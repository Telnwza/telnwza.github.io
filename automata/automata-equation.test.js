const test = require("node:test");
const assert = require("node:assert/strict");

const {
  EPSILON,
  layoutAutomaton,
  mergeParallelTransitions,
  parseTransitionEquations,
  regexToNfa,
} = require("./automata-equation.js");

test("converts a regular expression to a Thompson epsilon-NFA", () => {
  const model = regexToNfa("(0|1)*01");

  assert.equal(model.type, "NFA");
  assert.deepEqual(model.alphabet, ["0", "1"]);
  assert.ok(model.states.length > 2);
  assert.ok(model.transitions.some((transition) => transition.label === EPSILON));
  assert.equal(model.finals.length, 1);
  assert.notEqual(model.initial, model.finals[0]);
});

test("supports plus, optional, escaped operators, and epsilon", () => {
  const model = regexToNfa("(a+|ε)\\?");

  assert.deepEqual(model.alphabet, ["a", "?"]);
  assert.ok(model.transitions.some((transition) => transition.label === EPSILON));
});

test("reports an unmatched parenthesis with a useful column", () => {
  assert.throws(
    () => regexToNfa("(ab"),
    (error) => error.name === "EquationSyntaxError" && error.column === 1,
  );
});

test("rejects comma because canvas transition labels use it as a separator", () => {
  assert.throws(() => regexToNfa("a,b"), /comma/);
  assert.throws(() => regexToNfa("a\\,b"), /comma/);
});

test("parses DFA transition equations and preserves warnings", () => {
  const model = parseTransitionEquations(`
type: DFA
alphabet: 0,1
start: q0
final: q1

δ(q0,0) = q0
δ(q0,1) = q1
δ(q1,0) = q0
δ(q1,1) = q1
`);

  assert.equal(model.type, "DFA");
  assert.deepEqual(model.states, ["q0", "q1"]);
  assert.deepEqual(model.finals, ["q1"]);
  assert.equal(model.transitions.length, 4);
  assert.deepEqual(model.warnings, []);
});

test("parses NFA sets and epsilon transitions", () => {
  const model = parseTransitionEquations(`
type: NFA
alphabet: 0,1
start: q0
final: q2
δ(q0,0) = {q0,q1}
δ(q1,1) = q2
δ(q2,eps) = q0
`);

  assert.equal(model.transitions.length, 4);
  assert.ok(model.transitions.some((transition) => transition.label === EPSILON));
});

test("rejects nondeterministic DFA equations", () => {
  assert.throws(
    () => parseTransitionEquations(`
type: DFA
alphabet: 0
start: q0
final: q1
δ(q0,0) = {q0,q1}
`),
    /ปลายทางเดียว/,
  );
});

test("rejects multi-character transition symbols used by the character simulator", () => {
  assert.throws(
    () => parseTransitionEquations(`
type: NFA
start: q0
final: q1
δ(q0,ab) = q1
`),
    /อักขระเดียว/,
  );
});

test("merges labels only for parallel transitions", () => {
  const merged = mergeParallelTransitions([
    { from: "q0", to: "q1", label: "0" },
    { from: "q0", to: "q1", label: "1" },
    { from: "q1", to: "q0", label: "0" },
  ]);

  assert.deepEqual(merged, [
    { from: "q0", to: "q1", label: "0,1" },
    { from: "q1", to: "q0", label: "0" },
  ]);
});

test("lays initial state to the left of reachable states", () => {
  const model = parseTransitionEquations(`
type: NFA
start: q0
final: q2
δ(q0,a) = q1
δ(q1,b) = q2
`);
  const positions = layoutAutomaton(model);

  assert.ok(positions.q0.x < positions.q1.x);
  assert.ok(positions.q1.x < positions.q2.x);
});
