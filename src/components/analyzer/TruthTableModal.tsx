/**
 * Automated Truth Table Generator & Mathematical Boolean Equation Synthesizer
 * University of Galway - School of Computer Science
 * Displays full 2^N combination truth table with live current row highlighting,
 * prominent mathematical Boolean equations, canonical SOP forms, and interactive
 * click-to-rename for inputs and outputs.
 */

import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  Code,
  Copy,
  Edit2,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  Table,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { CircuitProject } from '../../types/circuit';
import { generateTruthTable, BooleanEquationResult } from '../../engine/truthTable';
import {
  COMBINATIONAL_CIRCUITS,
  CombinationalCircuitBenchmark,
} from '../../data/combinationalCircuits';
import { GalwayLogo } from '../common/GalwayLogo';

interface TruthTableModalProps {
  project: CircuitProject;
  isOpen: boolean;
  onClose: () => void;
  onChangeProject?: (project: CircuitProject) => void;
  theme?: 'dark' | 'light';
  onLoadBenchmark?: (benchmark: CombinationalCircuitBenchmark) => void;
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  project,
  isOpen,
  onClose,
  onChangeProject,
  theme = 'dark',
  onLoadBenchmark,
}) => {
  // Tab selection: 'active' (current canvas) or a benchmark id ('and-gate', 'or-gate', etc.)
  const [selectedTab, setSelectedTab] = useState<string>('active');
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState<string>('');
  const [copiedEqId, setCopiedEqId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  // Determine which project to evaluate: active canvas or selected benchmark
  const activeBenchmark = COMBINATIONAL_CIRCUITS.find((b) => b.id === selectedTab);
  const targetProject = activeBenchmark ? activeBenchmark.project : project;

  const tableData = generateTruthTable(targetProject);

  // Save renamed component label
  const handleSaveHeaderRename = (compId: string) => {
    if (!onChangeProject || !headerEditValue.trim()) {
      setEditingHeaderId(null);
      return;
    }
    const updated = targetProject.components.map((c) =>
      c.id === compId ? { ...c, label: headerEditValue.trim() } : c
    );
    onChangeProject({
      ...targetProject,
      components: updated,
      updatedAt: Date.now(),
    });
    setEditingHeaderId(null);
  };

  const handleStartHeaderRename = (id: string, currentLabel: string) => {
    setEditingHeaderId(id);
    setHeaderEditValue(currentLabel);
  };

  const handleCopyEquation = (eqText: string, id: string) => {
    navigator.clipboard.writeText(eqText);
    setCopiedEqId(id);
    setTimeout(() => setCopiedEqId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`relative w-full max-w-4xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors border-t-4 border-t-[#840038] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header with University of Galway Brand */}
        <div
          className={`flex items-center justify-between px-5 md:px-7 py-3.5 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#840038]/15 text-[#840038] dark:text-rose-400 rounded-xl">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Truth Table & Boolean Mathematics</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#840038] text-white">
                  Galway LogicLab
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated combinational analysis, Boolean mathematical equations & canonical SOP synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GalwayLogo variant="compact" theme={theme} />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Combinational Benchmark Quick Tabs */}
        <div
          className={`px-4 md:px-6 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1">
            Circuit Tabs:
          </span>

          {/* Active Canvas Tab */}
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
              selectedTab === 'active'
                ? 'bg-[#840038] text-white shadow-xs font-bold'
                : isLight
                ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            ★ Active Canvas ({project.name || 'Current Circuit'})
          </button>

          {/* Standard Gates */}
          {COMBINATIONAL_CIRCUITS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                selectedTab === item.id
                  ? 'bg-[#840038] text-white shadow-xs font-bold'
                  : isLight
                  ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={item.name}
            >
              <span>{item.shortLabel}</span>
              <span className="text-[10px] font-mono opacity-80">
                {item.primaryEquation.replace(/^Y\s*=\s*/, '')}
              </span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* If benchmark is selected, show banner with option to load onto canvas */}
          {activeBenchmark && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-rose-950/30 border-rose-900/50 text-rose-200'
              }`}
            >
              <div>
                <span className="font-bold text-sm block">{activeBenchmark.name}</span>
                <span className="opacity-90">{activeBenchmark.explanation}</span>
              </div>
              {onLoadBenchmark && (
                <button
                  onClick={() => {
                    onLoadBenchmark(activeBenchmark);
                    setSelectedTab('active');
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#840038] hover:bg-[#9b0f48] text-white shadow-sm transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Load onto Canvas</span>
                </button>
              )}
            </div>
          )}

          {!tableData || tableData.rows.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Table className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-300 mb-1">
                No Compatible Inputs or Outputs on Canvas
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Place at least one input (Toggle Switch, Push Button, or Clock) and one output
                (LED, Logic Probe, or Buzzer) to automatically generate the Boolean mathematical equation and full truth table.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setSelectedTab('and-gate')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#840038] text-white hover:bg-[#9b0f48] transition-colors"
                >
                  View AND Gate Benchmark
                </button>
                <button
                  onClick={() => setSelectedTab('or-gate')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  View OR Gate Benchmark
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. MATHEMATICAL BOOLEAN EQUATIONS CARD */}
              <div
                className={`p-4 md:p-5 rounded-2xl border shadow-inner ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#840038] dark:text-rose-400" />
                    <h3 className="text-sm font-bold tracking-tight">
                      Mathematical Boolean Equation
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {tableData.inputHeaders.length} Variables ({tableData.rows.length} States)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tableData.outputHeaders.map((outHeader) => {
                    const eq = tableData.equations[outHeader.id];
                    if (!eq) return null;

                    return (
                      <div
                        key={outHeader.id}
                        className={`p-3.5 rounded-xl border relative group transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyEquation(eq.primaryEquation, outHeader.id)}
                          className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                            copiedEqId === outHeader.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Copy Mathematical Equation"
                        >
                          {copiedEqId === outHeader.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Output: {outHeader.label}
                          </span>
                          {eq.isStandardGate && (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                              {eq.isStandardGate}
                            </span>
                          )}
                        </div>

                        {/* Primary Equation */}
                        <div className="my-2">
                          <div className="text-lg md:text-xl font-mono font-bold text-[#840038] dark:text-rose-400 tracking-wide">
                            {eq.primaryEquation}
                          </div>
                        </div>

                        {/* Canonical SOP and Boolean Algebra */}
                        <div className="space-y-1 text-xs text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/60">
                          <div>
                            <span className="text-slate-500 select-none">Algebra: </span>
                            <span className="text-slate-300 font-semibold">{eq.booleanAlgebra}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 select-none">Canonical SOP: </span>
                            <span className="text-slate-300">{eq.canonicalSOP}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. CLICK-TO-RENAME INPUTS & OUTPUTS BAR */}
              <div
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isLight
                    ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                    : 'bg-blue-950/30 border-blue-900/40 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold">Click Input / Output to Rename:</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    (Updates Boolean mathematical equations & truth table column names in real time)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Inputs */}
                  {tableData.inputHeaders.map((inp) => {
                    const isEditing = editingHeaderId === inp.id;
                    return (
                      <div key={inp.id} className="flex items-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400">
                            <input
                              type="text"
                              autoFocus
                              value={headerEditValue}
                              onChange={(e) => setHeaderEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveHeaderRename(inp.id);
                                if (e.key === 'Escape') setEditingHeaderId(null);
                              }}
                              className="w-16 text-xs font-mono font-bold bg-transparent outline-none text-blue-300"
                            />
                            <button
                              onClick={() => handleSaveHeaderRename(inp.id)}
                              className="p-0.5 text-blue-400 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartHeaderRename(inp.id, inp.label)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-300 border border-blue-500/40 transition-all cursor-pointer"
                            title="Click to change input name"
                          >
                            <span>IN: {inp.label}</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <span className="text-slate-400 font-bold">➔</span>

                  {/* Outputs */}
                  {tableData.outputHeaders.map((out) => {
                    const isEditing = editingHeaderId === out.id;
                    return (
                      <div key={out.id} className="flex items-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400">
                            <input
                              type="text"
                              autoFocus
                              value={headerEditValue}
                              onChange={(e) => setHeaderEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveHeaderRename(out.id);
                                if (e.key === 'Escape') setEditingHeaderId(null);
                              }}
                              className="w-16 text-xs font-mono font-bold bg-transparent outline-none text-emerald-300"
                            />
                            <button
                              onClick={() => handleSaveHeaderRename(out.id)}
                              className="p-0.5 text-emerald-400 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartHeaderRename(out.id, out.label)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
                            title="Click to change output name"
                          >
                            <span>OUT: {out.label}</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. TRUTH TABLE */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                  <span>
                    Evaluated {tableData.inputHeaders.length} input(s) across {tableData.rows.length} combinations
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ● Green row = Current Canvas State
                  </span>
                </div>

                <div
                  className={`border rounded-2xl overflow-hidden shadow-inner ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}
                >
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr
                        className={`border-b ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <th className="py-2.5 px-4 font-semibold text-slate-500 w-12">#</th>

                        {/* Interactive Click-to-Rename Input Headers */}
                        {tableData.inputHeaders.map((inp) => {
                          const isEditing = editingHeaderId === inp.id;
                          return (
                            <th key={inp.id} className="py-2.5 px-4 font-semibold text-blue-500 dark:text-blue-400">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={headerEditValue}
                                    onChange={(e) => setHeaderEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveHeaderRename(inp.id);
                                      if (e.key === 'Escape') setEditingHeaderId(null);
                                    }}
                                    className="w-16 px-1 py-0.5 rounded bg-blue-950/60 border border-blue-400 text-white outline-none"
                                  />
                                  <button
                                    onClick={() => handleSaveHeaderRename(inp.id)}
                                    className="text-blue-400 hover:text-white"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartHeaderRename(inp.id, inp.label)}
                                  className="group/th flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Click to rename this input variable"
                                >
                                  <span>{inp.label}</span>
                                  <Edit2 className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </th>
                          );
                        })}

                        {/* Interactive Click-to-Rename Output Headers */}
                        {tableData.outputHeaders.map((out) => {
                          const isEditing = editingHeaderId === out.id;
                          return (
                            <th key={out.id} className="py-2.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={headerEditValue}
                                    onChange={(e) => setHeaderEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveHeaderRename(out.id);
                                      if (e.key === 'Escape') setEditingHeaderId(null);
                                    }}
                                    className="w-16 px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-400 text-white outline-none"
                                  />
                                  <button
                                    onClick={() => handleSaveHeaderRename(out.id)}
                                    className="text-emerald-400 hover:text-white"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartHeaderRename(out.id, out.label)}
                                  className="group/th flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Click to rename this output variable"
                                >
                                  <span>{out.label}</span>
                                  <Edit2 className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b transition-colors ${
                            isLight
                              ? 'border-slate-200 hover:bg-slate-50'
                              : 'border-slate-800/60 hover:bg-slate-800/50'
                          } ${
                            row.isCurrentState
                              ? isLight
                                ? 'bg-emerald-100/70 text-emerald-900 font-bold border-l-4 border-l-emerald-600'
                                : 'bg-emerald-950/40 text-emerald-300 font-bold border-l-4 border-l-emerald-500'
                              : isLight
                              ? 'text-slate-700'
                              : 'text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">{idx}</td>
                          {tableData.inputHeaders.map((inp) => (
                            <td key={inp.id} className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  row.inputs[inp.id] === 1
                                    ? isLight
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-blue-500/20 text-blue-300'
                                    : isLight
                                    ? 'bg-slate-200/80 text-slate-500'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {row.inputs[inp.id]}
                              </span>
                            </td>
                          ))}
                          {tableData.outputHeaders.map((out) => (
                            <td key={out.id} className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  row.outputs[out.id] === 1
                                    ? isLight
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                    : isLight
                                    ? 'bg-slate-200/80 text-slate-500'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {row.outputs[out.id]}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
