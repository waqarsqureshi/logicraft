/**
 * Interactive CMOS Transistor Schematic Renderer
 * Visualizes PMOS / NMOS switching, conductive channels, voltage rails, and current paths
 */

import React from 'react';
import { GateElectronicsModel, TransistorDevice } from '../../data/transistorModels';

interface TransistorSchematicProps {
  model: GateElectronicsModel;
  nodeVoltages: Record<string, number>;
  transistorStates: Record<
    string,
    { state: 'ON' | 'OFF'; gateVoltage: number; vds: number; explanation: string }
  >;
  selectedTransistorId: string | null;
  onSelectTransistor: (id: string) => void;
  activeProbeNodeId: string | null;
  onSelectProbeNode: (nodeId: string) => void;
  onToggleInput?: (inputName: string) => void;
  showAnimations?: boolean;
}

export const TransistorSchematic: React.FC<TransistorSchematicProps> = ({
  model,
  nodeVoltages,
  transistorStates,
  selectedTransistorId,
  onSelectTransistor,
  activeProbeNodeId,
  onSelectProbeNode,
  onToggleInput,
  showAnimations = true,
}) => {
  // Helper to render individual MOSFET symbol
  const renderTransistor = (t: TransistorDevice) => {
    const stateInfo = transistorStates[t.id];
    const isOn = stateInfo?.state === 'ON';
    const isSelected = selectedTransistorId === t.id;

    // PMOS has circle bubble at gate, NMOS does not
    const isPmos = t.type === 'PMOS';
    const channelColor = isOn ? '#22c55e' : '#64748b';

    return (
      <g
        key={t.id}
        transform={`translate(${t.x}, ${t.y})`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelectTransistor(t.id);
        }}
      >
        {/* Selection ring */}
        {isSelected && (
          <rect
            x="-8"
            y="-8"
            width={t.width + 16}
            height={t.height + 16}
            rx="8"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}

        {/* Transistor Body Box (Translucent) */}
        <rect
          x="0"
          y="0"
          width={t.width}
          height={t.height}
          rx="6"
          fill={isOn ? 'rgba(34, 197, 94, 0.08)' : 'rgba(30, 41, 59, 0.5)'}
          stroke={isOn ? '#22c55e' : '#475569'}
          strokeWidth="1.5"
        />

        {/* Gate bar */}
        <line x1="8" y1="12" x2="8" y2="48" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

        {/* Gate Inversion Bubble for PMOS */}
        {isPmos ? (
          <circle cx="2" cy="30" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        ) : (
          <line x1="0" y1="30" x2="8" y2="30" stroke="#94a3b8" strokeWidth="2" />
        )}

        {/* Conductive Drain-Source Channel */}
        <line
          x1="22"
          y1="12"
          x2="22"
          y2="48"
          stroke={channelColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={isOn ? undefined : '4 3'}
        />

        {/* Source connection (top) */}
        <line x1="22" y1="18" x2="42" y2="18" stroke={channelColor} strokeWidth="2" />
        {/* Drain connection (bottom) */}
        <line x1="22" y1="42" x2="42" y2="42" stroke={channelColor} strokeWidth="2" />

        {/* Channel electron flow animation when ON */}
        {isOn && showAnimations && (
          <circle cx="22" cy="30" r="3" fill="#86efac" className="animate-ping" />
        )}

        {/* Identifier Label */}
        <text
          x={t.width / 2 + 8}
          y="34"
          fill={isOn ? '#4ade80' : '#94a3b8'}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
        >
          {t.id}
        </text>

        {/* ON / OFF State Badge */}
        <rect
          x={t.width - 24}
          y="4"
          width="20"
          height="12"
          rx="3"
          fill={isOn ? '#14532d' : '#334155'}
        />
        <text
          x={t.width - 14}
          y="13"
          fill={isOn ? '#86efac' : '#cbd5e1'}
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
        >
          {isOn ? 'ON' : 'OFF'}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center p-4">
      <svg
        viewBox="0 0 620 460"
        className="w-full h-full max-h-[500px] select-none"
      >
        <defs>
          <filter id="conduct-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Power Rails */}
        {/* VDD +5.0V Rail */}
        <rect x="60" y="30" width="480" height="12" rx="4" fill="#ef4444" opacity="0.8" />
        <text x="300" y="22" fill="#fca5a5" fontSize="12" fontWeight="bold" textAnchor="middle">
          +5.0 V (VDD Power Rail)
        </text>

        {/* GND 0.0V Rail */}
        <rect x="60" y="415" width="480" height="12" rx="4" fill="#3b82f6" opacity="0.8" />
        <text x="300" y="445" fill="#93c5fd" fontSize="12" fontWeight="bold" textAnchor="middle">
          0.0 V (Ground Reference GND)
        </text>

        {/* Schematic Wiring Paths based on model */}
        {model.gateType === 'AND' && (
          <g className="schematic-interconnects">
            {/* Input A Wire: from IN_A terminal to Q1 and Q3 gates */}
            <path
              d="M 80 130 L 120 130 L 120 140 L 160 140 M 120 130 L 120 260 L 215 260"
              stroke={nodeVoltages['IN_A'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* Input B Wire: from IN_B terminal to Q2 and Q4 gates */}
            <path
              d="M 80 280 L 105 280 L 105 80 L 250 80 L 250 140 L 270 140 M 105 280 L 105 350 L 215 350"
              stroke={nodeVoltages['IN_B'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />

            {/* VDD down to PMOS Q1 & Q2 */}
            <path d="M 182 42 L 182 110" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 292 42 L 292 110" stroke="#ef4444" strokeWidth="2.5" />

            {/* PMOS outputs to NAND node */}
            <path
              d="M 204 170 L 204 195 L 314 195 L 314 170"
              stroke={nodeVoltages['NODE_NAND'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            <line x1="250" y1="195" x2="250" y2="230" stroke={nodeVoltages['NODE_NAND'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />

            {/* Series NMOS Q3 to Q4 */}
            <line x1="257" y1="290" x2="257" y2="320" stroke={nodeVoltages['NODE_INT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            {/* NMOS Q4 down to GND */}
            <line x1="257" y1="380" x2="257" y2="415" stroke="#3b82f6" strokeWidth="2.5" />

            {/* NAND node to Inverter Gates Q5 & Q6 */}
            <path
              d="M 314 195 L 370 195 L 370 160 L 420 160 M 370 195 L 370 320 L 420 320"
              stroke={nodeVoltages['NODE_NAND'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />

            {/* Inverter VDD to Q5 and GND to Q6 */}
            <line x1="442" y1="42" x2="442" y2="130" stroke="#ef4444" strokeWidth="2.5" />
            <line x1="442" y1="350" x2="442" y2="415" stroke="#3b82f6" strokeWidth="2.5" />

            {/* Inverter Q5/Q6 outputs to OUT */}
            <path
              d="M 462 190 L 462 250 M 462 220 L 530 220"
              stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="3"
              fill="none"
            />
          </g>
        )}

        {model.gateType === 'NOT' && (
          <g className="schematic-interconnects">
            {/* Input A to Gates */}
            <path
              d="M 100 200 L 170 200 L 170 150 L 230 150 M 170 200 L 170 300 L 230 300"
              stroke={nodeVoltages['IN_A'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* VDD to Q1 */}
            <line x1="252" y1="42" x2="252" y2="120" stroke="#ef4444" strokeWidth="2.5" />
            {/* Q1 to Q2 channel */}
            <line x1="252" y1="180" x2="252" y2="270" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            {/* Q2 to GND */}
            <line x1="252" y1="330" x2="252" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
            {/* Output line */}
            <line x1="252" y1="225" x2="380" y2="225" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="3" />
          </g>
        )}

        {model.gateType === 'NAND' && (
          <g className="schematic-interconnects">
            {/* Input A Wire */}
            <path
              d="M 80 130 L 130 130 L 130 140 L 210 140 M 130 130 L 130 260 L 270 260"
              stroke={nodeVoltages['IN_A'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* Input B Wire */}
            <path
              d="M 80 280 L 110 280 L 110 80 L 310 80 L 310 140 L 330 140 M 110 280 L 110 350 L 270 350"
              stroke={nodeVoltages['IN_B'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* VDD down to PMOS Q1 & Q2 */}
            <line x1="232" y1="42" x2="232" y2="110" stroke="#ef4444" strokeWidth="2.5" />
            <line x1="352" y1="42" x2="352" y2="110" stroke="#ef4444" strokeWidth="2.5" />
            {/* PMOS drains to OUT */}
            <path d="M 232 170 L 232 190 L 352 190 L 352 170" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" fill="none" />
            <line x1="292" y1="190" x2="420" y2="190" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="3" />
            {/* NMOS series Q3 to Q4 */}
            <line x1="292" y1="190" x2="292" y2="230" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            <line x1="292" y1="290" x2="292" y2="320" stroke={nodeVoltages['NODE_INT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            <line x1="292" y1="380" x2="292" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
          </g>
        )}

        {model.gateType === 'OR' && (
          <g className="schematic-interconnects">
            {/* Input A Wire */}
            <path
              d="M 60 110 L 110 110 L 110 120 L 180 120 M 110 110 L 110 310 L 140 310"
              stroke={nodeVoltages['IN_A'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* Input B Wire */}
            <path
              d="M 60 240 L 90 240 L 90 200 L 180 200 M 90 240 L 90 310 L 250 310"
              stroke={nodeVoltages['IN_B'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* VDD down to PMOS Q1 */}
            <line x1="202" y1="42" x2="202" y2="90" stroke="#ef4444" strokeWidth="2.5" />
            {/* PMOS Q1 to Q2 series */}
            <line x1="202" y1="150" x2="202" y2="170" stroke={nodeVoltages['NODE_P_INT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            {/* PMOS Q2 to NOR node */}
            <line x1="202" y1="230" x2="202" y2="250" stroke={nodeVoltages['NODE_NOR'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            <path d="M 202 250 L 162 250 L 162 280 M 202 250 L 272 250 L 272 280" stroke={nodeVoltages['NODE_NOR'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" fill="none" />
            {/* NMOS Q3 & Q4 to GND */}
            <line x1="162" y1="340" x2="162" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
            <line x1="272" y1="340" x2="272" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
            {/* NOR node to Inverter */}
            <path d="M 202 250 L 340 250 L 340 160 L 390 160 M 340 250 L 340 310 L 390 310" stroke={nodeVoltages['NODE_NOR'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" fill="none" />
            {/* Inverter VDD to Q5 and GND to Q6 */}
            <line x1="412" y1="42" x2="412" y2="130" stroke="#ef4444" strokeWidth="2.5" />
            <line x1="412" y1="340" x2="412" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
            {/* Inverter to OUT */}
            <path d="M 432 190 L 432 250 M 432 220 L 490 220" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="3" fill="none" />
          </g>
        )}

        {model.gateType === 'NOR' && (
          <g className="schematic-interconnects">
            {/* Input A Wire */}
            <path
              d="M 70 130 L 130 130 L 130 130 L 210 130 M 130 130 L 130 330 L 160 330"
              stroke={nodeVoltages['IN_A'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* Input B Wire */}
            <path
              d="M 70 220 L 110 220 L 110 220 L 210 220 M 110 220 L 110 330 L 270 330"
              stroke={nodeVoltages['IN_B'] > 2.5 ? '#22c55e' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />
            {/* VDD down to PMOS Q1 */}
            <line x1="232" y1="42" x2="232" y2="100" stroke="#ef4444" strokeWidth="2.5" />
            {/* PMOS Q1 to Q2 series */}
            <line x1="232" y1="160" x2="232" y2="190" stroke={nodeVoltages['NODE_P_INT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            {/* PMOS Q2 to OUT */}
            <line x1="232" y1="250" x2="232" y2="270" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" />
            <path d="M 232 270 L 182 270 L 182 300 M 232 270 L 292 270 L 292 300" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="2.5" fill="none" />
            <line x1="232" y1="270" x2="440" y2="270" stroke={nodeVoltages['OUT'] > 2.5 ? '#22c55e' : '#475569'} strokeWidth="3" />
            {/* NMOS Q3 & Q4 to GND */}
            <line x1="182" y1="360" x2="182" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
            <line x1="292" y1="360" x2="292" y2="415" stroke="#3b82f6" strokeWidth="2.5" />
          </g>
        )}

        {/* Render All Transistor Devices */}
        {model.transistors.map(renderTransistor)}

        {/* Probe Nodes (Touch/Click to measure voltage with Multimeter or toggle inputs) */}
        {model.probeNodes.map((node) => {
          const isProbed = activeProbeNodeId === node.id;
          const voltage = nodeVoltages[node.id] ?? (node.id === 'VDD' ? 5.0 : node.id === 'GND' ? 0.0 : 0.0);
          const isInput = node.type === 'input';
          const inputName = node.id.replace('IN_', '');

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                if (isInput && onToggleInput) {
                  onToggleInput(inputName);
                }
                onSelectProbeNode(node.id);
              }}
            >
              {/* Click target */}
              <circle cx="0" cy="0" r="14" fill="transparent" />

              {/* Probe Terminal circle */}
              <circle
                cx="0"
                cy="0"
                r={isProbed ? 9 : isInput ? 7.5 : 6}
                fill={isProbed ? '#f59e0b' : voltage > 2.5 ? '#22c55e' : '#334155'}
                stroke={isProbed ? '#ffffff' : isInput ? '#38bdf8' : '#94a3b8'}
                strokeWidth={isInput ? '2.5' : '2'}
                className="transition-all"
              />

              {/* Node Voltage Tooltip */}
              <text
                x="0"
                y="-13"
                fill={isProbed ? '#fbbf24' : isInput ? '#7dd3fc' : '#cbd5e1'}
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {node.label}: {voltage.toFixed(1)}V {isInput ? '(Click to toggle)' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
