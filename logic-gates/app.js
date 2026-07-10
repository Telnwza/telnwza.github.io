(() => {
  "use strict";

  const Engine = window.LogicEngine;
  const $ = (id) => document.getElementById(id);
  const svg = $("circuitCanvas");
  const nodeLayer = $("nodeLayer");
  const wireLayer = $("wireLayer");
  const wirePreviewLayer = $("wirePreviewLayer");
  const AUTO_SAVE_KEY = "logicGatesLabAutoV1";
  const SVG_NS = "http://www.w3.org/2000/svg";

  let project = emptyProject("Untitled Circuit");
  let selected = null;
  let tool = "select";
  let history = [];
  let future = [];
  let dragState = null;
  let panState = null;
  let wireState = null;
  let spacePressed = false;
  let toastTimer = null;
  let saveTimer = null;
  let lastInputToggleAt = 0;
  let currentEvaluation = { values: {}, validation: { valid: true, errors: [], warnings: [] } };
  let lastCircuitTable = null;
  let currentTruthRow = -1;
  let editableTable = { variables: ["A", "B"], output: "Y", values: ["0", "0", "0", "0"] };
  let lastSynthesis = null;
  let lastEquationAnalysis = null;
  const view = { x: 0, y: 0, width: 1000, height: 620, baseWidth: 1000 };

  function emptyProject(name) {
    return { schemaVersion: 1, name, nodes: [], wires: [] };
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function snapshot() {
    return JSON.stringify(project);
  }

  function restoreSnapshot(raw) {
    project = normalizeProject(JSON.parse(raw));
    selected = null;
    invalidateAnalysis();
  }

  function normalizeProject(raw) {
    const source = raw.project && Array.isArray(raw.project.nodes) ? raw.project : raw;
    if (!source || !Array.isArray(source.nodes) || !Array.isArray(source.wires)) {
      throw new Error("ไฟล์นี้ไม่ใช่โปรเจกต์ Logic Gates Lab");
    }
    return {
      schemaVersion: Number(source.schemaVersion) || 1,
      name: String(source.name || "Imported Circuit"),
      nodes: source.nodes.map((node) => ({
        id: String(node.id || uid("node")),
        type: String(node.type || "AND").toUpperCase(),
        label: String(node.label || node.type || "Gate"),
        x: Number(node.x) || 100,
        y: Number(node.y) || 100,
        value: node.value === 1 || node.value === "1" ? 1 : 0,
        inputCount: Number(node.inputCount) || undefined,
      })),
      wires: source.wires.map((wire) => ({
        id: String(wire.id || uid("wire")),
        from: { node: String(wire.from.node), port: "out" },
        to: { node: String(wire.to.node), port: String(wire.to.port || "in0") },
      })),
    };
  }

  function commit(mutator, message = "แก้ไขวงจรแล้ว") {
    history.push(snapshot());
    if (history.length > 100) history.shift();
    future = [];
    mutator();
    invalidateAnalysis();
    markChanged(message);
    render();
  }

  function invalidateAnalysis() {
    lastCircuitTable = null;
    currentTruthRow = -1;
  }

  function markChanged(message) {
    $("saveState").textContent = "กำลังบันทึก…";
    $("saveState").classList.add("unsaved");
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveAuto();
      $("saveState").textContent = "บันทึกอัตโนมัติแล้ว";
      $("saveState").classList.remove("unsaved");
    }, 180);
    if (message) setStatus(message);
  }

  function saveAuto() {
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(project));
    } catch (error) {
      showToast("เบราว์เซอร์ไม่อนุญาตให้บันทึกอัตโนมัติ");
    }
  }

  function undo() {
    if (!history.length) return showToast("ไม่มีรายการให้ Undo");
    future.push(snapshot());
    restoreSnapshot(history.pop());
    saveAuto();
    render();
    setStatus("Undo แล้ว");
  }

  function redo() {
    if (!future.length) return showToast("ไม่มีรายการให้ Redo");
    history.push(snapshot());
    restoreSnapshot(future.pop());
    saveAuto();
    render();
    setStatus("Redo แล้ว");
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function setStatus(message) {
    $("statusText").textContent = message;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeName(value) {
    return String(value || "logic-circuit")
      .trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "logic-circuit";
  }

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function nodeById(id) {
    return project.nodes.find((node) => node.id === id);
  }

  function nodeSize(node) {
    const inputs = Engine.inputCount(node);
    if (["INPUT", "OUTPUT", "CONST0", "CONST1"].includes(node.type)) return { width: 104, height: 68 };
    return { width: 116, height: Math.max(76, inputs * 24 + 22) };
  }

  function portPosition(node, kind, portIndex = 0) {
    const size = nodeSize(node);
    if (kind === "out") return { x: node.x + size.width / 2, y: node.y };
    const count = Engine.inputCount(node);
    const offset = ((portIndex + 1) / (count + 1) - 0.5) * size.height;
    return { x: node.x - size.width / 2, y: node.y + offset };
  }

  function snap(value) {
    return $("snapToggle").checked ? Math.round(value / 24) * 24 : Math.round(value);
  }

  function canvasPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
  }

  function signalClass(value) {
    if (value === 1) return "signal-one";
    if (value === 0) return "signal-zero";
    return "signal-x";
  }

  function displayValue(value) {
    return value === 1 ? "1" : value === 0 ? "0" : "X";
  }

  function wirePath(start, end) {
    const distance = Math.max(48, Math.abs(end.x - start.x) * 0.48);
    const direction = end.x >= start.x ? 1 : -1;
    return `M ${start.x} ${start.y} C ${start.x + distance * direction} ${start.y}, ${end.x - distance * direction} ${end.y}, ${end.x} ${end.y}`;
  }

  function render() {
    currentEvaluation = Engine.evaluateCircuit(project);
    $("projectName").value = project.name;
    setViewBox();
    renderWires();
    renderNodes();
    renderInspector();
    renderAnalysis();
    renderCircuitTruthTable();
    renderHistoryState();
    $("canvasEmpty").hidden = project.nodes.length > 0;
    $("countText").textContent = `${project.nodes.length} อุปกรณ์ · ${project.wires.length} สาย`;
  }

  function renderHistoryState() {
    $("undoBtn").disabled = history.length === 0;
    $("redoBtn").disabled = future.length === 0;
  }

  function renderWires() {
    wireLayer.replaceChildren();
    for (const wire of project.wires) {
      const fromNode = nodeById(wire.from.node);
      const toNode = nodeById(wire.to.node);
      if (!fromNode || !toNode) continue;
      const portIndex = Number(String(wire.to.port).replace("in", "")) || 0;
      const start = portPosition(fromNode, "out");
      const end = portPosition(toNode, "in", portIndex);
      const value = currentEvaluation.values[fromNode.id];
      const group = svgElement("g", {
        class: `wire-group ${signalClass(value)}${selected?.type === "wire" && selected.id === wire.id ? " selected" : ""}`,
        "data-wire-id": wire.id,
      });
      const pathData = wirePath(start, end);
      const hit = svgElement("path", { d: pathData, class: "circuit-wire-hit" });
      const path = svgElement("path", { d: pathData, class: "circuit-wire" });
      hit.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        selected = { type: "wire", id: wire.id };
        render();
      });
      group.append(hit, path);
      if ($("signalToggle").checked) {
        const label = svgElement("text", {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2 - 7,
          class: "wire-value",
          "text-anchor": "middle",
        });
        label.textContent = displayValue(value);
        group.append(label);
      }
      wireLayer.append(group);
    }
  }

  function renderNodes() {
    nodeLayer.replaceChildren();
    for (const node of project.nodes) {
      const size = nodeSize(node);
      const classes = ["logic-node"];
      if (node.type === "INPUT" || node.type.startsWith("CONST")) classes.push("input-node");
      if (node.type === "OUTPUT") classes.push("output-node");
      if (selected?.type === "node" && selected.id === node.id) classes.push("selected");
      const group = svgElement("g", {
        class: classes.join(" "),
        transform: `translate(${node.x} ${node.y})`,
        "data-node-id": node.id,
        role: "group",
        "aria-label": `${node.label} ${node.type}`,
      });
      const body = svgElement("rect", {
        x: -size.width / 2,
        y: -size.height / 2,
        width: size.width,
        height: size.height,
        rx: 14,
        class: "node-body",
      });
      body.addEventListener("pointerdown", (event) => startNodeDrag(event, node));
      group.append(body);

      const label = svgElement("text", { x: 0, y: -8, class: "node-label" });
      label.textContent = node.label;
      const type = svgElement("text", { x: 0, y: 12, class: "node-type" });
      type.textContent = node.type;
      group.append(label, type);

      if (["INPUT", "OUTPUT", "CONST0", "CONST1"].includes(node.type)) {
        const value = currentEvaluation.values[node.id];
        if (node.type === "INPUT") {
          const toggleHit = svgElement("rect", {
            x: -25,
            y: -3,
            width: 50,
            height: 29,
            rx: 8,
            class: "input-toggle-hit",
            role: "button",
            "aria-label": `สลับค่า ${node.label}`,
          });
          toggleHit.addEventListener("pointerdown", (event) => event.stopPropagation());
          toggleHit.addEventListener("click", (event) => {
            event.stopPropagation();
            requestInputToggle(node.id);
          });
          toggleHit.addEventListener("dblclick", (event) => event.stopPropagation());
          group.append(toggleHit);
        }
        const valueText = svgElement("text", {
          x: 0,
          y: 18,
          class: `node-value ${value === 1 ? "value-one" : value === null ? "value-x" : ""}`,
        });
        valueText.textContent = displayValue(value);
        label.setAttribute("y", -14);
        type.remove();
        group.append(valueText);
      }

      for (let index = 0; index < Engine.inputCount(node); index += 1) {
        const position = portPosition(node, "in", index);
        const port = svgElement("circle", {
          cx: position.x - node.x,
          cy: position.y - node.y,
          r: 7,
          class: "port input",
          "data-node-id": node.id,
          "data-port-index": index,
        });
        port.addEventListener("pointerdown", (event) => event.stopPropagation());
        group.append(port);
      }

      if (node.type !== "OUTPUT") {
        const value = currentEvaluation.values[node.id];
        const position = portPosition(node, "out");
        const port = svgElement("circle", {
          cx: position.x - node.x,
          cy: position.y - node.y,
          r: 7,
          class: `port output ${signalClass(value)}`,
          "data-node-id": node.id,
        });
        port.addEventListener("pointerdown", (event) => startWire(event, node.id));
        group.append(port);
      }
      nodeLayer.append(group);
    }
  }

  function renderInspector() {
    const inspector = $("inspector");
    const node = selected?.type === "node" ? nodeById(selected.id) : null;
    inspector.hidden = !node;
    if (!node) return;
    $("selectedType").textContent = node.type;
    $("nodeLabel").value = node.label;
    const variableInputs = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"].includes(node.type);
    $("inputCountField").hidden = !variableInputs;
    if (variableInputs) $("nodeInputCount").value = String(Engine.inputCount(node));
  }

  function renderAnalysis() {
    const validation = currentEvaluation.validation;
    const badge = $("validityBadge");
    const message = $("validationBox");
    badge.className = `validity-badge ${validation.valid ? "valid" : "invalid"}`;
    badge.textContent = validation.valid ? "วงจรถูกต้อง" : `${validation.errors.length} ปัญหา`;
    message.className = `message-box ${validation.valid ? "valid" : "invalid"}`;
    if (validation.errors.length) {
      message.innerHTML = validation.errors.slice(0, 3).map((item) => `• ${escapeHtml(item)}`).join("<br>");
    } else if (validation.warnings.length) {
      message.innerHTML = validation.warnings.slice(0, 3).map((item) => `• ${escapeHtml(item)}`).join("<br>");
    } else {
      message.textContent = "วงจรพร้อมจำลองและสร้าง Truth Table";
    }

    const outputs = project.nodes.filter((node) => node.type === "OUTPUT").sort((a, b) => a.y - b.y);
    $("outputSummary").innerHTML = outputs.length
      ? outputs.map((node) => {
        const value = currentEvaluation.values[node.id];
        return `<div class="output-card ${value === 1 ? "value-one" : value === 0 ? "value-zero" : ""}"><span>${escapeHtml(node.label)}</span><strong>${displayValue(value)}</strong></div>`;
      }).join("")
      : '<p class="muted-copy">ยังไม่มี Output</p>';

    const expressions = Engine.circuitExpressions(project);
    let simplifiedByOutput = new Map();
    try {
      const table = Engine.truthTableForCircuit(project);
      table.outputs.forEach((output, index) => {
        const values = table.rows.map((row) => displayValue(row.outputs[index]));
        if (values.every((value) => value === "0" || value === "1")) {
          simplifiedByOutput.set(output.id, Engine.minimizeTruthTable(table.inputs.map((input) => input.label), values).sop);
        }
      });
    } catch (error) {
      simplifiedByOutput = new Map();
    }
    $("expressionList").innerHTML = expressions.length
      ? expressions.map((item) => `
        <div class="expression-card">
          <span>${escapeHtml(item.label)} = วงจร</span>
          <code>${escapeHtml(item.expression)}</code>
          ${simplifiedByOutput.has(item.id) ? `<span>ย่อแล้ว</span><code>${escapeHtml(simplifiedByOutput.get(item.id))}</code>` : ""}
        </div>`).join("")
      : '<p class="muted-copy">ต่อสายเข้า Output เพื่อดูสมการ</p>';
  }

  function renderCircuitTruthTable() {
    const wrap = $("circuitTableWrap");
    if (!lastCircuitTable) {
      wrap.replaceChildren();
      return;
    }
    wrap.innerHTML = truthTableHtml(lastCircuitTable, currentTruthRow);
    wrap.querySelectorAll("tbody tr").forEach((row) => {
      row.addEventListener("click", () => applyTruthRow(Number(row.dataset.rowIndex)));
    });
  }

  function truthTableHtml(table, activeRow = -1) {
    const headings = [
      ...table.inputs.map((input) => `<th scope="col">${escapeHtml(input.label)}</th>`),
      ...table.outputs.map((output) => `<th scope="col">${escapeHtml(output.label)}</th>`),
    ].join("");
    const rows = table.rows.map((row, index) => {
      const inputCells = row.inputs.map((value) => `<td>${value}</td>`).join("");
      const outputCells = row.outputs.map((value) => `<td class="output-cell ${signalClass(value).replace("signal-", "value-")}">${displayValue(value)}</td>`).join("");
      return `<tr data-row-index="${index}" class="${index === activeRow ? "current-row" : ""}">${inputCells}${outputCells}</tr>`;
    }).join("");
    return `<table class="logic-table"><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function addNode(type, x, y) {
    const labels = {
      INPUT: nextLabel("INPUT", "A"), OUTPUT: nextLabel("OUTPUT", "Y"),
      CONST0: "0", CONST1: "1", AND: "AND", OR: "OR", NOT: "NOT",
      NAND: "NAND", NOR: "NOR", XOR: "XOR", XNOR: "XNOR",
    };
    const node = {
      id: uid("node"), type, label: labels[type] || type,
      x: snap(x), y: snap(y), value: 0,
      inputCount: ["NOT", "OUTPUT"].includes(type) ? 1 : ["INPUT", "CONST0", "CONST1"].includes(type) ? 0 : 2,
    };
    commit(() => {
      project.nodes.push(node);
      selected = { type: "node", id: node.id };
    }, `เพิ่ม ${type}`);
    return node;
  }

  function nextLabel(type, fallback) {
    const used = new Set(project.nodes.filter((node) => node.type === type).map((node) => node.label));
    const sequence = type === "INPUT" ? ["A", "B", "C", "D", "E", "F"] : ["Y", "Z", "Q"];
    return sequence.find((label) => !used.has(label)) || `${fallback}${used.size + 1}`;
  }

  function startNodeDrag(event, node) {
    event.stopPropagation();
    if (event.button !== 0 || spacePressed) return;
    selected = { type: "node", id: node.id };
    const point = canvasPoint(event);
    dragState = {
      id: node.id,
      startX: node.x,
      startY: node.y,
      pointerX: point.x,
      pointerY: point.y,
      before: snapshot(),
      moved: false,
    };
    renderInspector();
  }

  function moveNode(event) {
    if (!dragState) return;
    const node = nodeById(dragState.id);
    if (!node) return;
    const point = canvasPoint(event);
    const nextX = snap(dragState.startX + point.x - dragState.pointerX);
    const nextY = snap(dragState.startY + point.y - dragState.pointerY);
    if (nextX === node.x && nextY === node.y) return;
    if (!dragState.moved) {
      history.push(dragState.before);
      future = [];
      dragState.moved = true;
    }
    node.x = nextX;
    node.y = nextY;
    renderWires();
    renderNodes();
  }

  function finishNodeDrag() {
    if (!dragState) return;
    const finishedDrag = dragState;
    const node = nodeById(finishedDrag.id);
    dragState = null;
    if (finishedDrag.moved) {
      invalidateAnalysis();
      markChanged("ย้ายอุปกรณ์แล้ว");
      render();
    } else if (node?.type === "INPUT") {
      requestInputToggle(node.id);
    } else {
      render();
    }
  }

  function startWire(event, nodeId) {
    event.stopPropagation();
    event.preventDefault();
    const node = nodeById(nodeId);
    if (!node || node.type === "OUTPUT") return;
    wireState = { nodeId, start: portPosition(node, "out"), end: portPosition(node, "out") };
    setStatus("ลากไปยัง input port ที่ต้องการ");
    renderWirePreview();
  }

  function moveWire(event) {
    if (!wireState) return;
    wireState.end = canvasPoint(event);
    document.querySelectorAll(".port.input.is-target").forEach((port) => port.classList.remove("is-target"));
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".port.input");
    if (target) target.classList.add("is-target");
    renderWirePreview();
  }

  function renderWirePreview() {
    wirePreviewLayer.replaceChildren();
    if (!wireState) return;
    wirePreviewLayer.append(svgElement("path", {
      d: wirePath(wireState.start, wireState.end),
      class: "preview-wire",
    }));
  }

  function finishWire(event) {
    if (!wireState) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".port.input");
    document.querySelectorAll(".port.input.is-target").forEach((port) => port.classList.remove("is-target"));
    if (target) {
      const toNode = target.dataset.nodeId;
      const portIndex = Number(target.dataset.portIndex) || 0;
      connectNodes(wireState.nodeId, toNode, portIndex);
    } else {
      setStatus("ยกเลิกการต่อสาย");
    }
    wireState = null;
    wirePreviewLayer.replaceChildren();
  }

  function connectNodes(fromId, toId, portIndex) {
    if (fromId === toId) return showToast("ไม่สามารถต่อสายกลับเข้าอุปกรณ์ตัวเดิม");
    const destination = nodeById(toId);
    if (!destination || portIndex >= Engine.inputCount(destination)) return;
    const portName = `in${portIndex}`;
    commit(() => {
      project.wires = project.wires.filter((wire) => !(wire.to.node === toId && wire.to.port === portName));
      project.wires.push({ id: uid("wire"), from: { node: fromId, port: "out" }, to: { node: toId, port: portName } });
      selected = null;
    }, `ต่อสายเข้า ${destination.label}`);
  }

  function toggleInput(id) {
    const node = nodeById(id);
    if (!node || node.type !== "INPUT") return;
    node.value = node.value ? 0 : 1;
    saveAuto();
    currentTruthRow = -1;
    render();
    setStatus(`${node.label} = ${node.value}`);
  }

  function requestInputToggle(id) {
    const now = Date.now();
    if (now - lastInputToggleAt < 220) return;
    lastInputToggleAt = now;
    toggleInput(id);
  }

  function deleteSelection() {
    if (!selected) return;
    commit(() => {
      if (selected.type === "node") {
        project.nodes = project.nodes.filter((node) => node.id !== selected.id);
        project.wires = project.wires.filter((wire) => wire.from.node !== selected.id && wire.to.node !== selected.id);
      } else {
        project.wires = project.wires.filter((wire) => wire.id !== selected.id);
      }
      selected = null;
    }, "ลบรายการที่เลือกแล้ว");
  }

  function duplicateSelection() {
    if (selected?.type !== "node") return;
    const source = nodeById(selected.id);
    if (!source) return;
    commit(() => {
      const copy = { ...deepCopy(source), id: uid("node"), x: source.x + 48, y: source.y + 48, label: `${source.label} copy` };
      project.nodes.push(copy);
      selected = { type: "node", id: copy.id };
    }, `Duplicate ${source.label}`);
  }

  function setTool(nextTool) {
    tool = nextTool;
    $("selectTool").classList.toggle("active", tool === "select");
    $("wireTool").classList.toggle("active", tool === "wire");
    $("selectTool").setAttribute("aria-pressed", String(tool === "select"));
    $("wireTool").setAttribute("aria-pressed", String(tool === "wire"));
    $("modeBadge").textContent = tool === "select" ? "โหมดเลือก / ลาก" : "โหมดต่อสาย";
    setStatus(tool === "select" ? "ลากเพื่อย้ายอุปกรณ์" : "ลากจาก output port ไป input port");
  }

  function setViewBox() {
    svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
    $("zoomLabel").textContent = `${Math.round((view.baseWidth / view.width) * 100)}%`;
  }

  function zoom(factor, center = null) {
    const nextWidth = Math.max(320, Math.min(3200, view.width * factor));
    const nextHeight = nextWidth * 0.62;
    const cx = center?.x ?? view.x + view.width / 2;
    const cy = center?.y ?? view.y + view.height / 2;
    const ratioX = (cx - view.x) / view.width;
    const ratioY = (cy - view.y) / view.height;
    view.x = cx - nextWidth * ratioX;
    view.y = cy - nextHeight * ratioY;
    view.width = nextWidth;
    view.height = nextHeight;
    setViewBox();
  }

  function fitCircuit() {
    if (!project.nodes.length) {
      Object.assign(view, { x: 0, y: 0, width: 1000, height: 620 });
      return setViewBox();
    }
    const boxes = project.nodes.map((node) => {
      const size = nodeSize(node);
      return { left: node.x - size.width / 2, right: node.x + size.width / 2, top: node.y - size.height / 2, bottom: node.y + size.height / 2 };
    });
    const left = Math.min(...boxes.map((box) => box.left)) - 90;
    const right = Math.max(...boxes.map((box) => box.right)) + 90;
    const top = Math.min(...boxes.map((box) => box.top)) - 90;
    const bottom = Math.max(...boxes.map((box) => box.bottom)) + 90;
    const width = Math.max(520, right - left);
    const height = Math.max(322, bottom - top);
    const targetRatio = 1000 / 620;
    if (width / height > targetRatio) {
      view.width = width;
      view.height = width / targetRatio;
      view.x = left;
      view.y = top - (view.height - height) / 2;
    } else {
      view.height = height;
      view.width = height * targetRatio;
      view.y = top;
      view.x = left - (view.width - width) / 2;
    }
    setViewBox();
    setStatus("จัดวงจรให้อยู่กลางจอแล้ว");
  }

  function startPan(event) {
    if (!(spacePressed || event.button === 1)) return false;
    event.preventDefault();
    panState = { clientX: event.clientX, clientY: event.clientY, x: view.x, y: view.y };
    return true;
  }

  function movePan(event) {
    if (!panState) return;
    const rect = svg.getBoundingClientRect();
    view.x = panState.x - (event.clientX - panState.clientX) * (view.width / rect.width);
    view.y = panState.y - (event.clientY - panState.clientY) * (view.height / rect.height);
    setViewBox();
  }

  function finishPan() {
    panState = null;
  }

  function generateCircuitTruthTable() {
    try {
      lastCircuitTable = Engine.truthTableForCircuit(project);
      currentTruthRow = inputRowIndex(lastCircuitTable);
      renderCircuitTruthTable();
      showTab("analysis");
      setStatus(`สร้าง Truth Table ${lastCircuitTable.rows.length} แถวแล้ว`);
    } catch (error) {
      showToast(error.message);
    }
  }

  function inputRowIndex(table) {
    const inputNodes = table.inputs.map((input) => nodeById(input.id));
    return inputNodes.reduce((number, node) => number * 2 + (node?.value ? 1 : 0), 0);
  }

  function applyTruthRow(index) {
    if (!lastCircuitTable || !lastCircuitTable.rows[index]) return;
    const row = lastCircuitTable.rows[index];
    lastCircuitTable.inputs.forEach((input, inputIndex) => {
      const node = nodeById(input.id);
      if (node) node.value = row.inputs[inputIndex];
    });
    currentTruthRow = index;
    saveAuto();
    currentEvaluation = Engine.evaluateCircuit(project);
    renderWires();
    renderNodes();
    renderAnalysis();
    renderCircuitTruthTable();
    setStatus(`กำลังดู Truth Table แถวที่ ${index + 1}`);
  }

  function stepTruthTable(direction) {
    if (!lastCircuitTable) generateCircuitTruthTable();
    if (!lastCircuitTable) return;
    const length = lastCircuitTable.rows.length;
    const next = currentTruthRow < 0 ? 0 : (currentTruthRow + direction + length) % length;
    applyTruthRow(next);
  }

  function buildEditableTable(reset = true) {
    const variables = parseVariables($("synthVariables").value);
    const output = $("synthOutput").value.trim() || "Y";
    const rowCount = 2 ** variables.length;
    editableTable = {
      variables,
      output,
      values: reset || editableTable.values.length !== rowCount ? Array(rowCount).fill("0") : editableTable.values,
    };
    lastSynthesis = null;
    $("synthesisResult").hidden = true;
    renderEditableTable();
  }

  function parseVariables(value) {
    const variables = String(value).split(",").map((item) => item.trim()).filter(Boolean);
    if (!variables.length) throw new Error("กรุณาใส่ชื่อตัวแปรอย่างน้อย 1 ตัว");
    if (variables.length > 6) throw new Error("รองรับสูงสุด 6 ตัวแปร");
    if (new Set(variables).size !== variables.length) throw new Error("ชื่อตัวแปรต้องไม่ซ้ำกัน");
    if (variables.some((variable) => !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(variable))) {
      throw new Error("ชื่อตัวแปรใช้ตัวอักษร ตัวเลข และ underscore โดยต้องไม่ขึ้นต้นด้วยตัวเลข");
    }
    return variables;
  }

  function renderEditableTable() {
    const headings = [...editableTable.variables, editableTable.output].map((name) => `<th scope="col">${escapeHtml(name)}</th>`).join("");
    const rows = editableTable.values.map((value, row) => {
      const inputs = editableTable.variables.map((_, index) => `<td>${(row >> (editableTable.variables.length - index - 1)) & 1}</td>`).join("");
      return `<tr>${inputs}<td><button type="button" class="truth-value-button" data-synth-row="${row}" data-value="${value}" aria-label="เปลี่ยนค่า output แถว ${row + 1}">${value}</button></td></tr>`;
    }).join("");
    $("editableTableWrap").innerHTML = `<table class="logic-table"><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>`;
    $("editableTableWrap").querySelectorAll("[data-synth-row]").forEach((button) => {
      button.addEventListener("click", () => cycleTruthValue(Number(button.dataset.synthRow)));
    });
  }

  function cycleTruthValue(index) {
    const cycle = { "0": "1", "1": "X", X: "0" };
    editableTable.values[index] = cycle[editableTable.values[index]];
    lastSynthesis = null;
    $("synthesisResult").hidden = true;
    renderEditableTable();
  }

  function calculateSynthesis() {
    try {
      buildEditableTable(false);
      lastSynthesis = Engine.minimizeTruthTable(editableTable.variables, editableTable.values);
      $("canonicalSop").textContent = lastSynthesis.canonicalSop;
      $("simplifiedSop").textContent = lastSynthesis.sop;
      $("simplifiedPos").textContent = lastSynthesis.pos;
      $("mintermInfo").textContent = `Σm(${lastSynthesis.minterms.join(", ") || "–"})${lastSynthesis.dontCares.length ? ` · d(${lastSynthesis.dontCares.join(", ")})` : ""}`;
      $("synthesisResult").hidden = false;
      $("synthesisError").textContent = "";
      setStatus("คำนวณและย่อสมการแล้ว");
      return lastSynthesis;
    } catch (error) {
      $("synthesisError").textContent = error.message;
      return null;
    }
  }

  function createCircuitFromSynthesis(analysis, variables, outputName, projectName) {
    if (!analysis) return;
    const next = emptyProject(projectName || `${outputName} from Truth Table`);
    const nodesByVariable = new Map();
    const negatedByVariable = new Map();
    const spacing = Math.max(95, 560 / Math.max(variables.length, 1));

    variables.forEach((variable, index) => {
      const node = makeNode("INPUT", variable, 90, 100 + index * spacing, 0, 0);
      next.nodes.push(node);
      nodesByVariable.set(variable, node);
    });

    const addWireTo = (source, target, port) => next.wires.push(makeWire(source.id, target.id, port));
    let finalSource = null;

    if (analysis.special === "XOR" || analysis.special === "XNOR") {
      const gate = makeNode(analysis.special, analysis.special, 500, 300, 0, variables.length);
      next.nodes.push(gate);
      variables.forEach((variable, index) => addWireTo(nodesByVariable.get(variable), gate, index));
      finalSource = gate;
    } else if (!analysis.minterms.length) {
      finalSource = makeNode("CONST0", "0", 520, 300, 0, 0);
      next.nodes.push(finalSource);
    } else if (!analysis.maxterms.length) {
      finalSource = makeNode("CONST1", "1", 520, 300, 1, 0);
      next.nodes.push(finalSource);
    } else {
      const neededNegations = new Set();
      analysis.sopPatterns.forEach((pattern) => {
        [...pattern].forEach((bit, index) => { if (bit === "0") neededNegations.add(variables[index]); });
      });
      for (const variable of neededNegations) {
        const source = nodesByVariable.get(variable);
        const not = makeNode("NOT", `¬${variable}`, 300, source.y, 0, 1);
        next.nodes.push(not);
        addWireTo(source, not, 0);
        negatedByVariable.set(variable, not);
      }

      const termSources = [];
      const termSpacing = Math.max(92, 620 / Math.max(analysis.sopPatterns.length, 1));
      analysis.sopPatterns.forEach((pattern, termIndex) => {
        const literals = [...pattern].flatMap((bit, index) => {
          if (bit === "-") return [];
          const variable = variables[index];
          return [bit === "1" ? nodesByVariable.get(variable) : negatedByVariable.get(variable)];
        });
        if (!literals.length) {
          const constant = makeNode("CONST1", "1", 510, 90 + termIndex * termSpacing, 1, 0);
          next.nodes.push(constant);
          termSources.push(constant);
        } else if (literals.length === 1) {
          termSources.push(literals[0]);
        } else {
          const gate = makeNode("AND", `Term ${termIndex + 1}`, 520, 90 + termIndex * termSpacing, 0, literals.length);
          next.nodes.push(gate);
          literals.forEach((source, index) => addWireTo(source, gate, index));
          termSources.push(gate);
        }
      });
      finalSource = combineSources(next, "OR", termSources, 720);
    }

    const output = makeNode("OUTPUT", outputName || "Y", Math.max(900, finalSource.x + 180), finalSource.y, 0, 1);
    next.nodes.push(output);
    next.wires.push(makeWire(finalSource.id, output.id, 0));

    commit(() => {
      project = next;
      selected = null;
    }, "สร้างวงจรจาก Truth Table แล้ว");
    window.setTimeout(fitCircuit, 0);
    showToast("สร้างวงจรจากสมการที่ย่อแล้วเรียบร้อย");
  }

  function combineSources(next, type, sources, startX) {
    let layer = sources.map((node) => ({ node, y: node.y }));
    let x = startX;
    let layerNumber = 1;
    while (layer.length > 1) {
      const combined = [];
      for (let index = 0; index < layer.length; index += 4) {
        const chunk = layer.slice(index, index + 4);
        if (chunk.length === 1) {
          combined.push(chunk[0]);
          continue;
        }
        const y = chunk.reduce((sum, item) => sum + item.y, 0) / chunk.length;
        const gate = makeNode(type, `${type} ${layerNumber}.${combined.length + 1}`, x, y, 0, chunk.length);
        next.nodes.push(gate);
        chunk.forEach((item, port) => next.wires.push(makeWire(item.node.id, gate.id, port)));
        combined.push({ node: gate, y });
      }
      layer = combined;
      x += 160;
      layerNumber += 1;
    }
    return layer[0].node;
  }

  function makeNode(type, label, x, y, value = 0, inputCount = 2) {
    return { id: uid("node"), type, label, x, y, value, inputCount };
  }

  function makeWire(from, to, port = 0) {
    return { id: uid("wire"), from: { node: from, port: "out" }, to: { node: to, port: `in${port}` } };
  }

  function analyzeEquation() {
    try {
      lastEquationAnalysis = Engine.analyzeExpression($("equationInput").value);
      $("equationVariables").textContent = lastEquationAnalysis.variables.join(", ");
      $("equationSop").textContent = lastEquationAnalysis.minimized.sop;
      $("equationPos").textContent = lastEquationAnalysis.minimized.pos;
      $("equationResult").hidden = false;
      $("equationError").textContent = "";
      const table = {
        inputs: lastEquationAnalysis.variables.map((label) => ({ label })),
        outputs: [{ label: "Y" }],
        rows: lastEquationAnalysis.values.map((value, row) => ({
          inputs: lastEquationAnalysis.variables.map((_, index) => (row >> (lastEquationAnalysis.variables.length - index - 1)) & 1),
          outputs: [Number(value)],
        })),
      };
      $("equationTableWrap").innerHTML = truthTableHtml(table);
      setStatus("คำนวณสมการและสร้าง Truth Table แล้ว");
      return lastEquationAnalysis;
    } catch (error) {
      $("equationError").textContent = error.message;
      $("equationResult").hidden = true;
      $("equationTableWrap").replaceChildren();
      return null;
    }
  }

  function showTab(name) {
    document.querySelectorAll(".analysis-tabs button").forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.hidden = panel.id !== `tab-${name}`;
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJson() {
    const payload = { ...deepCopy(project), exportedAt: new Date().toISOString() };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeName(project.name)}.json`);
    showToast("Export โปรเจกต์ JSON แล้ว");
  }

  function exportedSvgText() {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", SVG_NS);
    clone.setAttribute("width", "1600");
    clone.setAttribute("height", "992");
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = `
      .small-grid-line,.large-grid-line{fill:none;stroke:#17263a;stroke-width:1}.large-grid-line{stroke:#20334a;stroke-width:1.4}
      .grid-background{fill:#07101d}.circuit-wire{fill:none;stroke:#7f92ad;stroke-width:3}.signal-one .circuit-wire{stroke:#37d4b6}.signal-x .circuit-wire{stroke:#f4c95d;stroke-dasharray:7 6}.circuit-wire-hit{display:none}.wire-value{fill:#eef4ff;font:800 12px sans-serif;paint-order:stroke;stroke:#07101d;stroke-width:5}
      .node-body{fill:#101d2f;stroke:#4a607b;stroke-width:2}.input-node .node-body{fill:#162235;stroke:#7a6a3d}.output-node .node-body{fill:#1b1c35;stroke:#625889}.node-label,.node-type,.node-value{fill:#eef4ff;text-anchor:middle;font-family:sans-serif}.node-label{font-size:13px;font-weight:800}.node-type{fill:#91a5c2;font-size:10px}.node-value{font:900 20px monospace}.value-one{fill:#37d4b6}.value-x{fill:#f4c95d}.port{fill:#07101d;stroke:#a8b7ca;stroke-width:2.5}.port.signal-one{fill:#37d4b6}.port.signal-x{fill:#f4c95d}
    `;
    clone.prepend(style);
    return new XMLSerializer().serializeToString(clone);
  }

  function exportSvg() {
    downloadBlob(new Blob([exportedSvgText()], { type: "image/svg+xml;charset=utf-8" }), `${safeName(project.name)}.svg`);
    showToast("Export ภาพ SVG แล้ว");
  }

  function exportPng() {
    const blob = new Blob([exportedSvgText()], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 992;
      const context = canvas.getContext("2d");
      context.fillStyle = "#07101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((png) => {
        if (png) downloadBlob(png, `${safeName(project.name)}.png`);
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      showToast("ไม่สามารถสร้าง PNG ได้ กรุณาใช้ SVG แทน");
    };
    image.src = url;
  }

  function tableAsCsv(table) {
    const header = [...table.inputs, ...table.outputs].map((item) => item.label).join(",");
    const rows = table.rows.map((row) => [...row.inputs, ...row.outputs.map(displayValue)].join(","));
    return [header, ...rows].join("\n");
  }

  function tableAsMarkdown(table) {
    const labels = [...table.inputs, ...table.outputs].map((item) => item.label);
    const head = `| ${labels.join(" | ")} |`;
    const divider = `| ${labels.map(() => "---").join(" | ")} |`;
    const rows = table.rows.map((row) => `| ${[...row.inputs, ...row.outputs.map(displayValue)].join(" | ")} |`);
    return [head, divider, ...rows].join("\n");
  }

  function ensureCircuitTable() {
    if (!lastCircuitTable) generateCircuitTruthTable();
    return lastCircuitTable;
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast(successMessage);
  }

  function loadPreset(name, pushHistory = true) {
    const preset = presets()[name];
    if (!preset) return;
    const apply = () => {
      project = preset;
      selected = null;
    };
    if (pushHistory) commit(apply, `โหลดตัวอย่าง ${preset.name}`);
    else {
      apply();
      saveAuto();
      render();
    }
    window.setTimeout(fitCircuit, 0);
  }

  function presets() {
    return {
      "half-adder": buildHalfAdder(),
      "full-adder": buildFullAdder(),
      mux: buildMux(),
      majority: buildMajority(),
    };
  }

  function buildHalfAdder() {
    const next = emptyProject("Half Adder");
    const a = makeNode("INPUT", "A", 100, 190, 0, 0);
    const b = makeNode("INPUT", "B", 100, 410, 0, 0);
    const xor = makeNode("XOR", "XOR", 480, 220, 0, 2);
    const and = makeNode("AND", "AND", 480, 390, 0, 2);
    const sum = makeNode("OUTPUT", "Sum", 830, 220, 0, 1);
    const carry = makeNode("OUTPUT", "Carry", 830, 390, 0, 1);
    next.nodes.push(a, b, xor, and, sum, carry);
    next.wires.push(
      makeWire(a.id, xor.id, 0), makeWire(b.id, xor.id, 1), makeWire(xor.id, sum.id, 0),
      makeWire(a.id, and.id, 0), makeWire(b.id, and.id, 1), makeWire(and.id, carry.id, 0),
    );
    return next;
  }

  function buildFullAdder() {
    const next = emptyProject("Full Adder");
    const a = makeNode("INPUT", "A", 80, 130, 0, 0);
    const b = makeNode("INPUT", "B", 80, 300, 0, 0);
    const cin = makeNode("INPUT", "Cin", 80, 490, 0, 0);
    const xor1 = makeNode("XOR", "A⊕B", 340, 190, 0, 2);
    const xor2 = makeNode("XOR", "SUM", 610, 170, 0, 2);
    const and1 = makeNode("AND", "AB", 340, 360, 0, 2);
    const and2 = makeNode("AND", "Cin(A⊕B)", 610, 390, 0, 2);
    const or = makeNode("OR", "CARRY", 820, 360, 0, 2);
    const sum = makeNode("OUTPUT", "Sum", 900, 150, 0, 1);
    const carry = makeNode("OUTPUT", "Cout", 1030, 360, 0, 1);
    next.nodes.push(a, b, cin, xor1, xor2, and1, and2, or, sum, carry);
    next.wires.push(
      makeWire(a.id, xor1.id, 0), makeWire(b.id, xor1.id, 1),
      makeWire(xor1.id, xor2.id, 0), makeWire(cin.id, xor2.id, 1), makeWire(xor2.id, sum.id, 0),
      makeWire(a.id, and1.id, 0), makeWire(b.id, and1.id, 1),
      makeWire(xor1.id, and2.id, 0), makeWire(cin.id, and2.id, 1),
      makeWire(and1.id, or.id, 0), makeWire(and2.id, or.id, 1), makeWire(or.id, carry.id, 0),
    );
    return next;
  }

  function buildMux() {
    const next = emptyProject("2:1 Multiplexer");
    const d0 = makeNode("INPUT", "D0", 80, 120, 0, 0);
    const d1 = makeNode("INPUT", "D1", 80, 300, 0, 0);
    const s = makeNode("INPUT", "S", 80, 500, 0, 0);
    const not = makeNode("NOT", "¬S", 310, 500, 0, 1);
    const and0 = makeNode("AND", "D0¬S", 500, 170, 0, 2);
    const and1 = makeNode("AND", "D1S", 500, 360, 0, 2);
    const or = makeNode("OR", "MUX", 740, 270, 0, 2);
    const y = makeNode("OUTPUT", "Y", 930, 270, 0, 1);
    next.nodes.push(d0, d1, s, not, and0, and1, or, y);
    next.wires.push(
      makeWire(s.id, not.id, 0), makeWire(d0.id, and0.id, 0), makeWire(not.id, and0.id, 1),
      makeWire(d1.id, and1.id, 0), makeWire(s.id, and1.id, 1),
      makeWire(and0.id, or.id, 0), makeWire(and1.id, or.id, 1), makeWire(or.id, y.id, 0),
    );
    return next;
  }

  function buildMajority() {
    const next = emptyProject("3-input Majority Vote");
    const a = makeNode("INPUT", "A", 70, 120, 0, 0);
    const b = makeNode("INPUT", "B", 70, 300, 0, 0);
    const c = makeNode("INPUT", "C", 70, 500, 0, 0);
    const ab = makeNode("AND", "AB", 410, 130, 0, 2);
    const ac = makeNode("AND", "AC", 410, 310, 0, 2);
    const bc = makeNode("AND", "BC", 410, 490, 0, 2);
    const or = makeNode("OR", "Majority", 720, 310, 0, 3);
    const y = makeNode("OUTPUT", "Y", 930, 310, 0, 1);
    next.nodes.push(a, b, c, ab, ac, bc, or, y);
    next.wires.push(
      makeWire(a.id, ab.id, 0), makeWire(b.id, ab.id, 1),
      makeWire(a.id, ac.id, 0), makeWire(c.id, ac.id, 1),
      makeWire(b.id, bc.id, 0), makeWire(c.id, bc.id, 1),
      makeWire(ab.id, or.id, 0), makeWire(ac.id, or.id, 1), makeWire(bc.id, or.id, 2),
      makeWire(or.id, y.id, 0),
    );
    return next;
  }

  function bindEvents() {
    $("selectTool").addEventListener("click", () => setTool("select"));
    $("wireTool").addEventListener("click", () => setTool("wire"));
    $("undoBtn").addEventListener("click", undo);
    $("redoBtn").addEventListener("click", redo);
    $("saveBtn").addEventListener("click", () => {
      saveAuto();
      showToast("บันทึกโปรเจกต์ไว้ในเบราว์เซอร์แล้ว");
    });
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("exportSvgBtn").addEventListener("click", exportSvg);
    $("exportPngBtn").addEventListener("click", exportPng);
    $("truthTableBtn").addEventListener("click", generateCircuitTruthTable);
    $("stepPrevBtn").addEventListener("click", () => stepTruthTable(-1));
    $("stepNextBtn").addEventListener("click", () => stepTruthTable(1));
    $("exportCsvBtn").addEventListener("click", () => {
      const table = ensureCircuitTable();
      if (table) downloadBlob(new Blob([tableAsCsv(table)], { type: "text/csv;charset=utf-8" }), `${safeName(project.name)}-truth-table.csv`);
    });
    $("copyMarkdownBtn").addEventListener("click", () => {
      const table = ensureCircuitTable();
      if (table) copyText(tableAsMarkdown(table), "คัดลอก Truth Table แบบ Markdown แล้ว");
    });
    $("zoomInBtn").addEventListener("click", () => zoom(0.82));
    $("zoomOutBtn").addEventListener("click", () => zoom(1.22));
    $("fitBtn").addEventListener("click", fitCircuit);
    $("signalToggle").addEventListener("change", renderWires);
    $("deleteBtn").addEventListener("click", deleteSelection);
    $("duplicateBtn").addEventListener("click", duplicateSelection);
    $("clearBtn").addEventListener("click", () => {
      if (!project.nodes.length || window.confirm("ล้างอุปกรณ์และสายทั้งหมดหรือไม่? สามารถ Undo ได้")) {
        commit(() => {
          project.nodes = [];
          project.wires = [];
          selected = null;
        }, "ล้างวงจรแล้ว");
      }
    });

    $("projectName").addEventListener("change", (event) => {
      project.name = event.target.value.trim() || "Untitled Circuit";
      markChanged("เปลี่ยนชื่อโปรเจกต์แล้ว");
    });
    $("nodeLabel").addEventListener("change", (event) => {
      const node = selected?.type === "node" ? nodeById(selected.id) : null;
      if (!node) return;
      const label = event.target.value.trim() || node.type;
      commit(() => { node.label = label; }, "เปลี่ยนชื่ออุปกรณ์แล้ว");
    });
    $("nodeInputCount").addEventListener("change", (event) => {
      const node = selected?.type === "node" ? nodeById(selected.id) : null;
      if (!node) return;
      const count = Number(event.target.value);
      commit(() => {
        node.inputCount = count;
        project.wires = project.wires.filter((wire) => wire.to.node !== node.id || Number(wire.to.port.replace("in", "")) < count);
      }, `ตั้ง ${node.label} เป็น ${count} inputs`);
    });

    document.querySelectorAll("[data-component]").forEach((button) => {
      button.addEventListener("click", () => addNode(button.dataset.component, view.x + view.width / 2, view.y + view.height / 2));
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/logic-component", button.dataset.component);
        event.dataTransfer.effectAllowed = "copy";
      });
    });
    document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => loadPreset(button.dataset.preset)));
    document.querySelectorAll(".analysis-tabs button").forEach((button) => button.addEventListener("click", () => showTab(button.dataset.tab)));

    $("buildEditableTableBtn").addEventListener("click", () => {
      try {
        buildEditableTable(true);
        $("synthesisError").textContent = "";
      } catch (error) {
        $("synthesisError").textContent = error.message;
      }
    });
    $("calculateTableBtn").addEventListener("click", calculateSynthesis);
    $("generateCircuitBtn").addEventListener("click", () => {
      const result = lastSynthesis || calculateSynthesis();
      if (result) createCircuitFromSynthesis(result, editableTable.variables, editableTable.output, `${editableTable.output} from Truth Table`);
    });
    $("analyzeEquationBtn").addEventListener("click", analyzeEquation);
    $("equationToCircuitBtn").addEventListener("click", () => {
      const result = lastEquationAnalysis || analyzeEquation();
      if (result) createCircuitFromSynthesis(result.minimized, result.variables, "Y", "Circuit from Boolean Expression");
    });

    $("importFile").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const imported = normalizeProject(JSON.parse(await file.text()));
        commit(() => {
          project = imported;
          selected = null;
        }, "Import โปรเจกต์แล้ว");
        fitCircuit();
        showToast("นำเข้าโปรเจกต์เรียบร้อย");
      } catch (error) {
        showToast(error.message);
      } finally {
        event.target.value = "";
      }
    });

    svg.addEventListener("pointerdown", (event) => {
      if (startPan(event)) return;
      if (event.target === svg || event.target.id === "gridBackground") {
        selected = null;
        render();
      }
    });
    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? 1.12 : 0.89, canvasPoint(event));
    }, { passive: false });
    svg.addEventListener("dragover", (event) => {
      if (event.dataTransfer.types.includes("text/logic-component")) event.preventDefault();
    });
    svg.addEventListener("drop", (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("text/logic-component");
      if (type) {
        const point = canvasPoint(event);
        addNode(type, point.x, point.y);
      }
    });

    window.addEventListener("pointermove", (event) => {
      moveNode(event);
      moveWire(event);
      movePan(event);
    });
    window.addEventListener("pointerup", (event) => {
      finishNodeDrag();
      finishWire(event);
      finishPan();
    });
    window.addEventListener("keydown", handleShortcut);
    window.addEventListener("keyup", (event) => { if (event.code === "Space") spacePressed = false; });
  }

  function handleShortcut(event) {
    if (event.code === "Space") spacePressed = true;
    const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    const command = event.ctrlKey || event.metaKey;
    if (command && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
      return;
    }
    if (command && event.key.toLowerCase() === "d" && !editing) {
      event.preventDefault();
      duplicateSelection();
      return;
    }
    if (command && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveAuto();
      showToast("บันทึกโปรเจกต์แล้ว");
      return;
    }
    if (editing) return;
    if (event.key === "Delete" || event.key === "Backspace") deleteSelection();
    if (event.key.toLowerCase() === "v") setTool("select");
    if (event.key.toLowerCase() === "w") setTool("wire");
    if (event.key.toLowerCase() === "f") fitCircuit();
    if (event.key === "Escape") {
      wireState = null;
      wirePreviewLayer.replaceChildren();
      setTool("select");
    }
  }

  function init() {
    bindEvents();
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) project = normalizeProject(JSON.parse(saved));
      else project = buildHalfAdder();
    } catch (error) {
      project = buildHalfAdder();
    }
    buildEditableTable(true);
    render();
    fitCircuit();
  }

  init();
})();
