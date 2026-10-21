import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COMPONENT_DEFINITIONS, createComponentPins } from './definitions';
import { resetProjectRuntime, simulateCircuit } from './simulation';
import { ADVANCED_CIRCUITS } from '../data/advancedCircuits';
import { generateSequentialTruthTable } from './sequentialTruthTable';
import { generateTruthTable } from './truthTable';
import { CircuitComponent, CircuitProject, GateType, Wire } from '../types/circuit';

function component(id: string, type: GateType, state?: CircuitComponent['state']): CircuitComponent {
  const definition = COMPONENT_DEFINITIONS[type];
  const pins = createComponentPins(type, definition.width, definition.height, id);
  return {
    id,
    type,
    x: 0,
    y: 0,
    rotation: 0,
    inputs: pins.inputs,
    outputs: pins.outputs,
    state,
  };
}

function wire(id: string, from: CircuitComponent, outputIndex: number, to: CircuitComponent, inputIndex: number): Wire {
  return {
    id,
    fromComponentId: from.id,
    fromPinId: from.outputs[outputIndex].id,
    toComponentId: to.id,
    toPinId: to.inputs[inputIndex].id,
    value: 'X',
    voltage: 2.5,
  };
}

function project(components: CircuitComponent[], wires: Wire[]): CircuitProject {
  return {
    id: 'test-project',
    name: 'Test project',
    version: '1',
    createdAt: 0,
    updatedAt: 0,
    components,
    wires,
  };
}

function simulate(projectState: CircuitProject, tick = false): CircuitProject {
  const result = simulateCircuit(projectState, tick);
  return { ...projectState, components: result.components, wires: result.wires };
}

function getComponent(projectState: CircuitProject, id: string): CircuitComponent {
  const result = projectState.components.find((entry) => entry.id === id);
  assert.ok(result);
  return result;
}

describe('simulation engine', () => {
  it('resets and evaluates with no undefined pin values', () => {
    const gate = component('and', 'AND');
    const initialized = resetProjectRuntime(project([gate], []));
    const result = simulateCircuit(initialized);

    for (const entry of result.components) {
      for (const pin of [...entry.inputs, ...entry.outputs]) {
        assert.notEqual(pin.value, undefined);
        assert.ok([0, 1, 'X', 'Z'].includes(pin.value));
      }
    }
    assert.equal(result.components[0].inputs[0].value, 'Z');
    assert.equal(result.components[0].outputs[0].value, 'X');
  });

  it('captures D only on a known rising edge and holds Q between edges', () => {
    const data = component('data', 'SWITCH', { toggle: true });
    const clock = component('clock', 'CLOCK', { clockFrequencyHz: 1, clockTicks: 47 });
    const flipFlop = component('ff', 'D_FLIP_FLOP', { internalQ: 0, lastClock: 1 });
    let state = resetProjectRuntime(project(
      [data, clock, flipFlop],
      [wire('data-to-d', data, 0, flipFlop, 0), wire('clock-to-clk', clock, 0, flipFlop, 1)]
    ));
    state = simulate(state);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 'X');
    assert.equal(getComponent(state, 'clock').state?.clockTicks, 0);

    state = simulate(state, true);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 1);
    state = simulate(state, true);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 1);

    state = {
      ...state,
      components: state.components.map((entry) =>
        entry.id === 'data' ? { ...entry, state: { ...entry.state, toggle: false } } : entry
      ),
    };
    state = simulate(state);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 1);
    state = simulate(state, true);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 0);
    assert.equal(getComponent(state, 'ff').outputs[1].value, 1);
  });

  it('allows the clock connection to be created before D without a false edge', () => {
    const data = component('data', 'SWITCH', { toggle: true });
    const clock = component('clock', 'CLOCK');
    const flipFlop = component('ff', 'D_FLIP_FLOP');
    let state = resetProjectRuntime(project([data, clock, flipFlop], [wire('clock-wire', clock, 0, flipFlop, 1)]));
    state = simulate(state);
    state = simulate(state, true);
    assert.equal(getComponent(state, 'clock').outputs[0].value, 1);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 'X');

    state = {
      ...state,
      wires: [...state.wires, wire('data-wire', data, 0, flipFlop, 0)],
    };
    state = simulate(state);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 'X');
    state = simulate(state, true);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 'X');
    state = simulate(state, true);
    assert.equal(getComponent(state, 'ff').state?.internalQ, 1);
  });

  it('produces the same settled outputs regardless of component-array order', () => {
    const low = component('low', 'CONST_LOW');
    const high = component('high', 'CONST_HIGH');
    const andGate = component('and', 'AND');
    const components = [low, high, andGate];
    const wires = [wire('low-a', low, 0, andGate, 0), wire('high-b', high, 0, andGate, 1)];
    const forward = simulateCircuit(resetProjectRuntime(project(components, wires)));
    const reverse = simulateCircuit(resetProjectRuntime(project([...components].reverse(), wires)));

    assert.equal(forward.components.find((entry) => entry.id === 'and')?.outputs[0].value, 0);
    assert.equal(
      reverse.components.find((entry) => entry.id === 'and')?.outputs[0].value,
      forward.components.find((entry) => entry.id === 'and')?.outputs[0].value
    );
  });

  it('handles combinational feedback without hanging and keeps sequential feedback valid', () => {
    const inverter = component('inverter', 'NOT');
    const inverterLoop = simulateCircuit(resetProjectRuntime(project(
      [inverter],
      [wire('inverter-loop', inverter, 0, inverter, 0)]
    )));
    assert.equal(inverterLoop.components[0].outputs[0].value, 'X');

    const clock = component('clock', 'CLOCK');
    const flipFlop = component('ff', 'D_FLIP_FLOP');
    let sequential = resetProjectRuntime(project(
      [clock, flipFlop],
      [wire('clock-wire', clock, 0, flipFlop, 1), wire('feedback', flipFlop, 0, flipFlop, 0)]
    ));
    sequential = simulate(sequential);
    sequential = simulate(sequential, true);
    assert.equal(getComponent(sequential, 'clock').outputs[0].value, 1);
    assert.ok(!simulateCircuit(sequential).errors.some((error) => error.type === 'oscillation'));
  });

  it('keeps a flip-flop unknown when D is floating at a clock edge', () => {
    const clock = component('clock', 'CLOCK');
    const flipFlop = component('ff', 'D_FLIP_FLOP');
    let state = resetProjectRuntime(project(
      [clock, flipFlop],
      [wire('clock-wire', clock, 0, flipFlop, 1)]
    ));
    state = simulate(state);
    state = simulate(state, true);

    const result = getComponent(state, 'ff');
    assert.equal(result.state?.internalQ, 'X');
    assert.equal(result.outputs[0].value, 'X');
    assert.equal(result.outputs[1].value, 'X');
  });

  it('loads and steps a two-flip-flop XOR feedback playground topology', () => {
    const q1 = component('q1', 'D_FLIP_FLOP');
    const q0 = component('q0', 'D_FLIP_FLOP');
    const clock = component('clock', 'CLOCK', { clockTicks: 203 });
    const xor = component('xor', 'XOR');
    const led1 = component('led1', 'LED');
    const led0 = component('led0', 'LED');
    const fixture = project([q1, q0, clock, xor, led1, led0], [
      wire('clock-q1', clock, 0, q1, 1),
      wire('clock-q0', clock, 0, q0, 1),
      wire('q0-self-feedback', q0, 0, q0, 0),
      wire('q1-to-xor', q1, 0, xor, 0),
      wire('q0-to-xor', q0, 0, xor, 1),
      wire('xor-feedback', xor, 0, q1, 0),
      wire('q1-to-led', q1, 0, led1, 0),
      wire('q0-to-led', q0, 0, led0, 0),
    ]);
    let state = resetProjectRuntime(fixture);
    assert.equal(getComponent(state, 'clock').state?.clockTicks, 0);
    state = simulate(state);
    state = simulate(state, true);

    const result = simulateCircuit(state);
    assert.ok(!result.errors.some((error) => error.type === 'invalid_connection'));
    assert.ok(!result.errors.some((error) => error.type === 'oscillation'));
    for (const entry of result.components) {
      for (const pin of [...entry.inputs, ...entry.outputs]) {
        assert.ok([0, 1, 'X', 'Z'].includes(pin.value));
      }
    }
  });

  it('runs the supplied 2-bit D flip-flop ripple counter from its documented initial state', () => {
    const counter = ADVANCED_CIRCUITS.find((circuit) => circuit.id === 'd-ff-2bit-ripple-counter');
    assert.ok(counter);
    let state = resetProjectRuntime(counter.project);
    assert.equal(getComponent(state, 'ff0').state?.internalQ, 0);
    assert.equal(getComponent(state, 'ff1').state?.internalQ, 0);

    state = simulate(state);
    assert.ok(!state.wires.filter((wire) => ['w_fb0', 'w_rip', 'w_fb1'].includes(wire.id))
      .some((wire) => wire.value === 'X'));

    const observedCounts = new Set<string>();
    for (let tick = 0; tick < 12; tick++) {
      state = simulate(state, true);
      const q0 = getComponent(state, 'ff0').state?.internalQ;
      const q1 = getComponent(state, 'ff1').state?.internalQ;
      assert.ok((q0 === 0 || q0 === 1) && (q1 === 0 || q1 === 1));
      observedCounts.add(`${q1}${q0}`);
    }
    assert.deepEqual([...observedCounts].sort(), ['00', '01', '10', '11']);
  });

  it('runs the supplied 4-bit D flip-flop ripple counter with known feedback signals', () => {
    const counter = ADVANCED_CIRCUITS.find((circuit) => circuit.id === 'd-ff-4bit-ripple-counter');
    assert.ok(counter);
    let state = resetProjectRuntime(counter.project);
    state = simulate(state);

    for (const id of ['ff0', 'ff1', 'ff2', 'ff3']) {
      assert.equal(getComponent(state, id).state?.internalQ, 0);
    }
    assert.ok(!state.wires.filter((wire) => wire.id.startsWith('w_fb') || wire.id.startsWith('w_rip'))
      .some((wire) => wire.value === 'X'));

    const observedStates = new Set<string>();
    for (let tick = 0; tick < 32; tick++) {
      state = simulate(state, true);
      for (const id of ['ff0', 'ff1', 'ff2', 'ff3']) {
        const q = getComponent(state, id).state?.internalQ;
        assert.ok(q === 0 || q === 1, `${id} should retain a known state`);
      }
      observedStates.add(['ff3', 'ff2', 'ff1', 'ff0']
        .map((id) => getComponent(state, id).state?.internalQ)
        .join(''));
    }
    const outputBits = ['ff3', 'ff2', 'ff1', 'ff0']
      .map((id) => getComponent(state, id).state?.internalQ)
      .join('');
    assert.notEqual(outputBits, 'XXXX');
    assert.ok(observedStates.size >= 4, 'the counter should advance through multiple binary states');
  });

  it('reports invalid dangling wires instead of evaluating them', () => {
    const output = component('output', 'CONST_HIGH');
    const target = component('target', 'LED');
    const invalid = { ...wire('invalid', output, 0, target, 0), toComponentId: 'deleted-component' };
    const result = simulateCircuit(resetProjectRuntime(project([output, target], [invalid])));

    assert.equal(result.wires[0].error, true);
    assert.ok(result.errors.some((error) => error.type === 'invalid_connection'));
  });

  it('marks conflicting drivers as errors while preserving the resolved X input', () => {
    const low = component('low', 'CONST_LOW');
    const high = component('high', 'CONST_HIGH');
    const gate = component('gate', 'AND');
    const result = simulateCircuit(resetProjectRuntime(project(
      [low, high, gate],
      [wire('low-driver', low, 0, gate, 0), wire('high-driver', high, 0, gate, 0)]
    )));

    assert.equal(result.components.find((entry) => entry.id === 'gate')?.inputs[0].value, 'X');
    assert.equal(result.wires[0].error, true);
    assert.equal(result.wires[1].error, true);
    assert.ok(result.errors.some((error) => error.type === 'contention'));
  });

  it('generates edge-aware next-state tables for supported sequential components', () => {
    const dff = generateSequentialTruthTable('D_FLIP_FLOP');
    assert.ok(dff);
    const heldHighClock = dff.rows.find((row) =>
      row.inputs.CLK === 'No edge' && row.inputs.D === '1' && row.currentQ === '0'
    );
    const risingEdge = dff.rows.find((row) =>
      row.inputs.CLK === 'Rising edge' && row.inputs.D === '1' && row.currentQ === '0'
    );
    const unknownD = dff.rows.find((row) =>
      row.inputs.CLK === 'Rising edge' && row.inputs.D === 'X' && row.currentQ === '1'
    );

    assert.equal(heldHighClock?.nextQ, '0');
    assert.equal(risingEdge?.nextQ, '1');
    assert.equal(unknownD?.nextQ, 'X');
    assert.equal(generateSequentialTruthTable('JK_FLIP_FLOP')?.rows.find((row) =>
      row.inputs.CLK === 'Rising edge' && row.inputs.J === '1' && row.inputs.K === '1' && row.currentQ === '1'
    )?.nextQ, '0');
    assert.equal(generateSequentialTruthTable('SR_LATCH')?.rows.find((row) =>
      row.inputs.S === '1' && row.inputs.R === '1' && row.currentQ === '0'
    )?.nextQ, 'X');
    for (const type of [
      'JK_FLIP_FLOP',
      'T_FLIP_FLOP',
      'SR_LATCH',
      'D_LATCH',
      'JK_LATCH',
      'COUNTER_4BIT',
    ] as const) {
      assert.ok(generateSequentialTruthTable(type)?.rows.length);
    }
  });

  it('keeps existing combinational truth-table analysis intact', () => {
    const inputA = component('a', 'SWITCH');
    const inputB = component('b', 'SWITCH');
    const andGate = component('and', 'AND');
    const led = component('led', 'LED');
    const table = generateTruthTable(project(
      [inputA, inputB, andGate, led],
      [
        wire('a-to-and', inputA, 0, andGate, 0),
        wire('b-to-and', inputB, 0, andGate, 1),
        wire('and-to-led', andGate, 0, led, 0),
      ]
    ));

    assert.equal(table?.rows.length, 4);
    assert.deepEqual(table?.rows.map((row) => row.outputs.led), [0, 0, 0, 1]);
  });
});
