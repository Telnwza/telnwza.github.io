# Tested circuit patterns

Use these files as starting points, then validate the changed circuit. Every example is a complete file. File names are relative to this reference. The repository regression suite checks structure and uses GHDL to simulate the behavior listed below when GHDL is available.

| Example | Inputs and expected behavior | Design point |
|---|---|---|
| [Half adder](../assets/half-adder.sch.txt) | a,b: 00→sum=0 carry=0; 01/10→1,0; 11→0,1 | `XOR`/`AND` use i0,i1,o; fan-out needs no junction declaration |
| [MUX byte](../assets/mux-demo.sch.txt) | sel=0→a; sel=1→b, all 8 bits | width is the data width; s0 stays 1 bit |
| [DFF with reset](../assets/dff-reset.sch.txt) | rst=1 clears q asynchronously; otherwise rising clk captures d | `reset=true` creates rst; reset is active high; q is unknown before reset/capture |
| [Enabled counter](../assets/counter2.sch.txt) | rst clears; en=1 counts 0→1→2→3→0, en=0 holds | Both DFFs share clk; XOR computes next bits; AND computes carry; merge bit 0 is LSB |
| [Split nibble](../assets/split-nibble.sch.txt) | data=0xA5→upper=0xA | bit=4 nbit=4 selects bits 7:4 |
| [Merge nibbles](../assets/merge-nibbles.sch.txt) | hi=0xA lo=0x5→result=0xA5 | Merge taps drive disjoint ranges of the same destination |
| [Reuse MUX](../assets/reuse-mux.sch.txt) | Import mux-demo first; sel=0→a, sel=1→c | Two instances share mux_demo; use current catalog signature in real projects |

## Planning sequential circuits

Specify clock edge, reset polarity and timing, enable behavior, and overflow before wiring. Studio flip-flops are single-bit: build an N-bit register from N flip-flops or reuse an existing register subcircuit. `part r DFF width=8` is invalid. Do not implement enable by AND-gating clk; compute a held next-state value or use a MUX before d. In counter2, bit 1 toggles only when en AND bit 0 is high. Wrap at 3 is intentional; there is no carry-out port.

For an FSM, write the state encoding and transition/output table first, then implement next-state equations feeding DFFs on the same clock. No `FSM`, `REGISTER`, `COUNTER`, `ADD` or `ADDER` built-in exists in this version: compose supported gates or use an actual supplied subcircuit. Unused encodings need a deliberate transition policy. Do not substitute a combinational feedback loop for state storage.

## Reusing project-specific blocks

1. User copies Tools → Copy Circuit Info for AI, selecting the needed block.
2. Preserve its exact `use "SCH:..." as alias signature "..."` declaration, adapting only alias.
3. Add multiple `part u1 @alias` instances and connect actual pin names.
4. Validate against that same project export or in that project in Studio.

The reusable MUX example uses a readable name because mux-demo is supplied. Do not copy its name or a documentation SCH ID as though it existed in another user's project. For an adder block, confirm signedness, carry/overflow and latency before chaining it; identical ports do not establish those properties.
