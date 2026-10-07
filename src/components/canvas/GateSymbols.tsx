/**
 * SVG Schematic Symbols for all Circuit Components
 * Follows IEEE / ANSI standard digital logic gate symbology
 */

import React from 'react';
import { CircuitComponent } from '../../types/circuit';
import { COMPONENT_DEFINITIONS } from '../../engine/definitions';

interface GateSymbolProps {
  component: CircuitComponent;
  selected?: boolean;
  onToggleSwitch?: (id: string) => void;
  onPressButton?: (id: string, pressed: boolean) => void;
  isMobileTouch?: boolean;
  isSimRunning?: boolean;
}

export const GateSymbols: React.FC<GateSymbolProps> = ({
  component,
  selected = false,
  onToggleSwitch,
  onPressButton,
  isSimRunning = true,
}) => {
  const { type, inputs, outputs, state = {} } = component;

  // Render individual component interior graphics
  const renderGraphic = () => {
    switch (type) {
      case 'AND':
        return (
          <g>
            <path
              d="M 15 10 L 45 10 A 20 20 0 0 1 45 50 L 15 50 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <text x="35" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              &
            </text>
          </g>
        );

      case 'NAND':
        return (
          <g>
            <path
              d="M 15 10 L 45 10 A 20 20 0 0 1 45 50 L 15 50 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            {/* Inversion bubble */}
            <circle cx="68" cy="30" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <text x="35" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              &
            </text>
          </g>
        );

      case 'OR':
        return (
          <g>
            <path
              d="M 12 10 Q 30 30 12 50 Q 45 50 68 30 Q 45 10 12 10 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <text x="36" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              ≥1
            </text>
          </g>
        );

      case 'NOR':
        return (
          <g>
            <path
              d="M 12 10 Q 30 30 12 50 Q 45 50 64 30 Q 45 10 12 10 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <circle cx="68" cy="30" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <text x="36" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              ≥1
            </text>
          </g>
        );

      case 'XOR':
        return (
          <g>
            {/* Extra input curve */}
            <path d="M 6 10 Q 24 30 6 50" fill="none" stroke={selected ? '#38bdf8' : '#94a3b8'} strokeWidth="2.5" />
            <path
              d="M 14 10 Q 32 30 14 50 Q 45 50 68 30 Q 45 10 14 10 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <text x="36" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              =1
            </text>
          </g>
        );

      case 'XNOR':
        return (
          <g>
            <path d="M 6 10 Q 24 30 6 50" fill="none" stroke={selected ? '#38bdf8' : '#94a3b8'} strokeWidth="2.5" />
            <path
              d="M 14 10 Q 32 30 14 50 Q 45 50 64 30 Q 45 10 14 10 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <circle cx="68" cy="30" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <text x="36" y="34" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" pointerEvents="none">
              =1
            </text>
          </g>
        );

      case 'NOT':
        return (
          <g>
            <path
              d="M 15 10 L 52 25 L 15 40 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <circle cx="58" cy="25" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <text x="30" y="29" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" pointerEvents="none">
              1
            </text>
          </g>
        );

      case 'BUFFER':
        return (
          <g>
            <path
              d="M 15 10 L 60 25 L 15 40 Z"
              fill="#1e293b"
              stroke={selected ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <text x="32" y="29" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" pointerEvents="none">
              1
            </text>
          </g>
        );

      case 'CONST_HIGH': {
        const active = isSimRunning;
        return (
          <g>
            <rect x="5" y="5" width="40" height="30" rx="6" fill="#1e293b" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" />
            <text x="25" y="24" fill={active ? '#22c55e' : '#94a3b8'} fontSize="14" fontWeight="bold" textAnchor="middle">
              1
            </text>
          </g>
        );
      }

      case 'CONST_LOW':
        return (
          <g>
            <rect x="5" y="5" width="40" height="30" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <text x="25" y="24" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">
              0
            </text>
          </g>
        );

      case 'SWITCH': {
        const isOn = !!state.toggle;
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSwitch?.(component.id);
            }}
          >
            <rect
              x="5"
              y="6"
              width="60"
              height="38"
              rx="8"
              fill={isOn ? '#064e3b' : '#1e293b'}
              stroke={isOn ? '#10b981' : '#64748b'}
              strokeWidth="2"
            />
            {/* Toggle lever */}
            <circle
              cx={isOn ? 45 : 22}
              cy="25"
              r="10"
              fill={isOn ? '#34d399' : '#94a3b8'}
              className="transition-all duration-150"
            />
            <text
              x={isOn ? 24 : 44}
              y="29"
              fill={isOn ? '#a7f3d0' : '#64748b'}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              pointerEvents="none"
            >
              {isOn ? '1' : '0'}
            </text>
          </g>
        );
      }

      case 'BUTTON': {
        const isPressed = !!state.pressed;
        return (
          <g
            className="cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, true);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, false);
            }}
          >
            <rect
              x="5"
              y="6"
              width="60"
              height="38"
              rx="8"
              fill={isPressed ? '#1e3a8a' : '#1e293b'}
              stroke={isPressed ? '#3b82f6' : '#64748b'}
              strokeWidth="2"
            />
            <circle
              cx="35"
              cy="25"
              r="11"
              fill={isPressed ? '#60a5fa' : '#475569'}
              stroke={isPressed ? '#93c5fd' : '#334155'}
              strokeWidth="2"
            />
          </g>
        );
      }

      case 'CLOCK': {
        const outVal = isSimRunning && outputs[0]?.value === 1;
        const displayLabel = component.label || 'CLK';
        return (
          <g>
            <rect
              x="5"
              y="6"
              width="60"
              height="38"
              rx="8"
              fill="#1e293b"
              stroke={outVal ? '#38bdf8' : '#64748b'}
              strokeWidth="2"
            />
            {/* Square wave icon */}
            <path
              d="M 14 31 L 22 31 L 22 20 L 32 20 L 32 31 L 40 31"
              fill="none"
              stroke={outVal ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.2"
            />
            {/* CLK label */}
            <text
              x="27"
              y="15"
              fill={outVal ? '#38bdf8' : '#cbd5e1'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              pointerEvents="none"
            >
              {displayLabel}
            </text>
            <circle
              cx="53"
              cy="14"
              r="3.5"
              fill={outVal ? '#38bdf8' : '#334155'}
            />
          </g>
        );
      }

      case 'LED': {
        const inVal = isSimRunning && inputs[0]?.value === 1;
        const color = state.ledColor || 'red';
        const colorMap: Record<string, { on: string; glow: string; off: string }> = {
          red: { on: '#ef4444', glow: 'rgba(239, 68, 68, 0.65)', off: '#451a1a' },
          green: { on: '#22c55e', glow: 'rgba(34, 197, 94, 0.65)', off: '#143321' },
          blue: { on: '#3b82f6', glow: 'rgba(59, 130, 246, 0.65)', off: '#172554' },
          amber: { on: '#f59e0b', glow: 'rgba(245, 158, 11, 0.65)', off: '#452a10' },
          purple: { on: '#a855f7', glow: 'rgba(168, 85, 247, 0.65)', off: '#3b1754' },
          cyan: { on: '#06b6d4', glow: 'rgba(6, 182, 212, 0.65)', off: '#11333d' },
        };
        const c = colorMap[color] || colorMap.red;

        return (
          <g>
            {/* Outer bezel */}
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="#0f172a"
              stroke={selected ? '#38bdf8' : '#475569'}
              strokeWidth={selected ? '2.5' : '2'}
            />
            {/* LED lens */}
            <circle
              cx="25"
              cy="25"
              r="15"
              fill={inVal ? c.on : c.off}
              style={{
                filter: inVal ? `drop-shadow(0 0 10px ${c.glow})` : undefined,
              }}
            />
            {/* Reflection highlights */}
            <path
              d="M 18 19 A 10 10 0 0 1 29 16"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={inVal ? 0.8 : 0.25}
            />
            {/* Color indicator pip when selected */}
            {selected && (
              <circle
                cx="25"
                cy="25"
                r="4"
                fill={c.on}
                stroke="#ffffff"
                strokeWidth="1"
                opacity={0.8}
              />
            )}
          </g>
        );
      }

      case 'PROBE': {
        const val = isSimRunning ? inputs[0]?.value : 'Z';
        const isHigh = val === 1;
        const isLow = val === 0;
        const voltage = isSimRunning ? (inputs[0]?.voltage ?? 0) : 0;

        return (
          <g>
            <rect
              x="5"
              y="6"
              width="70"
              height="38"
              rx="6"
              fill="#020617"
              stroke={isHigh ? '#22c55e' : isLow ? '#3b82f6' : '#f59e0b'}
              strokeWidth="2"
            />
            <text x="40" y="22" fill={isHigh ? '#4ade80' : isLow ? '#60a5fa' : '#fcd34d'} fontSize="11" fontWeight="bold" textAnchor="middle">
              {isHigh ? 'HIGH (1)' : isLow ? 'LOW (0)' : 'FLOAT (Z)'}
            </text>
            <text x="40" y="36" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {voltage.toFixed(2)} V
            </text>
          </g>
        );
      }

      case 'SEVEN_SEGMENT': {
        // inputs: a, b, c, d, e, f, g
        const vals = inputs.map((p) => isSimRunning && p.value === 1);
        const [a, b, c, d, e, f, g] = vals;
        const segOn = '#ef4444';
        const segOff = '#2d1515';

        return (
          <g>
            <rect x="5" y="5" width="80" height="110" rx="8" fill="#090d16" stroke="#334155" strokeWidth="2" />
            {/* Segment a (top) */}
            <rect x="25" y="16" width="40" height="7" rx="3" fill={a ? segOn : segOff} />
            {/* Segment b (top right) */}
            <rect x="62" y="24" width="7" height="30" rx="3" fill={b ? segOn : segOff} />
            {/* Segment c (bottom right) */}
            <rect x="62" y="60" width="7" height="30" rx="3" fill={c ? segOn : segOff} />
            {/* Segment d (bottom) */}
            <rect x="25" y="93" width="40" height="7" rx="3" fill={d ? segOn : segOff} />
            {/* Segment e (bottom left) */}
            <rect x="20" y="60" width="7" height="30" rx="3" fill={e ? segOn : segOff} />
            {/* Segment f (top left) */}
            <rect x="20" y="24" width="7" height="30" rx="3" fill={f ? segOn : segOff} />
            {/* Segment g (center) */}
            <rect x="25" y="55" width="40" height="7" rx="3" fill={g ? segOn : segOff} />
          </g>
        );
      }

      case 'HEX_DISPLAY': {
        // inputs: D3, D2, D1, D0
        let num = 0;
        let valid = isSimRunning;
        if (isSimRunning) {
          inputs.forEach((p, idx) => {
            if (p.value === 'X' || p.value === 'Z') valid = false;
            else if (p.value === 1) {
              num |= 1 << (3 - idx);
            }
          });
        }
        const hexChar = !isSimRunning ? '-' : valid ? num.toString(16).toUpperCase() : '?';

        return (
          <g>
            <rect x="5" y="5" width="80" height="90" rx="8" fill="#020617" stroke={isSimRunning && valid ? '#38bdf8' : '#334155'} strokeWidth="2" />
            <text
              x="45"
              y="62"
              fill={!isSimRunning ? '#475569' : valid ? '#38bdf8' : '#f43f5e'}
              fontSize="48"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              style={{
                filter: isSimRunning && valid ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' : undefined,
              }}
            >
              {hexChar}
            </text>
            <text x="45" y="82" fill="#64748b" fontSize="9" textAnchor="middle">
              HEX
            </text>
          </g>
        );
      }

      case 'BUZZER': {
        const active = isSimRunning && inputs[0]?.value === 1;
        return (
          <g>
            <rect x="5" y="5" width="50" height="40" rx="8" fill="#1e293b" stroke={active ? '#f59e0b' : '#64748b'} strokeWidth="2" />
            <circle cx="30" cy="25" r="12" fill={active ? '#b45309' : '#334155'} />
            <path
              d="M 23 20 L 27 20 L 33 15 L 33 35 L 27 30 L 23 30 Z"
              fill={active ? '#fde68a' : '#cbd5e1'}
            />
            {active && (
              <path
                d="M 37 19 Q 41 25 37 31 M 40 16 Q 46 25 40 34"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      }

      case 'NMOS_TRANSISTOR': {
        const isOn = isSimRunning && inputs[0]?.value === 1; // Gate is pin 0
        const isConducting = isOn;
        return (
          <g>
            <rect
              x="5"
              y="5"
              width="70"
              height="60"
              rx="8"
              fill={isConducting ? '#052e16' : '#1e293b'}
              stroke={isConducting ? '#22c55e' : selected ? '#38bdf8' : '#64748b'}
              strokeWidth="2"
            />
            {/* Gate vertical bar */}
            <line x1="24" y1="18" x2="24" y2="52" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Gate lead from pin 0 (y=23.3) */}
            <line x1="5" y1="23" x2="24" y2="23" stroke={isSimRunning && inputs[0]?.value === 1 ? '#22c55e' : '#94a3b8'} strokeWidth="2" />
            {/* Channel bar */}
            <line
              x1="34"
              y1="18"
              x2="34"
              y2="52"
              stroke={isConducting ? '#22c55e' : '#64748b'}
              strokeWidth="3"
              strokeDasharray={isConducting ? undefined : '4 3'}
            />
            {/* Drain connection from pin 1 (y=46.6) */}
            <line x1="5" y1="46" x2="34" y2="46" stroke={isSimRunning && inputs[1]?.value === 1 ? '#22c55e' : '#94a3b8'} strokeWidth="2" />
            {/* Source output lead to output pin (x=80, y=35) */}
            <line x1="34" y1="35" x2="75" y2="35" stroke={isSimRunning && outputs[0]?.value === 1 ? '#22c55e' : '#64748b'} strokeWidth="2.5" />
            <text x="50" y="24" fill={isConducting ? '#4ade80' : '#94a3b8'} fontSize="9" fontWeight="bold" textAnchor="middle">
              NMOS
            </text>
            <text x="50" y="55" fill={isConducting ? '#86efac' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">
              {isConducting ? 'ON (5V)' : 'OFF (0V)'}
            </text>
          </g>
        );
      }

      case 'PMOS_TRANSISTOR': {
        const isOn = isSimRunning && inputs[0]?.value === 0; // PMOS turns ON when Gate is 0V
        const isConducting = isOn;
        return (
          <g>
            <rect
              x="5"
              y="5"
              width="70"
              height="60"
              rx="8"
              fill={isConducting ? '#052e16' : '#1e293b'}
              stroke={isConducting ? '#22c55e' : selected ? '#38bdf8' : '#64748b'}
              strokeWidth="2"
            />
            {/* Gate bar */}
            <line x1="28" y1="18" x2="28" y2="52" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Inversion bubble at Gate */}
            <circle cx="20" cy="23" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Gate lead */}
            <line x1="5" y1="23" x2="16" y2="23" stroke={isSimRunning && inputs[0]?.value === 1 ? '#22c55e' : '#94a3b8'} strokeWidth="2" />
            {/* Channel bar */}
            <line
              x1="38"
              y1="18"
              x2="38"
              y2="52"
              stroke={isConducting ? '#22c55e' : '#64748b'}
              strokeWidth="3"
              strokeDasharray={isConducting ? undefined : '4 3'}
            />
            {/* Source connection */}
            <line x1="5" y1="46" x2="38" y2="46" stroke={isSimRunning && inputs[1]?.value === 1 ? '#22c55e' : '#94a3b8'} strokeWidth="2" />
            {/* Drain output lead */}
            <line x1="38" y1="35" x2="75" y2="35" stroke={isSimRunning && outputs[0]?.value === 1 ? '#22c55e' : '#64748b'} strokeWidth="2.5" />
            <text x="54" y="24" fill={isConducting ? '#4ade80' : '#94a3b8'} fontSize="9" fontWeight="bold" textAnchor="middle">
              PMOS
            </text>
            <text x="54" y="55" fill={isConducting ? '#86efac' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">
              {isConducting ? 'ON (0V)' : 'OFF (5V)'}
            </text>
          </g>
        );
      }

      case 'PULLUP_RESISTOR': {
        const outHigh = outputs[0]?.value === 1;
        return (
          <g>
            <rect x="5" y="5" width="60" height="40" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M 12 25 L 20 25 L 24 16 L 30 34 L 36 16 L 42 34 L 46 25 L 58 25" fill="none" stroke="#ef4444" strokeWidth="2" />
            <text x="35" y="14" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">
              PULL-UP +5V
            </text>
          </g>
        );
      }

      case 'PULLDOWN_RESISTOR': {
        return (
          <g>
            <rect x="5" y="5" width="60" height="40" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <path d="M 12 25 L 20 25 L 24 16 L 30 34 L 36 16 L 42 34 L 46 25 L 58 25" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <text x="35" y="14" fill="#93c5fd" fontSize="8" fontWeight="bold" textAnchor="middle">
              PULL-DOWN GND
            </text>
          </g>
        );
      }

      case 'TIMING_ANALYZER': {
        const width = 260;
        const height = 180;
        const channelColors = ['#38bdf8', '#4ade80', '#fbbf24', '#f43f5e'];
        const channelNames = ['CH1', 'CH2', 'CH3', 'CH4'];
        const simTick = state.simTick || 0;

        return (
          <g>
            {/* Outer Chassis */}
            <rect
              x="2"
              y="2"
              width={width - 4}
              height={height - 4}
              rx="10"
              fill="#090d16"
              stroke={selected ? '#38bdf8' : '#334155'}
              strokeWidth={selected ? '2.5' : '1.5'}
            />

            {/* Chassis Header Bar */}
            <rect x="4" y="4" width={width - 8} height="20" rx="8" fill="#0f172a" />
            <circle cx="16" cy="14" r="3.5" fill={isSimRunning && simTick > 0 ? '#22c55e' : '#f59e0b'} className={isSimRunning && simTick > 0 ? 'animate-pulse' : ''} />
            <text x="26" y="17" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">
              TIMING ANALYZER / OSCILLOSCOPE
            </text>
            <text x={width - 12} y="17" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
              5V/DIV • AUTO
            </text>

            {/* Oscilloscope Screen Bezel */}
            <rect
              x="76"
              y="26"
              width="176"
              height="132"
              rx="4"
              fill="#020c09"
              stroke="#064e3b"
              strokeWidth="1.5"
            />

            {/* CRT Phosphor Screen Grid Lines */}
            <line x1="76" y1="58" x2="252" y2="58" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="76" y1="90" x2="252" y2="90" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="76" y1="122" x2="252" y2="122" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="120" y1="26" x2="120" y2="158" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="164" y1="26" x2="164" y2="158" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="208" y1="26" x2="208" y2="158" stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* Channels: 4 Signal Traces */}
            {[0, 1, 2, 3].map((chIdx) => {
              const color = channelColors[chIdx];
              const pin = inputs[chIdx];
              const isHigh = pin?.value === 1;
              const isLow = pin?.value === 0;
              const isUndef = pin?.value === 'X';
              const isFloating = !pin || pin.value === 'Z';
              const isConnected = !isFloating;
              const volt = pin?.voltage ?? (isHigh ? 5.0 : isLow ? 0.0 : 2.5);
              const history = (state.timingHistory && pin && state.timingHistory[pin.id]) || [];

              const rowTopY = 28 + chIdx * 32;
              const highY = rowTopY + 5;
              const midY = rowTopY + 14;
              const lowY = rowTopY + 23;

              // Generate square wave SVG path
              let wavePath = '';
              const maxPoints = 20;
              const pointsToRender = history.slice(-maxPoints);

              const getYForVal = (v: any) => {
                if (v === 1) return highY;
                if (v === 0) return lowY;
                return midY;
              };

              if (pointsToRender.length > 1) {
                const screenW = 166;
                const startX = 80;
                pointsToRender.forEach((pt, i) => {
                  const x = startX + (i / (maxPoints - 1)) * screenW;
                  const targetY = getYForVal(pt.value);
                  if (i === 0) {
                    wavePath = `M ${x} ${targetY}`;
                  } else {
                    const prevPt = pointsToRender[i - 1];
                    const prevY = getYForVal(prevPt.value);
                    if (prevY !== targetY) {
                      wavePath += ` L ${x} ${prevY} L ${x} ${targetY}`;
                    } else {
                      wavePath += ` L ${x} ${targetY}`;
                    }
                  }
                });
              } else {
                // Default flat line at current level
                const currentY = isConnected ? getYForVal(pin?.value) : midY;
                wavePath = `M 80 ${currentY} L 246 ${currentY}`;
              }

              return (
                <g key={chIdx}>
                  {/* Left Channel Header / Status Pill */}
                  <rect
                    x="8"
                    y={rowTopY}
                    width="62"
                    height="26"
                    rx="4"
                    fill="#0f172a"
                    stroke={isUndef ? '#f59e0b' : color}
                    strokeWidth={isUndef ? '1.5' : '1'}
                    opacity={isConnected ? 1 : 0.5}
                  />

                  {/* Channel Tag */}
                  <text
                    x="13"
                    y={rowTopY + 11}
                    fill={color}
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {channelNames[chIdx]}
                  </text>

                  {/* Voltage & Logic Value */}
                  <text
                    x="13"
                    y={rowTopY + 21}
                    fill={
                      isHigh
                        ? '#86efac'
                        : isLow
                        ? '#93c5fd'
                        : isUndef
                        ? '#fbbf24'
                        : '#64748b'
                    }
                    fontSize="7.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isHigh
                      ? '5.0V (HIGH)'
                      : isLow
                      ? '0.0V (LOW)'
                      : isUndef
                      ? '2.5V (UNDEF)'
                      : 'OPEN (Z)'}
                  </text>

                  {/* Waveform Trace on Screen */}
                  <path
                    d={wavePath}
                    fill="none"
                    stroke={isUndef ? '#f59e0b' : color}
                    strokeWidth={isConnected ? '2' : '1'}
                    strokeDasharray={isFloating ? '4 4' : isUndef ? '3 2' : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isFloating ? 0.35 : 1}
                  />

                  {/* Small level labels at left of waveform */}
                  <text x="74" y={highY + 3} fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="end">
                    5V
                  </text>
                  <text x="74" y={lowY + 3} fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="end">
                    0V
                  </text>
                </g>
              );
            })}

            {/* Sweep indicator line */}
            <line x1="246" y1="28" x2="246" y2="156" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8" />

            {/* Time Axis Bar at bottom */}
            <text x="76" y="172" fill="#64748b" fontSize="8" fontFamily="monospace">
              0V ──── 5V
            </text>
            <text x="160" y="172" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">
              Time →
            </text>
            <text x={width - 12} y="172" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
              Tick: {simTick}
            </text>
          </g>
        );
      }

      case 'SR_LATCH': {
        const isUndefined = component.state?.isUndefined || (inputs[0]?.value === 1 && inputs[1]?.value === 1);
        const def = COMPONENT_DEFINITIONS.SR_LATCH;
        const width = def?.width || 100;
        const height = def?.height || 80;
        return (
          <g>
            <rect
              x="5"
              y="5"
              width={width - 10}
              height={height - 10}
              rx="6"
              fill={isUndefined ? '#1c1308' : '#0f172a'}
              stroke={isUndefined ? '#f59e0b' : selected ? '#38bdf8' : '#475569'}
              strokeWidth={isUndefined ? '2.5' : '2'}
              style={isUndefined ? { filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))' } : undefined}
            />
            {/* Notch at top */}
            <circle cx={width / 2} cy="5" r="4" fill="#1e293b" stroke={isUndefined ? '#f59e0b' : '#475569'} strokeWidth="1" />
            <text
              x={width / 2}
              y={isUndefined ? height / 2 - 4 : height / 2 + 4}
              fill={isUndefined ? '#fbbf24' : '#cbd5e1'}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              pointerEvents="none"
            >
              {component.label || 'SR Latch'}
            </text>

            {/* Prominent Warning on chip when S=1 and R=1 */}
            {isUndefined && (
              <g>
                <rect
                  x="12"
                  y={height / 2 + 4}
                  width={width - 24}
                  height="17"
                  rx="4"
                  fill="#78350f"
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <text
                  x={width / 2}
                  y={height / 2 + 16}
                  fill="#fef3c7"
                  fontSize="8.5"
                  fontWeight="800"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  ⚠️ UNDEFINED
                </text>
              </g>
            )}
          </g>
        );
      }

      // Default IC chip box for complex arithmetic, sequential, and multiplexers
      default: {
        const def = COMPONENT_DEFINITIONS[component.type];
        const width = def?.width || 100;
        const height = def?.height || 80;
        const displayName = def?.name || component.label || component.type;
        return (
          <g>
            <rect
              x="5"
              y="5"
              width={width - 10}
              height={height - 10}
              rx="6"
              fill="#0f172a"
              stroke={selected ? '#38bdf8' : '#475569'}
              strokeWidth="2"
            />
            {/* Notch at top */}
            <circle cx={width / 2} cy="5" r="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text
              x={width / 2}
              y={height / 2 + 4}
              fill="#cbd5e1"
              fontSize={width > 110 ? "10" : "11"}
              fontWeight="600"
              textAnchor="middle"
              pointerEvents="none"
            >
              {component.label || displayName}
            </text>
          </g>
        );
      }
    }
  };

  return (
    <g>
      {renderGraphic()}

      {/* Component Title / Identifier Label */}
      {component.label && (
        <text
          x={component.type === 'SEVEN_SEGMENT' ? 45 : 35}
          y="-6"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="500"
          textAnchor="middle"
          pointerEvents="none"
        >
          {component.label}
        </text>
      )}
    </g>
  );
};
