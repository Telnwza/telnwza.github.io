"use strict";

const STORAGE_KEY = "visual-learning.architecture-studio.v1";
const GRID = 16;
const STAGE = { width: 1800, height: 1100 };

const catalog = {
  input: { label: "Input", ports: [{ id: "out", name: "OUT", direction: "output", width: 1, followsNodeWidth: true }] },
  output: { label: "Output", ports: [{ id: "in", name: "IN", direction: "input", width: 1, followsNodeWidth: true }] },
  and: { label: "AND", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1 }] },
  nand: { label: "NAND", glyph: "&○", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1, signalType: "active-low" }] },
  or: { label: "OR", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1 }] },
  nor: { label: "NOR", glyph: "≥○", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1, signalType: "active-low" }] },
  xor: { label: "XOR", glyph: "⊕", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1 }] },
  xnor: { label: "XNOR", glyph: "⊕○", ports: [{ id: "a", name: "A", direction: "input", width: 1 }, { id: "b", name: "B", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 1, signalType: "active-low" }] },
  not: { label: "NOT", glyph: "¬", ports: [{ id: "a", name: "A", direction: "input", width: 1, followsNodeWidth: true }, { id: "y", name: "Y", direction: "output", width: 1, followsNodeWidth: true, signalType: "active-low" }] },
  buffer: { label: "Buffer", glyph: "▷", ports: [{ id: "a", name: "A", direction: "input", width: 1, followsNodeWidth: true }, { id: "y", name: "Y", direction: "output", width: 1, followsNodeWidth: true }] },
  mux: { label: "MUX", ports: [{ id: "d0", name: "D0", direction: "input", width: 8, followsNodeWidth: true }, { id: "d1", name: "D1", direction: "input", width: 8, followsNodeWidth: true }, { id: "sel", name: "SEL", direction: "input", width: 1 }, { id: "y", name: "Y", direction: "output", width: 8, followsNodeWidth: true }] },
  demux: { label: "DEMUX", ports: [{ id: "d", name: "D", direction: "input", width: 8, followsNodeWidth: true }, { id: "sel", name: "SEL", direction: "input", width: 1 }, { id: "y0", name: "Y0", direction: "output", width: 8, followsNodeWidth: true }, { id: "y1", name: "Y1", direction: "output", width: 8, followsNodeWidth: true }] },
  encoder: { label: "Encoder", ports: [{ id: "d", name: "D", direction: "input", width: 8 }, { id: "y", name: "Y", direction: "output", width: 3 }] },
  decoder: { label: "Decoder", ports: [{ id: "a", name: "A", direction: "input", width: 3 }, { id: "y", name: "Y", direction: "output", width: 8 }] },
  adder: { label: "Adder", glyph: "+", ports: [{ id: "a", name: "A", direction: "input", width: 8, followsNodeWidth: true }, { id: "b", name: "B", direction: "input", width: 8, followsNodeWidth: true }, { id: "cin", name: "CIN", direction: "input", width: 1 }, { id: "sum", name: "SUM", direction: "output", width: 8, followsNodeWidth: true }, { id: "cout", name: "COUT", direction: "output", width: 1 }] },
  subtractor: { label: "Subtractor", glyph: "−", ports: [{ id: "a", name: "A", direction: "input", width: 8, followsNodeWidth: true }, { id: "b", name: "B", direction: "input", width: 8, followsNodeWidth: true }, { id: "y", name: "Y", direction: "output", width: 8, followsNodeWidth: true }, { id: "borrow", name: "BORROW", direction: "output", width: 1 }] },
  comparator: { label: "Comparator", glyph: "=", ports: [{ id: "a", name: "A", direction: "input", width: 8, followsNodeWidth: true }, { id: "b", name: "B", direction: "input", width: 8, followsNodeWidth: true }, { id: "eq", name: "EQ", direction: "output", width: 1 }, { id: "lt", name: "LT", direction: "output", width: 1 }, { id: "gt", name: "GT", direction: "output", width: 1 }] },
  constant: { label: "Constant", glyph: "1", ports: [{ id: "y", name: "VALUE", direction: "output", width: 1, followsNodeWidth: true }] },
  register: { label: "Register", ports: [{ id: "d", name: "D", direction: "input", width: 8, followsNodeWidth: true }, { id: "clk", name: "CLK", direction: "input", width: 1, signalType: "clock" }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "Q", direction: "output", width: 8, followsNodeWidth: true }] },
  dff: { label: "D Flip-Flop", glyph: "D", ports: [{ id: "d", name: "D", direction: "input", width: 1 }, { id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "Q", direction: "output", width: 1 }, { id: "qn", name: "Q_n", direction: "output", width: 1, signalType: "active-low" }] },
  jkff: { label: "JK Flip-Flop", glyph: "JK", ports: [{ id: "j", name: "J", direction: "input", width: 1 }, { id: "k", name: "K", direction: "input", width: 1 }, { id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "Q", direction: "output", width: 1 }] },
  tff: { label: "T Flip-Flop", glyph: "T", ports: [{ id: "t", name: "T", direction: "input", width: 1 }, { id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "Q", direction: "output", width: 1 }] },
  srff: { label: "SR Flip-Flop", glyph: "SR", ports: [{ id: "s", name: "S", direction: "input", width: 1 }, { id: "r", name: "R", direction: "input", width: 1 }, { id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "q", name: "Q", direction: "output", width: 1 }] },
  counter: { label: "Counter", glyph: "#", ports: [{ id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "en", name: "EN", direction: "input", width: 1 }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "Q", direction: "output", width: 8, followsNodeWidth: true }] },
  clockdiv: { label: "Clock Divider", glyph: "÷", ports: [{ id: "clk", name: "CLK", direction: "input", width: 1, signalType: "rising-edge" }, { id: "rst", name: "RST_n", direction: "input", width: 1, signalType: "active-low" }, { id: "q", name: "CLK_OUT", direction: "output", width: 1, signalType: "clock" }] },
  edge: { label: "Edge Detector", glyph: "↑", ports: [{ id: "d", name: "IN", direction: "input", width: 1 }, { id: "q", name: "PULSE", direction: "output", width: 1, signalType: "pulse" }] },
};

const port = (id, name, direction, width = 1, signalType = "normal") => ({ id, name, direction, width, signalType });
const node = (id, kind, name, x, y, extras = {}) => ({ id, kind, name, x, y, nodeWidth: kind === "input" || kind === "output" ? 132 : 226, height: kind === "input" || kind === "output" ? 82 : 170, ...extras });
const signal = (id, fromNode, fromPort, toNode, toPort, name, width = 1) => ({ id, from: { nodeId: fromNode, portId: fromPort }, to: { nodeId: toNode, portId: toPort }, name, width, signalType: "data", routeMode: "auto", points: [] });

function sampleProject() {
  return {
    version: 1,
    name: "8-bit Teaching CPU",
    topModuleId: "cpu",
    updatedAt: new Date().toISOString(),
    modules: {
      cpu: {
        id: "cpu", name: "CPU", description: "Top-level processor architecture", status: "draft",
        ports: [port("clk", "CLK", "input", 1, "clock"), port("rst", "RESET_n", "input", 1, "active-low"), port("data", "DATA_OUT", "output", 8)],
        nodes: [
          node("cpu-data-region", "boundary", "Data path", 220, 130, { nodeWidth: 760, height: 400, color: "green" }),
          node("cpu-control-region", "boundary", "Control path", 1030, 130, { nodeWidth: 420, height: 400, color: "orange" }),
          node("cpu-clk", "input", "CLK", 60, 205, { width: 1, signalType: "clock" }),
          node("cpu-rst", "input", "RESET_n", 60, 335, { width: 1, signalType: "active-low" }),
          node("cpu-dp", "module", "U_DATAPATH", 400, 235, { definitionId: "datapath", nodeWidth: 250, height: 190 }),
          node("cpu-mem", "module", "U_MEMORY", 720, 235, { definitionId: "memory", nodeWidth: 220, height: 190 }),
          node("cpu-ctrl", "module", "U_CONTROL", 1110, 235, { definitionId: "control", nodeWidth: 250, height: 190 }),
          node("cpu-out", "output", "DATA_OUT", 1510, 270, { width: 8 }),
        ],
        connections: [
          signal("cpu-s1", "cpu-clk", "out", "cpu-dp", "clk", "CLK"),
          signal("cpu-s2", "cpu-clk", "out", "cpu-ctrl", "clk", "CLK"),
          signal("cpu-s3", "cpu-rst", "out", "cpu-dp", "rst", "RESET_n"),
          signal("cpu-s4", "cpu-rst", "out", "cpu-ctrl", "rst", "RESET_n"),
          signal("cpu-s5", "cpu-ctrl", "ctrl", "cpu-dp", "ctrl", "CONTROL", 8),
          signal("cpu-s6", "cpu-dp", "addr", "cpu-mem", "addr", "ADDRESS", 8),
          signal("cpu-s7", "cpu-dp", "write", "cpu-mem", "din", "WRITE_DATA", 8),
          signal("cpu-s8", "cpu-mem", "dout", "cpu-dp", "read", "READ_DATA", 8),
          signal("cpu-s9", "cpu-dp", "result", "cpu-out", "in", "RESULT", 8),
        ],
      },
      datapath: {
        id: "datapath", name: "Datapath", description: "Registers, ALU, and internal data flow", status: "reviewed",
        ports: [port("clk", "CLK", "input", 1, "clock"), port("rst", "RESET_n", "input", 1, "active-low"), port("ctrl", "CONTROL", "input", 8), port("read", "READ_DATA", "input", 8), port("addr", "ADDRESS", "output", 8), port("write", "WRITE_DATA", "output", 8), port("result", "RESULT", "output", 8)],
        nodes: [
          node("dp-a", "input", "A", 90, 205, { width: 8 }), node("dp-b", "input", "B", 90, 335, { width: 8 }), node("dp-op", "input", "OP", 90, 465, { width: 3 }),
          node("dp-alu", "module", "U_ALU", 420, 285, { definitionId: "alu", nodeWidth: 250, height: 190 }),
          node("dp-reg", "register", "RESULT_REG", 790, 285, { width: 8, nodeWidth: 220, height: 190 }),
          node("dp-result", "output", "RESULT", 1150, 255, { width: 8 }), node("dp-zero", "output", "ZERO", 1150, 415, { width: 1 }),
        ],
        connections: [
          signal("dp-s1", "dp-a", "out", "dp-alu", "a", "A", 8), signal("dp-s2", "dp-b", "out", "dp-alu", "b", "B", 8), signal("dp-s3", "dp-op", "out", "dp-alu", "op", "OP", 3),
          signal("dp-s4", "dp-alu", "result", "dp-reg", "d", "ALU_RESULT", 8), signal("dp-s5", "dp-reg", "q", "dp-result", "in", "RESULT", 8), signal("dp-s6", "dp-alu", "zero", "dp-zero", "in", "ZERO"),
        ],
      },
      alu: {
        id: "alu", name: "ALU", description: "Arithmetic and bitwise operations", status: "reviewed",
        ports: [port("a", "A", "input", 8), port("b", "B", "input", 8), port("op", "OP", "input", 3), port("result", "RESULT", "output", 8), port("zero", "ZERO", "output")],
        nodes: [
          node("alu-a", "input", "A", 80, 190, { width: 8 }), node("alu-b", "input", "B", 80, 330, { width: 8 }), node("alu-op", "input", "OP", 80, 470, { width: 3 }),
          node("alu-add", "module", "U_ADDER", 380, 180, { definitionId: "adder" }), node("alu-logic", "module", "U_LOGIC", 380, 420, { definitionId: "logicunit" }),
          node("alu-mux", "mux", "RESULT_MUX", 760, 285, { width: 8, height: 210 }), node("alu-result", "output", "RESULT", 1140, 275, { width: 8 }), node("alu-zero", "output", "ZERO", 1140, 440, { width: 1 }),
        ],
        connections: [
          signal("alu-s1", "alu-a", "out", "alu-add", "a", "A", 8), signal("alu-s2", "alu-b", "out", "alu-add", "b", "B", 8), signal("alu-s3", "alu-a", "out", "alu-logic", "a", "A", 8), signal("alu-s4", "alu-b", "out", "alu-logic", "b", "B", 8),
          signal("alu-s5", "alu-add", "sum", "alu-mux", "d0", "SUM", 8), signal("alu-s6", "alu-logic", "y", "alu-mux", "d1", "LOGIC_RESULT", 8), signal("alu-s7", "alu-op", "out", "alu-mux", "sel", "OP", 3), signal("alu-s8", "alu-mux", "y", "alu-result", "in", "RESULT", 8),
        ],
      },
      adder: {
        id: "adder", name: "Adder", description: "Reusable 8-bit ripple-carry adder", status: "draft",
        ports: [port("a", "A", "input", 8), port("b", "B", "input", 8), port("sum", "SUM", "output", 8)],
        nodes: [node("ad-a", "input", "A", 70, 210, { width: 8 }), node("ad-b", "input", "B", 70, 380, { width: 8 }), node("ad-fa0", "module", "FA0", 370, 280, { definitionId: "fulladder", nodeWidth: 190 }), node("ad-fa1", "module", "FA1", 650, 280, { definitionId: "fulladder", nodeWidth: 190 }), node("ad-fa2", "module", "FA2", 930, 280, { definitionId: "fulladder", nodeWidth: 190 }), node("ad-sum", "output", "SUM", 1260, 320, { width: 8 })],
        connections: [],
      },
      fulladder: {
        id: "fulladder", name: "FullAdder", description: "Reusable one-bit adder cell", status: "hdl-ready",
        ports: [port("a", "A", "input"), port("b", "B", "input"), port("cin", "CIN", "input"), port("sum", "SUM", "output"), port("cout", "COUT", "output")],
        nodes: [node("fa-a", "input", "A", 90, 180, { width: 1 }), node("fa-b", "input", "B", 90, 300, { width: 1 }), node("fa-cin", "input", "CIN", 90, 420, { width: 1 }), node("fa-sumlogic", "or", "SUM_LOGIC", 470, 230), node("fa-carry", "and", "CARRY_LOGIC", 470, 440), node("fa-sum", "output", "SUM", 930, 260, { width: 1 }), node("fa-cout", "output", "COUT", 930, 470, { width: 1 })],
        connections: [],
      },
      logicunit: { id: "logicunit", name: "LogicUnit", description: "Bitwise operation block", status: "draft", ports: [port("a", "A", "input", 8), port("b", "B", "input", 8), port("y", "Y", "output", 8)], nodes: [], connections: [] },
      control: { id: "control", name: "ControlUnit", description: "Decode and control sequencing", status: "draft", ports: [port("clk", "CLK", "input", 1, "clock"), port("rst", "RESET_n", "input", 1, "active-low"), port("opcode", "OPCODE", "input", 4), port("ctrl", "CONTROL", "output", 8)], nodes: [], connections: [] },
      memory: { id: "memory", name: "Memory", description: "Program and data memory interface", status: "draft", ports: [port("addr", "ADDRESS", "input", 8), port("din", "DATA_IN", "input", 8), port("dout", "DATA_OUT", "output", 8)], nodes: [], connections: [] },
    },
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function uid(prefix = "id") { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function esc(value) { return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character])); }
function validProject(value) { return value?.version === 1 && value.modules?.[value.topModuleId]; }
function initialProject() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (validProject(value)) return value; } catch (_) {} return sampleProject(); }

const state = {
  project: initialProject(), activeModuleId: "datapath", navigation: ["cpu", "datapath"], selected: new Set(["dp-alu"]),
  history: [], future: [], clipboard: null, connectFrom: null, selectedConnectionId: null, leftTab: "library", grid: true, snap: true, zoom: .78, panX: 16, panY: 24, tool: "select", spaceDown: false, suppressPortClickUntil: 0,
};

if (!state.project.modules[state.activeModuleId]) { state.activeModuleId = state.project.topModuleId; state.navigation = [state.project.topModuleId]; state.selected.clear(); }

const dom = {
  canvas: document.querySelector(".canvas"), stage: document.querySelector(".canvas-stage"), breadcrumbs: document.querySelector(".breadcrumbs"),
  left: document.querySelector(".left-content"), inspectorHead: document.querySelector(".inspector-heading"), inspector: document.querySelector(".inspector-content"),
  status: document.querySelector(".statusbar"), zoom: document.querySelector(".zoom-readout"), file: document.querySelector("#project-file"), saved: document.querySelector(".document-status"),
};
const libraryMarkup = dom.left.innerHTML;

function moduleNow() { return state.project.modules[state.activeModuleId]; }
function nodeNow(id) { return moduleNow().nodes.find((item) => item.id === id); }
function selectedNodes() { return moduleNow().nodes.filter((item) => state.selected.has(item.id)); }
function widthOf(item) { return item.nodeWidth || 220; }
function portsOf(item) {
  const source = item.kind === "module" ? (state.project.modules[item.definitionId]?.ports || []) : (catalog[item.kind]?.ports || []);
  return source.map((itemPort) => {
    const override = item.portOverrides?.[itemPort.id] || {};
    return {
      ...itemPort,
      width: override.width || (itemPort.followsNodeWidth ? (item.width || itemPort.width || 1) : (itemPort.width || 1)),
      signalType: override.signalType || itemPort.signalType || item.signalType || "normal",
      name: override.name || itemPort.name,
    };
  });
}
function heightOf(item) {
  if (item.height) return item.height;
  const ports = portsOf(item); const inputs = ports.filter((p) => p.direction === "input").length; const outputs = ports.length - inputs;
  return Math.max(112, 65 + Math.max(inputs, outputs) * 25);
}
function portRef(nodeId, portId) { const item = nodeNow(nodeId); const itemPort = item && portsOf(item).find((p) => p.id === portId); return itemPort ? { node: item, port: itemPort } : null; }
function portXY(item, itemPort) {
  const isInput = itemPort.direction === "input"; const side = portsOf(item).filter((p) => (p.direction === "input") === isInput); const index = Math.max(0, side.findIndex((p) => p.id === itemPort.id));
  return { x: item.x + (isInput ? 0 : widthOf(item)), y: item.y + Math.min(84 + index * 25, heightOf(item) - 18) };
}
function snap(value) { return state.snap ? Math.round(value / GRID) * GRID : Math.round(value); }

function persist(label = "Saved locally") {
  state.project.updatedAt = new Date().toISOString();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project)); dom.saved.innerHTML = `<span class="saved-dot" aria-hidden="true"></span>${esc(label)}`; }
  catch (_) { dom.saved.textContent = "Local save unavailable"; }
}
function mutate(callback, label) {
  const previous = JSON.stringify(state.project); callback(); const current = JSON.stringify(state.project);
  if (previous !== current) { state.history.push(previous); if (state.history.length > 80) state.history.shift(); state.future = []; persist(label); }
  renderAll();
}

function setTransform() {
  dom.stage.style.width = `${STAGE.width}px`; dom.stage.style.height = `${STAGE.height}px`; dom.stage.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  dom.zoom.textContent = `${Math.round(state.zoom * 100)}%`; dom.canvas.style.backgroundImage = state.grid ? "radial-gradient(circle, #c8cdd5 1px, transparent 1px)" : "none";
  dom.canvas.style.backgroundSize = `${GRID * state.zoom}px ${GRID * state.zoom}px`; dom.canvas.style.backgroundPosition = `${state.panX}px ${state.panY}px`;
  updateMinimapViewport();
}

function orthogonalPath(points) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    if (point.y === previous.y) return `${path} H ${point.x}`;
    if (point.x === previous.x) return `${path} V ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}
function defaultRoutePoints(a, b, mode = "auto") {
  if (mode === "horizontal-first") return [{ x: b.x, y: a.y }];
  if (mode === "vertical-first") return [{ x: a.x, y: b.y }];
  if (b.x >= a.x + 80) {
    const midX = snap((a.x + b.x) / 2);
    return [{ x: midX, y: a.y }, { x: midX, y: b.y }];
  }
  const laneX = snap(Math.max(a.x, b.x) + 64);
  const approachX = snap(b.x - 64);
  const midY = snap((a.y + b.y) / 2);
  return [{ x: laneX, y: a.y }, { x: laneX, y: midY }, { x: approachX, y: midY }, { x: approachX, y: b.y }];
}
function labelAnchor(points) {
  const horizontal = points.slice(0, -1).map((point, index) => ({ a: point, b: points[index + 1] })).filter((segment) => segment.a.y === segment.b.y).sort((a, b) => Math.abs(b.b.x - b.a.x) - Math.abs(a.b.x - a.a.x))[0];
  const segment = horizontal || { a: points[0], b: points.at(-1) };
  return { x: (segment.a.x + segment.b.x) / 2, y: (segment.a.y + segment.b.y) / 2 };
}
function route(connection) {
  const from = portRef(connection.from.nodeId, connection.from.portId); const to = portRef(connection.to.nodeId, connection.to.portId); if (!from || !to) return null;
  const a = portXY(from.node, from.port); const b = portXY(to.node, to.port);
  const intermediate = connection.routeMode === "custom" && connection.points?.length ? connection.points : defaultRoutePoints(a, b, connection.routeMode);
  const points = [a, ...intermediate.map((point) => ({ x: snap(Number(point.x)), y: snap(Number(point.y)) })), b];
  const anchor = labelAnchor(points);
  return { d: orthogonalPath(points), x: anchor.x, y: anchor.y, points, intermediate };
}
function connectionIssues(connection) {
  const a = portRef(connection.from.nodeId, connection.from.portId); const b = portRef(connection.to.nodeId, connection.to.portId); if (!a || !b) return ["Missing endpoint"];
  const issues = []; if (a.port.direction === b.port.direction) issues.push("Same-direction ports"); if (Number(a.port.width || 1) !== Number(b.port.width || 1)) issues.push(`Width mismatch ${a.port.width || 1} ↔ ${b.port.width || 1}`); return issues;
}
function moduleIssues() {
  const issues = []; const driven = new Map();
  moduleNow().connections.forEach((connection) => { connectionIssues(connection).forEach((message) => issues.push({ id: connection.id, message })); const key = `${connection.to.nodeId}:${connection.to.portId}`; driven.set(key, (driven.get(key) || 0) + 1); });
  driven.forEach((count, key) => { if (count > 1) issues.push({ id: key, message: `Multiple drivers on ${key}` }); });
  moduleNow().nodes.filter((item) => item.kind === "module" && !state.project.modules[item.definitionId]).forEach((item) => issues.push({ id: item.id, message: `${item.name} has no definition` })); return issues;
}

function signalGlyph(itemPort) { if (itemPort.signalType === "clock" || itemPort.signalType === "rising-edge") return "▷"; if (itemPort.signalType === "active-low") return "○"; if (itemPort.signalType === "falling-edge") return "○▷"; if (itemPort.signalType === "pulse") return "↑"; return ""; }
function displayName(item) { return item.kind === "module" ? state.project.modules[item.definitionId]?.name || "Undefined module" : item.name || catalog[item.kind]?.label || "Block"; }
function subtitle(item) { return item.kind === "module" ? state.project.modules[item.definitionId]?.description || "Definition missing" : item.kind === "input" || item.kind === "output" ? `${item.width || 1}-bit ${item.kind} port` : catalog[item.kind]?.label || "Architecture component"; }
function typeLabel(item) { return item.kind === "module" ? "MODULE INSTANCE" : item.kind === "boundary" ? "ARCHITECTURE REGION" : (catalog[item.kind]?.label || item.kind).toUpperCase(); }

function renderPort(item, itemPort) {
  const left = itemPort.direction === "input"; const side = portsOf(item).filter((p) => (p.direction === "input") === left); const index = side.findIndex((p) => p.id === itemPort.id); const top = Math.min(84 + index * 25, heightOf(item) - 18); const width = Number(itemPort.width) || 1;
  const pending = state.connectFrom?.nodeId === item.id && state.connectFrom?.portId === itemPort.id;
  return `<button class="arch-port ${left ? "left" : "right"}${pending ? " is-pending" : ""}" style="--port-top:${top}px" type="button" data-node-id="${esc(item.id)}" data-port-id="${esc(itemPort.id)}" title="${esc(itemPort.direction)} · ${width} bit"><i></i><span>${esc(signalGlyph(itemPort))}${esc(itemPort.name)}${width > 1 ? `[${width - 1}:0]` : ""}</span></button>`;
}
function renderNode(item) {
  const selected = state.selected.has(item.id);
  if (item.kind === "boundary") return `<article class="arch-region region-${esc(item.color || "green")}${selected ? " is-selected" : ""}" data-node-id="${esc(item.id)}" style="left:${item.x}px;top:${item.y}px;width:${widthOf(item)}px;height:${heightOf(item)}px" tabindex="0"><span>${esc(item.name)}</span>${selected ? '<i class="resize-handle"></i>' : ""}</article>`;
  const definition = item.kind === "module" ? state.project.modules[item.definitionId] : null; const glyph = item.kind === "module" ? "▦" : (catalog[item.kind]?.glyph || (item.kind === "register" ? "R" : item.kind === "mux" ? "M" : item.kind === "and" ? "&" : item.kind === "or" ? "≥" : "→"));
  return `<article class="arch-node kind-${esc(item.kind)}${selected ? " is-selected" : ""}" data-node-id="${esc(item.id)}" style="left:${item.x}px;top:${item.y}px;width:${widthOf(item)}px;height:${heightOf(item)}px" tabindex="0"><header class="arch-node-header"><span>${esc(typeLabel(item))}</span><span>${esc(item.name)}</span></header><div class="arch-node-title"><span class="arch-node-glyph">${esc(glyph)}</span><div><strong>${esc(displayName(item))}</strong><small>${esc(subtitle(item))}</small></div></div>${portsOf(item).map((p) => renderPort(item, p)).join("")}${definition ? `<span class="maturity status-${esc(definition.status)}">${esc(definition.status)}</span><button class="drill-in" type="button" data-open-module="${esc(definition.id)}">Open ↗</button>` : `<span class="node-width">${item.width || portsOf(item)[0]?.width || 1} bit</span>`}${selected ? '<i class="resize-handle"></i>' : ""}</article>`;
}
function busMarker(connection, path) {
  if (Number(connection.width || 1) <= 1) return "";
  return `<g class="bus-width-marker${state.selectedConnectionId === connection.id ? " is-selected" : ""}" transform="translate(${path.x} ${path.y})"><line x1="-6" y1="7" x2="6" y2="-7"></line><text x="9" y="-6">${Number(connection.width) || 1}</text></g>`;
}
function waypointMarkup(connection, path) {
  if (state.selectedConnectionId !== connection.id) return "";
  return path.intermediate.map((point, index) => `<rect class="wire-waypoint" x="${point.x - 5}" y="${point.y - 5}" width="10" height="10" data-connection-id="${esc(connection.id)}" data-point-index="${index}"></rect>`).join("");
}
function renderMinimap() {
  const map = document.querySelector(".minimap-map");
  if (!map) return;
  map.innerHTML = moduleNow().nodes.filter((item) => item.kind !== "boundary").map((item) => `<i style="left:${item.x / STAGE.width * 100}%;top:${item.y / STAGE.height * 100}%;width:${Math.max(2, widthOf(item) / STAGE.width * 100)}%;height:${Math.max(3, heightOf(item) / STAGE.height * 100)}%"></i>`).join("");
}
function updateMinimapViewport() {
  const viewport = document.querySelector(".minimap-viewport");
  if (!viewport || !dom.canvas.clientWidth) return;
  const left = Math.max(0, -state.panX / state.zoom / STAGE.width * 100);
  const top = Math.max(0, -state.panY / state.zoom / STAGE.height * 100);
  const width = Math.min(100 - left, dom.canvas.clientWidth / state.zoom / STAGE.width * 100);
  const height = Math.min(100 - top, dom.canvas.clientHeight / state.zoom / STAGE.height * 100);
  viewport.style.left = `${left}%`; viewport.style.top = `${top}%`; viewport.style.width = `${Math.max(8, width)}%`; viewport.style.height = `${Math.max(8, height)}%`;
}
function renderCanvas() {
  const lines = []; const labels = [];
  moduleNow().connections.forEach((connection) => {
    const path = route(connection); if (!path) return; const invalid = connectionIssues(connection).length; const selected = state.selectedConnectionId === connection.id;
    lines.push(`<g class="wire-group${selected ? " is-selected" : ""}" data-connection-id="${esc(connection.id)}"><path class="wire${connection.width > 1 ? " bus" : ""}${invalid ? " invalid" : ""}" d="${path.d}"></path><path class="wire-hit" data-connection-id="${esc(connection.id)}" d="${path.d}"></path>${busMarker(connection, path)}${waypointMarkup(connection, path)}</g>`);
    if (connection.name) labels.push(`<button class="signal-label${connection.width > 1 ? " bus-label" : ""}${selected ? " is-selected" : ""}" type="button" data-connection-id="${esc(connection.id)}" style="left:${path.x}px;top:${path.y - 21}px">${esc(connection.name)}${connection.width > 1 ? `[${connection.width - 1}:0]` : ""}</button>`);
  });
  const regions = moduleNow().nodes.filter((item) => item.kind === "boundary"); const blocks = moduleNow().nodes.filter((item) => item.kind !== "boundary");
  dom.stage.innerHTML = `<svg class="wire-layer" aria-hidden="true" viewBox="0 0 ${STAGE.width} ${STAGE.height}" preserveAspectRatio="none">${lines.join("")}</svg>${labels.join("")}<div class="canvas-label"><span>MODULE DEFINITION · ${esc(moduleNow().status)}</span><strong>${esc(moduleNow().name)}</strong><small>${esc(moduleNow().description)}</small></div>${regions.map(renderNode).join("")}${blocks.map(renderNode).join("")}${blocks.length ? "" : `<div class="empty-canvas"><strong>${esc(moduleNow().name)} is empty</strong><span>Drag a component here to begin.</span></div>`}`;
  const minimapLabel = document.querySelector(".minimap span");
  if (minimapLabel) minimapLabel.textContent = moduleNow().name.toUpperCase();
  renderMinimap(); setTransform(); bindCanvasItems();
}

function findPath(target, current = state.project.topModuleId, path = [], visited = new Set()) {
  if (visited.has(current)) return null; const next = [...path, current]; if (current === target) return next; visited.add(current);
  for (const item of state.project.modules[current]?.nodes || []) { if (item.kind !== "module") continue; const found = findPath(target, item.definitionId, next, new Set(visited)); if (found) return found; } return null;
}
function openModule(id, path) { if (!state.project.modules[id]) return; state.activeModuleId = id; state.navigation = path || findPath(id) || [id]; state.selected.clear(); state.selectedConnectionId = null; state.connectFrom = null; state.zoom = .78; state.panX = 18; state.panY = 24; renderAll(); }
function renderBreadcrumbs() {
  dom.breadcrumbs.innerHTML = state.navigation.map((id, index) => `<button type="button" data-crumb="${index}">${esc(state.project.modules[id]?.name || id)}</button>${index < state.navigation.length - 1 ? "<span>›</span>" : ""}`).join("");
  dom.breadcrumbs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { const index = Number(button.dataset.crumb); openModule(state.navigation[index], state.navigation.slice(0, index + 1)); }));
}

function branch(id, path = [], seen = new Set(), instanceName = "") {
  const definition = state.project.modules[id]; if (!definition) return ""; const recursive = seen.has(id); const nextSeen = new Set(seen).add(id); const children = recursive ? [] : definition.nodes.filter((item) => item.kind === "module" && state.project.modules[item.definitionId]);
  const rowName = instanceName || definition.name;
  const rowMeta = instanceName ? `${definition.name} · ${definition.status}` : definition.status;
  return `<li><button class="tree-row${id === state.activeModuleId ? " is-active" : ""}" type="button" data-tree="${esc(id)}" data-path="${esc([...path, id].join(","))}"><span class="tree-caret">${children.length ? "⌄" : "·"}</span><span class="tree-module-icon">M</span><span><strong>${esc(rowName)}</strong><small>${esc(rowMeta)}</small></span></button>${children.length ? `<ul>${children.map((item) => branch(item.definitionId, [...path, id], nextSeen, item.name)).join("")}</ul>` : ""}${recursive ? '<span class="tree-warning">Recursive reference</span>' : ""}</li>`;
}
function newDefinition(name = `Module${Object.keys(state.project.modules).length + 1}`) { const id = uid("definition"); const definition = { id, name, description: "Reusable module definition", status: "draft", ports: [port("in", "IN", "input"), port("out", "OUT", "output")], nodes: [], connections: [] }; state.project.modules[id] = definition; return definition; }
function renderHierarchy() {
  dom.left.innerHTML = `<div class="project-summary"><span>PROJECT</span><strong>${esc(state.project.name)}</strong><small>${Object.keys(state.project.modules).length} module definitions</small></div><ul class="hierarchy-tree">${branch(state.project.topModuleId)}</ul><button class="add-module-definition" type="button">+ New module definition</button><div class="hierarchy-note"><strong>Definition-first workflow</strong><span>Edit once and every instance stays in sync.</span></div>`;
  dom.left.querySelectorAll("[data-tree]").forEach((button) => button.addEventListener("click", () => openModule(button.dataset.tree, button.dataset.path.split(","))));
  dom.left.querySelector(".add-module-definition")?.addEventListener("click", () => { const previous = JSON.stringify(state.project); const definition = newDefinition(); state.history.push(previous); persist("Created module definition"); openModule(definition.id, [definition.id]); });
}
function bindLibrary() {
  const search = dom.left.querySelector("input[type=search]"); search?.addEventListener("input", () => { const query = search.value.toLowerCase().trim(); dom.left.querySelectorAll("[data-kind]").forEach((item) => { item.hidden = !!query && !item.textContent.toLowerCase().includes(query); }); });
  dom.left.querySelectorAll("[data-kind]").forEach((item) => { item.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/x-architecture-kind", item.dataset.kind); event.dataTransfer.effectAllowed = "copy"; }); item.addEventListener("click", () => addNode(item.dataset.kind)); });
  dom.left.querySelectorAll(".group-heading").forEach((button) => button.addEventListener("click", () => { const expanded = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!expanded)); button.nextElementSibling.hidden = expanded; }));
}
function renderLeft() {
  if (state.leftTab === "library") { dom.left.innerHTML = libraryMarkup; bindLibrary(); } else renderHierarchy();
  document.querySelectorAll("[data-left-tab]").forEach((button) => { const active = button.dataset.leftTab === state.leftTab; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
}

function portTable(ports) { return `<div class="port-table-head"><span>Port</span><span>Dir.</span><span>Width</span></div>${ports.map((p) => `<div class="port-table-row"><strong>${esc(signalGlyph(p))}${esc(p.name)}</strong><span class="direction ${p.direction === "input" ? "in" : "out"}">${p.direction === "input" ? "IN" : "OUT"}</span><span>${p.width || 1}</span></div>`).join("")}`; }
function portEditor(item) {
  return `<div class="port-editor-head"><span>Name / notation</span><span>Bits</span></div><div class="port-editor">${portsOf(item).map((itemPort) => `<div class="port-editor-row"><span class="direction ${itemPort.direction === "input" ? "in" : "out"}">${itemPort.direction === "input" ? "IN" : "OUT"}</span><input aria-label="${esc(itemPort.name)} port name" data-port-id="${esc(itemPort.id)}" data-port-field="name" value="${esc(itemPort.name)}"><select aria-label="${esc(itemPort.name)} notation" data-port-id="${esc(itemPort.id)}" data-port-field="signalType"><option value="normal"${itemPort.signalType === "normal" ? " selected" : ""}>Normal</option><option value="active-low"${itemPort.signalType === "active-low" ? " selected" : ""}>NOT ○</option><option value="clock"${itemPort.signalType === "clock" ? " selected" : ""}>Clock</option><option value="rising-edge"${itemPort.signalType === "rising-edge" ? " selected" : ""}>Rise ▷</option><option value="falling-edge"${itemPort.signalType === "falling-edge" ? " selected" : ""}>Fall ○▷</option><option value="pulse"${itemPort.signalType === "pulse" ? " selected" : ""}>Pulse ↑</option></select><input class="port-width-input" aria-label="${esc(itemPort.name)} width" data-port-id="${esc(itemPort.id)}" data-port-field="width" type="number" min="1" max="64" value="${Number(itemPort.width) || 1}"></div>`).join("")}</div>`;
}
function validationCard(issues) { return issues.length ? `<section class="validation-card validation-error"><span class="validation-icon">!</span><div><strong>${issues.length} design issue${issues.length === 1 ? "" : "s"}</strong><p>${esc(issues[0].message)}</p></div></section>` : `<section class="validation-card"><span class="validation-icon">✓</span><div><strong>Design contract valid</strong><p>No width, driver, or definition conflicts</p></div></section>`; }
function renderConnectionInspector(connection) {
  const path = route(connection); const issues = connectionIssues(connection);
  dom.inspectorHead.innerHTML = `<div><span>NET / SIGNAL</span><strong>${esc(connection.name || "Unnamed signal")}${connection.width > 1 ? `[${connection.width - 1}:0]` : ""}</strong></div><button type="button" aria-label="Signal actions">•••</button>`;
  dom.inspector.innerHTML = `<section class="property-section"><h2>Signal</h2><label><span>Net name</span><input data-connection-field="name" value="${esc(connection.name || "")}"></label><div class="field-pair"><label><span>Bus width</span><input data-connection-field="width" type="number" min="1" max="64" value="${Number(connection.width) || 1}"></label><label><span>Type</span><select data-connection-field="signalType"><option value="data"${connection.signalType === "data" || !connection.signalType ? " selected" : ""}>Data</option><option value="control"${connection.signalType === "control" ? " selected" : ""}>Control</option><option value="clock"${connection.signalType === "clock" ? " selected" : ""}>Clock</option><option value="reset"${connection.signalType === "reset" ? " selected" : ""}>Reset</option><option value="pulse"${connection.signalType === "pulse" ? " selected" : ""}>Pulse</option></select></label></div><div class="bus-notation-preview">${connection.width > 1 ? `━━╱ ${Number(connection.width)} ━━` : "──────── 1 bit"}</div></section><section class="property-section"><h2>Orthogonal route</h2><label><span>Route style</span><select data-connection-field="routeMode"><option value="auto"${!connection.routeMode || connection.routeMode === "auto" ? " selected" : ""}>Auto</option><option value="horizontal-first"${connection.routeMode === "horizontal-first" ? " selected" : ""}>Horizontal → vertical</option><option value="vertical-first"${connection.routeMode === "vertical-first" ? " selected" : ""}>Vertical → horizontal</option><option value="custom"${connection.routeMode === "custom" ? " selected" : ""}>Custom bends</option></select></label><div class="wire-actions"><button type="button" data-wire-action="reset">Reset route</button><button type="button" data-wire-action="flip">Flip bend</button></div><p class="inspector-note">Drag the square bend handles on the selected wire. Every point snaps to the grid.</p></section>${validationCard(issues.map((message) => ({ message })))}<button class="danger-action" type="button" data-wire-action="delete">Delete signal</button>`;
  dom.inspector.querySelectorAll("[data-connection-field]").forEach((input) => input.addEventListener("change", () => { const field = input.dataset.connectionField; mutate(() => { connection[field] = input.type === "number" ? Math.max(1, Math.min(64, Number(input.value) || 1)) : input.value; if (field === "routeMode" && input.value !== "custom") connection.points = []; }, `Updated ${connection.name || "signal"}`); }));
  dom.inspector.querySelectorAll("[data-wire-action]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.wireAction === "delete") { mutate(() => { moduleNow().connections = moduleNow().connections.filter((item) => item.id !== connection.id); state.selectedConnectionId = null; }, "Deleted signal"); return; }
    mutate(() => {
      if (button.dataset.wireAction === "reset") { connection.routeMode = "auto"; connection.points = []; }
      if (button.dataset.wireAction === "flip") { connection.routeMode = connection.routeMode === "vertical-first" ? "horizontal-first" : "vertical-first"; connection.points = []; }
    }, "Routed signal");
  }));
  if (!path) dom.inspector.querySelector(".inspector-note").textContent = "This signal has a missing endpoint.";
}
function renderInspector() {
  const nodes = selectedNodes(); const issues = moduleIssues();
  const selectedConnection = moduleNow().connections.find((connection) => connection.id === state.selectedConnectionId);
  if (selectedConnection) { renderConnectionInspector(selectedConnection); return; }
  if (!nodes.length) {
    dom.inspectorHead.innerHTML = `<div><span>MODULE DEFINITION</span><strong>${esc(moduleNow().name)}</strong></div><button type="button">•••</button>`;
    dom.inspector.innerHTML = `<section class="module-overview"><span class="module-overview-icon">M</span><h2>${esc(moduleNow().name)}</h2><p>${esc(moduleNow().description)}</p><span class="maturity status-${esc(moduleNow().status)}">${esc(moduleNow().status)}</span></section><section class="property-section"><h2>Design contract</h2><div class="overview-metrics"><div><strong>${moduleNow().ports.length}</strong><span>ports</span></div><div><strong>${moduleNow().nodes.length}</strong><span>blocks</span></div><div><strong>${moduleNow().connections.length}</strong><span>signals</span></div></div></section><section class="property-section"><h2>Interface</h2>${portTable(moduleNow().ports)}</section>${validationCard(issues)}<section class="idea-card"><span>NEW</span><strong>Interface impact preview</strong><p>Before changing a port, highlight every instance that will be affected.</p></section>`; return;
  }
  if (nodes.length > 1) {
    dom.inspectorHead.innerHTML = `<div><span>MULTI-SELECTION</span><strong>${nodes.length} blocks</strong></div><button type="button">•••</button>`;
    dom.inspector.innerHTML = `<section class="property-section"><h2>Arrange</h2><div class="arrange-grid"><button data-arrange="left">Align left</button><button data-arrange="top">Align top</button><button data-arrange="horizontal">Distribute H</button><button data-arrange="vertical">Distribute V</button></div></section>${nodes.map((item) => `<div class="selection-list-row"><span>${esc(displayName(item))}</span><small>${esc(item.name)}</small></div>`).join("")}`;
    dom.inspector.querySelectorAll("[data-arrange]").forEach((button) => button.addEventListener("click", () => arrange(button.dataset.arrange))); return;
  }
  const item = nodes[0]; const definition = item.kind === "module" ? state.project.modules[item.definitionId] : null;
  dom.inspectorHead.innerHTML = `<div><span>${esc(typeLabel(item))}</span><strong>${esc(item.name)}</strong></div><button type="button">•••</button>`;
  dom.inspector.innerHTML = `<section class="property-section"><h2>Identity</h2><label><span>${definition ? "Instance name" : "Label"}</span><input data-field="name" value="${esc(item.name)}"></label>${definition ? `<label><span>Module definition</span><button class="select-control" type="button" data-open-definition>${esc(definition.name)} <span>Open ↗</span></button></label>` : ""}<label><span>Description</span><textarea data-field="description" rows="2">${esc(item.description || subtitle(item))}</textarea></label></section>${portsOf(item).length ? `<section class="property-section"><div class="section-title"><h2>Ports</h2>${definition ? '<button data-open-definition>Edit definition</button>' : ""}</div>${portEditor(item)}</section>` : ""}<section class="property-section"><h2>Transform</h2><div class="field-pair"><label><span>X</span><input data-field="x" type="number" value="${item.x}"></label><label><span>Y</span><input data-field="y" type="number" value="${item.y}"></label></div><div class="field-pair"><label><span>W</span><input data-field="nodeWidth" type="number" value="${widthOf(item)}"></label><label><span>H</span><input data-field="height" type="number" value="${heightOf(item)}"></label></div></section>${validationCard(issues.filter((issue) => issue.id.includes(item.id)))}`;
  dom.inspector.querySelectorAll("[data-open-definition]").forEach((button) => button.addEventListener("click", () => openModule(item.definitionId, [...state.navigation, item.definitionId])));
  dom.inspector.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("change", () => { const field = input.dataset.field; mutate(() => { item[field] = input.type === "number" ? Number(input.value) : input.value; }, `Updated ${item.name}`); }));
  dom.inspector.querySelectorAll("[data-port-field]").forEach((input) => input.addEventListener("change", () => { const portId = input.dataset.portId; const field = input.dataset.portField; mutate(() => { item.portOverrides ||= {}; item.portOverrides[portId] ||= {}; item.portOverrides[portId][field] = input.type === "number" ? Math.max(1, Math.min(64, Number(input.value) || 1)) : input.value; }, `Updated ${item.name} port`); }));
}

function renderStatus() { const issues = moduleIssues(); dom.status.innerHTML = `<span>${esc(state.connectFrom ? "Drag to a compatible destination port · Esc to cancel" : `${moduleNow().name} · ${moduleNow().nodes.length} blocks · ${moduleNow().connections.length} signals`)}</span><span>${issues.length ? `⚠ ${issues.length} design issue${issues.length === 1 ? "" : "s"}` : "✓ Design contract valid"}</span><span>Grid ${GRID} px · Snap ${state.snap ? "on" : "off"}</span>`; }
function renderAll(options = {}) { renderBreadcrumbs(); renderCanvas(); renderInspector(); renderStatus(); if (options.left || state.leftTab === "hierarchy") renderLeft(); }

function selectNode(id, additive) { state.selectedConnectionId = null; if (!additive) state.selected.clear(); if (additive && state.selected.has(id)) state.selected.delete(id); else state.selected.add(id); renderCanvas(); renderInspector(); renderStatus(); }
function selectConnection(id) { state.selected.clear(); state.selectedConnectionId = id; state.connectFrom = null; renderCanvas(); renderInspector(); renderStatus(); }
function bindCanvasItems() {
  dom.stage.querySelectorAll(".arch-node, .arch-region").forEach((element) => {
    element.addEventListener("pointerdown", dragNode); element.addEventListener("click", (event) => { if (!event.target.closest("button, .resize-handle")) selectNode(element.dataset.nodeId, event.shiftKey); });
    element.addEventListener("dblclick", () => { const item = nodeNow(element.dataset.nodeId); if (item?.kind === "module") openModule(item.definitionId, [...state.navigation, item.definitionId]); });
  });
  dom.stage.querySelectorAll(".arch-port").forEach((button) => {
    button.addEventListener("pointerdown", startWireDrag);
    button.addEventListener("click", (event) => { event.stopPropagation(); if (Date.now() < state.suppressPortClickUntil) return; connectPort(button.dataset.nodeId, button.dataset.portId); });
  });
  dom.stage.querySelectorAll(".wire-hit").forEach((path) => path.addEventListener("pointerdown", (event) => { event.stopPropagation(); selectConnection(path.dataset.connectionId); }));
  dom.stage.querySelectorAll(".signal-label[data-connection-id]").forEach((label) => label.addEventListener("click", (event) => { event.stopPropagation(); selectConnection(label.dataset.connectionId); }));
  dom.stage.querySelectorAll(".wire-waypoint").forEach((handle) => handle.addEventListener("pointerdown", dragWireWaypoint));
  dom.stage.querySelectorAll("[data-open-module]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); openModule(button.dataset.openModule, [...state.navigation, button.dataset.openModule]); }));
  dom.stage.querySelectorAll(".resize-handle").forEach((handle) => handle.addEventListener("pointerdown", resizeNode));
}
function previewPath(source, worldPoint) {
  const sourceRef = portRef(source.nodeId, source.portId); if (!sourceRef) return;
  const a = portXY(sourceRef.node, sourceRef.port); const midX = snap((a.x + worldPoint.x) / 2);
  const d = orthogonalPath([a, { x: midX, y: a.y }, { x: midX, y: worldPoint.y }, worldPoint]);
  let preview = dom.stage.querySelector(".wire-preview");
  if (!preview) { preview = document.createElementNS("http://www.w3.org/2000/svg", "path"); preview.setAttribute("class", "wire-preview"); dom.stage.querySelector(".wire-layer")?.append(preview); }
  preview.setAttribute("d", d);
}
function completeConnection(sourceRef, targetRef) {
  const source = portRef(sourceRef.nodeId, sourceRef.portId); const target = portRef(targetRef.nodeId, targetRef.portId); if (!source || !target || source.port.direction === target.port.direction) return false;
  const from = source.port.direction === "output" ? sourceRef : targetRef; const to = source.port.direction === "output" ? targetRef : sourceRef; const output = portRef(from.nodeId, from.portId);
  mutate(() => { const created = signal(uid("signal"), from.nodeId, from.portId, to.nodeId, to.portId, output.port.name, output.port.width || 1); created.signalType = output.port.signalType === "clock" ? "clock" : output.port.signalType === "active-low" ? "reset" : output.port.signalType === "pulse" ? "pulse" : "data"; moduleNow().connections.push(created); state.selectedConnectionId = created.id; state.selected.clear(); state.connectFrom = null; }, "Connected signal");
  return true;
}
function startWireDrag(event) {
  event.preventDefault(); event.stopPropagation();
  if (event.button !== 0) return;
  const button = event.currentTarget; const source = { nodeId: button.dataset.nodeId, portId: button.dataset.portId }; const origin = { x: event.clientX, y: event.clientY }; let dragging = false;
  const move = (next) => {
    if (!dragging && Math.hypot(next.clientX - origin.x, next.clientY - origin.y) < 4) return;
    dragging = true; state.connectFrom = source; previewPath(source, canvasPoint(next.clientX, next.clientY));
  };
  const end = (next) => {
    window.removeEventListener("pointermove", move); dom.stage.querySelector(".wire-preview")?.remove();
    if (!dragging) return;
    const targetElement = document.elementFromPoint(next.clientX, next.clientY)?.closest(".arch-port");
    const target = targetElement ? { nodeId: targetElement.dataset.nodeId, portId: targetElement.dataset.portId } : null;
    if (!target || (target.nodeId === source.nodeId && target.portId === source.portId) || !completeConnection(source, target)) { state.connectFrom = null; renderAll(); }
    state.suppressPortClickUntil = Date.now() + 250;
  };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
}
function dragWireWaypoint(event) {
  event.preventDefault(); event.stopPropagation();
  const connection = moduleNow().connections.find((item) => item.id === event.currentTarget.dataset.connectionId); const index = Number(event.currentTarget.dataset.pointIndex); const currentPath = connection && route(connection); if (!connection || !currentPath) return;
  const previous = JSON.stringify(state.project); connection.routeMode = "custom"; connection.points = currentPath.intermediate.map((point) => ({ ...point }));
  const move = (next) => { const point = canvasPoint(next.clientX, next.clientY); connection.points[index] = point; renderCanvas(); };
  const end = () => { window.removeEventListener("pointermove", move); state.history.push(previous); state.future = []; persist("Adjusted wire route"); renderAll(); };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
}
function dragNode(event) {
  if (event.button || event.target.closest("button, .resize-handle")) return; const id = event.currentTarget.dataset.nodeId; state.selectedConnectionId = null; if (!state.selected.has(id)) state.selected = new Set([id]);
  const items = selectedNodes().map((item) => ({ item, x: item.x, y: item.y })); const origin = { x: event.clientX, y: event.clientY }; const previous = JSON.stringify(state.project); let moved = false;
  const move = (next) => { const dx = (next.clientX - origin.x) / state.zoom; const dy = (next.clientY - origin.y) / state.zoom; moved ||= Math.abs(dx) + Math.abs(dy) > 2; items.forEach((entry) => { entry.item.x = snap(entry.x + dx); entry.item.y = snap(entry.y + dy); }); renderCanvas(); };
  const end = () => { window.removeEventListener("pointermove", move); if (moved) { state.history.push(previous); state.future = []; persist("Moved blocks"); } renderAll(); };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
}
function resizeNode(event) {
  event.preventDefault(); event.stopPropagation(); const item = nodeNow(event.currentTarget.closest("[data-node-id]").dataset.nodeId); const origin = { x: event.clientX, y: event.clientY, w: widthOf(item), h: heightOf(item) }; const previous = JSON.stringify(state.project);
  const move = (next) => { item.nodeWidth = Math.max(96, snap(origin.w + (next.clientX - origin.x) / state.zoom)); item.height = Math.max(72, snap(origin.h + (next.clientY - origin.y) / state.zoom)); renderCanvas(); };
  const end = () => { window.removeEventListener("pointermove", move); state.history.push(previous); state.future = []; persist("Resized block"); renderAll(); };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
}
function connectPort(nodeId, portId) {
  const target = portRef(nodeId, portId); if (!target) return;
  if (!state.connectFrom) { state.connectFrom = { nodeId, portId }; renderAll(); return; }
  if (state.connectFrom.nodeId === nodeId && state.connectFrom.portId === portId) { state.connectFrom = null; renderAll(); return; }
  const source = portRef(state.connectFrom.nodeId, state.connectFrom.portId); if (!source || source.port.direction === target.port.direction) { state.connectFrom = { nodeId, portId }; renderAll(); return; }
  completeConnection(state.connectFrom, { nodeId, portId });
}

function canvasPoint(clientX, clientY) { const rect = dom.canvas.getBoundingClientRect(); return { x: snap((clientX - rect.left - state.panX) / state.zoom), y: snap((clientY - rect.top - state.panY) / state.zoom) }; }
function addNode(kind, point) {
  const target = point || { x: snap((dom.canvas.clientWidth / 2 - state.panX) / state.zoom), y: snap((dom.canvas.clientHeight / 2 - state.panY) / state.zoom) }; let item;
  if (kind === "module") { const definition = Object.values(state.project.modules).find((value) => value.id !== state.activeModuleId) || newDefinition(); item = node(uid("module"), "module", `U_${definition.name.toUpperCase()}`, target.x, target.y, { definitionId: definition.id }); }
  else if (kind === "boundary") item = node(uid("region"), "boundary", "Architecture region", target.x, target.y, { nodeWidth: 420, height: 260, color: "green" });
  else { const definition = catalog[kind] || catalog.and; const portCount = Math.max(definition.ports.filter((p) => p.direction === "input").length, definition.ports.filter((p) => p.direction === "output").length); item = node(uid(kind), kind, definition.label.toUpperCase(), target.x, target.y, { width: ["mux", "demux", "register", "counter", "adder", "subtractor", "comparator", "not", "buffer", "constant"].includes(kind) ? 8 : 1, height: Math.max(150, 112 + portCount * 25) }); }
  mutate(() => { moduleNow().nodes.push(item); state.selected = new Set([item.id]); state.selectedConnectionId = null; }, `Added ${displayName(item)}`);
}
function arrange(mode) {
  const items = selectedNodes(); if (items.length < 2) return; mutate(() => {
    if (mode === "left") { const x = Math.min(...items.map((i) => i.x)); items.forEach((i) => { i.x = x; }); }
    if (mode === "top") { const y = Math.min(...items.map((i) => i.y)); items.forEach((i) => { i.y = y; }); }
    if (mode === "horizontal") { const sorted = [...items].sort((a, b) => a.x - b.x); const min = sorted[0].x; const max = sorted.at(-1).x; sorted.forEach((i, index) => { i.x = snap(min + (max - min) * index / (sorted.length - 1)); }); }
    if (mode === "vertical") { const sorted = [...items].sort((a, b) => a.y - b.y); const min = sorted[0].y; const max = sorted.at(-1).y; sorted.forEach((i, index) => { i.y = snap(min + (max - min) * index / (sorted.length - 1)); }); }
  }, "Arranged blocks");
}
function removeSelected() { if (!state.selected.size) return; mutate(() => { const ids = new Set(state.selected); moduleNow().nodes = moduleNow().nodes.filter((item) => !ids.has(item.id)); moduleNow().connections = moduleNow().connections.filter((item) => !ids.has(item.from.nodeId) && !ids.has(item.to.nodeId)); state.selected.clear(); state.selectedConnectionId = null; }, "Deleted blocks"); }
function copySelected() { const ids = new Set(state.selected); if (!ids.size) return; state.clipboard = { nodes: clone(moduleNow().nodes.filter((item) => ids.has(item.id))), connections: clone(moduleNow().connections.filter((item) => ids.has(item.from.nodeId) && ids.has(item.to.nodeId))) }; }
function pasteClipboard() {
  if (!state.clipboard?.nodes.length) return; mutate(() => { const ids = new Map(); const nodes = state.clipboard.nodes.map((item) => { const id = uid(item.kind); ids.set(item.id, id); return { ...clone(item), id, name: `${item.name}_COPY`, x: item.x + 32, y: item.y + 32 }; }); const connections = state.clipboard.connections.map((item) => ({ ...clone(item), id: uid("signal"), from: { ...item.from, nodeId: ids.get(item.from.nodeId) }, to: { ...item.to, nodeId: ids.get(item.to.nodeId) } })); moduleNow().nodes.push(...nodes); moduleNow().connections.push(...connections); state.selected = new Set(nodes.map((item) => item.id)); }, "Pasted blocks");
}
function undo() { if (!state.history.length) return; state.future.push(JSON.stringify(state.project)); state.project = JSON.parse(state.history.pop()); state.selected.clear(); state.selectedConnectionId = null; persist("Undo"); renderAll({ left: true }); }
function redo() { if (!state.future.length) return; state.history.push(JSON.stringify(state.project)); state.project = JSON.parse(state.future.pop()); state.selected.clear(); state.selectedConnectionId = null; persist("Redo"); renderAll({ left: true }); }

function zoomBy(factor, centerX = dom.canvas.clientWidth / 2, centerY = dom.canvas.clientHeight / 2) { const old = state.zoom; const next = Math.max(.25, Math.min(2, old * factor)); const worldX = (centerX - state.panX) / old; const worldY = (centerY - state.panY) / old; state.zoom = next; state.panX = centerX - worldX * next; state.panY = centerY - worldY * next; setTransform(); }
function fitView() {
  const items = moduleNow().nodes.filter((item) => item.kind !== "boundary"); if (!items.length) return; const minX = Math.min(...items.map((i) => i.x)) - 80; const minY = Math.min(...items.map((i) => i.y)) - 100; const maxX = Math.max(...items.map((i) => i.x + widthOf(i))) + 80; const maxY = Math.max(...items.map((i) => i.y + heightOf(i))) + 80;
  state.zoom = Math.max(.3, Math.min(1.2, Math.min(dom.canvas.clientWidth / (maxX - minX), dom.canvas.clientHeight / (maxY - minY))));
  const renderedWidth = (maxX - minX) * state.zoom; const renderedHeight = (maxY - minY) * state.zoom;
  state.panX = renderedWidth > dom.canvas.clientWidth ? -minX * state.zoom + 24 : -minX * state.zoom + (dom.canvas.clientWidth - renderedWidth) / 2;
  state.panY = renderedHeight > dom.canvas.clientHeight ? -minY * state.zoom + 24 : -minY * state.zoom + (dom.canvas.clientHeight - renderedHeight) / 2;
  setTransform();
}
function safeName(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "architecture"; }
function svgForModule() {
  const items = moduleNow().nodes.filter((item) => item.kind !== "boundary"); const minX = Math.min(0, ...items.map((i) => i.x - 70)); const minY = Math.min(0, ...items.map((i) => i.y - 100)); const maxX = Math.max(800, ...items.map((i) => i.x + widthOf(i) + 70)); const maxY = Math.max(500, ...items.map((i) => i.y + heightOf(i) + 70));
  const wires = moduleNow().connections.map((connection) => { const path = route(connection); return path ? `<path d="${path.d}" fill="none" stroke="#263b61" stroke-width="${connection.width > 1 ? 4 : 2}" stroke-linejoin="round"/>` : ""; }).join("");
  const blocks = items.map((item) => `<g><rect x="${item.x}" y="${item.y}" width="${widthOf(item)}" height="${heightOf(item)}" rx="4" fill="white" stroke="#46536a"/><rect x="${item.x}" y="${item.y}" width="${widthOf(item)}" height="28" rx="4" fill="#eef2f2"/><text x="${item.x + 10}" y="${item.y + 19}" fill="#697386" font-family="monospace" font-size="9">${esc(typeLabel(item))}</text><text x="${item.x + widthOf(item) / 2}" y="${item.y + 58}" text-anchor="middle" fill="#172033" font-family="Arial" font-size="17" font-weight="700">${esc(displayName(item))}</text></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX - minX}" height="${maxY - minY}" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}"><rect x="${minX}" y="${minY}" width="100%" height="100%" fill="white"/><text x="${minX + 32}" y="${minY + 40}" fill="#176b5b" font-family="monospace" font-size="10">MODULE DEFINITION</text><text x="${minX + 32}" y="${minY + 72}" fill="#172033" font-family="Georgia" font-size="26">${esc(moduleNow().name)}</text>${wires}${blocks}</svg>`;
}
function download(blob, filename) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
function exportSvg() { download(new Blob([svgForModule()], { type: "image/svg+xml" }), `${safeName(moduleNow().name)}.svg`); }
function exportPng() { const svg = svgForModule(); const image = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = image.width * 2; canvas.height = image.height * 2; const context = canvas.getContext("2d"); context.scale(2, 2); context.drawImage(image, 0, 0); canvas.toBlob((blob) => blob && download(blob, `${safeName(moduleNow().name)}.png`), "image/png"); URL.revokeObjectURL(url); }; image.src = url; }
function exportJson() { download(new Blob([JSON.stringify(state.project, null, 2)], { type: "application/json" }), `${safeName(state.project.name)}.arch.json`); persist("Project JSON exported"); }
function newProject() { if (!confirm("Start a fresh architecture project? Export JSON first if you need a backup.")) return; const id = "top"; state.project = { version: 1, name: "Untitled digital system", topModuleId: id, updatedAt: new Date().toISOString(), modules: { [id]: { id, name: "Top", description: "Top-level architecture", status: "draft", ports: [], nodes: [], connections: [] } } }; state.activeModuleId = id; state.navigation = [id]; state.selected.clear(); state.selectedConnectionId = null; state.history = []; state.future = []; persist("New project"); renderAll({ left: true }); }

function bindToolbar() {
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => { const action = button.dataset.action; if (action === "new") newProject(); if (action === "save") exportJson(); if (action === "load") dom.file.click(); if (action === "undo") undo(); if (action === "redo") redo(); if (action === "zoom-in") zoomBy(1.15); if (action === "zoom-out") zoomBy(1 / 1.15); if (action === "fit") fitView(); if (action === "grid") { state.grid = !state.grid; button.setAttribute("aria-pressed", String(state.grid)); setTransform(); } if (action === "snap") { state.snap = !state.snap; button.setAttribute("aria-pressed", String(state.snap)); renderStatus(); } if (action === "export-svg") exportSvg(); if (action === "export-png") exportPng(); }));
  document.querySelectorAll("[data-left-tab]").forEach((button) => button.addEventListener("click", () => { state.leftTab = button.dataset.leftTab; renderLeft(); }));
  document.querySelector("[data-toggle-panel='inspector']")?.addEventListener("click", (event) => {
    const open = document.body.classList.toggle("inspector-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
    event.currentTarget.textContent = open ? "Close inspector" : "Inspector";
  });
  document.querySelectorAll("[data-canvas-tool]").forEach((button) => button.addEventListener("click", () => { state.tool = button.dataset.canvasTool; document.querySelectorAll("[data-canvas-tool]").forEach((item) => item.classList.toggle("is-active", item === button)); }));
  dom.file.addEventListener("change", async () => { const file = dom.file.files[0]; if (!file) return; try { const project = JSON.parse(await file.text()); if (!validProject(project)) throw new Error("Unsupported project structure"); state.project = project; state.activeModuleId = project.topModuleId; state.navigation = [project.topModuleId]; state.selected.clear(); state.selectedConnectionId = null; state.history = []; state.future = []; persist("Project imported"); renderAll({ left: true }); setTimeout(fitView, 0); } catch (error) { alert(`Could not load project: ${error.message}`); } dom.file.value = ""; });
}
function bindSurface() {
  dom.canvas.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; });
  dom.canvas.addEventListener("drop", (event) => { event.preventDefault(); const kind = event.dataTransfer.getData("text/x-architecture-kind"); if (kind) addNode(kind, canvasPoint(event.clientX, event.clientY)); });
  dom.canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) { const rect = dom.canvas.getBoundingClientRect(); zoomBy(Math.exp(-event.deltaY * .008), event.clientX - rect.left, event.clientY - rect.top); return; }
    const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? dom.canvas.clientHeight : 1;
    state.panX -= event.deltaX * multiplier; state.panY -= event.deltaY * multiplier; setTransform();
  }, { passive: false });
  dom.canvas.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".arch-node, .arch-region, .canvas-tools, .minimap")) return;
    if (event.button !== 1 && state.tool !== "pan" && !state.spaceDown && !event.metaKey && !event.ctrlKey) { state.selected.clear(); state.selectedConnectionId = null; state.connectFrom = null; renderAll(); return; }
    const origin = { x: event.clientX, y: event.clientY, panX: state.panX, panY: state.panY }; const move = (next) => { state.panX = origin.panX + next.clientX - origin.x; state.panY = origin.panY + next.clientY - origin.y; setTransform(); }; const end = () => window.removeEventListener("pointermove", move); window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true });
  });
  const minimap = document.querySelector(".minimap");
  minimap?.addEventListener("pointerdown", (event) => { event.preventDefault(); const move = (next) => { const rect = minimap.getBoundingClientRect(); const worldX = Math.max(0, Math.min(STAGE.width, (next.clientX - rect.left) / rect.width * STAGE.width)); const worldY = Math.max(0, Math.min(STAGE.height, (next.clientY - rect.top) / rect.height * STAGE.height)); state.panX = dom.canvas.clientWidth / 2 - worldX * state.zoom; state.panY = dom.canvas.clientHeight / 2 - worldY * state.zoom; setTransform(); }; move(event); const end = () => window.removeEventListener("pointermove", move); window.addEventListener("pointermove", move); window.addEventListener("pointerup", end, { once: true }); });
}
function bindKeyboard() {
  document.addEventListener("keydown", (event) => { if (event.target.matches("input, textarea, select")) return; const command = event.metaKey || event.ctrlKey; if (event.code === "Space") { state.spaceDown = true; event.preventDefault(); } if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); } if (command && event.key.toLowerCase() === "c") { event.preventDefault(); copySelected(); } if (command && event.key.toLowerCase() === "v") { event.preventDefault(); pasteClipboard(); } if (command && event.key.toLowerCase() === "d") { event.preventDefault(); copySelected(); pasteClipboard(); } if (["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); if (state.selectedConnectionId) { const id = state.selectedConnectionId; mutate(() => { moduleNow().connections = moduleNow().connections.filter((item) => item.id !== id); state.selectedConnectionId = null; }, "Deleted signal"); } else removeSelected(); } if (event.key === "Escape") { state.connectFrom = null; state.selected.clear(); state.selectedConnectionId = null; renderAll(); } if (event.key.toLowerCase() === "f") fitView(); if (["+", "="].includes(event.key)) zoomBy(1.15); if (event.key === "-") zoomBy(1 / 1.15); });
  document.addEventListener("keyup", (event) => { if (event.code === "Space") state.spaceDown = false; });
  window.addEventListener("blur", () => { state.spaceDown = false; });
}

bindToolbar(); bindSurface(); bindKeyboard(); renderLeft(); renderAll();
