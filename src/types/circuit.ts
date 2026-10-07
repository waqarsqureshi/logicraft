/**
 * Core Circuit Types and Interfaces
 */

export type LogicValue = 0 | 1 | 'Z' | 'X'; // 0 = LOW (0V), 1 = HIGH (5V), Z = High-Impedance/Floating, X = Unknown/Conflict

export type ComponentCategory =
  | 'gates'
  | 'inputs'
  | 'outputs'
  | 'analysis'
  | 'transistors'
  | 'arithmetic'
  | 'sequential'
  | 'plexers';

export type GateType =
  // Basic Gates
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'
  // Inputs
  | 'CONST_LOW'
  | 'CONST_HIGH'
  | 'SWITCH'
  | 'BUTTON'
  | 'CLOCK'
  // Outputs & Analysis
  | 'LED'
  | 'PROBE'
  | 'SEVEN_SEGMENT'
  | 'HEX_DISPLAY'
  | 'BUZZER'
  | 'TIMING_ANALYZER'
  // Arithmetic & Decoders
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'BCD_DECODER'
  // Multiplexers & Decoders
  | 'MUX_2TO1'
  | 'MUX_4TO1'
  | 'MUX_8TO1'
  | 'MUX_16TO1'
  | 'DEMUX_1TO2'
  | 'DECODER_2TO4'
  | 'DECODER_3TO8'
  | 'DECODER_4TO16'
  // Sequential
  | 'SR_LATCH'
  | 'D_LATCH'
  | 'JK_LATCH'
  | 'D_FLIP_FLOP'
  | 'JK_FLIP_FLOP'
  | 'T_FLIP_FLOP'
  | 'COUNTER_4BIT'
  // Transistor-level discrete components
  | 'NMOS_TRANSISTOR'
  | 'PMOS_TRANSISTOR'
  | 'PULLUP_RESISTOR'
  | 'PULLDOWN_RESISTOR';

export interface Pin {
  id: string;
  name: string;
  type: 'input' | 'output';
  index: number;
  value: LogicValue;
  voltage: number; // 0.0 - 5.0 V
  relativeX: number; // relative to component anchor (0,0)
  relativeY: number;
}

export interface ComponentDefinition {
  type: GateType;
  name: string;
  category: ComponentCategory;
  description: string;
  width: number;
  height: number;
  defaultInputs: { name: string; label?: string }[];
  defaultOutputs: { name: string; label?: string }[];
  hasTransistorView?: boolean;
  truthTableSummary?: string;
}

export interface CircuitComponent {
  id: string;
  type: GateType;
  label?: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  inputs: Pin[];
  outputs: Pin[];
  state?: {
    toggle?: boolean; // for SWITCH
    pressed?: boolean; // for BUTTON
    clockFrequencyHz?: number; // for CLOCK (default 1Hz)
    clockTicks?: number;
    ledColor?: string; // red, green, blue, amber, purple, cyan
    internalQ?: LogicValue; // for latches / flip-flops
    internalQbar?: LogicValue;
    isUndefined?: boolean; // for SR Latch invalid S=1, R=1 state
    counterValue?: number; // for counter
    lastClock?: LogicValue; // for edge detection
    // Timing Analyzer oscilloscope history
    simTick?: number;
    timingHistory?: {
      [channelId: string]: Array<{ tick: number; value: LogicValue; voltage: number }>;
    };
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  value: LogicValue;
  voltage: number;
}

export interface CircuitProject {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  components: CircuitComponent[];
  wires: Wire[];
  autoPulldown?: boolean;
}

export interface CircuitError {
  id: string;
  type: 'floating_input' | 'contention' | 'oscillation' | 'high_impedance' | 'invalid_state';
  severity: 'warning' | 'error';
  message: string;
  componentId?: string;
  componentName?: string;
  pinId?: string;
  wireId?: string;
}

export interface SimulationState {
  running: boolean;
  frequencyHz: number;
  tickCount: number;
  stepMode: boolean;
  errors: CircuitError[];
}

export interface WaveformSample {
  timestamp: number;
  signals: Record<string, LogicValue>; // key: pinId or componentId
}

// Transistor Electronics Models (Inside the Gate)
export type TransistorType = 'NMOS' | 'PMOS';
export type TransistorState = 'ON' | 'OFF' | 'TRANSITION';

export interface TransistorNode {
  id: string;
  name: string;
  type: TransistorType;
  gateVoltage: number; // 0V or 5V
  drainVoltage: number;
  sourceVoltage: number;
  state: TransistorState;
  label: string;
  position: { x: number; y: number };
  explanation: string;
}

export interface TransistorCircuitModel {
  gateType: 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR';
  title: string;
  family: 'CMOS' | 'TTL' | 'RTL';
  description: string;
  inputs: { name: string; defaultVal: 0 | 1 }[];
  outputName: string;
  transistors: {
    id: string;
    label: string;
    type: TransistorType;
    gateInput: string; // e.g. "A", "B", or internal node id
    sourceNode: string; // "VDD", "GND", or node id
    drainNode: string;
    x: number;
    y: number;
  }[];
  internalNodes: {
    id: string;
    label: string;
    x: number;
    y: number;
  }[];
  notes: string[];
}
