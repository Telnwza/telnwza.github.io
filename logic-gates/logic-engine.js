(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LogicEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GATE_TYPES = new Set([
    "INPUT", "OUTPUT", "CONST0", "CONST1", "AND", "OR", "NOT",
    "NAND", "NOR", "XOR", "XNOR",
  ]);

  function normalizeValue(value) {
    if (value === 1 || value === "1" || value === true) return 1;
    if (value === 0 || value === "0" || value === false) return 0;
    return null;
  }

  function inputCount(node) {
    if (!node) return 0;
    if (["INPUT", "CONST0", "CONST1"].includes(node.type)) return 0;
    if (["OUTPUT", "NOT"].includes(node.type)) return 1;
    return Math.max(2, Math.min(8, Number(node.inputCount) || 2));
  }

  function invert(value) {
    return value === null ? null : value ? 0 : 1;
  }

  function evaluateGate(type, inputs) {
    const values = inputs.map(normalizeValue);
    if (type === "OUTPUT") return values[0] ?? null;
    if (type === "NOT") return invert(values[0] ?? null);

    if (type === "AND" || type === "NAND") {
      const base = values.includes(0) ? 0 : values.every((value) => value === 1) ? 1 : null;
      return type === "NAND" ? invert(base) : base;
    }

    if (type === "OR" || type === "NOR") {
      const base = values.includes(1) ? 1 : values.every((value) => value === 0) ? 0 : null;
      return type === "NOR" ? invert(base) : base;
    }

    if (type === "XOR" || type === "XNOR") {
      if (values.some((value) => value === null)) return null;
      const base = values.reduce((result, value) => result ^ value, 0);
      return type === "XNOR" ? invert(base) : base;
    }

    return null;
  }

  function incomingMap(project) {
    const map = new Map();
    for (const wire of project.wires || []) {
      const key = `${wire.to.node}:${wire.to.port}`;
      if (!map.has(key)) map.set(key, wire);
    }
    return map;
  }

  function evaluateCircuit(project, overrides = {}) {
    const nodes = project.nodes || [];
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const incoming = incomingMap(project);
    const values = {};

    for (const node of nodes) {
      values[node.id] = null;
      if (node.type === "INPUT") {
        const override = Object.prototype.hasOwnProperty.call(overrides, node.id)
          ? overrides[node.id]
          : overrides[node.label];
        values[node.id] = normalizeValue(override ?? node.value);
      } else if (node.type === "CONST0") {
        values[node.id] = 0;
      } else if (node.type === "CONST1") {
        values[node.id] = 1;
      }
    }

    for (let pass = 0; pass < nodes.length + 1; pass += 1) {
      let changed = false;
      for (const node of nodes) {
        if (["INPUT", "CONST0", "CONST1"].includes(node.type)) continue;
        const inputs = [];
        for (let port = 0; port < inputCount(node); port += 1) {
          const wire = incoming.get(`${node.id}:in${port}`);
          inputs.push(wire && nodeById.has(wire.from.node) ? values[wire.from.node] : null);
        }
        const next = evaluateGate(node.type, inputs);
        if (values[node.id] !== next) {
          values[node.id] = next;
          changed = true;
        }
      }
      if (!changed) break;
    }

    return { values, validation: validateCircuit(project) };
  }

  function validateCircuit(project) {
    const nodes = project.nodes || [];
    const wires = project.wires || [];
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const errors = [];
    const warnings = [];
    const incoming = new Map();

    for (const node of nodes) {
      if (!GATE_TYPES.has(node.type)) errors.push(`พบอุปกรณ์ชนิดที่ไม่รองรับ: ${node.type}`);
    }

    for (const wire of wires) {
      const from = nodeById.get(wire.from.node);
      const to = nodeById.get(wire.to.node);
      if (!from || !to) {
        errors.push("พบสายที่อ้างถึงอุปกรณ์ที่ไม่มีอยู่");
        continue;
      }
      if (from.type === "OUTPUT") errors.push(`Output ${from.label || from.id} ไม่สามารถเป็นต้นทางของสายได้`);
      if (["INPUT", "CONST0", "CONST1"].includes(to.type)) {
        errors.push(`${to.label || to.type} ไม่มี input port`);
      }
      const key = `${wire.to.node}:${wire.to.port}`;
      incoming.set(key, (incoming.get(key) || 0) + 1);
      if (incoming.get(key) > 1) errors.push(`Input port ของ ${to.label || to.type} มีสายเข้ามากกว่าหนึ่งเส้น`);
    }

    for (const node of nodes) {
      for (let port = 0; port < inputCount(node); port += 1) {
        if (!incoming.has(`${node.id}:in${port}`)) warnings.push(`${node.label || node.type} มี input ที่ยังไม่ต่อ`);
      }
    }

    const adjacency = new Map(nodes.map((node) => [node.id, []]));
    for (const wire of wires) {
      if (adjacency.has(wire.from.node) && nodeById.has(wire.to.node)) {
        adjacency.get(wire.from.node).push(wire.to.node);
      }
    }
    const visiting = new Set();
    const visited = new Set();
    let cyclic = false;
    function visit(id) {
      if (visiting.has(id)) {
        cyclic = true;
        return;
      }
      if (visited.has(id)) return;
      visiting.add(id);
      for (const next of adjacency.get(id) || []) visit(next);
      visiting.delete(id);
      visited.add(id);
    }
    nodes.forEach((node) => visit(node.id));
    if (cyclic) errors.push("พบวงจรย้อนกลับ (combinational loop)");

    if (!nodes.some((node) => node.type === "INPUT")) warnings.push("วงจรยังไม่มี Input");
    if (!nodes.some((node) => node.type === "OUTPUT")) warnings.push("วงจรยังไม่มี Output");
    return { valid: errors.length === 0, errors, warnings, cyclic };
  }

  function circuitExpressions(project) {
    const nodes = project.nodes || [];
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const incoming = incomingMap(project);
    const memo = new Map();

    function expressionFor(id, visiting = new Set()) {
      if (memo.has(id)) return memo.get(id);
      const node = nodeById.get(id);
      if (!node) return "?";
      if (visiting.has(id)) return "[loop]";
      if (node.type === "INPUT") return node.label || "Input";
      if (node.type === "CONST0") return "0";
      if (node.type === "CONST1") return "1";

      const nextVisiting = new Set(visiting);
      nextVisiting.add(id);
      const parts = [];
      for (let port = 0; port < inputCount(node); port += 1) {
        const wire = incoming.get(`${id}:in${port}`);
        parts.push(wire ? expressionFor(wire.from.node, nextVisiting) : "?");
      }

      let result = "?";
      if (node.type === "OUTPUT") result = parts[0];
      if (node.type === "NOT") result = `¬(${parts[0]})`;
      if (node.type === "AND") result = `(${parts.join(" · ")})`;
      if (node.type === "OR") result = `(${parts.join(" + ")})`;
      if (node.type === "NAND") result = `¬(${parts.join(" · ")})`;
      if (node.type === "NOR") result = `¬(${parts.join(" + ")})`;
      if (node.type === "XOR") result = `(${parts.join(" ⊕ ")})`;
      if (node.type === "XNOR") result = `(${parts.join(" ⊙ ")})`;
      memo.set(id, result);
      return result;
    }

    return nodes
      .filter((node) => node.type === "OUTPUT")
      .sort((a, b) => a.y - b.y)
      .map((node) => ({ id: node.id, label: node.label || "Y", expression: expressionFor(node.id) }));
  }

  function truthTableForCircuit(project, maxInputs = 6) {
    const inputs = (project.nodes || [])
      .filter((node) => node.type === "INPUT")
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const outputs = (project.nodes || [])
      .filter((node) => node.type === "OUTPUT")
      .sort((a, b) => a.y - b.y || a.x - b.x);
    if (!inputs.length) throw new Error("ต้องมี Input อย่างน้อย 1 ตัว");
    if (!outputs.length) throw new Error("ต้องมี Output อย่างน้อย 1 ตัว");
    if (inputs.length > maxInputs) throw new Error(`รองรับ Truth Table สูงสุด ${maxInputs} inputs`);

    const rows = [];
    const rowCount = 2 ** inputs.length;
    for (let row = 0; row < rowCount; row += 1) {
      const overrides = {};
      const inputValues = inputs.map((node, index) => {
        const value = (row >> (inputs.length - index - 1)) & 1;
        overrides[node.id] = value;
        return value;
      });
      const result = evaluateCircuit(project, overrides);
      rows.push({
        inputs: inputValues,
        outputs: outputs.map((node) => result.values[node.id]),
      });
    }
    return {
      inputs: inputs.map((node) => ({ id: node.id, label: node.label || "Input" })),
      outputs: outputs.map((node) => ({ id: node.id, label: node.label || "Output" })),
      rows,
    };
  }

  function bitsFor(number, width) {
    return number.toString(2).padStart(width, "0");
  }

  function patternCovers(pattern, minterm, width) {
    const bits = bitsFor(minterm, width);
    return [...pattern].every((bit, index) => bit === "-" || bit === bits[index]);
  }

  function combinePatterns(a, b) {
    let difference = -1;
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] === b[index]) continue;
      if (a[index] === "-" || b[index] === "-") return null;
      if (difference !== -1) return null;
      difference = index;
    }
    if (difference === -1) return null;
    return `${a.slice(0, difference)}-${a.slice(difference + 1)}`;
  }

  function primeImplicants(ones, dontCares, width) {
    let current = [...new Set([...ones, ...dontCares])].map((number) => ({
      pattern: bitsFor(number, width),
      sources: new Set([number]),
    }));
    const primes = new Map();

    while (current.length) {
      const used = new Set();
      const next = new Map();
      for (let a = 0; a < current.length; a += 1) {
        for (let b = a + 1; b < current.length; b += 1) {
          const pattern = combinePatterns(current[a].pattern, current[b].pattern);
          if (!pattern) continue;
          used.add(a);
          used.add(b);
          if (!next.has(pattern)) next.set(pattern, new Set());
          for (const value of current[a].sources) next.get(pattern).add(value);
          for (const value of current[b].sources) next.get(pattern).add(value);
        }
      }
      current.forEach((implicant, index) => {
        if (!used.has(index)) primes.set(implicant.pattern, implicant);
      });
      current = [...next.entries()].map(([pattern, sources]) => ({ pattern, sources }));
    }
    return [...primes.values()].filter((prime) => ones.some((one) => patternCovers(prime.pattern, one, width)));
  }

  function selectCover(primes, ones, width) {
    const covers = primes.map((prime) => ones.filter((one) => patternCovers(prime.pattern, one, width)));
    const selected = new Set();
    const uncovered = new Set(ones);

    let changed = true;
    while (changed) {
      changed = false;
      for (const one of [...uncovered]) {
        if (!uncovered.has(one)) continue;
        const candidates = primes
          .map((_, index) => index)
          .filter((index) => !selected.has(index) && covers[index].includes(one));
        if (candidates.length === 1) {
          const index = candidates[0];
          selected.add(index);
          covers[index].forEach((covered) => uncovered.delete(covered));
          changed = true;
        }
      }
    }

    let best = null;
    const selectedBase = [...selected];
    const literalCount = (indices) => indices.reduce(
      (count, index) => count + [...primes[index].pattern].filter((bit) => bit !== "-").length,
      0,
    );

    function search(remaining, extras) {
      if (!remaining.size) {
        const candidate = [...selectedBase, ...extras];
        const cost = [candidate.length, literalCount(candidate)];
        if (!best || cost[0] < best.cost[0] || (cost[0] === best.cost[0] && cost[1] < best.cost[1])) {
          best = { indices: candidate, cost };
        }
        return;
      }
      if (best && selectedBase.length + extras.length >= best.cost[0]) return;

      const target = [...remaining].sort((a, b) => {
        const ca = covers.filter((items) => items.includes(a)).length;
        const cb = covers.filter((items) => items.includes(b)).length;
        return ca - cb;
      })[0];
      const candidates = primes
        .map((_, index) => index)
        .filter((index) => !selected.has(index) && !extras.includes(index) && covers[index].includes(target));
      for (const index of candidates) {
        const nextRemaining = new Set([...remaining].filter((one) => !covers[index].includes(one)));
        search(nextRemaining, [...extras, index]);
      }
    }

    search(uncovered, []);
    return (best ? best.indices : selectedBase).map((index) => primes[index].pattern);
  }

  function patternsForValues(values, target, width) {
    const normalized = values.map((value) => String(value).toUpperCase());
    const targets = [];
    const dontCares = [];
    normalized.forEach((value, index) => {
      if (value === String(target)) targets.push(index);
      if (value === "X" || value === "-") dontCares.push(index);
    });
    if (!targets.length) return [];
    const primes = primeImplicants(targets, dontCares, width);
    return selectCover(primes, targets, width);
  }

  function sopTerm(pattern, variables) {
    const literals = [...pattern].flatMap((bit, index) => {
      if (bit === "-") return [];
      return [bit === "1" ? variables[index] : `¬${variables[index]}`];
    });
    return literals.length ? literals.join("·") : "1";
  }

  function posTerm(pattern, variables) {
    const literals = [...pattern].flatMap((bit, index) => {
      if (bit === "-") return [];
      return [bit === "1" ? `¬${variables[index]}` : variables[index]];
    });
    if (!literals.length) return "0";
    return literals.length === 1 ? literals[0] : `(${literals.join(" + ")})`;
  }

  function canonicalSop(variables, values) {
    const terms = values.flatMap((value, index) => {
      if (String(value) !== "1") return [];
      return [sopTerm(bitsFor(index, variables.length), variables)];
    });
    return terms.length ? terms.join(" + ") : "0";
  }

  function canonicalPos(variables, values) {
    const terms = values.flatMap((value, index) => {
      if (String(value) !== "0") return [];
      return [posTerm(bitsFor(index, variables.length), variables)];
    });
    return terms.length ? terms.join("·") : "1";
  }

  function minimizeTruthTable(variables, rawValues) {
    if (!variables.length) throw new Error("ต้องมีตัวแปรอย่างน้อย 1 ตัว");
    if (variables.length > 6) throw new Error("รองรับการย่อสมการสูงสุด 6 ตัวแปร");
    const expected = 2 ** variables.length;
    if (rawValues.length !== expected) throw new Error(`Truth Table ต้องมี ${expected} แถว`);
    const values = rawValues.map((value) => {
      const normalized = String(value).trim().toUpperCase();
      if (!["0", "1", "X", "-"].includes(normalized)) throw new Error(`ค่าที่ไม่รองรับ: ${value}`);
      return normalized === "-" ? "X" : normalized;
    });

    const sopPatterns = patternsForValues(values, 1, variables.length);
    const posPatterns = patternsForValues(values, 0, variables.length);
    const hasOne = values.includes("1");
    const hasZero = values.includes("0");
    let sop = hasOne ? sopPatterns.map((pattern) => sopTerm(pattern, variables)).join(" + ") : "0";
    let pos = hasZero ? posPatterns.map((pattern) => posTerm(pattern, variables)).join("·") : "1";
    let special = null;

    if (variables.length === 2 && !values.includes("X")) {
      const signature = values.join("");
      if (signature === "0110") {
        sop = `${variables[0]} ⊕ ${variables[1]}`;
        pos = sop;
        special = "XOR";
      } else if (signature === "1001") {
        sop = `${variables[0]} ⊙ ${variables[1]}`;
        pos = sop;
        special = "XNOR";
      }
    }

    return {
      variables: [...variables], values, sop, pos, sopPatterns, posPatterns, special,
      canonicalSop: canonicalSop(variables, values),
      canonicalPos: canonicalPos(variables, values),
      minterms: values.flatMap((value, index) => value === "1" ? [index] : []),
      maxterms: values.flatMap((value, index) => value === "0" ? [index] : []),
      dontCares: values.flatMap((value, index) => value === "X" ? [index] : []),
    };
  }

  function tokenizeExpression(source) {
    const normalized = String(source)
      .replace(/\bXNOR\b/gi, "@")
      .replace(/\bXOR\b/gi, "^")
      .replace(/\bAND\b/gi, "&")
      .replace(/\bOR\b/gi, "|")
      .replace(/\bNOT\b/gi, "!")
      .replace(/⊙/g, "@")
      .replace(/⊕/g, "^")
      .replace(/¬/g, "!")
      .replace(/[·*]/g, "&")
      .replace(/\+/g, "|");
    const tokens = [];
    let index = 0;
    const isLetter = (char) => /[\p{L}_]/u.test(char || "");
    const isBody = (char) => /[\p{L}\p{N}_]/u.test(char || "");
    while (index < normalized.length) {
      const char = normalized[index];
      if (/\s/.test(char)) {
        index += 1;
        continue;
      }
      if (isLetter(char)) {
        let value = char;
        index += 1;
        while (isBody(normalized[index])) value += normalized[index++];
        tokens.push({ type: "id", value });
        continue;
      }
      if (char === "0" || char === "1") {
        tokens.push({ type: "const", value: Number(char) });
        index += 1;
        continue;
      }
      if ("!&|^@()'~".includes(char)) {
        tokens.push({ type: char, value: char });
        index += 1;
        continue;
      }
      throw new Error(`ไม่รู้จักสัญลักษณ์ “${char}” ที่ตำแหน่ง ${index + 1}`);
    }
    tokens.push({ type: "eof" });
    return tokens;
  }

  function parseExpression(source) {
    const tokens = tokenizeExpression(source);
    let position = 0;
    const peek = () => tokens[position];
    const take = (type) => {
      if (peek().type !== type) throw new Error(`คาดว่าจะพบ “${type}”`);
      return tokens[position++];
    };

    function primary() {
      if (peek().type === "id") return { type: "var", name: take("id").value };
      if (peek().type === "const") return { type: "const", value: take("const").value };
      if (peek().type === "(") {
        take("(");
        const node = orExpression();
        take(")");
        return node;
      }
      throw new Error("สมการยังไม่สมบูรณ์");
    }

    function unary() {
      if (peek().type === "!" || peek().type === "~") {
        position += 1;
        return { type: "not", child: unary() };
      }
      let node = primary();
      while (peek().type === "'") {
        position += 1;
        node = { type: "not", child: node };
      }
      return node;
    }

    function andExpression() {
      let node = unary();
      while (peek().type === "&") {
        position += 1;
        node = { type: "and", left: node, right: unary() };
      }
      return node;
    }

    function xorExpression() {
      let node = andExpression();
      while (peek().type === "^" || peek().type === "@") {
        const operator = peek().type;
        position += 1;
        node = { type: operator === "^" ? "xor" : "xnor", left: node, right: andExpression() };
      }
      return node;
    }

    function orExpression() {
      let node = xorExpression();
      while (peek().type === "|") {
        position += 1;
        node = { type: "or", left: node, right: xorExpression() };
      }
      return node;
    }

    const ast = orExpression();
    if (peek().type !== "eof") throw new Error("มีส่วนเกินท้ายสมการ");
    return ast;
  }

  function expressionVariables(ast) {
    const result = new Set();
    function walk(node) {
      if (node.type === "var") result.add(node.name);
      if (node.child) walk(node.child);
      if (node.left) walk(node.left);
      if (node.right) walk(node.right);
    }
    walk(ast);
    return [...result].sort((a, b) => a.localeCompare(b));
  }

  function evaluateExpression(ast, values) {
    if (ast.type === "const") return ast.value;
    if (ast.type === "var") return normalizeValue(values[ast.name]);
    if (ast.type === "not") return invert(evaluateExpression(ast.child, values));
    const left = evaluateExpression(ast.left, values);
    const right = evaluateExpression(ast.right, values);
    if (ast.type === "and") return evaluateGate("AND", [left, right]);
    if (ast.type === "or") return evaluateGate("OR", [left, right]);
    if (ast.type === "xor") return evaluateGate("XOR", [left, right]);
    if (ast.type === "xnor") return evaluateGate("XNOR", [left, right]);
    return null;
  }

  function analyzeExpression(source) {
    const ast = parseExpression(source);
    const variables = expressionVariables(ast);
    if (!variables.length) throw new Error("สมการต้องมีตัวแปรอย่างน้อย 1 ตัว");
    if (variables.length > 6) throw new Error("รองรับสมการสูงสุด 6 ตัวแปร");
    const values = [];
    for (let row = 0; row < 2 ** variables.length; row += 1) {
      const inputValues = {};
      variables.forEach((variable, index) => {
        inputValues[variable] = (row >> (variables.length - index - 1)) & 1;
      });
      values.push(String(evaluateExpression(ast, inputValues)));
    }
    return { ast, variables, values, minimized: minimizeTruthTable(variables, values) };
  }

  return {
    GATE_TYPES,
    inputCount,
    evaluateGate,
    evaluateCircuit,
    validateCircuit,
    circuitExpressions,
    truthTableForCircuit,
    minimizeTruthTable,
    parseExpression,
    expressionVariables,
    evaluateExpression,
    analyzeExpression,
  };
});
