/**
 * Wire Rendering Engine with Signal Glow, Voltage Color, and Orthogonal Paths
 */

import React from 'react';
import { CircuitComponent, LogicValue, Wire } from '../../types/circuit';

interface WireRendererProps {
  wires: Wire[];
  components: CircuitComponent[];
  selectedWireId?: string | null;
  onSelectWire?: (wireId: string) => void;
  showAnimations?: boolean;
  isSimRunning?: boolean;
  theme?: 'dark' | 'light';
}

export function getPinAbsolutePosition(
  component: CircuitComponent,
  pinId: string
): { x: number; y: number } | null {
  const pin =
    component.inputs.find((p) => p.id === pinId) ||
    component.outputs.find((p) => p.id === pinId);
  if (!pin) return null;

  // Compute rotation around component center
  const rad = (component.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rx = pin.relativeX;
  const ry = pin.relativeY;

  return {
    x: component.x + (rx * cos - ry * sin),
    y: component.y + (rx * sin + ry * cos),
  };
}

export function computeWirePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): string {
  // Smooth cubic Bezier routing with horizontal inflection
  const dx = Math.abs(toX - fromX);
  const offset = Math.max(30, Math.min(dx * 0.5, 120));

  const cp1X = fromX + offset;
  const cp1Y = fromY;
  const cp2X = toX - offset;
  const cp2Y = toY;

  return `M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wires,
  components,
  selectedWireId,
  onSelectWire,
  showAnimations = true,
  isSimRunning = true,
  theme = 'dark',
}) => {
  const compMap = new Map<string, CircuitComponent>();
  components.forEach((c) => compMap.set(c.id, c));

  const getWireStroke = (val: LogicValue, isSelected: boolean) => {
    if (isSelected) return '#0284c7';
    // If simulation is paused / stopped, display neutral dormant wire
    if (!isSimRunning) {
      return theme === 'light' ? '#94a3b8' : '#475569';
    }
    switch (val) {
      case 1:
        return '#16a34a'; // High: bright green
      case 0:
        return theme === 'light' ? '#64748b' : '#475569'; // Low
      case 'Z':
        return '#d97706'; // Floating: amber
      case 'X':
        return '#e11d48'; // Error: bright red
      default:
        return theme === 'light' ? '#94a3b8' : '#64748b';
    }
  };

  return (
    <g className="wires-layer">
      {/* SVG glow filter for active high wires */}
      <defs>
        <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {wires.map((wire) => {
        const fromComp = compMap.get(wire.fromComponentId);
        const toComp = compMap.get(wire.toComponentId);
        if (!fromComp || !toComp) return null;

        const fromPos = getPinAbsolutePosition(fromComp, wire.fromPinId);
        const toPos = getPinAbsolutePosition(toComp, wire.toPinId);
        if (!fromPos || !toPos) return null;

        const pathData = computeWirePath(fromPos.x, fromPos.y, toPos.x, toPos.y);
        const isSelected = selectedWireId === wire.id;
        const strokeColor = getWireStroke(wire.value, isSelected);
        const isHigh = wire.value === 1;

        return (
          <g key={wire.id} className="wire-group cursor-pointer">
            {/* Thick transparent touch/click target for mobile and desktop */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              strokeLinecap="round"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire?.(wire.id);
              }}
            />

            {/* Glowing underlay for HIGH signals: only when simulator is actively running */}
            {isHigh && showAnimations && isSimRunning && (
              <path
                d={pathData}
                fill="none"
                stroke="#22c55e"
                strokeWidth="6"
                strokeOpacity="0.4"
                strokeLinecap="round"
                filter="url(#wire-glow)"
                pointerEvents="none"
              />
            )}

            {/* Main wire path */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isSelected ? 3.5 : (isHigh && isSimRunning) ? 2.8 : 2}
              strokeDasharray={wire.value === 'Z' ? '6 4' : undefined}
              strokeLinecap="round"
              pointerEvents="none"
            />

            {/* Animated electron dots on active high wires: only when running */}
            {isHigh && showAnimations && isSimRunning && (
              <path
                d={pathData}
                fill="none"
                stroke="#86efac"
                strokeWidth="2.5"
                strokeDasharray="4 16"
                strokeLinecap="round"
                className="animate-pulse"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};
