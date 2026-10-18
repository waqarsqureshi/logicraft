# D Flip-Flop Sequential Circuits & Orthogonal Wire Cornering

Comprehensive implementation plan to verify and ensure the 2-bit counter functions correctly without clock-edge race conditions, implement both Synchronous and Asynchronous (Ripple) 2-bit & 4-bit counters using D flip-flops with Q-bar feedback, add dedicated 4-bit Parallel-to-Serial (PISO) and Serial-to-Parallel (SIPO) shift registers, enable interactive square-corner wire routing (making 90° bends on mouse click), and wire all examples with real-time LEDs, binary probes, and 7-segment displays.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences from Turn 1 clarifying questions have been incorporated into this plan:
> - **Both Counter Implementations**: We will provide both **Asynchronous Ripple Counters** (clocked by previous stage $\bar{Q}$) and **Synchronous Binary Counters** (common clock with combinational logic) for both 2-bit and 4-bit configurations.
> - **$\bar{Q}$ Feedback with Square Corners**: Wires will route backwards from $\bar{Q}$ to $D$ with clean 90-degree square corners, and the canvas wire tool will allow users to click anywhere on the canvas to place square corners/bend points while drawing wires.
> - **Separate Shift Register Examples**: Dedicated, distinct templates for **4-Bit PISO (Parallel-In Serial-Out)** and **4-Bit SIPO (Serial-In Parallel-Out)** using D flip-flops.
> - **Full Educational Instrumentation**: Every sequential circuit example will feature individual color-coded logic LEDs, real-time binary state probes, and active 7-segment decimal/hex displays.

---

### 1. Overview & Core Concept

- **What It Does**: 
  1. Fixes sequential simulation timing: prevents clock-edge race-through conditions across cascaded flip-flops (shift registers and synchronous counters) by latching prior-state inputs during edge triggers.
  2. Implements interactive square-corner (orthogonal) wire routing on the canvas: while dragging/drafting a wire, clicking empty canvas space creates a 90° orthogonal waypoint (corner) so wires cleanly loop around components (like $\bar{Q}$ to $D$) without diagonal clutter.
  3. Adds 4 complete, pre-wired educational sequential circuit templates to the Example Circuits library:
     - **2-Bit & 4-Bit D Flip-Flop Ripple Counters** (Asynchronous, using $\bar{Q}$ clock cascading).
     - **2-Bit & 4-Bit D Flip-Flop Synchronous Counters** (Parallel clock with XOR/AND steering logic).
     - **4-Bit SIPO (Serial-In, Parallel-Out) Shift Register** with data injection switch and parallel output probes.
     - **4-Bit PISO (Parallel-In, Serial-Out) Shift Register** with 2:1 MUX load/shift control and serial output line.

- **Target Audience / Educational Persona**: 
  Computer science and electrical engineering students (such as University of Galway CT101 Computing Systems) learning digital logic fundamentals, sequential state machines, clock timing, and register architectures.

- **Key Value**: 
  Transforms abstract textbook circuit diagrams of flip-flop counters and shift registers into clear, interactive, real-time operational simulations with clean schematics and zero wire clutter.

---

### 2. User Experience & Visual Design

- **Canvas Wire Routing with Square Corners**:
  - When starting a wire from any pin (Input or Output), the cursor shows an active wire trace.
  - Clicking on the canvas creates an orthogonal corner waypoint (snapped to the 20px grid).
  - Pressing mouse / tapping adds intermediate bend points so users can guide a wire around the flip-flop body (from $\bar{Q}$ on the right, up, across, and down into $D$ on the left).
  - Clicking the target pin locks the wire with its square corners saved in `wire.waypoints`.
  - Right-clicking or pressing `Escape` cancels or undos the last waypoint.

- **Visual Theme & Aesthetics** (in accordance with `frontend-design` & educational simulation guidelines):
  - Canvas remains high-contrast, clean slate dark background (`#0B1120`) with 20px dot grid (`#1E293B`).
  - Active high signals glow in vibrant emerald (`#16A34A` / `#22C55E`), inactive in slate (`#475569`), floating in amber (`#D97706`), contention in crimson (`#E11D48`).
  - Sequential components (D Flip-Flops) show crisp clock chevrons ($\triangleright$), active $Q$ and $\bar{Q}$ indicators, and clearly separated terminal pins.
  - 7-Segment and Hex displays render with high-brightness LED phosphor styling (`#EF4444` ruby or `#0284C7` azure).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Edge-Triggered Flip-Flop Evaluation Order (Simulation Engine)**
  - *Chosen Approach*: Two-phase clock evaluation. At the instant of a clock transition ($0 \to 1$), all clocked components snapshot their current inputs before any flip-flop updates its outputs. Subsequent multi-pass relaxation settles combinational propagation.
  - *Why*: Eliminates false clock-edge races. In shift registers, a pulse must shift bit 0 to bit 1, bit 1 to bit 2, etc., rather than rushing through all 4 stages in a single cycle.
  - *Alternatives Considered*: Sub-nanosecond discrete event queues with delta cycles (overkill and slows down interactive 60fps canvas rendering).

- **Decision 2: Square Corner Wire Representation**
  - *Chosen Approach*: Support `waypoints: { x: number; y: number }[]` on the `Wire` interface. If waypoints are present, the wire path generator builds orthogonal right-angle Manhattan paths (`M x y L x1 y1 L x2 y2 ...`) with subtle 4px corner fillet radiuses for professional electrical schematic appearance. If no waypoints exist, standard smooth routing is maintained.
  - *Why*: Gives users complete manual control when wanted, while preserving backward compatibility with all existing templates.

- **Decision 3: Template Organization & Accessibility**
  - *Chosen Approach*: Group the new sequential circuits under the existing "Sequential & Memory" and "Counters & Displays" categories in the Top Bar sample picker and sidebar library.
  - *Why*: Zero clutter; instantly discoverable with 1-click loading.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CIRCUIT SIMULATION ENGINE                     │
│                                                                        │
│  [ Clock Generator / Manual Step ] ──► [ Phase 1: Clock Snapshot ]     │
│                                                  │                     │
│                                                  ▼                     │
│  [ D Flip-Flops (D_FLIP_FLOP) ] ◄── Evaluates rising edge on snapshots │
│               │                                                        │
│               ▼                                                        │
│  [ Multi-pass Wire Propagation ] ──► Settles combinational logic       │
│               │                                                        │
│               ▼                                                        │
│  [ Visual Outputs: LEDs, Probes, 7-Segment Hex Displays ]              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CANVAS & WIRE ROUTING                           │
│                                                                        │
│  User Pin Click ──► Draft Wire Active                                  │
│                          │                                             │
│       Canvas Mouse Click ┼──► Appends Waypoint [x, y] (Square Corner)  │
│                          │                                             │
│     Target Pin Click ────┴──► Commits Wire with Orthogonal Path        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Circuit Schematics Planned:

1. **2-Bit D Flip-Flop Ripple Counter**:
   - `FF0`: CLK $\leftarrow$ Clock Generator (1Hz), $D \leftarrow \bar{Q}_0$ (square wire loop).
   - `FF1`: CLK $\leftarrow \bar{Q}_0$, $D \leftarrow \bar{Q}_1$ (square wire loop).
   - Outputs: $Q_0$ (LSB LED + Probe), $Q_1$ (MSB LED + Probe), 2-bit Hex Display.
   - States: $00 \to 01 \to 10 \to 11 \to 00$.

2. **4-Bit D Flip-Flop Ripple Counter**:
   - 4 cascaded D Flip-Flops (`FF0`–`FF3`), each with $\bar{Q}_n \to D_n$ and $\bar{Q}_n \to \text{CLK}_{n+1}$.
   - Full 4-bit bus wired to Hex 7-Segment Display (counts 0 to F hex / 0 to 15 decimal).

3. **2-Bit & 4-Bit D Flip-Flop Synchronous Counters**:
   - Shared common Clock line to all CLK pins simultaneously.
   - `FF0`: $D_0 = \bar{Q}_0$.
   - `FF1`: $D_1 = Q_1 \oplus Q_0$ (XOR gate).
   - `FF2`: $D_2 = Q_2 \oplus (Q_1 \cdot Q_0)$ (XOR + AND gate).
   - `FF3`: $D_3 = Q_3 \oplus (Q_2 \cdot Q_1 \cdot Q_0)$ (XOR + 3-input AND gate).

4. **4-Bit SIPO (Serial-In Parallel-Out) Shift Register**:
   - 4 D Flip-Flops in series: `Data Input Switch` $\to D_0$, $Q_0 \to D_1$, $Q_1 \to D_2$, $Q_2 \to D_3$.
   - Common Clock pulse button / generator.
   - 4 parallel output LEDs & probes displaying the loaded register state.

5. **4-Bit PISO (Parallel-In Serial-Out) Shift Register**:
   - 4 D Flip-Flops with 2:1 Multiplexers (or AND-OR steering) on each $D$ input.
   - `Shift / !Load` control switch:
     - When `Load` (0): 4 parallel input switches ($D_0, D_1, D_2, D_3$) are loaded into the flip-flops.
     - When `Shift` (1): bits shift out serially bit-by-bit on each clock pulse.
   - Serial output LED + oscilloscope probe showing serial bitstream.

---

### Verification & Testing Plan
- Test edge-triggered behavior and verify absence of race conditions on synchronous counters and shift registers.
- Verify 2-bit counter counts $0 \to 1 \to 2 \to 3 \to 0$ without skipping states.
- Test square corner wire drawing by clicking on the canvas during wire drafting.
- Verify full app compilation via `compile_applet`.
