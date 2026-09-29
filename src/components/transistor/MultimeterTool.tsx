/**
 * Virtual Digital Multimeter / Voltage Probe Tool (Section 28.7)
 * Measures DC Voltage, Logic State, and Node Conduction
 */

import React from 'react';
import { Gauge, Radio } from 'lucide-react';
import { SchematicProbeNode } from '../../data/transistorModels';

interface MultimeterToolProps {
  probedNode: SchematicProbeNode | null;
  measuredVoltage: number;
  availableNodes: SchematicProbeNode[];
  onSelectNode: (nodeId: string) => void;
}

export const MultimeterTool: React.FC<MultimeterToolProps> = ({
  probedNode,
  measuredVoltage,
  availableNodes,
  onSelectNode,
}) => {
  const isHigh = measuredVoltage > 2.5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100">
      {/* Multimeter Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Digital Multimeter</h3>
            <p className="text-[11px] text-slate-400">DC Voltage & Logic State Probe</p>
          </div>
        </div>

        {/* Status LED */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isHigh ? 'bg-emerald-400 shadow-[0_0_8px_#22c55e]' : 'bg-blue-400'
            }`}
          />
          <span className="font-mono text-xs">{isHigh ? 'LOGIC 1' : 'LOGIC 0'}</span>
        </div>
      </div>

      {/* 7-Segment Digital Readout LCD */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
        <div className="absolute top-2 left-3 flex items-center gap-1 text-[10px] font-mono text-slate-500">
          <Radio className="w-3 h-3 text-amber-400" />
          <span>PROBE: {probedNode?.label || 'UNATTACHED'}</span>
        </div>

        {/* Huge Digital Voltage Display */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
            {measuredVoltage.toFixed(2)}
          </span>
          <span className="font-mono text-xl text-amber-500 font-semibold">V DC</span>
        </div>

        {/* Voltage Bar Graph */}
        <div className="w-full mt-3 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isHigh ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, (measuredVoltage / 5.0) * 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Probe Terminal Selector */}
      <div className="mt-3">
        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
          Place Red Probe On Terminal:
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
          {availableNodes.map((n) => {
            const isSelected = probedNode?.id === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                className={`px-2.5 py-1.5 text-xs text-left rounded-lg font-mono transition-colors flex items-center justify-between border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{n.label}</span>
                <span className="text-[10px] text-slate-500 ml-1 shrink-0">
                  {n.id === 'VDD' ? '+5V' : n.id === 'GND' ? '0V' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
