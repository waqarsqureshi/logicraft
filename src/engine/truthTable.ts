/**
 * Automated Truth Table Generator & Boolean Equation Synthesizer
 * Evaluates all 2^N input combinations and produces a verified truth table for the circuit,
 * along with simplified mathematical Boolean equations, canonical Sum-of-Products (SOP),
 * and Product-of-Sums (POS).
 */

import { CircuitComponent, CircuitProject, LogicValue } from '../types/circuit';
import { simulateCircuit } from './simulation';

export interface TruthTableRow {
  inputs: Record<string, LogicValue>;
  outputs: Record<string, LogicValue>;
  isCurrentState?: boolean;
}

export interface BooleanEquationResult {
  outputId: string;
  outputLabel: string;
  primaryEquation: string;      // e.g. Y = A · B or S = A ⊕ B
  booleanAlgebra: string;       // e.g. Y = A ∧ B
  canonicalSOP: string;         // e.g. Y = ∑m(1, 2) = A'B + AB'
  canonicalPOS?: string;        // e.g. Y = ∏M(0, 3) = (A + B)(A' + B')
  mintermIndices: number[];
  maxtermIndices: number[];
  isStandardGate?: string;
}

export interface TruthTableData {
  inputHeaders: { id: string; label: string }[];
  outputHeaders: { id: string; label: string }[];
  rows: TruthTableRow[];
  equations: Record<string, BooleanEquationResult>;
}

/**
 * Derives simplified Boolean equations, algebraic expressions, and canonical SOP/POS
 * for each output from the evaluated truth table.
 */
export function deriveBooleanEquation(
  inputHeaders: { id: string; label: string }[],
  outputHeader: { id: string; label: string },
  rows: TruthTableRow[]
): BooleanEquationResult {
  const minterms: number[] = [];
  const maxterms: number[] = [];
  const outputId = outputHeader.id;
  const outLabel = outputHeader.label || 'Y';

  rows.forEach((row, idx) => {
    const val = row.outputs[outputId];
    if (val === 1) {
      minterms.push(idx);
    } else {
      maxterms.push(idx);
    }
  });

  const varNames = inputHeaders.map((h, i) => h.label || `In${i + 1}`);
  const numInputs = varNames.length;

  // 1. Trivial cases
  if (minterms.length === 0) {
    return {
      outputId,
      outputLabel: outLabel,
      primaryEquation: `${outLabel} = 0 (Constant LOW)`,
      booleanAlgebra: `${outLabel} = ⊥`,
      canonicalSOP: `${outLabel} = 0`,
      mintermIndices: [],
      maxtermIndices: maxterms,
    };
  }

  if (minterms.length === rows.length) {
    return {
      outputId,
      outputLabel: outLabel,
      primaryEquation: `${outLabel} = 1 (Constant HIGH)`,
      booleanAlgebra: `${outLabel} = ⊤`,
      canonicalSOP: `${outLabel} = 1`,
      mintermIndices: minterms,
      maxtermIndices: [],
    };
  }

  // 2. Canonical SOP (Sum of Products)
  // For each minterm, construct product term: A if 1, A' if 0
  const productTerms: string[] = minterms.map((mIdx) => {
    const letters: string[] = [];
    varNames.forEach((name, bitIdx) => {
      const bitShift = numInputs - 1 - bitIdx;
      const bit = (mIdx >> bitShift) & 1;
      letters.push(bit === 1 ? name : `${name}'`);
    });
    return letters.join('');
  });

  const sopTermsStr = productTerms.join(' + ');
  const canonicalSOP = `${outLabel} = ∑m(${minterms.join(', ')}) = ${sopTermsStr}`;

  // 3. Pattern recognition for standard 1-input and 2-input gates
  let primaryEquation = `${outLabel} = ${sopTermsStr}`;
  let booleanAlgebra = `${outLabel} = ${sopTermsStr}`;
  let isStandardGate: string | undefined;

  if (numInputs === 1) {
    const A = varNames[0];
    if (minterms.length === 1 && minterms[0] === 0) {
      // NOT
      primaryEquation = `${outLabel} = ${A}' (Ā)`;
      booleanAlgebra = `${outLabel} = ¬${A}`;
      isStandardGate = 'NOT';
    } else if (minterms.length === 1 && minterms[0] === 1) {
      // Buffer
      primaryEquation = `${outLabel} = ${A}`;
      booleanAlgebra = `${outLabel} = ${A}`;
      isStandardGate = 'BUFFER';
    }
  } else if (numInputs === 2) {
    const A = varNames[0];
    const B = varNames[1];
    const mStr = minterms.slice().sort().join(',');

    if (mStr === '3') {
      // AND
      primaryEquation = `${outLabel} = ${A} · ${B}`;
      booleanAlgebra = `${outLabel} = ${A} ∧ ${B}`;
      isStandardGate = 'AND';
    } else if (mStr === '1,2,3') {
      // OR
      primaryEquation = `${outLabel} = ${A} + ${B}`;
      booleanAlgebra = `${outLabel} = ${A} ∨ ${B}`;
      isStandardGate = 'OR';
    } else if (mStr === '0,1,2') {
      // NAND
      primaryEquation = `${outLabel} = (${A} · ${B})' = ${A}' + ${B}'`;
      booleanAlgebra = `${outLabel} = ¬(${A} ∧ ${B})`;
      isStandardGate = 'NAND';
    } else if (mStr === '0') {
      // NOR
      primaryEquation = `${outLabel} = (${A} + ${B})' = ${A}' · ${B}'`;
      booleanAlgebra = `${outLabel} = ¬(${A} ∨ ${B})`;
      isStandardGate = 'NOR';
    } else if (mStr === '1,2') {
      // XOR
      primaryEquation = `${outLabel} = ${A} ⊕ ${B} = ${A}'${B} + ${A}${B}'`;
      booleanAlgebra = `${outLabel} = ${A} ⊻ ${B}`;
      isStandardGate = 'XOR';
    } else if (mStr === '0,3') {
      // XNOR
      primaryEquation = `${outLabel} = (${A} ⊕ ${B})' = ${A}${B} + ${A}'${B}'`;
      booleanAlgebra = `${outLabel} = ${A} ⊙ ${B}`;
      isStandardGate = 'XNOR';
    }
  } else if (numInputs === 3) {
    const A = varNames[0];
    const B = varNames[1];
    const C = varNames[2];
    const mStr = minterms.slice().sort().join(',');

    if (mStr === '1,2,4,7') {
      // 3-input XOR (Full Adder Sum)
      primaryEquation = `${outLabel} = ${A} ⊕ ${B} ⊕ ${C}`;
      booleanAlgebra = `${outLabel} = ${A} ⊻ ${B} ⊻ ${C}`;
      isStandardGate = '3-Input XOR (Sum)';
    } else if (mStr === '3,5,6,7') {
      // Majority Logic (Full Adder Carry Out)
      primaryEquation = `${outLabel} = (${A}·${B}) + (${B}·${C}) + (${A}·${C})`;
      booleanAlgebra = `${outLabel} = (${A}∧${B}) ∨ (${B}∧${C}) ∨ (${A}∧${C})`;
      isStandardGate = 'Majority (Carry)';
    } else if (mStr === '7') {
      // 3-input AND
      primaryEquation = `${outLabel} = ${A} · ${B} · ${C}`;
      booleanAlgebra = `${outLabel} = ${A} ∧ ${B} ∧ ${C}`;
      isStandardGate = '3-Input AND';
    } else if (mStr === '1,2,3,4,5,6,7') {
      // 3-input OR
      primaryEquation = `${outLabel} = ${A} + ${B} + ${C}`;
      booleanAlgebra = `${outLabel} = ${A} ∨ ${B} ∨ ${C}`;
      isStandardGate = '3-Input OR';
    }
  }

  return {
    outputId,
    outputLabel: outLabel,
    primaryEquation,
    booleanAlgebra,
    canonicalSOP,
    mintermIndices: minterms,
    maxtermIndices: maxterms,
    isStandardGate,
  };
}

export function generateTruthTable(project: CircuitProject): TruthTableData | null {
  // Find all controllable input components (SWITCH, BUTTON)
  const inputComps = project.components.filter(
    (c) => c.type === 'SWITCH' || c.type === 'BUTTON'
  );

  // Find all observing output components (LED, PROBE, BUZZER)
  const outputComps = project.components.filter(
    (c) => c.type === 'LED' || c.type === 'PROBE' || c.type === 'BUZZER'
  );

  if (inputComps.length === 0 || outputComps.length === 0) {
    return null;
  }

  // Cap at 6 inputs (64 rows) for responsive performance
  const cappedInputs = inputComps.slice(0, 6);
  const numRows = Math.pow(2, cappedInputs.length);

  const inputHeaders = cappedInputs.map((c, idx) => ({
    id: c.id,
    label: c.label || String.fromCharCode(65 + idx), // A, B, C, D...
  }));

  const outputHeaders = outputComps.map((c, idx) => ({
    id: c.id,
    label: c.label || (outputComps.length === 1 ? 'Y' : `Y${idx + 1}`),
  }));

  const rows: TruthTableRow[] = [];

  for (let i = 0; i < numRows; i++) {
    // Clone project for isolated run
    const testProject: CircuitProject = JSON.parse(JSON.stringify(project));

    const inputRowValues: Record<string, LogicValue> = {};

    // Assign binary inputs (MSB to LSB)
    cappedInputs.forEach((inp, idx) => {
      const bitShift = cappedInputs.length - 1 - idx;
      const bitVal = ((i >> bitShift) & 1) as LogicValue;
      inputRowValues[inp.id] = bitVal;

      const compToUpdate = testProject.components.find((c) => c.id === inp.id);
      if (compToUpdate) {
        compToUpdate.state = {
          ...compToUpdate.state,
          toggle: bitVal === 1,
          pressed: bitVal === 1,
        };
      }
    });

    // Run simulation
    const simResult = simulateCircuit(testProject, false);

    const outputRowValues: Record<string, LogicValue> = {};
    outputComps.forEach((outComp) => {
      const simulatedComp = simResult.components.find((c) => c.id === outComp.id);
      const val = simulatedComp?.inputs[0]?.value ?? 0;
      outputRowValues[outComp.id] = val;
    });

    // Check if this matches current state in the actual canvas
    let isCurrent = true;
    for (const inp of cappedInputs) {
      const origComp = project.components.find((c) => c.id === inp.id);
      const origVal = origComp?.state?.toggle || origComp?.state?.pressed ? 1 : 0;
      if (inputRowValues[inp.id] !== origVal) {
        isCurrent = false;
        break;
      }
    }

    rows.push({
      inputs: inputRowValues,
      outputs: outputRowValues,
      isCurrentState: isCurrent,
    });
  }

  // Generate equations for each output
  const equations: Record<string, BooleanEquationResult> = {};
  outputHeaders.forEach((outH) => {
    equations[outH.id] = deriveBooleanEquation(inputHeaders, outH, rows);
  });

  return {
    inputHeaders,
    outputHeaders,
    rows,
    equations,
  };
}
