/**
 * LogiCraft - Digital Logic Circuit Simulator
 * Main Application Orchestrator
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircuitComponent,
  CircuitProject,
  GateType,
  SimulationState,
  WaveformSample,
} from './types/circuit';
import { COMPONENT_DEFINITIONS, createComponentPins } from './engine/definitions';
import { resetProjectRuntime, simulateCircuit } from './engine/simulation';
import { getDefaultProject, loadCurrentProject, saveCurrentProject } from './utils/storage';
import { soundFx } from './utils/audio';
import { TutorialLesson } from './data/tutorials';
import { ChevronRight, Cpu } from 'lucide-react';

// Components
import { TopNavbar } from './components/toolbar/TopNavbar';
import { ComponentPalette } from './components/palette/ComponentPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { InsideGateModal } from './components/transistor/InsideGateModal';
import { TruthTableModal } from './components/analyzer/TruthTableModal';
import { TimingDiagram } from './components/analyzer/TimingDiagram';
import { ErrorFeedbackBanner } from './components/analyzer/ErrorFeedbackBanner';
import { TutorialModal } from './components/tutorials/TutorialModal';
import { ProjectManagerModal } from './components/modals/ProjectManagerModal';
import { ExportModal } from './components/modals/ExportModal';
import { CombinationalCircuitBenchmark } from './data/combinationalCircuits';

export default function App() {
  // Theme state: dark / light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('logicraft_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('logicraft_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Primary Circuit Project
  const [initialProject] = useState(() => {
    const loaded = resetProjectRuntime(loadCurrentProject());
    const result = simulateCircuit(loaded, false);
    return {
      project: { ...loaded, components: result.components, wires: result.wires },
      errors: result.errors,
    };
  });
  const [project, setProject] = useState<CircuitProject>(initialProject.project);
  const projectRef = useRef(project);

  // Auto-Pulldown state for unconnected gate inputs
  const [autoPulldown, setAutoPulldown] = useState<boolean>(() => project.autoPulldown ?? false);

  const handleToggleAutoPulldown = () => {
    const next = !autoPulldown;
    setAutoPulldown(next);
    handleUpdateProject({ ...project, autoPulldown: next }, false);
  };

  // Undo / Redo Stacks
  const undoStackRef = useRef<CircuitProject[]>([]);
  const redoStackRef = useRef<CircuitProject[]>([]);

  // Simulation Engine State
  const [simState, setSimState] = useState<SimulationState>({
    running: false,
    frequencyHz: 1,
    tickCount: 0,
    stepMode: false,
    errors: initialProject.errors,
  });

  // Waveform Buffer for Timing Analyzer (Oscilloscope)
  const [waveformSamples, setWaveformSamples] = useState<WaveformSample[]>([]);

  // UI Selection States
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Layout & Mobile
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [isInsideGateOpen, setIsInsideGateOpen] = useState(false);
  const [transistorGateType, setTransistorGateType] = useState<'AND' | 'NOT' | 'NAND' | 'OR' | 'NOR'>('AND');
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const [isTimingDiagramOpen, setIsTimingDiagramOpen] = useState(false);
  const [isTutorialsOpen, setIsTutorialsOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialLesson | null>(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isErrorBannerOpen, setIsErrorBannerOpen] = useState(false);

  // Active Combinational Circuit Benchmark
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);

  // Window resize check for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsPaletteOpen(false);
      } else {
        setIsPaletteOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Project with Undo recording
  const handleUpdateProject = useCallback(
    (newProject: CircuitProject, recordUndo: boolean = true) => {
      if (recordUndo) {
        undoStackRef.current.push(JSON.parse(JSON.stringify(project)));
        if (undoStackRef.current.length > 30) undoStackRef.current.shift();
        redoStackRef.current = [];
      }
      const result = simulateCircuit(newProject, false);
      const evaluatedProject = { ...newProject, components: result.components, wires: result.wires };
      projectRef.current = evaluatedProject;
      setProject(evaluatedProject);
      setSimState((state) => ({ ...state, errors: result.errors }));
      saveCurrentProject(evaluatedProject);
    },
    [project]
  );

  // Undo / Redo triggers
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(project)));
    const result = simulateCircuit(prev, false);
    const evaluated = { ...prev, components: result.components, wires: result.wires };
    projectRef.current = evaluated;
    setProject(evaluated);
    setSimState((state) => ({ ...state, errors: result.errors }));
    saveCurrentProject(evaluated);
  }, [project]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(project)));
    const result = simulateCircuit(next, false);
    const evaluated = { ...next, components: result.components, wires: result.wires };
    projectRef.current = evaluated;
    setProject(evaluated);
    setSimState((state) => ({ ...state, errors: result.errors }));
    saveCurrentProject(evaluated);
  }, [project]);

  // Insert component from palette
  const handleInsertComponent = (type: GateType, defaultState?: Record<string, any>) => {
    const def = COMPONENT_DEFINITIONS[type];
    const newId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const { inputs, outputs } = createComponentPins(type, def.width, def.height, newId);

    // Place at default viewport center
    const newComp: CircuitComponent = {
      id: newId,
      type,
      label: type === 'CLOCK' ? 'CLK' : def.name,
      x: 240 + Math.floor(Math.random() * 40),
      y: 160 + Math.floor(Math.random() * 40),
      rotation: 0,
      inputs,
      outputs,
      state: defaultState ? { ...defaultState } : undefined,
    };

    handleUpdateProject({
      ...project,
      components: [...project.components, newComp],
    });
    setSelectedCompId(newId);
  };

  // Main Simulation Loop
  useEffect(() => {
    if (!simState.running) {
      soundFx.stopBuzzer();
      return;
    }

    const intervalMs = Math.round(1000 / simState.frequencyHz);
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleTick = () => {
      timer = setTimeout(() => {
        if (disposed) return;
      const result = simulateCircuit(projectRef.current, true);
      const nextProject = {
        ...projectRef.current,
        components: result.components,
        wires: result.wires,
      };
      projectRef.current = nextProject;
      setProject(nextProject);

      if (result.buzzerActive) {
        soundFx.startBuzzer(880);
      } else {
        soundFx.stopBuzzer();
      }

      const signals: Record<string, 0 | 1 | 'X' | 'Z'> = {};
      result.components.forEach((component) => {
        signals[component.id] = component.outputs[0]?.value ?? component.inputs[0]?.value ?? 'X';
      });

      setWaveformSamples((prev) => [
        ...prev.slice(-30),
        { timestamp: Date.now(), signals },
      ]);
      setSimState((state) => ({
        ...state,
        tickCount: state.tickCount + 1,
        errors: result.errors,
      }));
        scheduleTick();
      }, intervalMs);
    };
    scheduleTick();

    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [simState.running, simState.frequencyHz]);

  // Keyboard shortcut listeners (Space for Run/Pause, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setSimState((s) => ({ ...s, running: !s.running }));
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Single step clock pulse
  const handleSingleStep = () => {
    const result = simulateCircuit(projectRef.current, true);
    const nextProject = {
      ...projectRef.current,
      components: result.components,
      wires: result.wires,
    };
    projectRef.current = nextProject;
    setProject(nextProject);
    setSimState((state) => ({
      ...state,
      running: false,
      tickCount: state.tickCount + 1,
      errors: result.errors,
    }));
  };

  const handleResetSimulation = () => {
    const resetProject = resetProjectRuntime(project);
    const result = simulateCircuit(resetProject, false);
    const evaluatedProject = {
      ...resetProject,
      components: result.components,
      wires: result.wires,
    };
    projectRef.current = evaluatedProject;
    setProject(evaluatedProject);
    setSimState((state) => ({
      ...state,
      running: false,
      tickCount: 0,
      errors: result.errors,
    }));
    setWaveformSamples([]);
    saveCurrentProject(evaluatedProject);
    soundFx.stopBuzzer();
  };

  const handleLoadCircuit = (circuit: CircuitProject) => {
    const loaded = resetProjectRuntime(circuit);
    const result = simulateCircuit(loaded, false);
    const evaluated = { ...loaded, components: result.components, wires: result.wires };
    projectRef.current = evaluated;
    setProject(evaluated);
    setAutoPulldown(evaluated.autoPulldown ?? false);
    setSimState((state) => ({
      ...state,
      running: false,
      tickCount: 0,
      errors: result.errors,
    }));
    setWaveformSamples([]);
    setSelectedCompId(null);
    setSelectedWireId(null);
    saveCurrentProject(evaluated);
    soundFx.stopBuzzer();
  };

  // Open Inside the Gate modal
  const handleOpenInsideGate = (
    gateType: 'AND' | 'NOT' | 'NAND' | 'OR' | 'NOR' = 'AND',
    comp?: CircuitComponent
  ) => {
    setTransistorGateType(gateType);
    if (comp) {
      setSelectedCompId(comp.id);
    }
    setIsInsideGateOpen(true);
  };

  // Select combinational benchmark circuit
  const handleSelectBenchmark = useCallback(
    (benchmark: CombinationalCircuitBenchmark) => {
      setActiveBenchmarkId(benchmark.id);
      setSelectedCompId(null);
      setSelectedWireId(null);
      handleLoadCircuit(JSON.parse(JSON.stringify(benchmark.project)));
    },
    [handleLoadCircuit]
  );

  // Select Playground (Blank canvas where student develops any circuit and exports as JSON)
  const handleSelectPlayground = useCallback(() => {
    setActiveBenchmarkId('playground');
    setSelectedCompId(null);
    setSelectedWireId(null);
    handleLoadCircuit({
      id: 'playground',
      name: 'Playground (Custom Circuit)',
      description: 'Blank student playground canvas. Develop any circuit freely and export using the share icon as JSON.',
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      components: [],
      wires: [],
      autoPulldown: false,
    });
  }, [handleLoadCircuit]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-150 ${
      theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 1. Top Navigation & Simulation Toolbar */}
      <TopNavbar
        projectName={project.name}
        onChangeProjectName={(name) => handleUpdateProject({ ...project, name }, false)}
        simState={simState}
        onToggleRun={() => setSimState((s) => ({ ...s, running: !s.running }))}
        onSingleStep={handleSingleStep}
        onReset={handleResetSimulation}
        onChangeFrequency={(hz) => setSimState((s) => ({ ...s, frequencyHz: hz }))}
        onOpenInsideGate={() => handleOpenInsideGate('AND')}
        onOpenTruthTable={() => setIsTruthTableOpen(true)}
        onOpenTimingDiagram={() => setIsTimingDiagramOpen(true)}
        onOpenTutorials={() => setIsTutorialsOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        snapToGrid={snapToGrid}
        onToggleGrid={() => setSnapToGrid(!snapToGrid)}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundFx.setMuted(next);
        }}
        onTogglePalette={() => setIsPaletteOpen(!isPaletteOpen)}
        isPaletteOpen={isPaletteOpen}
        isMobile={isMobile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        autoPulldown={autoPulldown}
        onToggleAutoPulldown={handleToggleAutoPulldown}
        activeBenchmarkId={activeBenchmarkId}
        onSelectBenchmark={handleSelectBenchmark}
        onSelectPlayground={handleSelectPlayground}
      />

      {/* 2. Real-time Diagnostics Feedback Advisory */}
      <ErrorFeedbackBanner
        errors={simState.errors}
        isOpen={isErrorBannerOpen}
        onToggle={() => setIsErrorBannerOpen(!isErrorBannerOpen)}
        theme={theme}
      />

      {/* 3. Main Workspace: Component Library Sidebar + Interactive Circuit Canvas */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Floating Side Tab to re-open Component Library if collapsed */}
        {!isPaletteOpen && (
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="absolute left-0 top-16 z-30 flex items-center gap-1.5 px-3 py-3.5 rounded-r-2xl shadow-2xl border border-l-0 transition-all cursor-pointer bg-[#840038] hover:bg-[#9e0044] text-white border-rose-900/50 group"
            title="Open Component Library Side Tab"
          >
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold [writing-mode:vertical-rl] tracking-wider uppercase">
              Side Tab • Components
            </span>
          </button>
        )}

        {/* Component Palette Sidebar */}
        <ComponentPalette
          onInsertComponent={handleInsertComponent}
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          isMobile={isMobile}
          theme={theme}
        />

        {/* Main Circuit Workspace: Full-height Interactive Circuit Canvas */}
        <main className="flex-1 relative h-full w-full flex flex-col overflow-hidden">
          {/* Interactive Circuit Canvas */}
          <div className="flex-1 relative h-full w-full overflow-hidden">
            <CircuitCanvas
              project={project}
              onChangeProject={handleUpdateProject}
              selectedComponentId={selectedCompId}
              onSelectComponent={setSelectedCompId}
              selectedWireId={selectedWireId}
              onSelectWire={setSelectedWireId}
              onOpenInsideGate={handleOpenInsideGate}
              showAnimations={showAnimations}
              snapToGrid={snapToGrid}
              isSimRunning={simState.running}
              theme={theme}
            />
          </div>
        </main>
      </div>

      {/* 4. Dockable Logic Analyzer / Oscilloscope Timing Diagram */}
      <TimingDiagram
        samples={waveformSamples}
        components={project.components}
        isOpen={isTimingDiagramOpen}
        onClose={() => setIsTimingDiagramOpen(false)}
        tickCount={simState.tickCount}
        theme={theme}
      />

      {/* 5. "Inside the Gate" Transistor-Level / Electronics View Modal (Section 28) */}
      <InsideGateModal
        initialGateType={transistorGateType}
        selectedComponent={project.components.find((c) => c.id === selectedCompId) || null}
        isSimRunning={simState.running}
        isOpen={isInsideGateOpen}
        onClose={() => setIsInsideGateOpen(false)}
        onStartTransistorTutorial={() => {
          setIsInsideGateOpen(false);
          setIsTutorialsOpen(true);
        }}
        theme={theme}
      />

      {/* 6. Automated Truth Table Generator & Mathematical Boolean Equation Dialog */}
      <TruthTableModal
        project={project}
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        onChangeProject={handleUpdateProject}
        theme={theme}
        onLoadBenchmark={handleSelectBenchmark}
      />

      {/* 7. Guided Interactive Tutorials & Labs */}
      <TutorialModal
        isOpen={isTutorialsOpen}
        onClose={() => setIsTutorialsOpen(false)}
        activeLesson={activeTutorial}
        onSelectLesson={setActiveTutorial}
        onOpenTransistorView={handleOpenInsideGate}
      />

      {/* 8. Projects & Templates Catalog Dialog */}
      <ProjectManagerModal
        currentProject={project}
        onLoadProject={(proj) => {
          handleLoadCircuit(proj);
        }}
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
      />

      {/* 9. Share, Export, and LMS Assignment Submission Dialog */}
      <ExportModal
        project={project}
        onImportProject={(proj) => {
          handleLoadCircuit(proj);
        }}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
