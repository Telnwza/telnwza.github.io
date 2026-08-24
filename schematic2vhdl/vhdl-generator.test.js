const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSequentialHelpers() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const match = /\/\* BEGIN TESTABLE VHDL SEQUENTIAL HELPERS \*\/([\s\S]*?)\/\* END TESTABLE VHDL SEQUENTIAL HELPERS \*\//.exec(html);
  assert.ok(match, "testable sequential helper block should exist in index.html");

  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${match[1]}\nthis.helpers = { stdLogicEquals, jkSequentialBody, tSequentialBody, srSequentialBody };`,
    context,
  );
  return context.helpers;
}

const helpers = loadSequentialHelpers();

test("constant-folds a VCC-driven JK toggle without ambiguous literal equality", () => {
  const body = helpers.jkSequentialBody("'1'", "'1'", "q_int", "qn_int");

  assert.equal(body, "      q_int <= not q_int; qn_int <= q_int;");
  assert.doesNotMatch(body, /'1'\s*=\s*'[01]'/);
});

test("constant-folds all four fixed JK input combinations", () => {
  assert.match(helpers.jkSequentialBody("'0'", "'0'", "q", "qn"), /null;/);
  assert.equal(helpers.jkSequentialBody("'0'", "'1'", "q", "qn"), "      q <= '0'; qn <= '1';");
  assert.equal(helpers.jkSequentialBody("'1'", "'0'", "q", "qn"), "      q <= '1'; qn <= '0';");
  assert.equal(helpers.jkSequentialBody("'1'", "'1'", "q", "qn"), "      q <= not q; qn <= q;");
});

test("keeps signal-driven JK comparisons typed and folds only constant operands", () => {
  const body = helpers.jkSequentialBody("j", "'1'", "q", "qn");

  assert.match(body, /j='0' and true/);
  assert.match(body, /j='1' and true/);
  assert.doesNotMatch(body, /'1'\s*=\s*'[01]'/);
});

test("applies the same literal-safe generation to T and SR flip-flops", () => {
  assert.equal(helpers.tSequentialBody("'1'", "q"), "      q <= not q;");
  assert.match(helpers.tSequentialBody("'0'", "q"), /null;/);
  assert.equal(helpers.srSequentialBody("'1'", "'0'", "q", "qn"), "      q <= '1'; qn <= '0';");
  assert.doesNotMatch(helpers.srSequentialBody("'0'", "'1'", "q", "qn"), /'[01]'\s*=\s*'[01]'/);
});
