/**
 * Logic Simulation Engine
 * Multi-pass settling evaluator with edge detection, loop limits, and error diagnostics
 */

import {
  CircuitComponent,
  CircuitError,
  CircuitProject,
  LogicValue,
  Pin,
  Wire,
} from '../types/circuit';

export interface SimulationResult {
  components: CircuitComponent[];
  wires: Wire[];
  errors: CircuitError[];
  buzzerActive: boolean;
  activeNodesCount: number;
}

const MAX_SETTLING_PASSES = 40;

export function logicToVoltage(val: LogicValue): number {
  if (val === 1) return 5.0;
  if (val === 0) return 0.0;
  if (val === 'Z') return 2.5; // floating
  return 2.5; // unknown / conflict
}

export function evaluateComponent(
  component: CircuitComponent,
  inputs: LogicValue[],
  clockTick: boolean
): { outputs: LogicValue[]; nextState?: Record<string, any> } {
  const compState = component.state || {};

  switch (component.type) {
    case 'CONST_HIGH':
      return { outputs: [1] };

    case 'CONST_LOW':
      return { outputs: [0] };

    case 'SWITCH':
      return { outputs: [compState.toggle ? 1 : 0] };

    case 'BUTTON':
      return { outputs: [compState.pressed ? 1 : 0] };

    case 'CLOCK': {
      // Toggle value when clock tick occurs
      const currentVal = component.outputs[0]?.value === 1 ? 0 : 1;
      const nextVal = clockTick ? currentVal : (component.outputs[0]?.value ?? 0);
      return {
        outputs: [nextVal as LogicValue],
        nextState: {
          ...compState,
          clockTicks: (compState.clockTicks || 0) + (clockTick ? 1 : 0),
        },
      };
    }

    case 'NOT': {
      const a = inputs[0];
      if (a === 'X' || a === 'Z') return { outputs: ['X'] };
      return { outputs: [a === 1 ? 0 : 1] };
    }

    case 'BUFFER': {
      const a = inputs[0];
      if (a === 'X' || a === 'Z') return { outputs: ['X'] };
      return { outputs: [a] };
    }

    case 'AND': {
      const [a, b] = inputs;
      if (a === 0 || b === 0) return { outputs: [0] };
      if (a === 1 && b === 1) return { outputs: [1] };
      return { outputs: ['X'] };
    }

    case 'NAND': {
      const [a, b] = inputs;
      if (a === 0 || b === 0) return { outputs: [1] };
      if (a === 1 && b === 1) return { outputs: [0] };
      return { outputs: ['X'] };
    }

    case 'OR': {
      const [a, b] = inputs;
      if (a === 1 || b === 1) return { outputs: [1] };
      if (a === 0 && b === 0) return { outputs: [0] };
      return { outputs: ['X'] };
    }

    case 'NOR': {
      const [a, b] = inputs;
      if (a === 1 || b === 1) return { outputs: [0] };
      if (a === 0 && b === 0) return { outputs: [1] };
      return { outputs: ['X'] };
    }

    case 'XOR': {
      const [a, b] = inputs;
      if (a === 'X' || a === 'Z' || b === 'X' || b === 'Z') return { outputs: ['X'] };
      return { outputs: [(a !== b ? 1 : 0) as LogicValue] };
    }

    case 'XNOR': {
      const [a, b] = inputs;
      if (a === 'X' || a === 'Z' || b === 'X' || b === 'Z') return { outputs: ['X'] };
      return { outputs: [(a === b ? 1 : 0) as LogicValue] };
    }

    case 'HALF_ADDER': {
      const [a, b] = inputs;
      if (a === 'X' || a === 'Z' || b === 'X' || b === 'Z') return { outputs: ['X', 'X'] };
      const sum = (a ^ b) as LogicValue;
      const carry = (a & b) as LogicValue;
      return { outputs: [sum, carry] };
    }

    case 'FULL_ADDER': {
      const [a, b, cin] = inputs;
      if (a === 'X' || a === 'Z' || b === 'X' || b === 'Z' || cin === 'X' || cin === 'Z') {
        return { outputs: ['X', 'X'] };
      }
      const sum = ((a ^ b) ^ cin) as LogicValue;
      const cout = (((a & b) | ((a ^ b) & cin)) & 1) as LogicValue;
      return { outputs: [sum, cout] };
    }

    case 'MUX_2TO1': {
      const [i0, i1, s] = inputs;
      if (s === 0) return { outputs: [i0] };
      if (s === 1) return { outputs: [i1] };
      return { outputs: ['X'] };
    }

    case 'DEMUX_1TO2': {
      const [inp, s] = inputs;
      if (s === 0) return { outputs: [inp, 0] };
      if (s === 1) return { outputs: [0, inp] };
      return { outputs: ['X', 'X'] };
    }

    case 'BCD_DECODER': {
      const [b0, b1, b2, b3] = inputs;
      const v0 = b0 === 1 ? 1 : 0;
      const v1 = b1 === 1 ? 2 : 0;
      const v2 = b2 === 1 ? 4 : 0;
      const v3 = b3 === 1 ? 8 : 0;
      const num = v3 + v2 + v1 + v0;
      const tens = Math.floor(num / 10);
      const units = num % 10;
      return {
        outputs: [
          (tens & 1) as LogicValue,
          (units & 1) as LogicValue,
          ((units >> 1) & 1) as LogicValue,
          ((units >> 2) & 1) as LogicValue,
          ((units >> 3) & 1) as LogicValue,
        ],
      };
    }

    case 'MUX_4TO1': {
      const [i0, i1, i2, i3, s0, s1] = inputs;
      if (s0 === 'X' || s0 === 'Z' || s1 === 'X' || s1 === 'Z') {
        return { outputs: ['X'] };
      }
      const sel = (s1 === 1 ? 2 : 0) + (s0 === 1 ? 1 : 0);
      const chosen = [i0, i1, i2, i3][sel] ?? 'X';
      return { outputs: [chosen as LogicValue] };
    }

    case 'MUX_8TO1': {
      const [i0, i1, i2, i3, i4, i5, i6, i7, s0, s1, s2] = inputs;
      if (s0 === 'X' || s0 === 'Z' || s1 === 'X' || s1 === 'Z' || s2 === 'X' || s2 === 'Z') {
        return { outputs: ['X'] };
      }
      const sel = (s2 === 1 ? 4 : 0) + (s1 === 1 ? 2 : 0) + (s0 === 1 ? 1 : 0);
      const chosen = [i0, i1, i2, i3, i4, i5, i6, i7][sel] ?? 'X';
      return { outputs: [chosen as LogicValue] };
    }

    case 'MUX_16TO1': {
      const s0 = inputs[16];
      const s1 = inputs[17];
      const s2 = inputs[18];
      const s3 = inputs[19];
      if (s0 === 'X' || s0 === 'Z' || s1 === 'X' || s1 === 'Z' || s2 === 'X' || s2 === 'Z' || s3 === 'X' || s3 === 'Z') {
        return { outputs: ['X'] };
      }
      const sel = (s3 === 1 ? 8 : 0) + (s2 === 1 ? 4 : 0) + (s1 === 1 ? 2 : 0) + (s0 === 1 ? 1 : 0);
      const chosen = inputs[sel] ?? 'X';
      return { outputs: [chosen as LogicValue] };
    }

    case 'DECODER_2TO4': {
      const [a0, a1, en] = inputs;
      if (en !== 1) {
        return { outputs: [0, 0, 0, 0] };
      }
      if (a0 === 'X' || a0 === 'Z' || a1 === 'X' || a1 === 'Z') {
        return { outputs: ['X', 'X', 'X', 'X'] };
      }
      const sel = (a1 === 1 ? 2 : 0) + (a0 === 1 ? 1 : 0);
      return {
        outputs: [
          (sel === 0 ? 1 : 0) as LogicValue,
          (sel === 1 ? 1 : 0) as LogicValue,
          (sel === 2 ? 1 : 0) as LogicValue,
          (sel === 3 ? 1 : 0) as LogicValue,
        ],
      };
    }

    case 'DECODER_3TO8': {
      const [a0, a1, a2, en] = inputs;
      if (en !== 1) {
        return { outputs: [0, 0, 0, 0, 0, 0, 0, 0] };
      }
      if (a0 === 'X' || a0 === 'Z' || a1 === 'X' || a1 === 'Z' || a2 === 'X' || a2 === 'Z') {
        return { outputs: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'] };
      }
      const sel = (a2 === 1 ? 4 : 0) + (a1 === 1 ? 2 : 0) + (a0 === 1 ? 1 : 0);
      return {
        outputs: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (sel === i ? 1 : 0)) as LogicValue[],
      };
    }

    case 'DECODER_4TO16': {
      const [a0, a1, a2, a3, en] = inputs;
      if (en !== 1) {
        return { outputs: Array(16).fill(0) as LogicValue[] };
      }
      if (a0 === 'X' || a0 === 'Z' || a1 === 'X' || a1 === 'Z' || a2 === 'X' || a2 === 'Z' || a3 === 'X' || a3 === 'Z') {
        return { outputs: Array(16).fill('X') as LogicValue[] };
      }
      const sel = (a3 === 1 ? 8 : 0) + (a2 === 1 ? 4 : 0) + (a1 === 1 ? 2 : 0) + (a0 === 1 ? 1 : 0);
      return {
        outputs: Array.from({ length: 16 }, (_, i) => (sel === i ? 1 : 0)) as LogicValue[],
      };
    }

    case 'SR_LATCH': {
      const [s, r] = inputs;
      let q = compState.internalQ ?? 0;
      let qbar = compState.internalQbar ?? 1;

      if (s === 1 && r === 1) {
        // Invalid condition
        q = 0;
        qbar = 0;
      } else if (s === 1 && r === 0) {
        q = 1;
        qbar = 0;
      } else if (s === 0 && r === 1) {
        q = 0;
        qbar = 1;
      }
      // if 0, 0: hold state
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar },
      };
    }

    case 'D_LATCH': {
      const [d, en] = inputs;
      let q = compState.internalQ ?? 0;
      if (en === 1) {
        q = d === 1 ? 1 : d === 0 ? 0 : 'X';
      }
      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar },
      };
    }

    case 'JK_LATCH': {
      const [j, en, k] = inputs;
      let q = compState.internalQ ?? 0;
      if (en === 1) {
        if (j === 0 && k === 1) {
          q = 0;
        } else if (j === 1 && k === 0) {
          q = 1;
        } else if (j === 1 && k === 1) {
          q = q === 1 ? 0 : 1;
        }
      }
      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar },
      };
    }

    case 'D_FLIP_FLOP': {
      const [d, clk] = inputs;
      const lastClock = compState.lastClock ?? 0;
      let q = compState.internalQ ?? 0;
      let qbar = compState.internalQbar ?? 1;

      // Positive edge triggered (0 -> 1)
      if (lastClock === 0 && clk === 1) {
        if (d === 1) {
          q = 1;
          qbar = 0;
        } else if (d === 0) {
          q = 0;
          qbar = 1;
        } else {
          q = 'X';
          qbar = 'X';
        }
      }

      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, lastClock: clk },
      };
    }

    case 'JK_FLIP_FLOP': {
      const [j, clk, k] = inputs;
      const lastClock = compState.lastClock ?? 0;
      let q = compState.internalQ ?? 0;

      if (lastClock === 0 && clk === 1) {
        if (j === 0 && k === 0) {
          // hold
        } else if (j === 0 && k === 1) {
          q = 0;
        } else if (j === 1 && k === 0) {
          q = 1;
        } else if (j === 1 && k === 1) {
          q = q === 1 ? 0 : 1; // toggle
        }
      }

      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, lastClock: clk },
      };
    }

    case 'T_FLIP_FLOP': {
      const [t, clk] = inputs;
      const lastClock = compState.lastClock ?? 0;
      let q = compState.internalQ ?? 0;

      if (lastClock === 0 && clk === 1 && t === 1) {
        q = q === 1 ? 0 : 1;
      }

      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, lastClock: clk },
      };
    }

    case 'COUNTER_4BIT': {
      const [clk, rst] = inputs;
      const lastClock = compState.lastClock ?? 0;
      let val = compState.counterValue ?? 0;

      if (rst === 1) {
        val = 0;
      } else if (lastClock === 0 && clk === 1) {
        val = (val + 1) & 0xf;
      }

      const q0 = ((val >> 0) & 1) as LogicValue;
      const q1 = ((val >> 1) & 1) as LogicValue;
      const q2 = ((val >> 2) & 1) as LogicValue;
      const q3 = ((val >> 3) & 1) as LogicValue;

      return {
        outputs: [q0, q1, q2, q3],
        nextState: { ...compState, counterValue: val, lastClock: clk },
      };
    }

    case 'NMOS_TRANSISTOR': {
      // inputs: [Gate, Drain], outputs: [Source]
      const [gate, drain] = inputs;
      // NMOS turns ON when Gate is HIGH (1, 5V)
      const isOn = gate === 1;
      // When ON, conducts Drain to Source
      const sourceVal: LogicValue = isOn ? (drain ?? 0) : 'Z';
      return {
        outputs: [sourceVal],
        nextState: { ...compState, isOn },
      };
    }

    case 'PMOS_TRANSISTOR': {
      // inputs: [Gate, Source], outputs: [Drain]
      const [gate, source] = inputs;
      // PMOS turns ON when Gate is LOW (0, 0V)
      const isOn = gate === 0;
      // When ON, conducts Source to Drain
      const drainVal: LogicValue = isOn ? (source ?? 1) : 'Z';
      return {
        outputs: [drainVal],
        nextState: { ...compState, isOn },
      };
    }

    case 'PULLUP_RESISTOR': {
      // inputs: [Node], outputs: [Weak 5V]
      const [node] = inputs;
      // If node is already actively driven to 0 (GND), it stays 0; if floating Z or 1, pulls to 1
      const outVal: LogicValue = node === 0 ? 0 : 1;
      return { outputs: [outVal] };
    }

    case 'PULLDOWN_RESISTOR': {
      // inputs: [Node], outputs: [Weak 0V]
      const [node] = inputs;
      const outVal: LogicValue = node === 1 ? 1 : 0;
      return { outputs: [outVal] };
    }

    // Displays, probes, and analyzers have no logic outputs
    case 'LED':
    case 'PROBE':
    case 'TIMING_ANALYZER':
    case 'SEVEN_SEGMENT':
    case 'HEX_DISPLAY':
    case 'BUZZER':
    default:
      return { outputs: [] };
  }
}

/**
 * Perform full circuit simulation tick with error diagnostics
 */
export function simulateCircuit(
  project: CircuitProject,
  clockTick: boolean = false
): SimulationResult {
  const errors: CircuitError[] = [];
  let buzzerActive = false;

  // Deep clone components and wires
  const components: CircuitComponent[] = project.components.map((c) => ({
    ...c,
    inputs: c.inputs.map((p) => ({ ...p })),
    outputs: c.outputs.map((p) => ({ ...p })),
    state: { ...(c.state || {}) },
  }));

  const wires: Wire[] = project.wires.map((w) => ({ ...w }));

  // Index maps
  const componentMap = new Map<string, CircuitComponent>();
  components.forEach((c) => componentMap.set(c.id, c));

  const pinMap = new Map<string, Pin>();
  components.forEach((c) => {
    c.inputs.forEach((p) => pinMap.set(p.id, p));
    c.outputs.forEach((p) => pinMap.set(p.id, p));
  });

  // Track connected wires to input pins
  const inputPinWires = new Map<string, Wire[]>();
  wires.forEach((w) => {
    const list = inputPinWires.get(w.toPinId) || [];
    list.push(w);
    inputPinWires.set(w.toPinId, list);
  });

  // Check for floating inputs
  components.forEach((c) => {
    c.inputs.forEach((p) => {
      const connected = inputPinWires.get(p.id);
      if (!connected || connected.length === 0) {
        if (project.autoPulldown) {
          // Auto-pulldown mode ties unconnected inputs gently to Logic 0 (0V)
          p.value = 0;
          p.voltage = 0.0;
        } else {
          p.value = 'Z';
          p.voltage = 2.5;
          // Educational feedback explaining why floating pins cause 'X' output
          errors.push({
            id: `float_${p.id}`,
            type: 'floating_input',
            severity: 'warning',
            message: `Floating Input Pin '${p.name}' on ${c.label || c.type}. In CMOS/TTL logic, open pins float at high-impedance (Z), making gate outputs unknown (X). Tie Pin '${p.name}' to Ground (0V) or Clock.`,
            componentId: c.id,
            componentName: c.label || c.type,
            pinId: p.id,
          });
        }
      }
    });
  });

  // Multi-pass propagation to handle feedback loops and multi-stage logic
  let settled = false;
  let passes = 0;

  while (!settled && passes < MAX_SETTLING_PASSES) {
    passes++;
    settled = true;

    // 1. Evaluate component transfer functions
    for (const comp of components) {
      const inVals = comp.inputs.map((p) => p.value);
      const isClockPulse = clockTick && passes === 1;
      const { outputs: newOutputs, nextState } = evaluateComponent(comp, inVals, isClockPulse);

      if (nextState) {
        comp.state = nextState;
      }

      // Check if any output pin value changed
      newOutputs.forEach((outVal, idx) => {
        const pin = comp.outputs[idx];
        if (pin && pin.value !== outVal) {
          pin.value = outVal;
          pin.voltage = logicToVoltage(outVal);
          settled = false;
        }
      });
    }

    // 2. Propagate values across wires to inputs
    for (const wire of wires) {
      const fromComp = componentMap.get(wire.fromComponentId);
      const toComp = componentMap.get(wire.toComponentId);
      if (!fromComp || !toComp) continue;

      const fromPin = fromComp.outputs.find((p) => p.id === wire.fromPinId);
      const toPin = toComp.inputs.find((p) => p.id === wire.toPinId);
      if (!fromPin || !toPin) continue;

      const currentVal = fromPin.value;
      wire.value = currentVal;
      wire.voltage = fromPin.voltage;

      // Handle contention: multiple wires driving the same input pin
      const allWiresToPin = inputPinWires.get(toPin.id) || [];
      if (allWiresToPin.length > 1) {
        // Check for conflicting values
        const driverValues = allWiresToPin
          .map((w) => {
            const fc = componentMap.get(w.fromComponentId);
            return fc?.outputs.find((p) => p.id === w.fromPinId)?.value;
          })
          .filter((v) => v !== undefined && v !== 'Z');

        const hasZero = driverValues.includes(0);
        const hasOne = driverValues.includes(1);

        if (hasZero && hasOne) {
          toPin.value = 'X';
          toPin.voltage = 2.5;
          wire.value = 'X';
          errors.push({
            id: `contention_${toPin.id}`,
            type: 'contention',
            severity: 'error',
            message: `Bus Contention / Short Circuit on ${toComp.label || toComp.type}.${toPin.name}: Multiple active outputs are driving opposite logic states (0V vs 5V)!`,
            componentId: toComp.id,
            pinId: toPin.id,
            wireId: wire.id,
          });
          continue;
        }
      }

      if (toPin.value !== currentVal) {
        toPin.value = currentVal;
        toPin.voltage = fromPin.voltage;
        settled = false;
      }
    }
  }

  // Check for oscillation if reached max passes
  if (passes >= MAX_SETTLING_PASSES) {
    errors.push({
      id: 'oscillation_detected',
      type: 'oscillation',
      severity: 'warning',
      message: 'Unstable Feedback Loop or High-Frequency Oscillation detected in circuit.',
    });
  }

  // Check buzzer activation
  components.forEach((c) => {
    if (c.type === 'BUZZER' && c.inputs[0]?.value === 1) {
      buzzerActive = true;
    }
  });

  // Update TIMING_ANALYZER oscilloscopes with settled channel values
  components.forEach((c) => {
    if (c.type === 'TIMING_ANALYZER') {
      const currentTick = (c.state?.simTick || 0) + 1;
      const history = { ...(c.state?.timingHistory || {}) };

      c.inputs.forEach((pin) => {
        const val: LogicValue = pin.value;
        const volt = pin.voltage ?? (val === 1 ? 5.0 : val === 0 ? 0.0 : 2.5);
        const pinHist = history[pin.id] ? [...history[pin.id]] : [];
        pinHist.push({ tick: currentTick, value: val, voltage: volt });
        // Keep up to 36 samples for smooth scrolling oscilloscope window
        if (pinHist.length > 36) {
          pinHist.shift();
        }
        history[pin.id] = pinHist;
      });

      c.state = {
        ...c.state,
        simTick: currentTick,
        timingHistory: history,
      };
    }
  });

  // Calculate active nodes count
  const activeNodesCount = wires.filter((w) => w.value === 1).length;

  return {
    components,
    wires,
    errors,
    buzzerActive,
    activeNodesCount,
  };
}
