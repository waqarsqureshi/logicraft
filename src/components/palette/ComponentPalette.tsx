/**
 * Component Library Palette
 * Supports mobile touch insertion, desktop drag-and-drop, category tabs, and search filtering
 */

import React, { useState } from 'react';
import { ComponentCategory, GateType } from '../../types/circuit';
import { COMPONENT_DEFINITIONS } from '../../engine/definitions';
import {
  Activity,
  Binary,
  ChevronLeft,
  Cpu,
  Layers,
  Search,
  Sliders,
  ToggleLeft,
  X,
} from 'lucide-react';

interface ComponentPaletteProps {
  onInsertComponent: (type: GateType) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  theme?: 'dark' | 'light';
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onInsertComponent,
  isOpen,
  onClose,
  isMobile,
  theme = 'dark',
}) => {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: ComponentCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
    { id: 'gates', label: 'Gates', icon: <Binary className="w-4 h-4" /> },
    { id: 'inputs', label: 'Inputs', icon: <ToggleLeft className="w-4 h-4" /> },
    { id: 'outputs', label: 'Outputs', icon: <Activity className="w-4 h-4" /> },
    { id: 'sequential', label: 'Latches & Flip-Flops', icon: <Sliders className="w-4 h-4 text-sky-400" /> },
    { id: 'plexers', label: 'MUX & Decoders', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { id: 'arithmetic', label: 'Math & BCD', icon: <Cpu className="w-4 h-4 text-amber-400" /> },
    { id: 'analysis', label: 'Measurement / Scope', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { id: 'transistors', label: 'Transistors', icon: <Cpu className="w-4 h-4 text-rose-400" /> },
  ];

  const allComps = Object.values(COMPONENT_DEFINITIONS);

  const filtered = allComps.filter((comp) => {
    const matchesCategory =
      activeCategory === 'all' ||
      comp.category === activeCategory ||
      (activeCategory === 'outputs' && comp.type === 'TIMING_ANALYZER') ||
      (activeCategory === 'analysis' && comp.type === 'TIMING_ANALYZER');
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comp.type === 'TIMING_ANALYZER' &&
        ('oscilloscope' .includes(searchQuery.toLowerCase()) ||
          'scope'.includes(searchQuery.toLowerCase()) ||
          'waveform'.includes(searchQuery.toLowerCase()) ||
          'signal'.includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 relative flex flex-col w-72 md:w-80 shadow-2xl transition-all duration-150 border-r ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* Dock / Collapse side tab handle on desktop outer border */}
      <button
        onClick={onClose}
        className="hidden md:flex absolute -right-3 top-16 z-50 items-center justify-center w-6 h-9 rounded-r-lg bg-[#840038] hover:bg-[#9e0044] text-white shadow-md border border-l-0 border-rose-900/50 cursor-pointer group"
        title="Collapse Side Tab"
        aria-label="Collapse Side Tab"
      >
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Component Library
            </h2>
            <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Tap or drag onto canvas
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            theme === 'light'
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Collapse Component Library Side Tab"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className={`p-3 border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gates, inputs, analyzer..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg outline-none transition-colors border ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className={`flex items-center gap-1.5 p-2 overflow-x-auto no-scrollbar border-b text-xs ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((comp) => (
          <div
            key={comp.type}
            onClick={() => {
              onInsertComponent(comp.type);
              if (isMobile) onClose();
            }}
            className={`group flex items-start gap-3 p-2.5 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
              theme === 'light'
                ? 'bg-slate-50/80 hover:bg-blue-50/80 border-slate-200 hover:border-blue-400'
                : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-blue-500/50'
            }`}
          >
            {/* Visual Icon Badge */}
            <div className={`flex items-center justify-center w-10 h-10 border rounded-lg font-mono text-xs font-bold shrink-0 transition-colors ${
              comp.type === 'TIMING_ANALYZER'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400'
                : theme === 'light'
                ? 'bg-white border-slate-200 text-blue-600 group-hover:border-blue-400'
                : 'bg-slate-900 border-slate-800 text-blue-400 group-hover:border-blue-500/40'
            }`}>
              {comp.type === 'TIMING_ANALYZER'
                ? <Activity className="w-5 h-5 text-emerald-400" />
                : comp.type === 'CLOCK'
                ? 'CLK'
                : comp.type === 'SEVEN_SEGMENT'
                ? '7SEG'
                : comp.type.slice(0, 4)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium transition-colors ${
                  theme === 'light'
                    ? 'text-slate-800 group-hover:text-blue-600'
                    : 'text-slate-200 group-hover:text-blue-400'
                }`}>
                  {comp.name}
                </span>
                {comp.hasTransistorView && (
                  <span className="text-[9px] px-1.5 py-0.5 font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 rounded-full">
                    Inside Gate
                  </span>
                )}
              </div>
              <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {comp.description}
              </p>
              {comp.truthTableSummary && (
                <div className={`text-[10px] font-mono mt-1 ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {comp.truthTableSummary}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={`p-8 text-center text-xs ${
            theme === 'light' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            No components found matching "{searchQuery}".
          </div>
        )}
      </div>
    </aside>
  );
};
