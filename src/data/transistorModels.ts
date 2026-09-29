/**
 * Educational Transistor Models for "Inside the Gate" Mode
 * Implements CMOS complementary logic (PMOS pull-up network, NMOS pull-down network)
 */

export interface TransistorDevice {
  id: string;
  name: string;
  type: 'PMOS' | 'NMOS';
  gateInput: string; // 'A', 'B', 'NAND_OUT', etc.
  sourceNode: string; // 'VDD', 'GND', node id
  drainNode: string;
  x: number; // coordinate for schematic drawing
  y: number;
  width: number;
  height: number;
  role: string;
}

export interface SchematicProbeNode {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  type: 'rail' | 'input' | 'internal' | 'output' | 'gnd';
}

export interface GateElectronicsModel {
  gateType: 'AND' | 'NAND' | 'NOT' | 'OR' | 'NOR' | 'XOR';
  title: string;
  technology: string;
  summary: string;
  inputs: { name: string; label: string }[];
  outputName: string;
  transistors: TransistorDevice[];
  probeNodes: SchematicProbeNode[];
  truthTable: {
    inputs: Record<string, 0 | 1>;
    internalValues?: Record<string, 0 | 1>;
    output: 0 | 1;
    explanation: string;
  }[];
  educationalNotes: string[];
}

export const TRANSISTOR_MODELS: Record<string, GateElectronicsModel> = {
  AND: {
    gateType: 'AND',
    title: 'CMOS AND Gate Architecture',
    technology: 'CMOS (Complementary Metal-Oxide-Semiconductor)',
    summary:
      'In real-world CMOS integrated circuits, an AND gate is implemented as a NAND gate stage (Q1-Q4) followed by a CMOS Inverter stage (Q5-Q6) to drive the output.',
    inputs: [
      { name: 'A', label: 'Input A' },
      { name: 'B', label: 'Input B' },
    ],
    outputName: 'OUT (Y)',
    transistors: [
      {
        id: 'Q1',
        name: 'Q1 (PMOS)',
        type: 'PMOS',
        gateInput: 'A',
        sourceNode: 'VDD',
        drainNode: 'NODE_NAND',
        x: 160,
        y: 110,
        width: 60,
        height: 60,
        role: 'Pull-up transistor connected to Input A. Turns ON when A = 0V.',
      },
      {
        id: 'Q2',
        name: 'Q2 (PMOS)',
        type: 'PMOS',
        gateInput: 'B',
        sourceNode: 'VDD',
        drainNode: 'NODE_NAND',
        x: 270,
        y: 110,
        width: 60,
        height: 60,
        role: 'Pull-up transistor in parallel with Q1. Turns ON when B = 0V.',
      },
      {
        id: 'Q3',
        name: 'Q3 (NMOS)',
        type: 'NMOS',
        gateInput: 'A',
        sourceNode: 'NODE_NAND',
        drainNode: 'NODE_INT',
        x: 215,
        y: 230,
        width: 60,
        height: 60,
        role: 'Upper pull-down transistor. Conducts toward GND only when A = 5V.',
      },
      {
        id: 'Q4',
        name: 'Q4 (NMOS)',
        type: 'NMOS',
        gateInput: 'B',
        sourceNode: 'NODE_INT',
        drainNode: 'GND',
        x: 215,
        y: 320,
        width: 60,
        height: 60,
        role: 'Lower pull-down transistor in series with Q3. Conducts toward GND when B = 5V.',
      },
      // Inverter Stage
      {
        id: 'Q5',
        name: 'Q5 (PMOS)',
        type: 'PMOS',
        gateInput: 'NODE_NAND',
        sourceNode: 'VDD',
        drainNode: 'OUT',
        x: 420,
        y: 130,
        width: 60,
        height: 60,
        role: 'Inverter pull-up. Pulls output OUT to 5V when intermediate node is 0V.',
      },
      {
        id: 'Q6',
        name: 'Q6 (NMOS)',
        type: 'NMOS',
        gateInput: 'NODE_NAND',
        sourceNode: 'OUT',
        drainNode: 'GND',
        x: 420,
        y: 290,
        width: 60,
        height: 60,
        role: 'Inverter pull-down. Pulls output OUT to 0V when intermediate node is 5V.',
      },
    ],
    probeNodes: [
      { id: 'VDD', name: 'VDD Power Rail', label: '+5.0V (VDD)', x: 215, y: 40, type: 'rail' },
      { id: 'IN_A', name: 'Input A Pin', label: 'Input A', x: 80, y: 130, type: 'input' },
      { id: 'IN_B', name: 'Input B Pin', label: 'Input B', x: 80, y: 280, type: 'input' },
      { id: 'NODE_NAND', name: 'NAND Intermediate Node', label: 'NAND Node (¬[A·B])', x: 330, y: 190, type: 'internal' },
      { id: 'NODE_INT', name: 'NMOS Stack Node', label: 'Series Midpoint', x: 215, y: 285, type: 'internal' },
      { id: 'OUT', name: 'Output Terminal', label: 'Output (A · B)', x: 530, y: 210, type: 'output' },
      { id: 'GND', name: 'Ground Rail', label: '0.0V (GND)', x: 215, y: 395, type: 'gnd' },
    ],
    truthTable: [
      {
        inputs: { A: 0, B: 0 },
        internalValues: { NODE_NAND: 1 },
        output: 0,
        explanation: 'A=0V & B=0V: Both PMOS (Q1,Q2) are ON pulling NAND node to 5V. Inverter (Q6 ON) pulls Output to 0V.',
      },
      {
        inputs: { A: 0, B: 1 },
        internalValues: { NODE_NAND: 1 },
        output: 0,
        explanation: 'A=0V: PMOS Q1 is ON holding NAND node at 5V. NMOS stack Q3 is OFF. Output is pulled to 0V by Q6.',
      },
      {
        inputs: { A: 1, B: 0 },
        internalValues: { NODE_NAND: 1 },
        output: 0,
        explanation: 'B=0V: PMOS Q2 is ON holding NAND node at 5V. NMOS stack Q4 is OFF. Output is pulled to 0V by Q6.',
      },
      {
        inputs: { A: 1, B: 1 },
        internalValues: { NODE_NAND: 0 },
        output: 1,
        explanation: 'A=5V & B=5V: PMOS (Q1,Q2) turn OFF. NMOS stack (Q3,Q4) conducts to GND (0V). Inverter PMOS Q5 turns ON, pulling Output to 5V!',
      },
    ],
    educationalNotes: [
      'PMOS transistors conduct when gate voltage is 0V (LOW). They act as pull-up switches to +5V.',
      'NMOS transistors conduct when gate voltage is 5V (HIGH). They act as pull-down switches to Ground (0V).',
      'Because NMOS transistors are in series, BOTH Q3 and Q4 must be ON to pull down the NAND node.',
      'CMOS draws virtually zero static current because at any steady state, either the pull-up or pull-down network is disconnected.',
    ],
  },

  NAND: {
    gateType: 'NAND',
    title: 'CMOS NAND Gate Architecture',
    technology: 'CMOS (Complementary Metal-Oxide-Semiconductor)',
    summary:
      'NAND is the most silicon-efficient universal logic gate in CMOS, requiring only 4 transistors (2 parallel PMOS and 2 series NMOS).',
    inputs: [
      { name: 'A', label: 'Input A' },
      { name: 'B', label: 'Input B' },
    ],
    outputName: 'OUT (¬[A·B])',
    transistors: [
      {
        id: 'Q1',
        name: 'Q1 (PMOS)',
        type: 'PMOS',
        gateInput: 'A',
        sourceNode: 'VDD',
        drainNode: 'OUT',
        x: 180,
        y: 110,
        width: 60,
        height: 60,
        role: 'PMOS pull-up on Input A. Conducts when A = 0V.',
      },
      {
        id: 'Q2',
        name: 'Q2 (PMOS)',
        type: 'PMOS',
        gateInput: 'B',
        sourceNode: 'VDD',
        drainNode: 'OUT',
        x: 300,
        y: 110,
        width: 60,
        height: 60,
        role: 'PMOS pull-up on Input B. Conducts when B = 0V.',
      },
      {
        id: 'Q3',
        name: 'Q3 (NMOS)',
        type: 'NMOS',
        gateInput: 'A',
        sourceNode: 'OUT',
        drainNode: 'NODE_INT',
        x: 240,
        y: 230,
        width: 60,
        height: 60,
        role: 'Upper series NMOS switch.',
      },
      {
        id: 'Q4',
        name: 'Q4 (NMOS)',
        type: 'NMOS',
        gateInput: 'B',
        sourceNode: 'NODE_INT',
        drainNode: 'GND',
        x: 240,
        y: 320,
        width: 60,
        height: 60,
        role: 'Lower series NMOS switch to GND.',
      },
    ],
    probeNodes: [
      { id: 'VDD', name: 'VDD Rail', label: '+5.0V', x: 240, y: 40, type: 'rail' },
      { id: 'IN_A', name: 'Input A', label: 'Input A', x: 90, y: 130, type: 'input' },
      { id: 'IN_B', name: 'Input B', label: 'Input B', x: 90, y: 280, type: 'input' },
      { id: 'NODE_INT', name: 'Midpoint Node', label: 'Stack Midpoint', x: 240, y: 285, type: 'internal' },
      { id: 'OUT', name: 'Output Terminal', label: 'OUT', x: 420, y: 190, type: 'output' },
      { id: 'GND', name: 'Ground Rail', label: '0.0V (GND)', x: 240, y: 395, type: 'gnd' },
    ],
    truthTable: [
      { inputs: { A: 0, B: 0 }, output: 1, explanation: 'Q1 & Q2 both ON, Output connected directly to +5V.' },
      { inputs: { A: 0, B: 1 }, output: 1, explanation: 'Q1 ON, pulling Output to +5V. Series stack broken by Q3.' },
      { inputs: { A: 1, B: 0 }, output: 1, explanation: 'Q2 ON, pulling Output to +5V. Series stack broken by Q4.' },
      { inputs: { A: 1, B: 1 }, output: 0, explanation: 'Q1 & Q2 OFF. Both Q3 & Q4 ON, discharging Output to 0V.' },
    ],
    educationalNotes: [
      'NAND gates are naturally faster and smaller in silicon than AND gates because they don’t need an inverter stage.',
      'Apollo Guidance Computer (1960s) was constructed entirely out of 3-input NOR gates; similarly, entire computers can be built solely of NANDs.',
    ],
  },

  NOT: {
    gateType: 'NOT',
    title: 'CMOS Inverter (NOT Gate)',
    technology: 'CMOS (Complementary Metal-Oxide-Semiconductor)',
    summary:
      'The foundational building block of all modern digital electronics. Composed of exactly 1 PMOS and 1 NMOS transistor.',
    inputs: [{ name: 'A', label: 'Input A' }],
    outputName: 'OUT (¬A)',
    transistors: [
      {
        id: 'Q1',
        name: 'Q1 (PMOS)',
        type: 'PMOS',
        gateInput: 'A',
        sourceNode: 'VDD',
        drainNode: 'OUT',
        x: 230,
        y: 120,
        width: 60,
        height: 60,
        role: 'Pull-up transistor: conducts when Input A = 0V, charging Output to 5V.',
      },
      {
        id: 'Q2',
        name: 'Q2 (NMOS)',
        type: 'NMOS',
        gateInput: 'A',
        sourceNode: 'OUT',
        drainNode: 'GND',
        x: 230,
        y: 270,
        width: 60,
        height: 60,
        role: 'Pull-down transistor: conducts when Input A = 5V, discharging Output to 0V.',
      },
    ],
    probeNodes: [
      { id: 'VDD', name: 'VDD Rail', label: '+5.0V', x: 230, y: 40, type: 'rail' },
      { id: 'IN_A', name: 'Input A', label: 'Input A', x: 100, y: 200, type: 'input' },
      { id: 'OUT', name: 'Output Terminal', label: 'Output (¬A)', x: 380, y: 200, type: 'output' },
      { id: 'GND', name: 'Ground Rail', label: '0.0V (GND)', x: 230, y: 370, type: 'gnd' },
    ],
    truthTable: [
      { inputs: { A: 0 }, output: 1, explanation: 'Input A = 0V: Q1 (PMOS) turns ON, connecting OUT to 5V. Q2 is OFF.' },
      { inputs: { A: 1 }, output: 0, explanation: 'Input A = 5V: Q1 turns OFF, Q2 (NMOS) turns ON, sinking OUT to 0V.' },
    ],
    educationalNotes: [
      'The CMOS inverter is self-restoring: a slightly degraded high or low voltage at the input is regenerated into a clean rail-to-rail voltage at the output.',
      'Power is consumed primarily during dynamic switching as internal capacitance charges and discharges.',
    ],
  },

  OR: {
    gateType: 'OR',
    title: 'CMOS OR Gate Architecture',
    technology: 'CMOS',
    summary:
      'In CMOS, an OR gate is implemented as a NOR gate (2 PMOS series, 2 NMOS parallel) followed by an Inverter stage.',
    inputs: [
      { name: 'A', label: 'Input A' },
      { name: 'B', label: 'Input B' },
    ],
    outputName: 'OUT (A + B)',
    transistors: [
      {
        id: 'Q1',
        name: 'Q1 (PMOS)',
        type: 'PMOS',
        gateInput: 'A',
        sourceNode: 'VDD',
        drainNode: 'NODE_P_INT',
        x: 180,
        y: 90,
        width: 60,
        height: 60,
        role: 'Upper series PMOS pull-up.',
      },
      {
        id: 'Q2',
        name: 'Q2 (PMOS)',
        type: 'PMOS',
        gateInput: 'B',
        sourceNode: 'NODE_P_INT',
        drainNode: 'NODE_NOR',
        x: 180,
        y: 170,
        width: 60,
        height: 60,
        role: 'Lower series PMOS pull-up.',
      },
      {
        id: 'Q3',
        name: 'Q3 (NMOS)',
        type: 'NMOS',
        gateInput: 'A',
        sourceNode: 'NODE_NOR',
        drainNode: 'GND',
        x: 140,
        y: 280,
        width: 60,
        height: 60,
        role: 'Parallel NMOS pull-down for A.',
      },
      {
        id: 'Q4',
        name: 'Q4 (NMOS)',
        type: 'NMOS',
        gateInput: 'B',
        sourceNode: 'NODE_NOR',
        drainNode: 'GND',
        x: 250,
        y: 280,
        width: 60,
        height: 60,
        role: 'Parallel NMOS pull-down for B.',
      },
      // Inverter
      {
        id: 'Q5',
        name: 'Q5 (PMOS)',
        type: 'PMOS',
        gateInput: 'NODE_NOR',
        sourceNode: 'VDD',
        drainNode: 'OUT',
        x: 390,
        y: 130,
        width: 60,
        height: 60,
        role: 'Output Inverter PMOS.',
      },
      {
        id: 'Q6',
        name: 'Q6 (NMOS)',
        type: 'NMOS',
        gateInput: 'NODE_NOR',
        sourceNode: 'OUT',
        drainNode: 'GND',
        x: 390,
        y: 280,
        width: 60,
        height: 60,
        role: 'Output Inverter NMOS.',
      },
    ],
    probeNodes: [
      { id: 'VDD', name: 'VDD Rail', label: '+5.0V', x: 200, y: 30, type: 'rail' },
      { id: 'IN_A', name: 'Input A', label: 'Input A', x: 60, y: 110, type: 'input' },
      { id: 'IN_B', name: 'Input B', label: 'Input B', x: 60, y: 240, type: 'input' },
      { id: 'NODE_NOR', name: 'NOR Node', label: 'NOR Internal', x: 300, y: 190, type: 'internal' },
      { id: 'OUT', name: 'Output', label: 'OUT', x: 490, y: 200, type: 'output' },
      { id: 'GND', name: 'Ground', label: '0.0V', x: 200, y: 370, type: 'gnd' },
    ],
    truthTable: [
      { inputs: { A: 0, B: 0 }, output: 0, explanation: 'NOR node is 5V (Q1+Q2 ON), output is inverted to 0V.' },
      { inputs: { A: 0, B: 1 }, output: 1, explanation: 'Q4 NMOS discharges NOR node to 0V, inverter drives OUT to 5V.' },
      { inputs: { A: 1, B: 0 }, output: 1, explanation: 'Q3 NMOS discharges NOR node to 0V, inverter drives OUT to 5V.' },
      { inputs: { A: 1, B: 1 }, output: 1, explanation: 'Both Q3 & Q4 discharge NOR node to 0V, inverter drives OUT to 5V.' },
    ],
    educationalNotes: [
      'Dual topology: In OR, PMOS are in series while NMOS are in parallel; in AND, PMOS are in parallel while NMOS are in series.',
    ],
  },

  NOR: {
    gateType: 'NOR',
    title: 'CMOS NOR Gate Architecture',
    technology: 'CMOS',
    summary:
      'Universal CMOS NOR gate: 2 series PMOS transistors in the pull-up network, and 2 parallel NMOS transistors in the pull-down network.',
    inputs: [
      { name: 'A', label: 'Input A' },
      { name: 'B', label: 'Input B' },
    ],
    outputName: 'OUT (¬[A + B])',
    transistors: [
      {
        id: 'Q1',
        name: 'Q1 (PMOS)',
        type: 'PMOS',
        gateInput: 'A',
        sourceNode: 'VDD',
        drainNode: 'NODE_P_INT',
        x: 210,
        y: 100,
        width: 60,
        height: 60,
        role: 'Upper series PMOS pull-up connected to Input A.',
      },
      {
        id: 'Q2',
        name: 'Q2 (PMOS)',
        type: 'PMOS',
        gateInput: 'B',
        sourceNode: 'NODE_P_INT',
        drainNode: 'OUT',
        x: 210,
        y: 190,
        width: 60,
        height: 60,
        role: 'Lower series PMOS pull-up connected to Input B.',
      },
      {
        id: 'Q3',
        name: 'Q3 (NMOS)',
        type: 'NMOS',
        gateInput: 'A',
        sourceNode: 'OUT',
        drainNode: 'GND',
        x: 160,
        y: 300,
        width: 60,
        height: 60,
        role: 'Parallel NMOS pull-down: discharges output when A = 5V.',
      },
      {
        id: 'Q4',
        name: 'Q4 (NMOS)',
        type: 'NMOS',
        gateInput: 'B',
        sourceNode: 'OUT',
        drainNode: 'GND',
        x: 270,
        y: 300,
        width: 60,
        height: 60,
        role: 'Parallel NMOS pull-down: discharges output when B = 5V.',
      },
    ],
    probeNodes: [
      { id: 'VDD', name: 'VDD Rail', label: '+5.0V', x: 230, y: 35, type: 'rail' },
      { id: 'IN_A', name: 'Input A', label: 'Input A', x: 70, y: 130, type: 'input' },
      { id: 'IN_B', name: 'Input B', label: 'Input B', x: 70, y: 220, type: 'input' },
      { id: 'NODE_P_INT', name: 'PMOS Midpoint', label: 'Series Midpoint', x: 230, y: 175, type: 'internal' },
      { id: 'OUT', name: 'Output Terminal', label: 'OUT (¬[A+B])', x: 440, y: 250, type: 'output' },
      { id: 'GND', name: 'Ground Rail', label: '0.0V (GND)', x: 230, y: 400, type: 'gnd' },
    ],
    truthTable: [
      { inputs: { A: 0, B: 0 }, output: 1, explanation: 'Both PMOS Q1 & Q2 ON in series, pulling output directly to +5V. Both NMOS OFF.' },
      { inputs: { A: 0, B: 1 }, output: 0, explanation: 'Q4 NMOS turns ON, pulling output directly to 0V Ground.' },
      { inputs: { A: 1, B: 0 }, output: 0, explanation: 'Q3 NMOS turns ON, pulling output directly to 0V Ground.' },
      { inputs: { A: 1, B: 1 }, output: 0, explanation: 'Both Q3 & Q4 NMOS conduct, sinking output to 0V Ground.' },
    ],
    educationalNotes: [
      'In a NOR gate, both inputs must be 0V for the PMOS series chain to conduct from VDD to OUT.',
    ],
  },
};

/**
 * Calculates live voltages and transistor conduction states based on inputs
 */
export function evaluateTransistorCircuit(
  model: GateElectronicsModel,
  inputVoltages: Record<string, number>
) {
  const transistorStates: Record<
    string,
    { state: 'ON' | 'OFF'; gateVoltage: number; vds: number; explanation: string }
  > = {};

  const nodeVoltages: Record<string, number> = {
    VDD: 5.0,
    GND: 0.0,
  };

  // Convert inputs to voltages and digital logic
  for (const inp of model.inputs) {
    const v = inputVoltages[inp.name] ?? 0.0;
    nodeVoltages[`IN_${inp.name}`] = v;
  }

  // Multi-step electrical solving for CMOS
  if (model.gateType === 'AND') {
    const vA = inputVoltages['A'] ?? 0;
    const vB = inputVoltages['B'] ?? 0;

    const q1On = vA < 1.5; // PMOS conducts when gate is LOW
    const q2On = vB < 1.5; // PMOS
    const q3On = vA > 3.0; // NMOS conducts when gate is HIGH
    const q4On = vB > 3.0; // NMOS

    // Intermediate NAND node
    let vNand = 0.0;
    if (q1On || q2On) {
      vNand = 5.0;
    }
    if (q3On && q4On) {
      vNand = 0.0;
    }

    nodeVoltages['NODE_NAND'] = vNand;
    nodeVoltages['NODE_INT'] = q4On ? 0.0 : 2.5;

    // Inverter stage
    const q5On = vNand < 1.5;
    const q6On = vNand > 3.0;
    const vOut = q5On ? 5.0 : 0.0;
    nodeVoltages['OUT'] = vOut;

    transistorStates['Q1'] = {
      state: q1On ? 'ON' : 'OFF',
      gateVoltage: vA,
      vds: 5.0 - vNand,
      explanation: q1On
        ? 'Conducting: Gate at 0V creates negative Vgs below threshold, turning channel ON.'
        : 'Cut-off: Gate at 5V brings Vgs to 0V, pinching off PMOS channel.',
    };

    transistorStates['Q2'] = {
      state: q2On ? 'ON' : 'OFF',
      gateVoltage: vB,
      vds: 5.0 - vNand,
      explanation: q2On
        ? 'Conducting: Gate at 0V turns PMOS ON to supply current from VDD.'
        : 'Cut-off: Gate at 5V turns PMOS OFF.',
    };

    transistorStates['Q3'] = {
      state: q3On ? 'ON' : 'OFF',
      gateVoltage: vA,
      vds: vNand - nodeVoltages['NODE_INT'],
      explanation: q3On
        ? 'Conducting: Gate at 5V attracts electron channel to bridge drain and source.'
        : 'Cut-off: Gate at 0V leaves channel non-conductive.',
    };

    transistorStates['Q4'] = {
      state: q4On ? 'ON' : 'OFF',
      gateVoltage: vB,
      vds: nodeVoltages['NODE_INT'] - 0.0,
      explanation: q4On
        ? 'Conducting: Completes the pull-down series path to Ground (0V).'
        : 'Cut-off: Blocks pull-down current flow to Ground.',
    };

    transistorStates['Q5'] = {
      state: q5On ? 'ON' : 'OFF',
      gateVoltage: vNand,
      vds: 5.0 - vOut,
      explanation: q5On ? 'Inverter PMOS ON: Pulls OUT to 5V.' : 'Inverter PMOS OFF.',
    };

    transistorStates['Q6'] = {
      state: q6On ? 'ON' : 'OFF',
      gateVoltage: vNand,
      vds: vOut,
      explanation: q6On ? 'Inverter NMOS ON: Sinks OUT to 0V.' : 'Inverter NMOS OFF.',
    };
  } else if (model.gateType === 'NOT') {
    const vA = inputVoltages['A'] ?? 0;
    const q1On = vA < 1.5;
    const q2On = vA > 3.0;
    const vOut = q1On ? 5.0 : 0.0;
    nodeVoltages['OUT'] = vOut;

    transistorStates['Q1'] = {
      state: q1On ? 'ON' : 'OFF',
      gateVoltage: vA,
      vds: 5.0 - vOut,
      explanation: q1On ? 'Conducting: Pulls output OUT to +5.0V.' : 'Cut-off: Channel open.',
    };
    transistorStates['Q2'] = {
      state: q2On ? 'ON' : 'OFF',
      gateVoltage: vA,
      vds: vOut,
      explanation: q2On ? 'Conducting: Pulls output OUT to Ground (0.0V).' : 'Cut-off: Channel open.',
    };
  } else if (model.gateType === 'NAND') {
    const vA = inputVoltages['A'] ?? 0;
    const vB = inputVoltages['B'] ?? 0;
    const q1On = vA < 1.5;
    const q2On = vB < 1.5;
    const q3On = vA > 3.0;
    const q4On = vB > 3.0;

    const vOut = q1On || q2On ? 5.0 : 0.0;
    nodeVoltages['OUT'] = vOut;
    nodeVoltages['NODE_INT'] = q4On ? 0.0 : 2.5;

    transistorStates['Q1'] = { state: q1On ? 'ON' : 'OFF', gateVoltage: vA, vds: 5 - vOut, explanation: q1On ? 'ON' : 'OFF' };
    transistorStates['Q2'] = { state: q2On ? 'ON' : 'OFF', gateVoltage: vB, vds: 5 - vOut, explanation: q2On ? 'ON' : 'OFF' };
    transistorStates['Q3'] = { state: q3On ? 'ON' : 'OFF', gateVoltage: vA, vds: vOut, explanation: q3On ? 'ON' : 'OFF' };
    transistorStates['Q4'] = { state: q4On ? 'ON' : 'OFF', gateVoltage: vB, vds: 0, explanation: q4On ? 'ON' : 'OFF' };
  } else if (model.gateType === 'OR') {
    const vA = inputVoltages['A'] ?? 0;
    const vB = inputVoltages['B'] ?? 0;
    const q1On = vA < 1.5; // PMOS series upper
    const q2On = vB < 1.5; // PMOS series lower
    const q3On = vA > 3.0; // NMOS parallel A
    const q4On = vB > 3.0; // NMOS parallel B

    // NOR node
    let vNor = 0.0;
    if (q1On && q2On) {
      vNor = 5.0;
    }
    if (q3On || q4On) {
      vNor = 0.0;
    }

    nodeVoltages['NODE_NOR'] = vNor;
    nodeVoltages['NODE_P_INT'] = q1On ? 5.0 : 2.5;

    // Inverter Q5 & Q6
    const q5On = vNor < 1.5;
    const q6On = vNor > 3.0;
    const vOut = q5On ? 5.0 : 0.0;
    nodeVoltages['OUT'] = vOut;

    transistorStates['Q1'] = { state: q1On ? 'ON' : 'OFF', gateVoltage: vA, vds: 5 - nodeVoltages['NODE_P_INT'], explanation: q1On ? 'PMOS ON' : 'PMOS OFF' };
    transistorStates['Q2'] = { state: q2On ? 'ON' : 'OFF', gateVoltage: vB, vds: nodeVoltages['NODE_P_INT'] - vNor, explanation: q2On ? 'PMOS ON' : 'PMOS OFF' };
    transistorStates['Q3'] = { state: q3On ? 'ON' : 'OFF', gateVoltage: vA, vds: vNor, explanation: q3On ? 'NMOS ON: Pulls NOR node to GND' : 'NMOS OFF' };
    transistorStates['Q4'] = { state: q4On ? 'ON' : 'OFF', gateVoltage: vB, vds: vNor, explanation: q4On ? 'NMOS ON: Pulls NOR node to GND' : 'NMOS OFF' };
    transistorStates['Q5'] = { state: q5On ? 'ON' : 'OFF', gateVoltage: vNor, vds: 5 - vOut, explanation: q5On ? 'Inverter PMOS ON: Pulls OUT to 5V' : 'Inverter PMOS OFF' };
    transistorStates['Q6'] = { state: q6On ? 'ON' : 'OFF', gateVoltage: vNor, vds: vOut, explanation: q6On ? 'Inverter NMOS ON: Sinks OUT to 0V' : 'Inverter NMOS OFF' };
  } else if (model.gateType === 'NOR') {
    const vA = inputVoltages['A'] ?? 0;
    const vB = inputVoltages['B'] ?? 0;
    const q1On = vA < 1.5; // PMOS series upper
    const q2On = vB < 1.5; // PMOS series lower
    const q3On = vA > 3.0; // NMOS parallel A
    const q4On = vB > 3.0; // NMOS parallel B

    let vOut = 0.0;
    if (q1On && q2On) {
      vOut = 5.0;
    }
    if (q3On || q4On) {
      vOut = 0.0;
    }

    nodeVoltages['OUT'] = vOut;
    nodeVoltages['NODE_P_INT'] = q1On ? 5.0 : 2.5;

    transistorStates['Q1'] = { state: q1On ? 'ON' : 'OFF', gateVoltage: vA, vds: 5 - nodeVoltages['NODE_P_INT'], explanation: q1On ? 'PMOS Q1 conducting from VDD' : 'PMOS Q1 cut-off' };
    transistorStates['Q2'] = { state: q2On ? 'ON' : 'OFF', gateVoltage: vB, vds: nodeVoltages['NODE_P_INT'] - vOut, explanation: q2On ? 'PMOS Q2 conducting to OUT' : 'PMOS Q2 cut-off' };
    transistorStates['Q3'] = { state: q3On ? 'ON' : 'OFF', gateVoltage: vA, vds: vOut, explanation: q3On ? 'NMOS Q3 ON: Discharging OUT to 0V' : 'NMOS Q3 OFF' };
    transistorStates['Q4'] = { state: q4On ? 'ON' : 'OFF', gateVoltage: vB, vds: vOut, explanation: q4On ? 'NMOS Q4 ON: Discharging OUT to 0V' : 'NMOS Q4 OFF' };
  }

  return {
    nodeVoltages,
    transistorStates,
    outputVoltage: nodeVoltages['OUT'] ?? 0.0,
    logicOutput: (nodeVoltages['OUT'] ?? 0.0) > 2.5 ? (1 as const) : (0 as const),
  };
}
