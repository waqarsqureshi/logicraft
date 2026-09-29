/**
 * Digital Logic Analyzer / Timing Diagram Oscilloscope
 * Plots square wave transitions over time for clocks, inputs, and outputs
 */

import React from 'react';
import { CircuitComponent, WaveformSample } from '../../types/circuit';
import { Activity, X } from 'lucide-react';

interface TimingDiagramProps {
  samples: WaveformSample[];
  components: CircuitComponent[];
  isOpen: boolean;
  onClose: () => void;
  tickCount: number;
  theme?: 'dark' | 'light';
}

export const TimingDiagram: React.FC<TimingDiagramProps> = ({
  samples,
  components,
  isOpen,
  onClose,
  tickCount,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  // Filter channels to display: clocks, gates (including OR, AND, etc.), switches, outputs, probes, flip flops
  const observedComps = components.filter(
    (c) =>
      c.type === 'CLOCK' ||
      c.type === 'OR' ||
      c.type === 'AND' ||
      c.type === 'NOT' ||
      c.type === 'NAND' ||
      c.type === 'NOR' ||
      c.type === 'XOR' ||
      c.type === 'XNOR' ||
      c.type === 'SWITCH' ||
      c.type === 'BUTTON' ||
      c.type === 'LED' ||
      c.type === 'PROBE' ||
      c.type === 'D_FLIP_FLOP' ||
      c.type === 'COUNTER_4BIT' ||
      c.type === 'TIMING_ANALYZER'
  ).slice(0, 10); // Max 10 channels

  const maxSamples = 24;
  const recentSamples = samples.slice(-maxSamples);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t shadow-2xl animate-in slide-in-from-bottom duration-200 ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Logic Timing Analyzer (Oscilloscope Channels)
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-600'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            Tick: {tickCount}
          </span>
        </div>

        <button
          onClick={onClose}
          className={`p-1 rounded transition-colors ${
            theme === 'light'
              ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 max-h-56 overflow-y-auto space-y-2">
        {observedComps.length === 0 ? (
          <div className={`text-xs text-center py-4 ${
            theme === 'light' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Place Clocks, OR/AND Gates, Switches, or LEDs on the canvas to observe real-time waveforms.
          </div>
        ) : (
          observedComps.map((comp) => {
            const label = comp.label || `${comp.type} (${comp.id.slice(-4)})`;
            const currentSignal = comp.outputs[0]?.value ?? comp.inputs[0]?.value ?? 0;
            const isHigh = currentSignal === 1;
            const isUndef = currentSignal === 'X';

            return (
              <div key={comp.id} className="flex items-center gap-3 text-xs font-mono">
                {/* Channel Label */}
                <div className={`w-32 truncate font-medium shrink-0 flex items-center justify-between ${
                  theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <span title={label}>{label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ml-1 shrink-0 ${
                      isHigh
                        ? 'bg-emerald-400 shadow-[0_0_6px_#22c55e]'
                        : isUndef
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>

                {/* SVG Digital Waveform Track */}
                <div className="flex-1 h-9 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center px-2">
                  <svg
                    className="w-full h-7 overflow-hidden"
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
                  >
                    {/* Time grid ticks */}
                    {Array.from({ length: maxSamples }).map((_, i) => (
                      <line
                        key={i}
                        x1={i * (100 / maxSamples)}
                        y1="0"
                        x2={i * (100 / maxSamples)}
                        y2="28"
                        stroke="#1e293b"
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {/* Waveform polyline */}
                    {recentSamples.length > 1 && (
                      <path
                        d={(() => {
                          let d = '';
                          const getValY = (sig: any) => {
                            if (sig === 1) return 5;
                            if (sig === 0) return 22;
                            return 13.5; // Undefined / floating at middle
                          };
                          recentSamples.forEach((sample, i) => {
                            const val = getValY(sample.signals[comp.id]);
                            const x = (i / (maxSamples - 1)) * 100;
                            if (i === 0) {
                              d += `M ${x} ${val}`;
                            } else {
                              const prevVal = getValY(recentSamples[i - 1].signals[comp.id]);
                              d += ` L ${x} ${prevVal} L ${x} ${val}`;
                            }
                          });
                          return d;
                        })()}
                        fill="none"
                        stroke={comp.type === 'CLOCK' ? '#38bdf8' : isUndef ? '#f59e0b' : '#22c55e'}
                        strokeWidth="2"
                        strokeLinejoin="miter"
                      />
                    )}
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
