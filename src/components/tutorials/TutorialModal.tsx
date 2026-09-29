/**
 * Guided Tutorial and Interactive Lab System (Objectives 6 & 28.8)
 */

import React, { useState } from 'react';
import { TUTORIALS, TutorialLesson } from '../../data/tutorials';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Play,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLesson: TutorialLesson | null;
  onSelectLesson: (lesson: TutorialLesson) => void;
  onOpenTransistorView: (gate: 'AND' | 'NOT' | 'NAND' | 'OR') => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  activeLesson,
  onSelectLesson,
  onOpenTransistorView,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (!activeLesson) return;
    const step = activeLesson.steps[currentStepIdx];
    setCompletedSteps((prev) => ({ ...prev, [step.id]: true }));

    if (currentStepIdx < activeLesson.steps.length - 1) {
      setCurrentStepIdx((i) => i + 1);
      setShowHint(false);
    } else {
      // Completed all steps!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((i) => i - 1);
      setShowHint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 border-t-4 border-t-[#840038] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {activeLesson ? activeLesson.title : 'Interactive Tutorials & Labs'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeLesson
                  ? `Step ${currentStepIdx + 1} of ${activeLesson.steps.length}`
                  : 'Hands-on guided exercises from transistors to digital micro-architectures'}
              </p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {!activeLesson ? (
            // Lessons Catalog
            <div className="space-y-3">
              {TUTORIALS.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    onSelectLesson(lesson);
                    setCurrentStepIdx(0);
                    setCompletedSteps({});
                    if (lesson.openTransistorViewOnStart && lesson.transistorGateType) {
                      onOpenTransistorView(lesson.transistorGateType);
                    }
                  }}
                  className="group p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {lesson.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-900 text-slate-400 border border-slate-800">
                        {lesson.difficulty}
                      </span>
                      {lesson.openTransistorViewOnStart && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Transistor Lab
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lesson.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>{lesson.category}</span>
                      <span>•</span>
                      <span>~{lesson.estimatedMinutes} mins</span>
                      <span>•</span>
                      <span>{lesson.steps.length} steps</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Active Step Guided Flow
            <div className="space-y-6">
              {/* Step Progress Bar */}
              <div className="flex items-center gap-1.5">
                {activeLesson.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      idx === currentStepIdx
                        ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
                        : completedSteps[step.id]
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Step Details */}
              {(() => {
                const step = activeLesson.steps[currentStepIdx];
                const isFinished = currentStepIdx === activeLesson.steps.length - 1 && completedSteps[step.id];

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">
                          {currentStepIdx + 1}
                        </span>
                        {step.title}
                      </h3>

                      <p className="text-sm font-semibold text-slate-200 mb-2">
                        {step.instruction}
                      </p>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {step.detail}
                      </p>

                      {step.hint && (
                        <div>
                          {showHint ? (
                            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
                              <strong className="text-amber-400">Hint: </strong>
                              {step.hint}
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowHint(true)}
                              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Show Hint</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Transistor shortcut button for transistor lab */}
                    {activeLesson.openTransistorViewOnStart && (
                      <button
                        onClick={() => onOpenTransistorView(activeLesson.transistorGateType || 'AND')}
                        className="w-full py-2 px-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Open Synchronized Inside Gate Transistor View</span>
                      </button>
                    )}

                    {isFinished && (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 space-y-2 animate-in zoom-in-95">
                        <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                          <Trophy className="w-5 h-5 text-amber-400" />
                          <span>Tutorial Complete!</span>
                        </div>
                        <p className="leading-relaxed">{activeLesson.conclusion}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {activeLesson && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
            <button
              onClick={() => onSelectLesson(null as any)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Back to Catalog
            </button>

            <div className="flex items-center gap-2">
              <button
                disabled={currentStepIdx === 0}
                onClick={handlePrevStep}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 rounded-lg hover:bg-slate-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNextStep}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow flex items-center gap-1 transition-colors"
              >
                <span>
                  {currentStepIdx === activeLesson.steps.length - 1 ? 'Finish & Celebrate' : 'Next Step'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
