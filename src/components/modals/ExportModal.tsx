/**
 * Export, Import, and LMS Assignment Submission Modal (Objectives 10, 11, 12)
 */

import React, { useState } from 'react';
import { CircuitProject } from '../../types/circuit';
import {
  downloadProjectFile,
  exportProjectToJSON,
  generateShareableURL,
} from '../../utils/storage';
import {
  Check,
  Copy,
  Download,
  FileJson,
  Link,
  Share2,
  Upload,
  X,
  GraduationCap,
} from 'lucide-react';

interface ExportModalProps {
  project: CircuitProject;
  onImportProject: (project: CircuitProject) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onImportProject,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = exportProjectToJSON(project);

  const handleCopyLink = () => {
    const url = generateShareableURL(project);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.components && Array.isArray(parsed.components)) {
          onImportProject(parsed);
          onClose();
        } else {
          setImportError('Invalid file: Missing components array.');
        }
      } catch (err: any) {
        setImportError(`Parse error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importText);
      if (parsed.components && Array.isArray(parsed.components)) {
        onImportProject(parsed);
        onClose();
      } else {
        setImportError('Invalid circuit JSON schema.');
      }
    } catch (err: any) {
      setImportError(`JSON syntax error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 border-t-4 border-t-[#840038] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Share & Export Project</h2>
              <p className="text-xs text-slate-400">Download for LMS homework submission or send to peers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* LMS Homework Submission Box */}
          <div className="p-4 bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/30 rounded-2xl flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-white block mb-0.5">
                LMS Assignment Submission Ready (Canvas, Blackboard, Moodle)
              </span>
              <p className="text-slate-300 leading-relaxed">
                Download the standardized <code className="text-blue-300 bg-blue-900/40 px-1 py-0.5 rounded">.logicraft.json</code> file below. Your lecturer or TA can open this exact circuit with 100% of your wires, states, and logic preserved.
              </p>
            </div>
          </div>

          {/* Download & Copy Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download File */}
            <button
              onClick={() => downloadProjectFile(project)}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-2xl text-left group transition-all hover:shadow-lg flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-white group-hover:text-emerald-400 block mb-1">
                  Download Circuit File (.json)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Best for classroom assignment turn-in
                </span>
              </div>
              <Download className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
            </button>

            {/* Copy Shareable Link */}
            <button
              onClick={handleCopyLink}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/60 rounded-2xl text-left group transition-all hover:shadow-lg flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-white group-hover:text-blue-400 block mb-1">
                  {copiedLink ? 'Link Copied!' : 'Copy Shareable URL'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Encodes entire circuit in share link
                </span>
              </div>
              {copiedLink ? (
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Link className="w-5 h-5 text-slate-500 group-hover:text-blue-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Import Circuit Section */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">
              Import / Reopen Saved Circuit File:
            </span>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer text-xs font-medium text-slate-200 transition-colors">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Upload .json File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500">or paste JSON data below</span>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste raw circuit JSON here..."
              rows={3}
              className="w-full p-2.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />

            {importError && (
              <p className="text-xs text-rose-400 font-medium">{importError}</p>
            )}

            {importText.trim().length > 0 && (
              <button
                onClick={handleImportText}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
              >
                Load Pasted Circuit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
