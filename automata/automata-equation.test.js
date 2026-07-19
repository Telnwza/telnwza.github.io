const test = require("node:test");
const assert = require("node:assert/strict");

const {
  EPSILON,
  compareLanguages,
  determinizeNfa,
  layoutAutomaton,
  mergeParallelTransitions,
  minimizeDfa,
  parseTransitionEquations,
  regexToMinimalDfa,
  regexToNfa,
  regexToPositionNfa,
} = require("./automata-equation.js");

function runDfa(model, input) {
  const transitions = new Map(
    model.transitions.map(({ from, to, label }) => [`${from}\u0000${label}`, to]),
  );
  let state = model.initial;
  for (const symbol of input) {
    state = transitions.get(`${state}\u0000${symbol}`);
    if (state === undefined) return false;
  }
  return model.finals.includes(state);
}

function runNfa(model, input) {
  const transitions = new Map();
  model.transitions.forEach(({ from, to, label }) => {
    const key = `${from}\u0000${label}`;
    if (!transitions.has(key)) transitions.set(key, []);
    transitions.get(key).push(to);
  });
  function closure(inputStates) {
    const stack = [...inputStates];
    const seen = new Set(inputStates);
    while (stack.length) {
      const state = stack.pop();
      (transitions.get(`${state}\u0000${EPSILON}`) || []).forEach((to) => {
        if (!seen.has(to)) {
          seen.add(to);
          stack.push(to);
        }
      });
    }
    return seen;
  }
  let current = closure([model.initial]);
  for (const symbol of input) {
    const next = new Set();
    current.forEach((state) => {
      (transitions.get(`${state}\u0000${symbol}`) || []).forEach((to) => next.add(to));
    });
    current = closure(next);
  }
  return [...current].some((state) => model.finals.includes(state));
}

function stringsUpTo(alphabet, maxLength) {
  const output = [""];
  let level = [""];
  for (let length = 1; length <= maxLength; length += 1) {
    const next = [];
    level.forEach((prefix) => {
      alphabet.forEach((symbol) => next.push(prefix + symbol));
    });
    output.push(...next);
    level = next;
  }
  return output;
}

test("converts a regular expression to a Thompson epsilon-NFA", () => {
  const model = regexToNfa("(0|1)*01");

  assert.equal(model.type, "NFA");
  assert.deepEqual(model.alphabet, ["0", "1"]);
  assert.ok(model.states.length > 2);
  assert.ok(model.transitions.some((transition) => transition.label === EPSILON));
  assert.equal(model.finals.length, 1);
  assert.notEqual(model.initial, model.finals[0]);
});

test("supports plus, optional, escaped operators, and legacy epsilon", () => {
  const model = regexToNfa("(a+|ε)\\?");

  assert.deepEqual(model.alphabet, ["a", "?"]);
  assert.ok(model.transitions.some((transition) => transition.label === EPSILON));
});

test("supports classroom braces, comma union, explicit dots, and implicit concatenation", () => {
  const classroom = regexToNfa("{a,b.a*.{a,b}.a}*");
  const legacy = regexToNfa("(a*|ba*(a|b)a)*");
  const explicit = regexToNfa("a.b");
  const implicit = regexToNfa("ab");

  assert.equal(compareLanguages(classroom, legacy).equivalent, true);
  assert.equal(compareLanguages(explicit, implicit).equivalent, true);
  assert.deepEqual(classroom.alphabet, ["a", "b"]);
});

test("supports U and union-symbol aliases while allowing an escaped literal U", () => {
  const expected = regexToNfa("{0,10}*|1");
  const asciiUnion = regexToNfa("{0,10}* U {1}");
  const symbolUnion = regexToNfa("{0,10}* ∪ {1}");
  const literalU = regexToNfa("\\U");

  assert.equal(compareLanguages(asciiUnion, expected).equivalent, true);
  assert.equal(compareLanguages(symbolUnion, expected).equivalent, true);
  assert.deepEqual(asciiUnion.alphabet, ["0", "1"]);
  assert.deepEqual(literalU.alphabet, ["U"]);
});

test("supports fixed non-negative exponents on symbols and groups", () => {
  const symbolPower = regexToNfa("a^5");
  const groupPower = regexToNfa("{ab}^3");
  const zeroPower = regexToNfa("a^0");

  assert.equal(compareLanguages(symbolPower, regexToNfa("aaaaa")).equivalent, true);
  assert.equal(compareLanguages(groupPower, regexToNfa("ababab")).equivalent, true);
  assert.equal(runNfa(zeroPower, ""), true);
  assert.deepEqual(zeroPower.alphabet, []);
  assert.throws(() => regexToNfa("a^m"), /เลขยกกำลัง/);
  assert.throws(() => regexToNfa("a^41"), /สูงสุด 40/);
});

test("accepts lambda spellings for the empty word", () => {
  ["λ", "lambda", "lamda", "ε", "epsilon", "eps"].forEach((expression) => {
    const model = regexToPositionNfa(expression);
    assert.equal(runNfa(model, ""), true, expression);
    assert.deepEqual(model.alphabet, [], expression);
  });
});

test("creates the three-state minimal DFA for binary strings ending in 01", () => {
  const model = regexToMinimalDfa("(0|1)*01");

  assert.equal(model.type, "DFA");
  assert.equal(model.states.length, 3);
  assert.equal(model.optimization.thompsonStates, 12);
  assert.ok(model.optimization.subsetStates >= model.states.length);
  assert.equal(model.optimization.minimizedStates, 3);
  assert.equal(model.transitions.length, 6);

  const samples = new Map([
    ["", false],
    ["01", true],
    ["101", true],
    ["0101", true],
    ["010", false],
    ["11", false],
  ]);
  samples.forEach((accepted, input) => assert.equal(runDfa(model, input), accepted, input));
});

test("creates a compact epsilon-free position NFA", () => {
  const model = regexToPositionNfa("(0|1)*01");

  assert.equal(model.type, "NFA");
  assert.equal(model.states.length, 5);
  assert.equal(model.transitions.some(({ label }) => label === EPSILON), false);
  assert.equal(runNfa(model, "01"), true);
  assert.equal(runNfa(model, "1101"), true);
  assert.equal(runNfa(model, "010"), false);
});

test("position NFA accepts epsilon when the regex is nullable", () => {
  const epsilon = regexToPositionNfa("ε");
  const optional = regexToPositionNfa("a?");

  assert.deepEqual(epsilon.states, ["q0"]);
  assert.deepEqual(epsilon.finals, ["q0"]);
  assert.equal(runNfa(optional, ""), true);
  assert.equal(runNfa(optional, "a"), true);
  assert.equal(runNfa(optional, "aa"), false);
});

test("minimizes star and epsilon expressions to one state", () => {
  const star = regexToMinimalDfa("a*");
  const epsilon = regexToMinimalDfa("ε");

  assert.equal(star.states.length, 1);
  assert.equal(star.finals.length, 1);
  assert.equal(runDfa(star, ""), true);
  assert.equal(runDfa(star, "aaaa"), true);
  assert.equal(epsilon.states.length, 1);
  assert.equal(runDfa(epsilon, ""), true);
});

test("adds and preserves the required dead state in a complete minimal DFA", () => {
  const model = regexToMinimalDfa("a|b");

  assert.equal(model.states.length, 3);
  assert.equal(model.transitions.length, 6);
  assert.equal(runDfa(model, "a"), true);
  assert.equal(runDfa(model, "b"), true);
  assert.equal(runDfa(model, "aa"), false);
});

test("determinizes and minimizes a transition model independently", () => {
  const nfa = regexToNfa("(a|b)*a");
  const dfa = determinizeNfa(nfa);
  const minimized = minimizeDfa(dfa);

  assert.equal(dfa.type, "DFA");
  assert.equal(minimized.states.length, 2);
  assert.equal(runDfa(minimized, "bba"), true);
  assert.equal(runDfa(minimized, "bbb"), false);
});

test("minimal DFAs preserve the Thompson NFA language", () => {
  ["(0|1)*01", "(a|b)+", "a?b*", "(ab|ba)*"].forEach((expression) => {
    const nfa = regexToNfa(expression);
    const minimal = regexToMinimalDfa(expression);
    stringsUpTo(nfa.alphabet, 4).forEach((input) => {
      assert.equal(
        runDfa(minimal, input),
        runNfa(nfa, input),
        `${expression} on ${input || "ε"}`,
      );
    });
  });
});

test("position NFAs preserve the Thompson NFA language", () => {
  ["(0|1)*01", "(a|b)+", "a?b*", "(ab|ba)*", "ε|ab"].forEach((expression) => {
    const thompson = regexToNfa(expression);
    const position = regexToPositionNfa(expression);
    stringsUpTo(thompson.alphabet, 4).forEach((input) => {
      assert.equal(
        runNfa(position, input),
        runNfa(thompson, input),
        `${expression} on ${input || "ε"}`,
      );
    });
  });
});

test("proves an NFA and equivalent regex recognize the same language", () => {
  const drawnNfa = regexToPositionNfa("(0|1)*01");
  const regexModel = regexToNfa("(0|1)*01");
  const result = compareLanguages(drawnNfa, regexModel);

  assert.equal(result.equivalent, true);
  assert.equal(result.counterexample, null);
  assert.deepEqual(result.alphabet, ["0", "1"]);
});

test("returns the shortest counterexample when languages differ", () => {
  const ends01 = regexToPositionNfa("(0|1)*01");
  const ends0 = regexToPositionNfa("(0|1)*0");
  const result = compareLanguages(ends01, ends0);

  assert.equal(result.equivalent, false);
  assert.equal(result.counterexample, "0");
  assert.equal(result.leftAccepted, false);
  assert.equal(result.rightAccepted, true);
});

test("uses epsilon as the counterexample when initial acceptance differs", () => {
  const acceptsEpsilon = regexToPositionNfa("a*");
  const requiresA = regexToPositionNfa("a+");
  const result = compareLanguages(acceptsEpsilon, requiresA);

  assert.equal(result.equivalent, false);
  assert.equal(result.counterexample, "");
  assert.equal(result.leftAccepted, true);
  assert.equal(result.rightAccepted, false);
});

test("compares over the union alphabet and expands grouped labels", () => {
  const groupedDfa = {
    type: "DFA",
    alphabet: ["a", "b"],
    states: ["q0"],
    initial: "q0",
    finals: ["q0"],
    transitions: [{ from: "q0", to: "q0", label: "a,b" }],
  };
  const equivalentRegex = regexToNfa("(a|b)*");
  const differentAlphabet = regexToNfa("a*");

  assert.equal(compareLanguages(groupedDfa, equivalentRegex).equivalent, true);
  const mismatch = compareLanguages(groupedDfa, differentAlphabet);
  assert.equal(mismatch.equivalent, false);
  assert.equal(mismatch.counterexample, "b");
});

test("reports an unmatched parenthesis with a useful column", () => {
  assert.throws(
    () => regexToNfa("(ab"),
    (error) => error.name === "EquationSyntaxError" && error.column === 1,
  );
});

test("uses comma as union but still rejects an escaped literal comma", () => {
  assert.equal(compareLanguages(regexToNfa("a,b"), regexToNfa("a|b")).equivalent, true);
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
