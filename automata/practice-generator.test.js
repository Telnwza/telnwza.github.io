const test = require("node:test");
const assert = require("node:assert/strict");
const Equation = require("./automata-equation.js");
const Practice = require("./practice-generator.js");

test("builds large unique catalogs whose expressions compile to DFA and NFA", () => {
  const minimums = { easy: 25, medium: 35, hard: 45 };
  for (const difficulty of Object.keys(minimums)) {
    const catalog = Practice.createCatalog(difficulty);
    assert.ok(catalog.length >= minimums[difficulty], `${difficulty} catalog is too small`);
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    assert.equal(new Set(catalog.map((item) => item.regex || item.set)).size, catalog.length);
    for (const question of catalog) {
      const expression = question.regex || question.set;
      assert.ok(Equation.regexToMinimalDfa(expression).states.length > 0);
      assert.ok(Equation.regexToPositionNfa(expression).states.length > 0);
    }
  }
});

test("draws every question once before starting a new shuffled cycle", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const catalog = Practice.createCatalog(difficulty);
    let state = {};
    const drawn = [];
    for (let index = 0; index < catalog.length; index += 1) {
      const result = Practice.drawQuestion(difficulty, state, () => 0.25);
      drawn.push(result.question.id);
      state = result.state;
    }
    assert.equal(new Set(drawn).size, catalog.length);
    assert.equal(state.remaining.length, 0);

    const next = Practice.drawQuestion(difficulty, state, () => 0.25);
    assert.notEqual(next.question.id, drawn.at(-1));
    assert.equal(next.cycle, 2);
    assert.equal(next.remaining, catalog.length - 1);
  }
});

test("repairs stale or duplicated saved deck entries", () => {
  const catalog = Practice.createCatalog("medium");
  const validId = catalog[0].id;
  const result = Practice.drawQuestion("medium", {
    remaining: ["removed-question", validId, validId],
    lastId: "old-question",
    cycle: 4,
  }, () => 0.5);
  assert.equal(result.question.id, validId);
  assert.deepEqual(result.state.remaining, []);
  assert.equal(result.cycle, 4);
  assert.ok(Practice.drawQuestion("medium", null, () => 0.5).question);
});
