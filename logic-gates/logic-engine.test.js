const test = require("node:test");
const assert = require("node:assert/strict");
const Engine = require("./logic-engine.js");

function node(id, type, label, value = 0, inputCount = 2) {
  return { id, type, label, value, inputCount, x: 0, y: 0 };
}

function wire(id, from, to, port = 0) {
  return { id, from: { node: from, port: "out" }, to: { node: to, port: `in${port}` } };
}

test("evaluates a half adder circuit", () => {
  const project = {
    nodes: [
      node("a", "INPUT", "A"), node("b", "INPUT", "B"),
      node("xor", "XOR", "XOR"), node("and", "AND", "AND"),
      node("sum", "OUTPUT", "Sum", 0, 1), node("carry", "OUTPUT", "Carry", 0, 1),
    ],
    wires: [
      wire("w1", "a", "xor", 0), wire("w2", "b", "xor", 1), wire("w3", "xor", "sum"),
      wire("w4", "a", "and", 0), wire("w5", "b", "and", 1), wire("w6", "and", "carry"),
    ],
  };
  const result = Engine.evaluateCircuit(project, { A: 1, B: 1 });
  assert.equal(result.values.sum, 0);
  assert.equal(result.values.carry, 1);
  assert.equal(result.validation.valid, true);
});

test("builds the expected half adder truth table", () => {
  const project = {
    nodes: [
      node("a", "INPUT", "A"), node("b", "INPUT", "B"),
      node("xor", "XOR", "XOR"), node("sum", "OUTPUT", "Sum", 0, 1),
    ],
    wires: [wire("w1", "a", "xor", 0), wire("w2", "b", "xor", 1), wire("w3", "xor", "sum")],
  };
  const table = Engine.truthTableForCircuit(project);
  assert.deepEqual(table.rows.map((row) => row.outputs[0]), [0, 1, 1, 0]);
});

test("minimizes XOR and respects don't-care rows", () => {
  const xor = Engine.minimizeTruthTable(["A", "B"], ["0", "1", "1", "0"]);
  assert.equal(xor.sop, "A ⊕ B");
  assert.equal(xor.special, "XOR");

  const withDontCare = Engine.minimizeTruthTable(["A", "B"], ["0", "1", "X", "1"]);
  assert.equal(withDontCare.sop, "B");
});

test("parses, evaluates and simplifies Boolean equations", () => {
  const analysis = Engine.analyzeExpression("(A · ¬B) + (¬A · B)");
  assert.deepEqual(analysis.values, ["0", "1", "1", "0"]);
  assert.equal(analysis.minimized.sop, "A ⊕ B");

  const apostrophe = Engine.analyzeExpression("A' * B + A * B'");
  assert.deepEqual(apostrophe.values, analysis.values);
});

test("reports combinational loops", () => {
  const project = {
    nodes: [node("not1", "NOT", "NOT 1", 0, 1), node("not2", "NOT", "NOT 2", 0, 1)],
    wires: [wire("w1", "not1", "not2"), wire("w2", "not2", "not1")],
  };
  const validation = Engine.validateCircuit(project);
  assert.equal(validation.valid, false);
  assert.equal(validation.cyclic, true);
});
