const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadHelpers() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const routing = /\/\* BEGIN TESTABLE SMART ROUTING HELPERS \*\/([\s\S]*?)\/\* END TESTABLE SMART ROUTING HELPERS \*\//.exec(html);
  const compatibility = /\/\* BEGIN TESTABLE ROUTE COMPATIBILITY HELPER \*\/([\s\S]*?)\/\* END TESTABLE ROUTE COMPATIBILITY HELPER \*\//.exec(html);
  const netColor = /\/\* BEGIN TESTABLE NET COLOR HELPER \*\/([\s\S]*?)\/\* END TESTABLE NET COLOR HELPER \*\//.exec(html);
  assert.ok(routing, "testable smart-routing helper block should exist");
  assert.ok(compatibility, "testable compatibility helper block should exist");
  assert.ok(netColor, "testable net-color helper block should exist");

  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${routing[1]}\n${compatibility[1]}\n${netColor[1]}\nthis.helpers = { routingEdgeKey, simplifyGridPath, routeGridAStar, isManualWire, normalizeNetColor };`,
    context,
  );
  return context.helpers;
}

const { routingEdgeKey, simplifyGridPath, routeGridAStar, isManualWire, normalizeNetColor } = loadHelpers();

test("routes a clear connection as one straight Manhattan run", () => {
  const route = routeGridAStar(
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { minX: -2, maxX: 7, minY: -2, maxY: 2 },
    () => false,
    () => 0,
  );

  assert.deepEqual(JSON.parse(JSON.stringify(route)), [{ x: 0, y: 0 }, { x: 5, y: 0 }]);
});

test("detours around blocked component cells without diagonal segments", () => {
  const blocked = new Set(["2,0", "3,0"]);
  const route = routeGridAStar(
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { minX: -2, maxX: 7, minY: -3, maxY: 3 },
    (x, y) => blocked.has(`${x},${y}`),
    () => 0,
  );

  assert.ok(route.length >= 4, "route should contain a visible detour");
  assert.deepEqual(JSON.parse(JSON.stringify(route[0])), { x: 0, y: 0 });
  assert.deepEqual(JSON.parse(JSON.stringify(route.at(-1))), { x: 5, y: 0 });
  assert.ok(route.every(p => !blocked.has(`${p.x},${p.y}`)));
  for (let i = 1; i < route.length; i++) {
    assert.ok(route[i - 1].x === route[i].x || route[i - 1].y === route[i].y);
  }
});

test("prefers a short detour over an expensive overlap with another net", () => {
  const occupied = new Set([
    routingEdgeKey({ x: 1, y: 0 }, { x: 2, y: 0 }),
    routingEdgeKey({ x: 2, y: 0 }, { x: 3, y: 0 }),
    routingEdgeKey({ x: 3, y: 0 }, { x: 4, y: 0 }),
  ]);
  const route = routeGridAStar(
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { minX: -2, maxX: 7, minY: -3, maxY: 3 },
    () => false,
    (a, b) => occupied.has(routingEdgeKey(a, b)) ? 70 : 0,
  );

  const expanded = [];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
    for (let p = { ...a }; p.x !== b.x || p.y !== b.y;) {
      const q = { x: p.x + dx, y: p.y + dy };
      expanded.push(routingEdgeKey(p, q));
      p = q;
    }
  }
  assert.ok(expanded.every(edge => !occupied.has(edge)));
});

test("keeps legacy hand-routed wires manual while route-less wires remain auto", () => {
  assert.equal(isManualWire({ pts: [{ x: 22, y: 33 }] }), true);
  assert.equal(isManualWire({ mx: 55 }), true);
  assert.equal(isManualWire({ pts: [{ x: 22, y: 33 }], routeMode: "auto" }), false);
  assert.equal(isManualWire({ routeMode: "manual" }), true);
  assert.equal(isManualWire({ from: {}, to: {} }), false);
});

test("accepts only serializable six-digit net colours", () => {
  assert.equal(normalizeNetColor("#Aa44FF"), "#aa44ff");
  assert.equal(normalizeNetColor("  #123456  "), "#123456");
  assert.equal(normalizeNetColor("red"), "");
  assert.equal(normalizeNetColor("#fff"), "");
  assert.equal(normalizeNetColor("#12345678"), "");
});

test("simplifies duplicate and collinear grid points", () => {
  const route = simplifyGridPath([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(route)), [
    { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 },
  ]);
});
