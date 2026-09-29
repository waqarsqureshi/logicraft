/**
 * "Inside the Gate" Transistor-Level / Electronics View Modal (Section 28)
 * Synchronized Logic Gate vs CMOS Transistor network with interactive voltages, multimeter,
 * and independent real-time simulation engine.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  evaluateTransistorCircuit,
  TRANSISTOR_MODELS,
  GateElectronicsModel,
} from '../../data/transistorModels';
import { TransistorSchematic } from './TransistorSchematic';
import { MultimeterTool } from './MultimeterTool';
import { CircuitComponent } from '../../types/circuit';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  FastForward,
  Layers,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Sparkles,
  ToggleLeft,
  X,
  Zap,
} from 'lucide-react';

interface InsideGateModalProps {
  initialGateType?: 'AND' | 'NOT' | 'NAND' | 'OR' | 'NOR';
  selectedComponent?: CircuitComponent | null;
  isSimRunning?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onStartTransistorTutorial?: () => void;
  theme?: 'dark' | 'light';
}

export const InsideGateModal: React.FC<InsideGateModalProps> = ({
  initialGateType = 'AND',
  selectedComponent,
  isSimRunning = false,
  isOpen,
  onClose,
  onStartTransistorTutorial,
  theme = 'dark',
}) => {
  const [gateType, setGateType] = useState<'AND' | 'NOT' | 'NAND' | 'OR' | 'NOR'>(initialGateType);

  // Independent Modal Real-Time Simulation State
  const [modalSimRunning, setModalSimRunning] = useState<boolean>(true);
  const [modalFrequencyHz, setModalFrequencyHz] = useState<number>(1);
  const [autoCycle, setAutoCycle] = useState<boolean>(false);
  const [modalTick, setModalTick] = useState<number>(0);
  const [syncWithCanvas, setSyncWithCanvas] = useState<boolean>(!!selectedComponent);

  // Input states (0 = 0V, 1 = 5V)
  const [inputStates, setInputStates] = useState<Record<string, 0 | 1>>({
    A: 0,
    B: 0,
  });

  // Selected transistor for detail inspection
  const [selectedTransistorId, setSelectedTransistorId] = useState<string | null>('Q1');

  // Multimeter probe location (default to OUT node)
  const [activeProbeNodeId, setActiveProbeNodeId] = useState<string>('OUT');

  // Abstraction level tab: 'all' | 'voltage' | 'transistor' | 'logic'
  const [abstractionLevel, setAbstractionLevel] = useState<'all' | 'voltage' | 'transistor' | 'logic'>('all');

  const model: GateElectronicsModel = TRANSISTOR_MODELS[gateType] || TRANSISTOR_MODELS.AND;

  // Sync state whenever initialGateType or selectedComponent changes upon opening
  useEffect(() => {
    if (selectedComponent && ['AND', 'NOT', 'NAND', 'OR', 'NOR'].includes(selectedComponent.type)) {
      setGateType(selectedComponent.type as any);
      setSyncWithCanvas(true);
      const liveInputs: Record<string, 0 | 1> = {};
      selectedComponent.inputs.forEach((pin, idx) => {
        const name = idx === 0 ? 'A' : 'B';
        liveInputs[name] = pin.value === 1 ? 1 : 0;
      });
      setInputStates(liveInputs);
    } else if (initialGateType) {
      setGateType(initialGateType);
    }
  }, [initialGateType, selectedComponent?.id]);

  // Live Sync with Canvas Gate (only if syncWithCanvas is enabled and pins actually change)
  useEffect(() => {
    if (!syncWithCanvas || !selectedComponent) return;
    const nextInputs: Record<string, 0 | 1> = {};
    selectedComponent.inputs.forEach((pin, idx) => {
      const name = idx === 0 ? 'A' : 'B';
      nextInputs[name] = pin.value === 1 ? 1 : 0;
    });

    setInputStates((prev) => {
      const hasChanged = Object.keys(nextInputs).some((k) => prev[k] !== nextInputs[k]);
      return hasChanged ? nextInputs : prev;
    });
  }, [
    syncWithCanvas,
    selectedComponent?.inputs?.[0]?.value,
    selectedComponent?.inputs?.[1]?.value,
  ]);

  // Independent Modal Real-Time Simulation Loop (Effect-Based Ticker)
  useEffect(() => {
    if (!isOpen || !modalSimRunning) return;

    const intervalMs = Math.max(100, Math.round(1000 / modalFrequencyHz));
    const timer = setInterval(() => {
      setModalTick((t) => t + 1);

      if (autoCycle) {
        setInputStates((prev) => {
          const keys = model.inputs.map((i) => i.name);
          if (keys.length === 1) {
            return { [keys[0]]: prev[keys[0]] === 1 ? 0 : 1 };
          }
          const a = prev['A'] ?? 0;
          const b = prev['B'] ?? 0;
          const nextVal = (a * 2 + b + 1) % 4;
          return {
            A: ((nextVal >> 1) & 1) as 0 | 1,
            B: (nextVal & 1) as 0 | 1,
          };
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, modalSimRunning, modalFrequencyHz, autoCycle, model]);

  // User manually toggles an input pin
  const handleToggleInput = (inputName: string) => {
    // When user manually manipulates input, disable canvas sync & autoCycle
    setSyncWithCanvas(false);
    setAutoCycle(false);
    setInputStates((prev) => {
      const current = prev[inputName] ?? 0;
      return {
        ...prev,
        [inputName]: current === 1 ? 0 : 1,
      };
    });
  };

  // Step manually to next truth table row
  const handleManualStep = () => {
    setSyncWithCanvas(false);
    setAutoCycle(false);
    setInputStates((prev) => {
      const keys = model.inputs.map((i) => i.name);
      if (keys.length === 1) {
        return { [keys[0]]: prev[keys[0]] === 1 ? 0 : 1 };
      }
      const a = prev['A'] ?? 0;
      const b = prev['B'] ?? 0;
      const nextVal = (a * 2 + b + 1) % 4;
      return {
        A: ((nextVal >> 1) & 1) as 0 | 1,
        B: (nextVal & 1) as 0 | 1,
      };
    });
  };

  // Convert digital input states to physical voltages (0.0V / 5.0V)
  const inputVoltages: Record<string, number> = useMemo(() => {
    const voltages: Record<string, number> = {};
    for (const inp of model.inputs) {
      const val = inputStates[inp.name] ?? 0;
      voltages[inp.name] = val === 1 ? 5.0 : 0.0;
    }
    return voltages;
  }, [model.inputs, inputStates]);

  // Calculate live transistor states and node voltages
  const sim = useMemo(() => {
    return evaluateTransistorCircuit(model, inputVoltages);
  }, [model, inputVoltages]);

  // Probed node details
  const probedNode = model.probeNodes.find((n) => n.id === activeProbeNodeId) || model.probeNodes[0];
  const probedVoltage = sim.nodeVoltages[probedNode?.id] ?? 0.0;

  // Currently inspected transistor
  const inspectedTransistor = model.transistors.find((t) => t.id === selectedTransistorId);
  const inspectedState = selectedTransistorId ? sim.transistorStates[selectedTransistorId] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div
        className={`relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border border-t-4 border-t-[#840038] transition-colors duration-150 ${
          theme === 'light'
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Inside the Gate: Electronics View
                </h2>
                <span className="text-[10px] px-2 py-0.5 font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 rounded-full">
                  CMOS Transistor Level
                </span>

                {/* Independent Real-Time Simulation Status Badge */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 font-mono font-bold rounded-full flex items-center gap-1.5 ${
                      modalSimRunning
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        modalSimRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                      }`}
                    />
                    {modalSimRunning ? 'REAL-TIME ACTIVE' : 'SIMULATION PAUSED'}
                  </span>

                  {syncWithCanvas && selectedComponent && (
                    <span className="text-[10px] px-2 py-0.5 font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 rounded-full">
                      CANVAS SYNC ON
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {syncWithCanvas && selectedComponent
                  ? `Observing canvas ${selectedComponent.label || selectedComponent.type} gate (${selectedComponent.id.slice(-4)}) — live inputs connected`
                  : 'Independent interactive transistor sandbox — toggle inputs, inspect CMOS switching channels, and probe voltages'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartTransistorTutorial && (
              <button
                onClick={onStartTransistorTutorial}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-xl transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Tutorial</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                theme === 'light'
                  ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gate Selector & Simulation Ticker Control Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b text-xs ${
            theme === 'light' ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          {/* Gate Selector */}
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Gate:
            </span>
            {(['AND', 'OR', 'NOT', 'NAND', 'NOR'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setGateType(type);
                  setSelectedTransistorId('Q1');
                  setActiveProbeNodeId('OUT');
                  setSyncWithCanvas(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  gateType === type
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Real-Time Simulation Loop Controls */}
          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Play/Pause */}
            <button
              onClick={() => setModalSimRunning(!modalSimRunning)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                modalSimRunning
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-600 text-white shadow-sm'
              }`}
              title={modalSimRunning ? 'Pause Transistor Clock' : 'Start Transistor Clock'}
            >
              {modalSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{modalSimRunning ? 'Pause' : 'Play'}</span>
            </button>

            {/* Single Step */}
            <button
              onClick={handleManualStep}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                theme === 'light'
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Step to Next Input Pattern"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            {/* Auto Cycle */}
            <button
              onClick={() => {
                setSyncWithCanvas(false);
                setAutoCycle(!autoCycle);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                autoCycle
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : theme === 'light'
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Automatically cycle through truth table input combinations"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoCycle ? 'animate-spin' : ''}`} />
              <span>Auto-Test</span>
            </button>

            {/* Frequency Selector */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700/50">
              {[0.5, 1, 2].map((hz) => (
                <button
                  key={hz}
                  onClick={() => setModalFrequencyHz(hz)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                    modalFrequencyHz === hz
                      ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {hz}Hz
                </button>
              ))}
            </div>

            {/* Canvas Sync Toggle */}
            {selectedComponent && (
              <button
                onClick={() => setSyncWithCanvas(!syncWithCanvas)}
                className={`ml-1 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  syncWithCanvas
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Synchronize live input values directly from the canvas gate"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Canvas</span>
              </button>
            )}
          </div>

          {/* Abstraction Level Switcher */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {[
              { id: 'all', label: 'All (Sync View)' },
              { id: 'voltage', label: '1. Voltages' },
              { id: 'transistor', label: '2. Transistors' },
              { id: 'logic', label: '3. Logic' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAbstractionLevel(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  abstractionLevel === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Content: Split View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Inputs & Logic Gate View */}
          {(abstractionLevel === 'all' || abstractionLevel === 'logic' || abstractionLevel === 'voltage' || abstractionLevel === 'transistor') && (
            <div
              className={`${
                abstractionLevel === 'all'
                  ? 'lg:col-span-4'
                  : abstractionLevel === 'logic'
                  ? 'lg:col-span-6'
                  : 'lg:col-span-5'
              } flex flex-col gap-4`}
            >
              {/* Synchronized Logic Gate Card */}
              <div
                className={`border rounded-2xl p-4 shadow-lg transition-colors ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                    Synchronized Logic Gate View
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 bg-emerald-950/80 rounded-full border border-emerald-500/20 font-bold">
                    TICK #{modalTick}
                  </span>
                </div>

                {/* Graphical Logic Gate Representation */}
                <div
                  className={`flex items-center justify-center p-5 rounded-xl border ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Inputs */}
                    <div className="flex flex-col gap-3">
                      {model.inputs.map((inp) => (
                        <div key={inp.name} className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{inp.name}:</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              inputStates[inp.name] === 1
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            }`}
                          >
                            {inputStates[inp.name]} ({inputVoltages[inp.name].toFixed(1)}V)
                          </span>
                        </div>
                      ))}
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                    {/* Gate Symbol Badge */}
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md">
                      <span>{model.gateType}</span>
                      <span className="text-[9px] opacity-80">CMOS</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                    {/* Logic Output */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">Output Y</span>
                      <span
                        className={`text-lg font-mono font-bold px-3 py-1 rounded-xl shadow-sm ${
                          sim.logicOutput === 1
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {sim.logicOutput} ({sim.outputVoltage.toFixed(1)}V)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Input Switches */}
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Toggle Physical Inputs (0V / 5V):
                    </label>
                    {syncWithCanvas && (
                      <span className="text-[10px] text-cyan-400 font-mono">
                        (Clicking disables Canvas Sync)
                      </span>
                    )}
                  </div>

                  <div className={`grid ${model.inputs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    {model.inputs.map((inp) => {
                      const isHigh = inputStates[inp.name] === 1;
                      return (
                        <button
                          key={inp.name}
                          onClick={() => handleToggleInput(inp.name)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isHigh
                              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-md hover:bg-emerald-900/80'
                              : theme === 'light'
                              ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-semibold">{inp.label}</span>
                          <span className="text-lg font-mono font-bold mt-1">
                            {isHigh ? '5.0 V' : '0.0 V'}
                          </span>
                          <span className="text-[10px] font-mono opacity-80">
                            Logic {isHigh ? '1 (HIGH)' : '0 (LOW)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Virtual Multimeter / Voltage Probe Tool */}
              {(abstractionLevel === 'all' || abstractionLevel === 'voltage') && (
                <MultimeterTool
                  probedNode={probedNode}
                  measuredVoltage={probedVoltage}
                  availableNodes={model.probeNodes}
                  onSelectNode={setActiveProbeNodeId}
                />
              )}

              {/* Transistor Detail Inspection Panel */}
              {(abstractionLevel === 'all' || abstractionLevel === 'transistor') && inspectedTransistor && inspectedState && (
                <div
                  className={`border rounded-2xl p-4 shadow-lg text-xs ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      MOSFET {inspectedTransistor.id} Inspection
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inspectedState.state === 'ON'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      CHANNEL: {inspectedState.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
                    <div
                      className={`p-2 rounded-lg border ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <span className="text-slate-500 block text-[10px]">Semiconductor Type:</span>
                      <span className="font-bold text-blue-400">{inspectedTransistor.type}</span>
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <span className="text-slate-500 block text-[10px]">Gate Voltage Vgs:</span>
                      <span className="font-bold text-amber-400">{inspectedState.gateVoltage.toFixed(1)} V</span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed mb-2 opacity-80">
                    {inspectedTransistor.role}
                  </p>

                  <div
                    className={`p-2.5 rounded-lg text-[11px] leading-normal border ${
                      theme === 'light'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-slate-900/80 border-slate-800 text-emerald-300/90'
                    }`}
                  >
                    <strong className="text-emerald-500">Physical Principle: </strong>
                    {inspectedState.explanation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column: Interactive Transistor Schematic & Truth Table */}
          {(abstractionLevel === 'all' || abstractionLevel === 'transistor' || abstractionLevel === 'voltage' || abstractionLevel === 'logic') && (
            <div
              className={`${
                abstractionLevel === 'all'
                  ? 'lg:col-span-8'
                  : abstractionLevel === 'transistor'
                  ? 'lg:col-span-12'
                  : abstractionLevel === 'logic'
                  ? 'lg:col-span-6'
                  : 'lg:col-span-7'
              } flex flex-col gap-4`}
            >
              {/* Transistor Schematic Card */}
              {(abstractionLevel === 'all' || abstractionLevel === 'transistor' || abstractionLevel === 'voltage') && (
                <div
                  className={`border rounded-2xl shadow-xl overflow-hidden flex flex-col ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {model.title}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        — Click any transistor to inspect its channel state, or click probe nodes
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e]" />
                        <span className="text-[11px]">Conducting (ON)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                        <span className="text-[11px] text-slate-400">Cut-off (OFF)</span>
                      </div>
                    </div>
                  </div>

                  {/* The Visual Schematic Component */}
                  <div className="h-[360px] md:h-[420px] w-full">
                    <TransistorSchematic
                      model={model}
                      nodeVoltages={sim.nodeVoltages}
                      transistorStates={sim.transistorStates}
                      selectedTransistorId={selectedTransistorId}
                      onSelectTransistor={setSelectedTransistorId}
                      activeProbeNodeId={activeProbeNodeId}
                      onSelectProbeNode={setActiveProbeNodeId}
                      onToggleInput={handleToggleInput}
                    />
                  </div>
                </div>
              )}

              {/* Truth Table + Electronics View */}
              {(abstractionLevel === 'all' || abstractionLevel === 'logic') && (
                <div
                  className={`border rounded-2xl p-4 shadow-lg text-xs ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      Truth Table & Electronics Mapping
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Active state highlighted in green
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr
                          className={`border-b ${
                            theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          {model.inputs.map((inp) => (
                            <th key={inp.name} className="py-2 px-3">
                              {inp.name}
                            </th>
                          ))}
                          {model.inputs.map((inp) => (
                            <th key={`v_${inp.name}`} className="py-2 px-3">
                              {inp.name} Volt
                            </th>
                          ))}
                          <th className="py-2 px-3">Output</th>
                          <th className="py-2 px-3">Output Volt</th>
                          <th className="py-2 px-3 font-sans">Physical Conduction Path</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.truthTable.map((row, idx) => {
                          let isCurrent = true;
                          for (const inp of model.inputs) {
                            if (row.inputs[inp.name] !== inputStates[inp.name]) {
                              isCurrent = false;
                              break;
                            }
                          }

                          return (
                            <tr
                              key={idx}
                              onClick={() => {
                                setSyncWithCanvas(false);
                                setAutoCycle(false);
                                setInputStates({ ...row.inputs });
                              }}
                              className={`border-b transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-500/20 text-emerald-400 font-bold border-l-4 border-l-emerald-500'
                                  : theme === 'light'
                                  ? 'border-slate-100 hover:bg-slate-100/70 text-slate-700'
                                  : 'border-slate-800/60 hover:bg-slate-900/60 text-slate-300'
                              }`}
                            >
                              {model.inputs.map((inp) => (
                                <td key={inp.name} className="py-2 px-3">
                                  {row.inputs[inp.name]}
                                </td>
                              ))}
                              {model.inputs.map((inp) => (
                                <td key={`v_${inp.name}`} className="py-2 px-3 text-slate-400">
                                  {row.inputs[inp.name] === 1 ? '5.0 V' : '0.0 V'}
                                </td>
                              ))}
                              <td className="py-2 px-3 font-bold">
                                {row.output}
                              </td>
                              <td className="py-2 px-3 text-amber-400">
                                {row.output === 1 ? '5.0 V' : '0.0 V'}
                              </td>
                              <td className="py-2 px-3 font-sans text-[11px]">
                                {row.explanation}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Educational Summary Callout */}
              <div
                className={`border rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className={theme === 'light' ? 'text-slate-800' : 'text-slate-200'}>
                    Semiconductor Physics in Action:{' '}
                  </strong>
                  Digital 0 and 1 are physical voltage states. CMOS logic uses complementary pairs of PMOS
                  (which conduct when gate is 0V) and NMOS (which conduct when gate is 5V) transistors to steer
                  current from either the +5.0V VDD rail or the 0.0V GND rail to the output pin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
