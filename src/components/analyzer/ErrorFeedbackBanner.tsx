/**
 * Circuit Diagnostics and Real-time Error Feedback Banner
 */

import React from 'react';
import { CircuitError } from '../../types/circuit';
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ErrorFeedbackBannerProps {
  errors: CircuitError[];
  isOpen: boolean;
  onToggle: () => void;
  onDismissError?: (id: string) => void;
  theme?: 'dark' | 'light';
}

export const ErrorFeedbackBanner: React.FC<ErrorFeedbackBannerProps> = ({
  errors,
  isOpen,
  onToggle,
  theme = 'dark',
}) => {
  const severeErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
      <div className={`pointer-events-auto backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transition-all border ${
        theme === 'light'
          ? 'bg-white/95 border-slate-300 text-slate-800'
          : 'bg-slate-900/95 border-slate-700/80 text-slate-100'
      }`}>
        {/* Banner Summary Header */}
        <div
          onClick={onToggle}
          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
            theme === 'light' ? 'hover:bg-slate-100/70' : 'hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {severeErrors.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}

            <div className="text-xs">
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {severeErrors.length > 0 ? 'Circuit Contention / Error' : 'Circuit Advisory'}
              </span>
              <span className={`ml-2 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                ({errors.length} {errors.length === 1 ? 'notice' : 'notices'})
              </span>
            </div>
          </div>

          <button className={`p-1 ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Detailed Error Notices when expanded */}
        {isOpen && (
          <div className={`p-3 border-t max-h-48 overflow-y-auto space-y-2 ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-800'
          }`}>
            {errors.map((err) => (
              <div
                key={err.id}
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  err.severity === 'error'
                    ? theme === 'light'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : theme === 'light'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                {err.severity === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">{err.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
