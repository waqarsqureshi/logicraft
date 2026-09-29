/**
 * Educational Interactive Tutorials and Labs
 */

import { CircuitProject } from '../types/circuit';

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  detail: string;
  hint?: string;
  expectedCondition?: (project: CircuitProject, simState: any) => boolean;
  actionRequired?: string;
}

export interface TutorialLesson {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Transistors & Physics' | 'Combinational Logic' | 'Arithmetic' | 'Sequential';
  estimatedMinutes: number;
  summary: string;
  initialProject?: CircuitProject;
  openTransistorViewOnStart?: boolean;
  transistorGateType?: 'AND' | 'NOT' | 'NAND' | 'OR';
  steps: TutorialStep[];
  conclusion: string;
}

export const TUTORIALS: TutorialLesson[] = [
  {
    id: 'transistor-to-logic-gate',
    title: 'From Transistor to Logic Gate',
    difficulty: 'Beginner',
    category: 'Transistors & Physics',
    estimatedMinutes: 5,
    summary:
      'Discover how microscopic CMOS transistors act as electrical switches to compute the Boolean AND function using 0V and 5V voltages.',
    openTransistorViewOnStart: true,
    transistorGateType: 'AND',
    steps: [
      {
        id: 'step1',
        title: '1. Set Both Inputs to 0V (LOW)',
        instruction: 'Ensure both Input A and Input B are set to 0 V (Logic 0).',
        detail:
          'Observe the transistor switches: When Gate voltage is 0V, the upper PMOS transistors (Q1 and Q2) are ON (conducting current), while the lower NMOS transistors (Q3 and Q4) are OFF.',
        hint: 'Use the toggle switch for Input A and B in the Transistor Electronics panel to set them to 0V.',
      },
      {
        id: 'step2',
        title: '2. Measure Output Voltage',
        instruction: 'Inspect the Output terminal voltage using the Multimeter probe.',
        detail:
          'Because the NAND node is charged to +5V through PMOS Q1/Q2, the subsequent Inverter pulls the final Output OUT down to Ground (0.00 V). Thus, 0 AND 0 = 0.',
        hint: 'Click the Multimeter probe on the OUT terminal or check the Output display.',
      },
      {
        id: 'step3',
        title: '3. Set Input A to 5V (HIGH)',
        instruction: 'Flip Input A to 5 V (Logic 1) while keeping Input B at 0 V.',
        detail:
          'Notice what changed: PMOS Q1 turned OFF, and NMOS Q3 turned ON. However, the path to Ground is still blocked because NMOS Q4 remains OFF! The output remains at 0.00 V.',
        hint: 'Toggle Input A to 5V.',
      },
      {
        id: 'step4',
        title: '4. Set Both Inputs to 5V (HIGH)',
        instruction: 'Now flip Input B to 5 V as well (both A = 5V and B = 5V).',
        detail:
          'Electrons now have an uninterrupted path through both series NMOS transistors (Q3 and Q4) to Ground (0V). The intermediate node drops to 0V, turning Inverter PMOS Q5 ON and pulling the Output OUT to 5.00 V (Logic 1)!',
        hint: 'Toggle both switches to 5V.',
      },
      {
        id: 'step5',
        title: '5. Compare with the AND Truth Table',
        instruction: 'Look at the highlighted row in the Truth Table table below.',
        detail:
          'Notice how the physical voltage conduction rules correspond 1:1 with the mathematical Boolean AND truth table: only 1 AND 1 produces 1.',
        hint: 'Review the truth table rows on the right side of the screen.',
      },
    ],
    conclusion:
      'What did you discover? A digital logic gate is an abstraction constructed from physical electronic switching devices. The Boolean values 0 and 1 correspond directly to measurable ranges of electrical voltage (0V and 5V)!',
  },

  {
    id: 'intro-basic-gates',
    title: 'Intro to Basic Logic Gates',
    difficulty: 'Beginner',
    category: 'Combinational Logic',
    estimatedMinutes: 6,
    summary:
      'Learn how fundamental gates (AND, OR, NOT, XOR) transform digital signals using switches and LEDs on the canvas.',
    steps: [
      {
        id: 'step1',
        title: '1. Place an AND Gate and Toggle Switch',
        instruction: 'Drag an AND gate from the component library onto the canvas, along with two Switches.',
        detail: 'Connect each switch output to an input pin on the AND gate.',
        hint: 'Click or drag components from the left sidebar onto the canvas.',
      },
      {
        id: 'step2',
        title: '2. Connect an LED Indicator',
        instruction: 'Place an LED indicator and wire the AND gate output to the LED input pin.',
        detail: 'The LED will glow brightly whenever the wire carries a HIGH (5V) logic state.',
        hint: 'Click the output pin of the AND gate, then click the input pin of the LED to draw a wire.',
      },
      {
        id: 'step3',
        title: '3. Test the Truth Table Live',
        instruction: 'Click the switches to test all 4 combinations (00, 01, 10, 11).',
        detail: 'Verify that the LED only turns ON when both switches are active.',
        hint: 'Click directly on a Toggle Switch on the canvas to flip its state.',
      },
    ],
    conclusion:
      'Excellent! You have built your first live interactive digital logic circuit. Wires illuminate with high-voltage glowing signals in real time.',
  },

  {
    id: 'half-adder-arithmetic',
    title: 'Building a 1-Bit Binary Half Adder',
    difficulty: 'Intermediate',
    category: 'Arithmetic',
    estimatedMinutes: 8,
    summary:
      'Computers do math using logic gates. Learn how an XOR gate and an AND gate form a binary Half Adder capable of adding 1 + 1.',
    steps: [
      {
        id: 'step1',
        title: '1. The Math of Binary Addition',
        instruction: 'Recall binary addition rules: 0+0=0, 0+1=1, 1+0=1, 1+1 = 10 (Sum=0, Carry=1).',
        detail: 'The Sum bit behaves exactly like an XOR gate (1 when inputs differ), and the Carry bit behaves like an AND gate (1 only when both are 1).',
      },
      {
        id: 'step2',
        title: '2. Wire Inputs to XOR and AND Gates',
        instruction: 'Place two Switches (A and B). Connect both A and B to an XOR gate, and also connect both A and B to an AND gate.',
        detail: 'The output of the XOR gate is your SUM bit; the output of the AND gate is your CARRY bit.',
      },
      {
        id: 'step3',
        title: '3. Verify with Probe or LEDs',
        instruction: 'Connect two LEDs labeled "SUM" and "CARRY" to test 1 + 1 = 2 (Sum 0, Carry 1).',
        detail: 'When both switches are ON, the Carry LED lights up and the Sum LED is OFF, showing binary 10 (decimal 2).',
      },
    ],
    conclusion:
      'Congratulations! You have constructed an arithmetic logic unit (ALU) building block that powers modern microprocessors.',
  },

  {
    id: 'sr-latch-memory',
    title: 'Memory from Gates: The SR Latch',
    difficulty: 'Advanced',
    category: 'Sequential',
    estimatedMinutes: 10,
    summary:
      'How does computer RAM remember data? Explore cross-coupled feedback loops that store a bit indefinitely.',
    steps: [
      {
        id: 'step1',
        title: '1. Feedback Loops in Electronics',
        instruction: 'Place an SR Latch or cross-couple two NOR gates.',
        detail: 'In sequential circuits, the output of a gate is fed back into an earlier gate. This feedback loop creates a stable memory state.',
      },
      {
        id: 'step2',
        title: '2. Set (S = 1, R = 0)',
        instruction: 'Pulse the Set switch (S=1, R=0) and observe Output Q turn HIGH.',
        detail: 'Then turn S back to 0. Notice that Q remains HIGH! The circuit has "remembered" that Set was pressed.',
      },
      {
        id: 'step3',
        title: '3. Reset (S = 0, R = 1)',
        instruction: 'Now pulse the Reset switch (R=1). Observe Q drop to 0 and Q̄ jump to 1.',
        detail: 'Turn R back to 0. Q stays at 0! You have stored a 0 bit into memory.',
      },
    ],
    conclusion:
      'You have mastered sequential memory circuits! All computer registers and static RAM (SRAM) caches rely on this feedback principle.',
  },
];
