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
import { COMPONENT_DEFINITIONS, createComponentPins } from './definitions';

export interface SimulationResult {
  components: CircuitComponent[];
  wires: Wire[];
  errors: CircuitError[];
  buzzerActive: boolean;
  activeNodesCount: number;
}

const MAX_SETTLING_PASSES = 40;

export function normalizeLogicValue(value: unknown): LogicValue {
  return value === 0 || value === 1 || value === 'X' || value === 'Z' ? value : 'X';
}

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
): { outputs: LogicValue[]; nextState?: Record<string, unknown> } {
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
      if ([b0, b1, b2, b3].some((value) => value !== 0 && value !== 1)) {
        return { outputs: ['X', 'X', 'X', 'X', 'X'] };
      }
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
      if (en === 0) {
        return { outputs: [0, 0, 0, 0] };
      }
      if (en !== 1 || (a0 !== 0 && a0 !== 1) || (a1 !== 0 && a1 !== 1)) {
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
      if (en === 0) {
        return { outputs: [0, 0, 0, 0, 0, 0, 0, 0] };
      }
      if (en !== 1 || [a0, a1, a2].some((value) => value !== 0 && value !== 1)) {
        return { outputs: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'] };
      }
      const sel = (a2 === 1 ? 4 : 0) + (a1 === 1 ? 2 : 0) + (a0 === 1 ? 1 : 0);
      return {
        outputs: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (sel === i ? 1 : 0)) as LogicValue[],
      };
    }

    case 'DECODER_4TO16': {
      const [a0, a1, a2, a3, en] = inputs;
      if (en === 0) {
        return { outputs: Array(16).fill(0) as LogicValue[] };
      }
      if (en !== 1 || [a0, a1, a2, a3].some((value) => value !== 0 && value !== 1)) {
        return { outputs: Array(16).fill('X') as LogicValue[] };
      }
      const sel = (a3 === 1 ? 8 : 0) + (a2 === 1 ? 4 : 0) + (a1 === 1 ? 2 : 0) + (a0 === 1 ? 1 : 0);
      return {
        outputs: Array.from({ length: 16 }, (_, i) => (sel === i ? 1 : 0)) as LogicValue[],
      };
    }

    case 'SR_LATCH': {
      const [s, r] = inputs;
      let q = normalizeLogicValue(compState.internalQ);
      let qbar = normalizeLogicValue(compState.internalQbar);
      let isUndefined = false;

      if (s === 1 && r === 1) {
        // Forbidden / Undefined condition in SR Latch (Metastable race condition)
        q = 'X';
        qbar = 'X';
        isUndefined = true;
      } else if (s === 1 && r === 0) {
        q = 1;
        qbar = 0;
      } else if (s === 0 && r === 1) {
        q = 0;
        qbar = 1;
      } else if ((s !== 0 && s !== 1) || (r !== 0 && r !== 1)) {
        q = 'X';
        qbar = 'X';
      }
      // if 0, 0: hold previous valid state
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, isUndefined },
      };
    }

    case 'D_LATCH': {
      const [d, en] = inputs;
      let q = normalizeLogicValue(compState.internalQ);
      if (en === 1) {
        q = d === 0 || d === 1 ? d : 'X';
      } else if (en !== 0) {
        q = 'X';
      }
      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar },
      };
    }

    case 'JK_LATCH': {
      const [j, en, k] = inputs;
      let q = normalizeLogicValue(compState.internalQ);
      if (en === 1) {
        if (j === 0 && k === 1) {
          q = 0;
        } else if (j === 1 && k === 0) {
          q = 1;
        } else if (j === 1 && k === 1) {
          q = q === 0 ? 1 : q === 1 ? 0 : 'X';
        } else {
          q = 'X';
        }
      } else if (en !== 0) {
        q = 'X';
      }
      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar },
      };
    }

    case 'D_FLIP_FLOP': {
      const [d, clk] = inputs;
      const lastClock = compState.lastClock;
      let q = normalizeLogicValue(compState.internalQ);
      let qbar = normalizeLogicValue(compState.internalQbar);

      // Positive edge triggered (0 -> 1)
      if (clockTick && lastClock === 0 && clk === 1) {
        const captured: LogicValue = d === 0 || d === 1 ? d : 'X';
        q = captured;
        qbar = captured === 1 ? 0 : captured === 0 ? 1 : 'X';
      }

      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, lastClock: clk },
      };
    }

    case 'JK_FLIP_FLOP': {
      const [j, clk, k] = inputs;
      const lastClock = compState.lastClock;
      let q = normalizeLogicValue(compState.internalQ);

      if (clockTick && lastClock === 0 && clk === 1) {
        if (j === 0 && k === 0) {
          // hold
        } else if (j === 0 && k === 1) {
          q = 0;
        } else if (j === 1 && k === 0) {
          q = 1;
        } else if (j === 1 && k === 1) {
          q = q === 1 ? 0 : q === 0 ? 1 : 'X'; // toggle only from a known state
        } else {
          q = 'X';
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
      const lastClock = compState.lastClock;
      let q = normalizeLogicValue(compState.internalQ);

      if (clockTick && lastClock === 0 && clk === 1) {
        if (t === 1) q = q === 1 ? 0 : q === 0 ? 1 : 'X';
        else if (t !== 0) q = 'X';
      }

      const qbar = q === 'X' ? 'X' : q === 1 ? 0 : 1;
      return {
        outputs: [q as LogicValue, qbar as LogicValue],
        nextState: { ...compState, internalQ: q, internalQbar: qbar, lastClock: clk },
      };
    }

    case 'COUNTER_4BIT': {
      const [clk, rst] = inputs;
      const lastClock = compState.lastClock;
      let val = compState.counterValue ?? 0;

      if (rst === 1) {
        val = 0;
      } else if (clockTick && lastClock === 0 && clk === 1) {
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
      const sourceVal: LogicValue = isOn ? normalizeLogicValue(drain) : 'Z';
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
      const drainVal: LogicValue = isOn ? normalizeLogicValue(source) : 'Z';
      return {
        outputs: [drainVal],
        nextState: { ...compState, isOn },
      };
    }

    case 'PULLUP_RESISTOR': {
      // inputs: [Node], outputs: [Weak 5V]
      const [node] = inputs;
      // If node is already actively driven to 0 (GND), it stays 0; if floating Z or 1, pulls to 1
      const outVal: LogicValue = node === 0 ? 0 : node === 1 || node === 'Z' ? 1 : 'X';
      return { outputs: [outVal] };
    }

    case 'PULLDOWN_RESISTOR': {
      // inputs: [Node], outputs: [Weak 0V]
      const [node] = inputs;
      const outVal: LogicValue = node === 1 ? 1 : node === 0 || node === 'Z' ? 0 : 'X';
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
  const errorIds = new Set<string>();
  const report = (error: CircuitError) => {
    if (!errorIds.has(error.id)) {
      errorIds.add(error.id);
      errors.push(error);
    }
  };

  const components = project.components.map((component) => ({
    ...component,
    inputs: component.inputs.map((pin) => {
      const value = normalizeLogicValue(pin.value);
      return { ...pin, value, voltage: logicToVoltage(value) };
    }),
    outputs: component.outputs.map((pin) => {
      const value = normalizeLogicValue(pin.value);
      return { ...pin, value, voltage: logicToVoltage(value) };
    }),
    state: { ...(component.state || {}) },
  }));
  const wires = project.wires.map((wire) => ({ ...wire, error: false }));
  const componentMap = new Map<string, CircuitComponent>();
  const seenComponentIds = new Set<string>();
  const seenPinIds = new Set<string>();

  for (const component of components) {
    if (seenComponentIds.has(component.id)) {
      report({
        id: `duplicate_component_${component.id}`,
        type: 'invalid_connection',
        severity: 'error',
        message: `Duplicate component identifier "${component.id}".`,
        componentId: component.id,
      });
    } else {
      seenComponentIds.add(component.id);
      componentMap.set(component.id, component);
    }

    for (const pin of component.inputs) {
      if (seenPinIds.has(pin.id)) {
        report({
          id: `duplicate_pin_${pin.id}`,
          type: 'invalid_connection',
          severity: 'error',
          message: `Duplicate pin identifier "${pin.id}".`,
          componentId: component.id,
          pinId: pin.id,
        });
      }
      seenPinIds.add(pin.id);
    }
    for (const pin of component.outputs) {
      if (seenPinIds.has(pin.id)) {
        report({
          id: `duplicate_pin_${pin.id}`,
          type: 'invalid_connection',
          severity: 'error',
          message: `Duplicate pin identifier "${pin.id}".`,
          componentId: component.id,
          pinId: pin.id,
        });
      }
      seenPinIds.add(pin.id);
    }
  }

  const inputPinWires = new Map<string, Wire[]>();
  const validWires = new Set<Wire>();
  const activeContentions = new Map<string, {
    component: CircuitComponent;
    pin: Pin;
    wires: Wire[];
  }>();
  for (const wire of wires) {
    const fromComponent = componentMap.get(wire.fromComponentId);
    const toComponent = componentMap.get(wire.toComponentId);
    const fromPin = fromComponent?.outputs.find((pin) => pin.id === wire.fromPinId);
    const toPin = toComponent?.inputs.find((pin) => pin.id === wire.toPinId);
    if (!fromComponent || !toComponent || !fromPin || !toPin) {
      wire.error = true;
      report({
        id: `invalid_wire_${wire.id}`,
        type: 'invalid_connection',
        severity: 'error',
        message: `Wire "${wire.id}" must connect an existing output pin to an existing input pin.`,
        wireId: wire.id,
      });
      continue;
    }
    validWires.add(wire);
    const connected = inputPinWires.get(toPin.id) || [];
    connected.push(wire);
    inputPinWires.set(toPin.id, connected);
  }

  for (const component of components) {
    for (const output of component.outputs) {
      output.value = 'X';
      output.voltage = logicToVoltage('X');
    }
    if (component.type === 'CLOCK') {
      const output = component.outputs[0];
      if (output) {
        output.value = normalizeLogicValue(project.components.find((item) => item.id === component.id)?.outputs?.[0]?.value);
        if (output.value !== 0 && output.value !== 1) output.value = 0;
        output.voltage = logicToVoltage(output.value);
        if (clockTick) {
          output.value = output.value === 1 ? 0 : 1;
          output.voltage = logicToVoltage(output.value);
        }
      }
      component.state = {
        ...component.state,
        clockTicks: (Number(component.state?.clockTicks) || 0) + (clockTick ? 1 : 0),
      };
    } else if (component.type === 'CONST_HIGH' || component.type === 'CONST_LOW' ||
      component.type === 'SWITCH' || component.type === 'BUTTON') {
      const { outputs } = evaluateComponent(component, [], false);
      outputs.forEach((value, index) => {
        if (component.outputs[index]) {
          component.outputs[index].value = normalizeLogicValue(value);
          component.outputs[index].voltage = logicToVoltage(component.outputs[index].value);
        }
      });
    } else if (isSequentialType(component.type)) {
      const q = normalizeLogicValue(component.state?.internalQ);
      const qbar = q === 0 || q === 1 ? (q === 1 ? 0 : 1) : 'X';
      component.state = { ...component.state, internalQ: q, internalQbar: qbar };
      const outputValues: LogicValue[] = component.type === 'COUNTER_4BIT'
        ? counterOutputs(Number(component.state.counterValue) || 0)
        : [q, qbar];
      outputValues.forEach((value, index) => {
        if (component.outputs[index]) {
          component.outputs[index].value = value;
          component.outputs[index].voltage = logicToVoltage(value);
        }
      });
    }
  }

  const resolveInputs = (): boolean => {
    let changed = false;
    activeContentions.clear();
    validWires.forEach((wire) => { wire.error = false; });
    for (const component of components) {
      for (const pin of component.inputs) {
        const connected = inputPinWires.get(pin.id) || [];
        let value: LogicValue;
        if (connected.length === 0) {
          value = project.autoPulldown ? 0 : 'Z';
          if (!project.autoPulldown) {
            report({
              id: `float_${pin.id}`,
              type: 'floating_input',
              severity: 'warning',
              message: `Floating input "${pin.name}" on ${component.label || component.type}; it resolves to Z.`,
              componentId: component.id,
              componentName: component.label || component.type,
              pinId: pin.id,
            });
          }
        } else {
          const driverValues = connected.map((wire) => {
            const driver = componentMap.get(wire.fromComponentId);
            return normalizeLogicValue(driver?.outputs.find((output) => output.id === wire.fromPinId)?.value);
          });
          const hasLow = driverValues.includes(0);
          const hasHigh = driverValues.includes(1);
          if (hasLow && hasHigh) {
            value = 'X';
            connected.forEach((wire) => { wire.error = true; });
            activeContentions.set(pin.id, { component, pin, wires: connected });
          } else if (driverValues.includes('X')) {
            value = 'X';
          } else {
            const drivenValues = driverValues.filter((driverValue) => driverValue !== 'Z');
            value = drivenValues[0] ?? 'Z';
          }
        }
        for (const wire of connected) {
          const source = componentMap.get(wire.fromComponentId)?.outputs.find((output) => output.id === wire.fromPinId);
          if (source) {
            wire.value = normalizeLogicValue(source.value);
            wire.voltage = logicToVoltage(wire.value);
          }
        }
        if (pin.value !== value) changed = true;
        pin.value = value;
        pin.voltage = logicToVoltage(value);
      }
    }
    return changed;
  };

  const settleCombinational = (): boolean => {
    let settled = false;
    let passes = 0;
    while (!settled && passes < MAX_SETTLING_PASSES) {
      passes++;
      const inputsChanged = resolveInputs();
      const nextOutputs = new Map<Pin, LogicValue>();
      for (const component of components) {
        if (isSequentialType(component.type) || component.type === 'CLOCK') continue;
        const { outputs } = evaluateComponent(component, component.inputs.map((pin) => pin.value), false);
        outputs.forEach((value, index) => {
          const output = component.outputs[index];
          if (output) nextOutputs.set(output, normalizeLogicValue(value));
        });
      }

      let outputsChanged = false;
      for (const [pin, value] of nextOutputs) {
        if (pin.value !== value) outputsChanged = true;
        pin.value = value;
        pin.voltage = logicToVoltage(value);
      }
      settled = !inputsChanged && !outputsChanged;
    }
    return settled;
  };

  let settled = settleCombinational();
  if (!settled) {
    report({
      id: 'oscillation_detected',
      type: 'oscillation',
      severity: 'warning',
      message: `Combinational signals did not settle within ${MAX_SETTLING_PASSES} passes.`,
    });
  }

  for (const component of components) {
    if (!isSequentialType(component.type)) continue;
    const inputs = component.inputs.map((pin) => pin.value);
    const clockIndex = clockInputIndex(component.type);
    if (clockIndex !== null) {
      const clockPin = component.inputs[clockIndex];
      const clockWires = inputPinWires.get(clockPin?.id || '') || [];
      const connectionKey = clockWires.map((wire) => `${wire.fromComponentId}:${wire.fromPinId}`).sort().join('|');
      if (component.state?.clockConnectionKey !== connectionKey) {
        component.state = {
          ...component.state,
          lastClock: normalizeLogicValue(clockPin?.value),
          clockConnectionKey: connectionKey,
        };
      } else {
        const { nextState } = evaluateComponent(component, inputs, clockTick);
        if (nextState) component.state = { ...component.state, ...nextState };
        component.state = { ...component.state, clockConnectionKey: connectionKey };
        continue;
      }
    }
    const { nextState } = evaluateComponent(component, inputs, false);
    if (nextState) component.state = { ...component.state, ...nextState };
  }

  for (const component of components) {
    if (!isSequentialType(component.type)) continue;
    const { outputs, nextState } = evaluateComponent(component, component.inputs.map((pin) => pin.value), false);
    if (nextState) {
      component.state = {
        ...component.state,
        ...nextState,
        internalQbar: normalizeLogicValue(component.state.internalQ) === 0
          ? 1
          : normalizeLogicValue(component.state.internalQ) === 1
            ? 0
            : 'X',
      };
    }
    outputs.forEach((value, index) => {
      const output = component.outputs[index];
      if (output) {
        output.value = normalizeLogicValue(value);
        output.voltage = logicToVoltage(output.value);
      }
    });
  }

  settled = settleCombinational();
  if (!settled && !errorIds.has('oscillation_detected')) {
    report({
      id: 'oscillation_detected',
      type: 'oscillation',
      severity: 'warning',
      message: `Combinational signals did not settle within ${MAX_SETTLING_PASSES} passes.`,
    });
  }

  for (const { component, pin, wires: connected } of activeContentions.values()) {
    report({
      id: `contention_${pin.id}`,
      type: 'contention',
      severity: 'error',
      message: `Conflicting output drivers on ${component.label || component.type}.${pin.name}.`,
      componentId: component.id,
      componentName: component.label || component.type,
      pinId: pin.id,
      wireId: connected[0]?.id,
    });
  }

  let buzzerActive = false;
  for (const component of components) {
    if (component.type === 'SR_LATCH' && (component.state?.isUndefined ||
      (component.inputs[0]?.value === 1 && component.inputs[1]?.value === 1))) {
      report({
        id: `invalid_sr_${component.id}`,
        type: 'invalid_state',
        severity: 'warning',
        message: `SR latch "${component.label || component.type}" has both set and reset asserted.`,
        componentId: component.id,
      });
    }
    if (component.type === 'BUZZER' && component.inputs[0]?.value === 1) buzzerActive = true;
    if (component.type === 'TIMING_ANALYZER' && clockTick) {
      const currentTick = (Number(component.state?.simTick) || 0) + 1;
      const history = { ...(component.state?.timingHistory || {}) };
      for (const pin of component.inputs) {
        const samples = [...(history[pin.id] || []), {
          tick: currentTick,
          value: pin.value,
          voltage: pin.voltage,
        }];
        if (samples.length > 36) samples.shift();
        history[pin.id] = samples;
      }
      component.state = { ...component.state, simTick: currentTick, timingHistory: history };
    }
  }

  for (const wire of wires) {
    if (!validWires.has(wire)) continue;
    const source = componentMap.get(wire.fromComponentId)?.outputs.find((pin) => pin.id === wire.fromPinId);
    if (!source) continue;
    wire.value = normalizeLogicValue(source.value);
    wire.voltage = logicToVoltage(wire.value);
  }

  return {
    components,
    wires,
    errors,
    buzzerActive,
    activeNodesCount: wires.filter((wire) => wire.value === 1).length,
  };
}

function isSequentialType(type: CircuitComponent['type']): boolean {
  return type === 'SR_LATCH' || type === 'D_LATCH' || type === 'JK_LATCH' ||
    type === 'D_FLIP_FLOP' || type === 'JK_FLIP_FLOP' ||
    type === 'T_FLIP_FLOP' || type === 'COUNTER_4BIT';
}

function clockInputIndex(type: CircuitComponent['type']): number | null {
  switch (type) {
    case 'D_FLIP_FLOP':
    case 'T_FLIP_FLOP':
      return 1;
    case 'JK_FLIP_FLOP':
      return 1;
    case 'COUNTER_4BIT':
      return 0;
    default:
      return null;
  }
}

function counterOutputs(value: number): LogicValue[] {
  return [0, 1, 2, 3].map((bit) => ((value >> bit) & 1) as LogicValue);
}

export function resetProjectRuntime(project: CircuitProject): CircuitProject {
  const components = (Array.isArray(project.components) ? project.components : []).map((rawComponent, index) => {
    const component = rawComponent as CircuitComponent;
    const definition = COMPONENT_DEFINITIONS[component.type];
    const generated = definition
      ? createComponentPins(component.type, definition.width, definition.height, component.id || `component_${index}`)
      : { inputs: [], outputs: [] };
    const normalizePins = (pins: Pin[] | undefined, defaults: Pin[], direction: Pin['type']): Pin[] => {
      const sourcePins = Array.isArray(pins) && pins.length > 0 ? pins : defaults;
      const normalized = sourcePins.map((pin, pinIndex) => {
        const value: LogicValue = direction === 'output' && component.type === 'CLOCK' ? 0 : 'X';
        const id = typeof pin?.id === 'string' && pin.id.length > 0
          ? pin.id
          : defaults[pinIndex]?.id || `${component.id || `component_${index}`}_${direction}_${pinIndex}`;
        return {
          ...defaults[pinIndex],
          ...pin,
          id,
          name: typeof pin?.name === 'string' ? pin.name : defaults[pinIndex]?.name || `${direction}${pinIndex}`,
          type: direction,
          index: Number.isInteger(pin?.index) ? pin.index : pinIndex,
          value,
          voltage: logicToVoltage(value),
          relativeX: Number.isFinite(pin?.relativeX) ? pin.relativeX : defaults[pinIndex]?.relativeX || 0,
          relativeY: Number.isFinite(pin?.relativeY) ? pin.relativeY : defaults[pinIndex]?.relativeY || 0,
        };
      });
      for (const defaultPin of defaults) {
        if (normalized.some((pin) => pin.index === defaultPin.index || pin.name === defaultPin.name)) continue;
        const value: LogicValue = direction === 'output' && component.type === 'CLOCK' ? 0 : 'X';
        normalized.push({
          ...defaultPin,
          value,
          voltage: logicToVoltage(value),
        });
      }
      return normalized.sort((a, b) => a.index - b.index);
    };

    const state = { ...(component.state || {}) };
    delete state.clockConnectionKey;
    delete state.lastClock;
    if (component.type === 'CLOCK') state.clockTicks = 0;
    if (isSequentialType(component.type)) {
      const initialQ = normalizeLogicValue(state.initialQ);
      state.internalQ = initialQ === 'Z' ? 'X' : initialQ;
      state.internalQbar = state.internalQ === 0
        ? 1
        : state.internalQ === 1
          ? 0
          : 'X';
      if (component.type === 'COUNTER_4BIT') state.counterValue = 0;
    }
    if (component.type === 'TIMING_ANALYZER') {
      state.simTick = 0;
      state.timingHistory = {};
    }
    return {
      ...component,
      id: component.id || `component_${index}`,
      inputs: normalizePins(component.inputs, generated.inputs, 'input'),
      outputs: normalizePins(component.outputs, generated.outputs, 'output'),
      state,
    };
  });
  const wires = (Array.isArray(project.wires) ? project.wires : []).map((wire, index) => ({
    ...wire,
    id: typeof wire.id === 'string' && wire.id.length > 0 ? wire.id : `wire_${index}`,
    value: 'X' as LogicValue,
    voltage: logicToVoltage('X'),
    error: false,
  }));
  return { ...project, components, wires };
}
