/**
 * Project Manager & Templates Catalog Modal
 * University of Galway - School of Computer Science Circuit Laboratory
 */

import React, { useState } from 'react';
import { CircuitProject } from '../../types/circuit';
import { CIRCUIT_TEMPLATES } from '../../data/templates';
import {
  deleteSavedProjectSlot,
  getSavedProjectsList,
  loadProjectFromSlot,
  saveProjectToSlot,
} from '../../utils/storage';
import {
  FolderOpen,
  Plus,
  Save,
  Trash2,
  X,
  FileCode,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { GalwayLogo } from '../common/GalwayLogo';

interface ProjectManagerModalProps {
  currentProject: CircuitProject;
  onLoadProject: (project: CircuitProject) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'All',
  'Logic Gates',
  'Fundamentals',
  'Arithmetic',
  'Multiplexers',
  'Sequential',
  'Demonstrations',
] as const;

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  currentProject,
  onLoadProject,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [saveName, setSaveName] = useState(currentProject.name);
  const [savedSlots, setSavedSlots] = useState(getSavedProjectsList());

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const updated = {
      ...currentProject,
      name: saveName || 'Untitled Circuit',
    };
    saveProjectToSlot(updated);
    setSavedSlots(getSavedProjectsList());
    setActiveTab('saved');
  };

  const handleLoadSlot = (id: string) => {
    const proj = loadProjectFromSlot(id);
    if (proj) {
      onLoadProject(proj);
      onClose();
    }
  };

  const handleDeleteSlot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedProjectSlot(id);
    setSavedSlots(getSavedProjectsList());
  };

  const filteredTemplates = CIRCUIT_TEMPLATES.filter((tmpl) => {
    if (selectedCategory === 'All') return true;
    return tmpl.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 border-t-4 border-t-[#840038] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header with Galway Logo and School of Computer Science branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <GalwayLogo variant="compact" theme="dark" />
            <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-tight">Circuit Template Catalog</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#840038]/30 text-[#f472b6] border border-[#840038]/50">
                  Galway LogicLab
                </span>
              </div>
              <p className="text-xs text-slate-400">Standalone logic gate showcases, laboratory templates, and saved experiments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'border-[#840038] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#f472b6]" />
              <span>Predefined Templates ({CIRCUIT_TEMPLATES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'border-[#840038] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Save className="w-4 h-4 text-[#f472b6]" />
              <span>My Saved Circuits ({savedSlots.length})</span>
            </button>
          </div>
        </div>

        {/* Category Filters Bar (for templates tab) */}
        {activeTab === 'templates' && (
          <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? CIRCUIT_TEMPLATES.length
                  : CIRCUIT_TEMPLATES.filter((t) => t.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#840038] text-white font-semibold shadow-xs'
                      : cat === 'Logic Gates'
                      ? 'bg-[#840038]/20 text-[#f472b6] border border-[#840038]/40 hover:bg-[#840038]/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'templates' ? (
            <div className="space-y-3">
              {filteredTemplates.map((tmpl) => {
                const isGateShowcase = tmpl.category === 'Logic Gates';
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      onLoadProject(JSON.parse(JSON.stringify(tmpl.project)));
                      onClose();
                    }}
                    className={`group p-4 bg-slate-950 border rounded-2xl cursor-pointer transition-all hover:shadow-lg flex items-start justify-between gap-4 ${
                      isGateShowcase
                        ? 'border-[#840038]/40 hover:border-[#840038]'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white group-hover:text-[#f472b6] transition-colors">
                          {tmpl.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            isGateShowcase
                              ? 'bg-[#840038]/20 text-[#f472b6] border-[#840038]/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{tmpl.description}</p>
                      <div className="text-[11px] text-slate-500 mt-2">
                        {tmpl.project.components.length} components • {tmpl.project.wires.length} wires
                      </div>
                    </div>

                    <button
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                        isGateShowcase
                          ? 'text-white bg-[#840038] group-hover:bg-[#9e1447]'
                          : 'text-slate-300 bg-slate-800 group-hover:bg-[#840038] group-hover:text-white'
                      }`}
                    >
                      Open Laboratory
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Save Current Circuit box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Save Active Circuit to Local Storage:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter project name..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#840038]"
                  />
                  <button
                    onClick={handleSaveCurrent}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#840038] hover:bg-[#9e1447] rounded-xl shadow flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Snapshot</span>
                  </button>
                </div>
              </div>

              {/* Saved List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Previous Snapshots:</span>
                {savedSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No custom circuits saved yet. Build something on the canvas and hit 'Save Snapshot'!
                  </p>
                ) : (
                  savedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => handleLoadSlot(slot.id)}
                      className="group p-3 bg-slate-950 border border-slate-800 hover:border-[#840038]/60 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white group-hover:text-[#f472b6] transition-colors block">
                          {slot.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Last edited: {new Date(slot.updatedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteSlot(slot.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                          title="Delete saved circuit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-white px-2.5 py-1 bg-slate-900 group-hover:bg-[#840038] rounded-lg transition-all">
                          Load
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
