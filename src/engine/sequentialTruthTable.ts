import { GateType } from '../types/circuit';

export interface SequentialTruthRow {
  inputs: Record<string, string>;
  currentQ: string;
  nextQ: string;
}

export interface SequentialTruthTable {
  headers: string[];
  description: string;
  rows: SequentialTruthRow[];
}

const BOOLEAN_VALUES = ['0', '1', 'X'];
const CLOCK_EVENTS = ['No edge', 'Rising edge'];
const CURRENT_STATES = ['0', '1', 'X'];
const COUNTER_STATES = Array.from({ length: 16 }, (_, value) => value.toString(2).padStart(4, '0'));

function qBar(value: string): string {
  return value === '0' ? '1' : value === '1' ? '0' : 'X';
}

export function generateSequentialTruthTable(type: GateType): SequentialTruthTable | null {
  const rows: SequentialTruthRow[] = [];
  const add = (inputs: Record<string, string>, currentQ: string, nextQ: string) => {
    rows.push({ inputs, currentQ, nextQ });
  };

  switch (type) {
    case 'D_FLIP_FLOP':
      for (const clock of CLOCK_EVENTS) {
        for (const d of BOOLEAN_VALUES) {
          for (const q of CURRENT_STATES) {
            add({ CLK: clock, D: d }, q, clock === 'Rising edge' ? d : q);
          }
        }
      }
      return {
        headers: ['CLK event', 'D', 'Q (current)', 'Q (next)'],
        description: 'A positive-edge-triggered D flip-flop captures D on a LOW-to-HIGH transition. A static HIGH or LOW level is not a new edge; without an edge, Q holds. X remains unknown.',
        rows,
      };
    case 'JK_FLIP_FLOP':
      for (const clock of CLOCK_EVENTS) {
        for (const j of BOOLEAN_VALUES) {
          for (const k of BOOLEAN_VALUES) {
            for (const q of CURRENT_STATES) {
              let nextQ = q;
              if (clock === 'Rising edge') {
                if (j === '0' && k === '1') nextQ = '0';
                else if (j === '1' && k === '0') nextQ = '1';
                else if (j === '1' && k === '1') nextQ = qBar(q);
                else if (j !== '0' || k !== '0') nextQ = 'X';
              }
              add({ CLK: clock, J: j, K: k }, q, nextQ);
            }
          }
        }
      }
      return {
        headers: ['CLK event', 'J', 'K', 'Q (current)', 'Q (next)'],
        description: 'On a rising edge, J=0/K=0 holds, J=0/K=1 resets, J=1/K=0 sets, and J=1/K=1 toggles. Unknown control values produce X when the edge requires them; otherwise Q holds.',
        rows,
      };
    case 'T_FLIP_FLOP':
      for (const clock of CLOCK_EVENTS) {
        for (const t of BOOLEAN_VALUES) {
          for (const q of CURRENT_STATES) {
            const nextQ = clock !== 'Rising edge' || t === '0'
              ? q
              : t === '1' ? qBar(q) : 'X';
            add({ CLK: clock, T: t }, q, nextQ);
          }
        }
      }
      return {
        headers: ['CLK event', 'T', 'Q (current)', 'Q (next)'],
        description: 'On a rising edge, T=0 holds and T=1 toggles. Without a rising edge, Q holds. An unknown T at the edge produces X.',
        rows,
      };
    case 'SR_LATCH':
      for (const s of BOOLEAN_VALUES) {
        for (const r of BOOLEAN_VALUES) {
          for (const q of CURRENT_STATES) {
            const nextQ = s === '1' && r === '0' ? '1'
              : s === '0' && r === '1' ? '0'
                : s === '0' && r === '0' ? q : 'X';
            add({ S: s, R: r }, q, nextQ);
          }
        }
      }
      return {
        headers: ['S', 'R', 'Q (current)', 'Q (next)'],
        description: 'This component is an active-high SR latch: S=1 sets, R=1 resets, and S=R=0 holds. S=R=1 is the forbidden condition and resolves to X.',
        rows,
      };
    case 'D_LATCH':
      for (const en of BOOLEAN_VALUES) {
        for (const d of BOOLEAN_VALUES) {
          for (const q of CURRENT_STATES) {
            const nextQ = en === '1' ? d : en === '0' ? q : 'X';
            add({ EN: en, D: d }, q, nextQ);
          }
        }
      }
      return {
        headers: ['EN', 'D', 'Q (current)', 'Q (next)'],
        description: 'When EN=1, the latch is transparent and Q follows D. When EN=0, Q holds. An unknown enable produces X.',
        rows,
      };
    case 'JK_LATCH':
      for (const en of BOOLEAN_VALUES) {
        for (const j of BOOLEAN_VALUES) {
          for (const k of BOOLEAN_VALUES) {
            for (const q of CURRENT_STATES) {
              let nextQ = q;
              if (en === '1') {
                if (j === '0' && k === '1') nextQ = '0';
                else if (j === '1' && k === '0') nextQ = '1';
                else if (j === '1' && k === '1') nextQ = qBar(q);
                else if (j !== '0' || k !== '0') nextQ = 'X';
              } else if (en !== '0') {
                nextQ = 'X';
              }
              add({ EN: en, J: j, K: k }, q, nextQ);
            }
          }
        }
      }
      return {
        headers: ['EN', 'J', 'K', 'Q (current)', 'Q (next)'],
        description: 'This level-sensitive JK latch follows the simulator behavior: with EN=1, J/K=00 holds, 01 resets, 10 sets, and 11 toggles. EN=0 holds; unknown control conditions resolve to X.',
        rows,
      };
    case 'COUNTER_4BIT':
      for (const clock of CLOCK_EVENTS) {
        for (const reset of ['0', '1']) {
          for (const q of COUNTER_STATES) {
            const next = reset === '1'
              ? 0
              : clock === 'Rising edge'
                ? (parseInt(q, 2) + 1) & 0xf
                : parseInt(q, 2);
            add({ CLK: clock, RST: reset }, q, next.toString(2).padStart(4, '0'));
          }
        }
      }
      return {
        headers: ['CLK event', 'RST', 'Q (current)', 'Q (next)'],
        description: 'The counter resets to 0000 while RST=1. Otherwise it increments on a rising clock edge and holds between edges. The simulator counter state is a four-bit known value.',
        rows,
      };
    default:
      return null;
  }
}
