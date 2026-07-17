(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AutomataEquation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EPSILON = "λ";
  const EPSILON_WORDS = new Set(["ε", "λ", "eps", "epsilon", "lambda", "lamda"]);

  class EquationSyntaxError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = "EquationSyntaxError";
      Object.assign(this, details);
    }
  }

  function normalizeEpsilon(value) {
    const text = String(value || "").trim();
    return EPSILON_WORDS.has(text.toLowerCase()) ? EPSILON : text;
  }

  function tokenizeRegex(source) {
    const tokens = [];
    let index = 0;

    while (index < source.length) {
      const char = source[index];

      if (/\s/u.test(char)) {
        index += 1;
        continue;
      }

      if (char === "\\") {
        if (index + 1 >= source.length) {
          throw new EquationSyntaxError("เครื่องหมาย \\ ต้องตามด้วยสัญลักษณ์ที่ต้องการ escape", {
            column: index + 1,
          });
        }
        const literal = String.fromCodePoint(source.codePointAt(index + 1));
        if (literal === ",") {
          throw new EquationSyntaxError("ไม่รองรับ comma เป็นสัญลักษณ์ เพราะใช้คั่น transition labels", {
            column: index + 1,
          });
        }
        tokens.push({ type: "literal", value: literal, column: index + 1 });
        index += 1 + literal.length;
        continue;
      }

      if (char === "(" || char === "{") {
        tokens.push({
          type: "open",
          value: char,
          closing: char === "(" ? ")" : "}",
          column: index + 1,
        });
        index += 1;
        continue;
      }

      if (char === ")" || char === "}") {
        tokens.push({ type: "close", value: char, column: index + 1 });
        index += 1;
        continue;
      }

      if (char === "|" || char === ",") {
        tokens.push({ type: "union", value: char, column: index + 1 });
        index += 1;
        continue;
      }

      if (char === ".") {
        tokens.push({ type: "concat", value: char, column: index + 1 });
        index += 1;
        continue;
      }

      if ("*+?".includes(char)) {
        tokens.push({ type: char, value: char, column: index + 1 });
        index += 1;
        continue;
      }

      if (char === "ε" || char === "λ") {
        tokens.push({ type: "epsilon", value: EPSILON, column: index + 1 });
        index += char.length;
        continue;
      }

      const rest = source.slice(index);
      const epsilonWord = rest.match(/^(epsilon|lambda|lamda|eps)(?![\p{L}\p{N}_])/iu);
      if (epsilonWord) {
        tokens.push({ type: "epsilon", value: EPSILON, column: index + 1 });
        index += epsilonWord[0].length;
        continue;
      }

      const literal = String.fromCodePoint(source.codePointAt(index));
      tokens.push({ type: "literal", value: literal, column: index + 1 });
      index += literal.length;
    }

    tokens.push({ type: "eof", value: "", column: source.length + 1 });
    return tokens;
  }

  function parseRegexAst(source) {
    const tokens = tokenizeRegex(source);
    let current = 0;

    function peek() {
      return tokens[current];
    }

    function take(type) {
      if (peek().type !== type) {
        throw new EquationSyntaxError(`คาดว่าจะพบ "${type}"`, { column: peek().column });
      }
      return tokens[current++];
    }

    function parseUnion() {
      let node = parseConcatenation();
      while (peek().type === "union") {
        const operator = take("union");
        if (peek().type === "union" || peek().type === "close" || peek().type === "eof") {
          throw new EquationSyntaxError(`ด้านขวาของ ${operator.value} ต้องมีนิพจน์`, {
            column: peek().column,
          });
        }
        node = { type: "union", left: node, right: parseConcatenation() };
      }
      return node;
    }

    function parseConcatenation() {
      const nodes = [];
      while (!["union", "close", "eof"].includes(peek().type)) {
        if (peek().type === "concat") {
          const separator = take("concat");
          if (!nodes.length) {
            throw new EquationSyntaxError("ด้านซ้ายของ . ต้องมีนิพจน์", {
              column: separator.column,
            });
          }
          if (["concat", "union", "close", "eof", "*", "+", "?"].includes(peek().type)) {
            throw new EquationSyntaxError("ด้านขวาของ . ต้องมีนิพจน์", {
              column: peek().column,
            });
          }
          continue;
        }
        nodes.push(parseRepetition());
      }
      if (!nodes.length) {
        throw new EquationSyntaxError("ต้องมีสัญลักษณ์หรือ λ ในตำแหน่งนี้", {
          column: peek().column,
        });
      }
      return nodes.slice(1).reduce(
        (left, right) => ({ type: "concat", left, right }),
        nodes[0],
      );
    }

    function parseRepetition() {
      let node = parseAtom();
      let hasPostfix = false;
      while (["*", "+", "?"].includes(peek().type)) {
        if (hasPostfix) {
          throw new EquationSyntaxError("ไม่รองรับ postfix operator ซ้อนกัน", {
            column: peek().column,
          });
        }
        const operator = tokens[current++].type;
        node = {
          type: operator === "*" ? "star" : operator === "+" ? "plus" : "optional",
          child: node,
        };
        hasPostfix = true;
      }
      return node;
    }

    function parseAtom() {
      if (peek().type === "literal") {
        return { type: "literal", value: take("literal").value };
      }
      if (peek().type === "epsilon") {
        take("epsilon");
        return { type: "epsilon" };
      }
      if (peek().type === "open") {
        const opening = take("open");
        if (peek().type === "close") {
          throw new EquationSyntaxError("วงเล็บว่างไม่ใช่ Regular Expression", {
            column: opening.column,
          });
        }
        const node = parseUnion();
        if (peek().type !== "close") {
          throw new EquationSyntaxError("ยังไม่ได้ปิดวงเล็บ", { column: opening.column });
        }
        const closing = take("close");
        if (closing.value !== opening.closing) {
          throw new EquationSyntaxError(
            `เปิดด้วย ${opening.value} แต่ปิดด้วย ${closing.value}`,
            { column: closing.column },
          );
        }
        return node;
      }
      throw new EquationSyntaxError(`ไม่รู้จักสัญลักษณ์ "${peek().value}"`, {
        column: peek().column,
      });
    }

    const ast = parseUnion();
    if (peek().type !== "eof") {
      throw new EquationSyntaxError(`มีสัญลักษณ์เกิน "${peek().value}"`, {
        column: peek().column,
      });
    }
    return ast;
  }

  function parseRegexExpression(source) {
    const expression = String(source || "").trim();
    if (!expression) throw new EquationSyntaxError("กรุณาใส่ Regular Expression");
    if (expression.length > 500) {
      throw new EquationSyntaxError("Regular Expression ยาวเกิน 500 ตัวอักษร");
    }
    return { expression, ast: parseRegexAst(expression) };
  }

  function regexToNfa(source) {
    const { expression, ast } = parseRegexExpression(source);
    const transitions = [];
    const alphabet = [];
    const alphabetSet = new Set();
    let stateCounter = 0;

    function newState() {
      const name = `q${stateCounter++}`;
      if (stateCounter > 80) {
        throw new EquationSyntaxError("นิพจน์นี้สร้าง state มากเกินขีดจำกัด 80 states");
      }
      return name;
    }

    function connect(from, to, label) {
      transitions.push({ from, to, label });
      if (label !== EPSILON && !alphabetSet.has(label)) {
        alphabetSet.add(label);
        alphabet.push(label);
      }
    }

    function compile(node) {
      if (node.type === "literal" || node.type === "epsilon") {
        const start = newState();
        const end = newState();
        connect(start, end, node.type === "epsilon" ? EPSILON : node.value);
        return { start, end };
      }

      if (node.type === "concat") {
        const left = compile(node.left);
        const right = compile(node.right);
        connect(left.end, right.start, EPSILON);
        return { start: left.start, end: right.end };
      }

      if (node.type === "union") {
        const start = newState();
        const end = newState();
        const left = compile(node.left);
        const right = compile(node.right);
        connect(start, left.start, EPSILON);
        connect(start, right.start, EPSILON);
        connect(left.end, end, EPSILON);
        connect(right.end, end, EPSILON);
        return { start, end };
      }

      if (node.type === "star") {
        const start = newState();
        const end = newState();
        const child = compile(node.child);
        connect(start, child.start, EPSILON);
        connect(start, end, EPSILON);
        connect(child.end, child.start, EPSILON);
        connect(child.end, end, EPSILON);
        return { start, end };
      }

      if (node.type === "plus") {
        const start = newState();
        const end = newState();
        const child = compile(node.child);
        connect(start, child.start, EPSILON);
        connect(child.end, child.start, EPSILON);
        connect(child.end, end, EPSILON);
        return { start, end };
      }

      if (node.type === "optional") {
        const start = newState();
        const end = newState();
        const child = compile(node.child);
        connect(start, child.start, EPSILON);
        connect(start, end, EPSILON);
        connect(child.end, end, EPSILON);
        return { start, end };
      }

      throw new EquationSyntaxError("ไม่สามารถแปลง Regular Expression นี้ได้");
    }

    const fragment = compile(ast);
    const states = Array.from({ length: stateCounter }, (_, index) => `q${index}`);
    return {
      sourceKind: "regex",
      type: "NFA",
      alphabet,
      states,
      initial: fragment.start,
      finals: [fragment.end],
      transitions,
      warnings: [],
      expression,
    };
  }

  function regexToPositionNfa(source) {
    const { expression, ast } = parseRegexExpression(source);
    const symbols = new Map();
    const follow = new Map();
    const alphabet = [];
    const alphabetSet = new Set();
    let positionCounter = 0;

    function union(left, right) {
      return new Set([...left, ...right]);
    }

    function addFollow(fromPositions, toPositions) {
      fromPositions.forEach((from) => {
        if (!follow.has(from)) follow.set(from, new Set());
        const destinations = follow.get(from);
        toPositions.forEach((to) => destinations.add(to));
      });
    }

    function analyze(node) {
      if (node.type === "literal") {
        const position = ++positionCounter;
        symbols.set(position, node.value);
        follow.set(position, new Set());
        if (!alphabetSet.has(node.value)) {
          alphabetSet.add(node.value);
          alphabet.push(node.value);
        }
        return {
          nullable: false,
          first: new Set([position]),
          last: new Set([position]),
        };
      }

      if (node.type === "epsilon") {
        return { nullable: true, first: new Set(), last: new Set() };
      }

      if (node.type === "union") {
        const left = analyze(node.left);
        const right = analyze(node.right);
        return {
          nullable: left.nullable || right.nullable,
          first: union(left.first, right.first),
          last: union(left.last, right.last),
        };
      }

      if (node.type === "concat") {
        const left = analyze(node.left);
        const right = analyze(node.right);
        addFollow(left.last, right.first);
        return {
          nullable: left.nullable && right.nullable,
          first: left.nullable ? union(left.first, right.first) : left.first,
          last: right.nullable ? union(left.last, right.last) : right.last,
        };
      }

      if (["star", "plus", "optional"].includes(node.type)) {
        const child = analyze(node.child);
        if (node.type === "star" || node.type === "plus") {
          addFollow(child.last, child.first);
        }
        return {
          nullable: node.type === "plus" ? child.nullable : true,
          first: child.first,
          last: child.last,
        };
      }

      throw new EquationSyntaxError("ไม่สามารถสร้าง NFA จาก Regular Expression นี้ได้");
    }

    const analysis = analyze(ast);
    const transitions = [];
    analysis.first.forEach((position) => {
      transitions.push({ from: "q0", to: `q${position}`, label: symbols.get(position) });
    });
    follow.forEach((destinations, from) => {
      destinations.forEach((to) => {
        transitions.push({ from: `q${from}`, to: `q${to}`, label: symbols.get(to) });
      });
    });

    const finals = [...analysis.last].map((position) => `q${position}`);
    if (analysis.nullable) finals.unshift("q0");

    return {
      sourceKind: "position-nfa",
      type: "NFA",
      alphabet,
      states: Array.from({ length: positionCounter + 1 }, (_, index) => `q${index}`),
      initial: "q0",
      finals,
      transitions,
      warnings: [],
      expression,
      optimization: {
        literalPositions: positionCounter,
        positionStates: positionCounter + 1,
      },
    };
  }

  function determinizeNfa(model, options = {}) {
    const maxStates = Number(options.maxStates || 256);
    const stateOrder = new Map(model.states.map((state, index) => [state, index]));
    const transitionMap = new Map();

    model.transitions.forEach(({ from, to, label }) => {
      const key = `${from}\u0000${label}`;
      if (!transitionMap.has(key)) transitionMap.set(key, []);
      transitionMap.get(key).push(to);
    });

    function epsilonClosure(inputStates) {
      const stack = [...inputStates];
      const seen = new Set(inputStates);
      while (stack.length) {
        const state = stack.pop();
        (transitionMap.get(`${state}\u0000${EPSILON}`) || []).forEach((destination) => {
          if (!seen.has(destination)) {
            seen.add(destination);
            stack.push(destination);
          }
        });
      }
      return [...seen].sort((a, b) => (stateOrder.get(a) ?? 0) - (stateOrder.get(b) ?? 0));
    }

    function subsetKey(subset) {
      return subset.join("\u0001");
    }

    const subsets = [];
    const namesByKey = new Map();
    const queue = [];

    function addSubset(subset) {
      const key = subsetKey(subset);
      if (namesByKey.has(key)) return namesByKey.get(key);
      if (subsets.length >= maxStates) {
        throw new EquationSyntaxError(
          `Regex นี้สร้าง DFA มากเกินขีดจำกัด ${maxStates} states กรุณาลดความซับซ้อน`,
        );
      }
      const name = `d${subsets.length}`;
      const item = { name, states: subset };
      subsets.push(item);
      namesByKey.set(key, name);
      queue.push(item);
      return name;
    }

    const startSubset = epsilonClosure([model.initial]);
    const initial = addSubset(startSubset);
    const transitions = [];

    while (queue.length) {
      const current = queue.shift();
      model.alphabet.forEach((symbol) => {
        const destinations = new Set();
        current.states.forEach((state) => {
          (transitionMap.get(`${state}\u0000${symbol}`) || [])
            .forEach((destination) => destinations.add(destination));
        });
        const nextSubset = epsilonClosure([...destinations]);
        const to = addSubset(nextSubset);
        transitions.push({ from: current.name, to, label: symbol });
      });
    }

    const finalSet = new Set(model.finals);
    return {
      sourceKind: model.sourceKind,
      type: "DFA",
      alphabet: [...model.alphabet],
      states: subsets.map(({ name }) => name),
      initial,
      finals: subsets
        .filter(({ states }) => states.some((state) => finalSet.has(state)))
        .map(({ name }) => name),
      transitions,
      warnings: [],
      expression: model.expression,
      optimization: {
        thompsonStates: model.states.length,
        subsetStates: subsets.length,
      },
    };
  }

  function minimizeDfa(model) {
    if (model.type !== "DFA") {
      throw new EquationSyntaxError("ต้องแปลงเป็น DFA ก่อนจึงจะลดจำนวน state ได้");
    }

    const states = [...model.states];
    const stateSet = new Set(states);
    const transitionMap = new Map();

    model.transitions.forEach(({ from, to, label }) => {
      const key = `${from}\u0000${label}`;
      if (transitionMap.has(key) && transitionMap.get(key) !== to) {
        throw new EquationSyntaxError(`DFA มี transition ซ้ำที่ δ(${from},${label})`);
      }
      transitionMap.set(key, to);
      stateSet.add(from);
      stateSet.add(to);
    });

    let sinkName = "__sink__";
    while (stateSet.has(sinkName)) sinkName += "_";
    let needsSink = false;
    [...stateSet].forEach((state) => {
      model.alphabet.forEach((symbol) => {
        if (!transitionMap.has(`${state}\u0000${symbol}`)) needsSink = true;
      });
    });
    if (needsSink) {
      stateSet.add(sinkName);
      model.alphabet.forEach((symbol) => {
        transitionMap.set(`${sinkName}\u0000${symbol}`, sinkName);
      });
      [...stateSet].forEach((state) => {
        model.alphabet.forEach((symbol) => {
          const key = `${state}\u0000${symbol}`;
          if (!transitionMap.has(key)) transitionMap.set(key, sinkName);
        });
      });
    }

    const reachable = new Set([model.initial]);
    const queue = [model.initial];
    while (queue.length) {
      const state = queue.shift();
      model.alphabet.forEach((symbol) => {
        const destination = transitionMap.get(`${state}\u0000${symbol}`);
        if (destination !== undefined && !reachable.has(destination)) {
          reachable.add(destination);
          queue.push(destination);
        }
      });
    }

    const finalSet = new Set(model.finals.filter((state) => reachable.has(state)));
    const accepting = [...reachable].filter((state) => finalSet.has(state));
    const rejecting = [...reachable].filter((state) => !finalSet.has(state));
    let partitions = [accepting, rejecting].filter((partition) => partition.length);

    let changed = true;
    while (changed) {
      changed = false;
      const partitionIndex = new Map();
      partitions.forEach((partition, index) => {
        partition.forEach((state) => partitionIndex.set(state, index));
      });
      const refined = [];

      partitions.forEach((partition) => {
        const groups = new Map();
        partition.forEach((state) => {
          const signature = model.alphabet.map((symbol) => {
            const destination = transitionMap.get(`${state}\u0000${symbol}`);
            return partitionIndex.get(destination);
          }).join(",");
          if (!groups.has(signature)) groups.set(signature, []);
          groups.get(signature).push(state);
        });
        if (groups.size > 1) changed = true;
        refined.push(...groups.values());
      });
      partitions = refined;
    }

    const blockOf = new Map();
    partitions.forEach((partition, index) => {
      partition.forEach((state) => blockOf.set(state, index));
    });
    const initialBlock = blockOf.get(model.initial);
    const orderedBlocks = [];
    const seenBlocks = new Set([initialBlock]);
    const blockQueue = [initialBlock];

    while (blockQueue.length) {
      const block = blockQueue.shift();
      orderedBlocks.push(block);
      const representative = partitions[block][0];
      model.alphabet.forEach((symbol) => {
        const destination = transitionMap.get(`${representative}\u0000${symbol}`);
        const destinationBlock = blockOf.get(destination);
        if (!seenBlocks.has(destinationBlock)) {
          seenBlocks.add(destinationBlock);
          blockQueue.push(destinationBlock);
        }
      });
    }

    partitions.forEach((_, index) => {
      if (!seenBlocks.has(index)) orderedBlocks.push(index);
    });

    const nameByBlock = new Map(
      orderedBlocks.map((block, index) => [block, `q${index}`]),
    );
    const minimizedTransitions = [];
    orderedBlocks.forEach((block) => {
      const representative = partitions[block][0];
      model.alphabet.forEach((symbol) => {
        const destination = transitionMap.get(`${representative}\u0000${symbol}`);
        minimizedTransitions.push({
          from: nameByBlock.get(block),
          to: nameByBlock.get(blockOf.get(destination)),
          label: symbol,
        });
      });
    });

    return {
      sourceKind: "minimal-dfa",
      type: "DFA",
      alphabet: [...model.alphabet],
      states: orderedBlocks.map((block) => nameByBlock.get(block)),
      initial: nameByBlock.get(initialBlock),
      finals: orderedBlocks
        .filter((block) => partitions[block].some((state) => finalSet.has(state)))
        .map((block) => nameByBlock.get(block)),
      transitions: minimizedTransitions,
      warnings: [],
      expression: model.expression,
      optimization: {
        ...(model.optimization || {}),
        minimizedStates: orderedBlocks.length,
      },
    };
  }

  function regexToMinimalDfa(source, options = {}) {
    const nfa = regexToNfa(source);
    const dfa = determinizeNfa(nfa, options);
    return minimizeDfa(dfa);
  }

  function compareLanguages(leftModel, rightModel, options = {}) {
    function expandedModel(model, side) {
      if (!model || !Array.isArray(model.states) || !model.states.length) {
        throw new EquationSyntaxError(`${side} ยังไม่มี state`);
      }
      if (!model.initial || !model.states.includes(model.initial)) {
        throw new EquationSyntaxError(`${side} ไม่มี Initial state ที่ถูกต้อง`);
      }

      const transitions = [];
      const alphabet = [];
      const alphabetSet = new Set();
      const addSymbol = (symbol) => {
        const normalized = normalizeEpsilon(symbol);
        if (!normalized || normalized === EPSILON || alphabetSet.has(normalized)) return;
        if (Array.from(normalized).length !== 1 || normalized === ",") {
          throw new EquationSyntaxError(
            `${side} ใช้สัญลักษณ์ "${normalized}" ที่ไม่ใช่อักขระเดียว`,
          );
        }
        alphabetSet.add(normalized);
        alphabet.push(normalized);
      };

      (model.alphabet || []).forEach(addSymbol);
      (model.transitions || []).forEach(({ from, to, label }) => {
        if (!model.states.includes(from) || !model.states.includes(to)) {
          throw new EquationSyntaxError(`${side} มี transition ที่อ้างถึง state ที่ไม่มีอยู่`);
        }
        String(label || "")
          .split(",")
          .map((item) => normalizeEpsilon(item))
          .filter(Boolean)
          .forEach((symbol) => {
            if (symbol !== EPSILON) addSymbol(symbol);
            transitions.push({ from, to, label: symbol });
          });
      });

      return {
        ...model,
        type: model.type === "DFA" ? "DFA" : "NFA",
        alphabet,
        transitions,
        finals: (model.finals || []).filter((state) => model.states.includes(state)),
      };
    }

    const left = expandedModel(leftModel, "Automata A");
    const right = expandedModel(rightModel, "Automata B");
    const alphabet = [];
    const alphabetSet = new Set();
    [...left.alphabet, ...right.alphabet].forEach((symbol) => {
      if (!alphabetSet.has(symbol)) {
        alphabetSet.add(symbol);
        alphabet.push(symbol);
      }
    });

    const maxDfaStates = Number(options.maxDfaStates || 512);
    const leftDfa = determinizeNfa({ ...left, alphabet }, { maxStates: maxDfaStates });
    const rightDfa = determinizeNfa({ ...right, alphabet }, { maxStates: maxDfaStates });
    const leftFinals = new Set(leftDfa.finals);
    const rightFinals = new Set(rightDfa.finals);
    const leftTransitions = new Map(
      leftDfa.transitions.map(({ from, to, label }) => [`${from}\u0000${label}`, to]),
    );
    const rightTransitions = new Map(
      rightDfa.transitions.map(({ from, to, label }) => [`${from}\u0000${label}`, to]),
    );

    const startKey = `${leftDfa.initial}\u0001${rightDfa.initial}`;
    const queue = [{
      left: leftDfa.initial,
      right: rightDfa.initial,
      word: "",
    }];
    let queueIndex = 0;
    const seen = new Set([startKey]);
    const maxPairs = Number(options.maxPairs || 100000);

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      const leftAccepted = leftFinals.has(current.left);
      const rightAccepted = rightFinals.has(current.right);
      if (leftAccepted !== rightAccepted) {
        return {
          equivalent: false,
          counterexample: current.word,
          leftAccepted,
          rightAccepted,
          alphabet,
          exploredPairs: seen.size,
          leftDfaStates: leftDfa.states.length,
          rightDfaStates: rightDfa.states.length,
        };
      }

      alphabet.forEach((symbol) => {
        const nextLeft = leftTransitions.get(`${current.left}\u0000${symbol}`);
        const nextRight = rightTransitions.get(`${current.right}\u0000${symbol}`);
        const key = `${nextLeft}\u0001${nextRight}`;
        if (seen.has(key)) return;
        if (seen.size >= maxPairs) {
          throw new EquationSyntaxError(
            `การเปรียบเทียบซับซ้อนเกินขีดจำกัด ${maxPairs} state pairs`,
          );
        }
        seen.add(key);
        queue.push({
          left: nextLeft,
          right: nextRight,
          word: current.word + symbol,
        });
      });
    }

    return {
      equivalent: true,
      counterexample: null,
      alphabet,
      exploredPairs: seen.size,
      leftDfaStates: leftDfa.states.length,
      rightDfaStates: rightDfa.states.length,
    };
  }

  function splitList(value) {
    const cleaned = String(value || "")
      .trim()
      .replace(/^[{[]/, "")
      .replace(/[}\]]$/, "")
      .trim();
    if (!cleaned || cleaned === "∅") return [];
    return cleaned.split(",").map((item) => item.trim()).filter(Boolean);
  }

  function stripComment(line) {
    const hashIndex = line.indexOf("#");
    const slashIndex = line.indexOf("//");
    const indexes = [hashIndex, slashIndex].filter((index) => index >= 0);
    return indexes.length ? line.slice(0, Math.min(...indexes)) : line;
  }

  function parseTransitionEquations(source, options = {}) {
    const text = String(source || "");
    if (!text.trim()) throw new EquationSyntaxError("กรุณาใส่นิยาม Automata");

    const headers = {
      type: String(options.defaultType || "DFA").toUpperCase(),
      alphabet: null,
      start: "",
      finals: [],
    };
    const rawTransitions = [];
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const lineNumber = index + 1;
      const line = stripComment(lines[index]).trim();
      if (!line) continue;

      const header = line.match(
        /^(type|alphabet|sigma|start|initial|final|accept|accepting|Σ|q₀|F)\s*[:=]\s*(.*)$/iu,
      );
      if (header) {
        const key = header[1].toLowerCase();
        const value = header[2].trim();
        if (key === "type") headers.type = value.toUpperCase();
        else if (["alphabet", "sigma", "σ"].includes(key)) headers.alphabet = splitList(value);
        else if (["start", "initial", "q₀"].includes(key)) headers.start = value;
        else headers.finals = splitList(value);
        continue;
      }

      let match = line.match(
        /^(?:δ|delta)\s*\(\s*([^,()]+?)\s*,\s*([^()]+?)\s*\)\s*(?:=|->|→)\s*(.+)$/iu,
      );
      if (!match) {
        match = line.match(/^([^,\s]+)\s*,\s*(\S+)\s*(?:=|->|→)\s*(.+)$/u);
      }
      if (!match) {
        throw new EquationSyntaxError("ไม่เข้าใจบรรทัดนี้ กรุณาใช้รูปแบบ δ(q0,0) = q1", {
          line: lineNumber,
          sourceLine: lines[index],
        });
      }

      const from = match[1].trim();
      const label = normalizeEpsilon(match[2]);
      const destinations = splitList(match[3]);
      if (!from || !label || !destinations.length) {
        throw new EquationSyntaxError("Transition ต้องมีต้นทาง สัญลักษณ์ และปลายทาง", {
          line: lineNumber,
          sourceLine: lines[index],
        });
      }
      rawTransitions.push({ from, label, destinations, line: lineNumber });
    }

    if (!["DFA", "NFA"].includes(headers.type)) {
      throw new EquationSyntaxError("รุ่นนี้รองรับ type: DFA หรือ type: NFA เท่านั้น");
    }
    if (!headers.start) {
      throw new EquationSyntaxError("กรุณาระบุ start: หรือ initial:");
    }
    if (!rawTransitions.length) {
      throw new EquationSyntaxError("ยังไม่มี transition อย่างน้อยหนึ่งบรรทัด");
    }

    const states = [];
    const stateSet = new Set();
    function addState(name) {
      const normalized = String(name || "").trim();
      if (normalized && !stateSet.has(normalized)) {
        stateSet.add(normalized);
        states.push(normalized);
      }
    }

    addState(headers.start);
    headers.finals.forEach(addState);
    rawTransitions.forEach((transition) => {
      addState(transition.from);
      transition.destinations.forEach(addState);
    });

    const inferredAlphabet = [];
    const inferredSet = new Set();
    rawTransitions.forEach(({ label }) => {
      if (label !== EPSILON && !inferredSet.has(label)) {
        inferredSet.add(label);
        inferredAlphabet.push(label);
      }
    });
    const alphabet = [...new Set(headers.alphabet || inferredAlphabet)];
    const alphabetSet = new Set(alphabet);
    const warnings = [];

    alphabet.forEach((symbol) => {
      if (normalizeEpsilon(symbol) === EPSILON) {
        throw new EquationSyntaxError("ไม่ต้องใส่ λ ใน alphabet");
      }
      if (Array.from(symbol).length !== 1 || symbol === ",") {
        throw new EquationSyntaxError(`สัญลักษณ์ "${symbol}" ต้องเป็นอักขระเดียวและห้ามเป็น comma`);
      }
    });

    for (const transition of rawTransitions) {
      if (transition.label !== EPSILON && (Array.from(transition.label).length !== 1 || transition.label === ",")) {
        throw new EquationSyntaxError(
          `สัญลักษณ์ "${transition.label}" ต้องเป็นอักขระเดียวและห้ามเป็น comma`,
          { line: transition.line },
        );
      }
      if (transition.label !== EPSILON && !alphabetSet.has(transition.label)) {
        throw new EquationSyntaxError(
          `สัญลักษณ์ "${transition.label}" ไม่ได้อยู่ใน alphabet`,
          { line: transition.line },
        );
      }
      if (headers.type === "DFA" && transition.label === EPSILON) {
        throw new EquationSyntaxError("DFA ไม่สามารถมี λ-transition", {
          line: transition.line,
        });
      }
      if (headers.type === "DFA" && transition.destinations.length !== 1) {
        throw new EquationSyntaxError("DFA ต้องมีปลายทางเดียวต่อ transition", {
          line: transition.line,
        });
      }
    }

    if (headers.type === "DFA") {
      const seen = new Map();
      rawTransitions.forEach((transition) => {
        const key = `${transition.from}\u0000${transition.label}`;
        if (seen.has(key)) {
          throw new EquationSyntaxError(
            `DFA มี δ(${transition.from},${transition.label}) ซ้ำ`,
            { line: transition.line },
          );
        }
        seen.set(key, transition.destinations[0]);
      });

      states.forEach((state) => {
        alphabet.forEach((symbol) => {
          if (!seen.has(`${state}\u0000${symbol}`)) {
            warnings.push(`ขาด δ(${state},${symbol})`);
          }
        });
      });
    }

    const transitions = [];
    rawTransitions.forEach(({ from, label, destinations }) => {
      destinations.forEach((to) => transitions.push({ from, to, label }));
    });

    return {
      sourceKind: "transitions",
      type: headers.type,
      alphabet,
      states,
      initial: headers.start,
      finals: headers.finals,
      transitions,
      warnings,
    };
  }

  function mergeParallelTransitions(transitions) {
    const grouped = new Map();
    transitions.forEach((transition) => {
      const key = `${transition.from}\u0000${transition.to}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          from: transition.from,
          to: transition.to,
          labels: [],
        });
      }
      const group = grouped.get(key);
      if (!group.labels.includes(transition.label)) group.labels.push(transition.label);
    });
    return [...grouped.values()].map(({ from, to, labels }) => ({
      from,
      to,
      label: labels.join(","),
    }));
  }

  function layoutAutomaton(model, width = 1000, height = 620) {
    const adjacency = new Map(model.states.map((state) => [state, []]));
    model.transitions.forEach(({ from, to }) => {
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push(to);
    });

    const levels = new Map();
    const queue = [model.initial];
    levels.set(model.initial, 0);
    while (queue.length) {
      const state = queue.shift();
      const level = levels.get(state);
      (adjacency.get(state) || []).forEach((destination) => {
        if (!levels.has(destination)) {
          levels.set(destination, level + 1);
          queue.push(destination);
        }
      });
    }

    let maxLevel = Math.max(0, ...levels.values());
    model.states.forEach((state) => {
      if (!levels.has(state)) levels.set(state, ++maxLevel);
    });

    const groups = new Map();
    model.states.forEach((state) => {
      const level = levels.get(state);
      if (!groups.has(level)) groups.set(level, []);
      groups.get(level).push(state);
    });

    const horizontalMargin = 105;
    const verticalMargin = 70;
    const usableWidth = Math.max(1, width - horizontalMargin * 2);
    const usableHeight = Math.max(1, height - verticalMargin * 2);
    const divisor = Math.max(1, maxLevel);
    const positions = {};

    [...groups.entries()].sort((a, b) => a[0] - b[0]).forEach(([level, group]) => {
      const x = horizontalMargin + (usableWidth * level) / divisor;
      group.forEach((state, index) => {
        const y = group.length === 1
          ? height / 2
          : verticalMargin + (usableHeight * index) / (group.length - 1);
        positions[state] = { x, y };
      });
    });

    return positions;
  }

  return {
    EPSILON,
    EquationSyntaxError,
    compareLanguages,
    layoutAutomaton,
    mergeParallelTransitions,
    determinizeNfa,
    minimizeDfa,
    parseTransitionEquations,
    regexToMinimalDfa,
    regexToNfa,
    regexToPositionNfa,
  };
});
