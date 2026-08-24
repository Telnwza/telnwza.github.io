"use strict";

// Block Schematic Studio uses its own storage namespace and route.

const SVG_NS = "http://www.w3.org/2000/svg";
const STORAGE_KEY = "block-schematic-studio.project.v1";
const UI_STORAGE_KEY = "block-schematic-studio.ui.v1";
const GRID = 20;
const FRAME_BLOCK_PADDING_X = 180;
const FRAME_BLOCK_PADDING_Y = 120;
const FRAME_WIRE_PADDING = 70;
const PAGE_INTERFACE_BLOCK_ID = "__page_interface__";
const HISTORY_LIMIT = 100;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

const els = {
  studioShell: document.querySelector(".studio-shell"),
  leftPanel: document.querySelector(".left-panel"),
  rightPanel: document.querySelector(".right-panel"),
  canvasWrap: document.querySelector("#canvas-wrap"),
  svg: document.querySelector("#schematic"),
  viewport: document.querySelector("#viewport-layer"),
  pageFrameLayer: document.querySelector("#page-frame-layer"),
  pagePortLayer: document.querySelector("#page-port-layer"),
  wireLayer: document.querySelector("#wire-layer"),
  blockLayer: document.querySelector("#block-layer"),
  overlayLayer: document.querySelector("#overlay-layer"),
  pageTree: document.querySelector("#page-tree"),
  partsLibrary: document.querySelector("#parts-library"),
  partsSearch: document.querySelector("#parts-search"),
  breadcrumbs: document.querySelector("#breadcrumbs"),
  layerContext: document.querySelector("#layer-context"),
  inspector: document.querySelector("#inspector"),
  inspectorTitle: document.querySelector("#inspector-title"),
  selectionCount: document.querySelector("#selection-count"),
  pageSummary: document.querySelector("#page-summary"),
  validationStatus: document.querySelector("#validation-status"),
  validationDialog: document.querySelector("#validation-dialog"),
  validationList: document.querySelector("#validation-list"),
  projectFile: document.querySelector("#project-file"),
  pageActionMenu: document.querySelector("#page-action-menu"),
  saveStatus: document.querySelector("#save-status"),
  zoomStatus: document.querySelector("#zoom-status"),
  toastRegion: document.querySelector("#toast-region"),
  minimap: document.querySelector("#minimap"),
  minimapSvg: document.querySelector("#minimap-svg"),
  emptyPage: document.querySelector("#empty-page"),
  draftStatus: document.querySelector("#draft-status"),
  wireTooltip: document.querySelector("#wire-tooltip"),
};

const library = [
  { category: "Ports and nets", type: "INPUT", label: "Input", symbol: "IN", legacyOnly: true },
  { category: "Ports and nets", type: "OUTPUT", label: "Output", symbol: "OUT", legacyOnly: true },
  { category: "Ports and nets", type: "INOUT", label: "InOut", symbol: "↔" },
  { category: "Ports and nets", type: "NET_LABEL", label: "Net label", symbol: "N" },
  { category: "Ports and nets", type: "BUS", label: "Bus", symbol: "B8" },
  { category: "Ports and nets", type: "BUS_TAP", label: "Bus tap", symbol: "BT" },
  { category: "Ports and nets", type: "JUNCTION", label: "Junction", symbol: "●" },
  { category: "Ports and nets", type: "CONST_0", label: "Constant 0", symbol: "0" },
  { category: "Ports and nets", type: "CONST_1", label: "Constant 1", symbol: "1" },
  { category: "Ports and nets", type: "CLOCK", label: "Clock", symbol: "CLK" },
  { category: "Ports and nets", type: "GROUND", label: "Ground", symbol: "GND" },
  { category: "Ports and nets", type: "VCC", label: "VCC", symbol: "VCC" },
  { category: "Logic gates", type: "BUFFER", label: "Buffer", symbol: "BUF" },
  { category: "Logic gates", type: "NOT", label: "NOT", symbol: "¬" },
  { category: "Logic gates", type: "AND", label: "AND", symbol: "&", gate: true },
  { category: "Logic gates", type: "NAND", label: "NAND", symbol: "!&", gate: true },
  { category: "Logic gates", type: "OR", label: "OR", symbol: "≥1", gate: true },
  { category: "Logic gates", type: "NOR", label: "NOR", symbol: "!≥", gate: true },
  { category: "Logic gates", type: "XOR", label: "XOR", symbol: "=1", gate: true },
  { category: "Logic gates", type: "XNOR", label: "XNOR", symbol: "!=", gate: true },
  { category: "Flip-flops and sequential", type: "D_FF", label: "D Flip-Flop", symbol: "D" },
  { category: "Flip-flops and sequential", type: "JK_FF", label: "JK Flip-Flop", symbol: "JK" },
  { category: "Flip-flops and sequential", type: "T_FF", label: "T Flip-Flop", symbol: "T" },
  { category: "Flip-flops and sequential", type: "SR_FF", label: "SR Flip-Flop", symbol: "SR" },
  { category: "Flip-flops and sequential", type: "D_LATCH", label: "D Latch", symbol: "DL" },
  { category: "Flip-flops and sequential", type: "REGISTER", label: "Register", symbol: "REG" },
  { category: "Flip-flops and sequential", type: "SHIFT_REGISTER", label: "Shift Register", symbol: "SHR" },
  { category: "Flip-flops and sequential", type: "COUNTER", label: "Counter", symbol: "CTR" },
  { category: "Flip-flops and sequential", type: "CLOCK_DIVIDER", label: "Clock Divider", symbol: "÷N" },
  { category: "Flip-flops and sequential", type: "RISING_EDGE", label: "Rising Edge", symbol: "↑" },
  { category: "Flip-flops and sequential", type: "FALLING_EDGE", label: "Falling Edge", symbol: "↓" },
  { category: "Flip-flops and sequential", type: "ONE_SHOT", label: "One-shot / Pulse", symbol: "1×" },
  { category: "Routing and arithmetic", type: "MUX", label: "MUX", symbol: "MUX" },
  { category: "Routing and arithmetic", type: "DEMUX", label: "DEMUX", symbol: "DMX" },
  { category: "Routing and arithmetic", type: "ENCODER", label: "Encoder", symbol: "ENC" },
  { category: "Routing and arithmetic", type: "PRIORITY_ENCODER", label: "Priority Encoder", symbol: "PEN" },
  { category: "Routing and arithmetic", type: "DECODER", label: "Decoder", symbol: "DEC" },
  { category: "Routing and arithmetic", type: "COMPARATOR", label: "Comparator", symbol: "CMP" },
  { category: "Routing and arithmetic", type: "ADDER", label: "Adder", symbol: "+" },
  { category: "Routing and arithmetic", type: "SUBTRACTOR", label: "Subtractor", symbol: "−" },
  { category: "Routing and arithmetic", type: "INCREMENTER", label: "Incrementer", symbol: "+1" },
  { category: "Routing and arithmetic", type: "CONCAT", label: "Concatenation", symbol: "{}" },
  { category: "Routing and arithmetic", type: "SPLITTER", label: "Splitter", symbol: "Y" },
  { category: "Routing and arithmetic", type: "BUS_TAP", label: "Bus Tap", symbol: "BT" },
];

const ui = {
  selectedBlocks: new Set(),
  selectedWireId: null,
  expandedPages: new Set(),
  activeTab: "pages",
  grid: true,
  snap: true,
  wireDraft: null,
  interaction: null,
  clipboard: null,
  history: [],
  future: [],
  saveTimer: null,
  inspectorInputTimer: null,
  renderQueued: false,
  minimapMap: null,
  spaceDown: false,
  lastBlockPointer: null,
  lastWirePointer: null,
  suppressWireDoubleClickUntil: 0,
  lastWaypointPointer: null,
  pageMenuPageId: null,
  pageMenuAnchor: null,
  pageMenuMode: "actions",
  hoveredWireId: null,
  panelResize: null,
};

function loadPanelPrefs() {
  try {
    const value = JSON.parse(localStorage.getItem(UI_STORAGE_KEY));
    return {
      leftWidth: clamp(Number(value?.leftWidth) || 252, 190, 440),
      rightWidth: clamp(Number(value?.rightWidth) || 286, 240, 520),
      leftOpen: value?.leftOpen !== false,
      rightOpen: value?.rightOpen !== false,
    };
  } catch {
    return { leftWidth: 252, rightWidth: 286, leftOpen: true, rightOpen: true };
  }
}

let panelPrefs = loadPanelPrefs();

function id(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function snap(value) { return ui.snap ? Math.round(value / GRID) * GRID : value; }
function clone(value) { return structuredClone(value); }

function port(name, direction, width = 1, notation = "normal", required = true) {
  return { id: id("port"), name, direction, width, notation, required };
}

function pagePortSide(targetPort) {
  if (targetPort.direction === "inout") return targetPort.side === "right" ? "right" : "left";
  return targetPort.direction === "output" ? "right" : "left";
}

function internalPagePort(targetPort) {
  if (!targetPort) return null;
  const direction = targetPort.direction === "input" ? "output" : targetPort.direction === "output" ? "input" : "inout";
  return { ...targetPort, direction };
}

function defaultPagePortPosition(page, targetPort) {
  const side = pagePortSide(targetPort);
  const sameSide = page.ports.filter((item) => pagePortSide(item) === side);
  const index = Math.max(0, sameSide.findIndex((item) => item.id === targetPort.id));
  return .14 + .72 * (index + 1) / (sameSide.length + 1);
}

function portsForType(type, inputCount = 2) {
  const gateInputs = () => Array.from({ length: inputCount }, (_, index) => port(String.fromCharCode(65 + index), "input"));
  if (["INPUT", "CONST_0", "CONST_1", "GROUND", "VCC"].includes(type)) return [port(type === "INPUT" ? "IN" : "Y", "output")];
  if (type === "CLOCK") return [port("CLK", "output", 1, "clock")];
  if (type === "OUTPUT") return [port("OUT", "input")];
  if (["INOUT", "NET_LABEL", "JUNCTION"].includes(type)) return [port("IO", "inout", 1, "normal", false)];
  if (type === "BUS") return [port("IN", "input", 8), port("OUT", "output", 8)];
  if (type === "BUS_TAP") return [port("BUS", "input", 8), port("BIT", "output", 1)];
  if (["BUFFER", "NOT"].includes(type)) return [port("A", "input"), port("Y", "output", 1, type === "NOT" ? "not" : "normal")];
  if (["AND", "NAND", "OR", "NOR", "XOR", "XNOR"].includes(type)) return [...gateInputs(), port("Y", "output", 1, ["NAND", "NOR", "XNOR"].includes(type) ? "not" : "normal")];
  if (type === "D_FF") return [port("D", "input"), port("CLK", "input", 1, "rising"), port("RST", "input", 1, "not", false), port("Q", "output"), port("QN", "output", 1, "not", false)];
  if (type === "JK_FF") return [port("J", "input"), port("K", "input"), port("CLK", "input", 1, "rising"), port("Q", "output")];
  if (type === "T_FF") return [port("T", "input"), port("CLK", "input", 1, "rising"), port("Q", "output")];
  if (type === "SR_FF") return [port("S", "input"), port("R", "input"), port("CLK", "input", 1, "rising", false), port("Q", "output")];
  if (type === "D_LATCH") return [port("D", "input"), port("EN", "input"), port("Q", "output")];
  if (["REGISTER", "SHIFT_REGISTER", "COUNTER"].includes(type)) return [port(type === "COUNTER" ? "EN" : "D", "input", type === "COUNTER" ? 1 : 8), port("CLK", "input", 1, "rising"), port("RST", "input", 1, "not", false), port("Q", "output", 8)];
  if (type === "CLOCK_DIVIDER") return [port("CLK", "input", 1, "clock"), port("RST", "input", 1, "not", false), port("CLK_OUT", "output", 1, "clock")];
  if (["RISING_EDGE", "FALLING_EDGE", "ONE_SHOT"].includes(type)) return [port("IN", "input", 1, type === "FALLING_EDGE" ? "falling" : "rising"), port("PULSE", "output", 1, "pulse")];
  if (type === "MUX") return [port("A", "input", 8), port("B", "input", 8), port("SEL", "input"), port("Y", "output", 8)];
  if (type === "DEMUX") return [port("A", "input", 8), port("SEL", "input"), port("Y0", "output", 8), port("Y1", "output", 8)];
  if (["ENCODER", "PRIORITY_ENCODER"].includes(type)) return [port("D", "input", 8), port("Y", "output", 3), port("VALID", "output", 1, "normal", false)];
  if (type === "DECODER") return [port("A", "input", 3), port("EN", "input", 1, "normal", false), port("Y", "output", 8)];
  if (type === "COMPARATOR") return [port("A", "input", 8), port("B", "input", 8), port("EQ", "output"), port("LT", "output"), port("GT", "output")];
  if (["ADDER", "SUBTRACTOR"].includes(type)) return [port("A", "input", 8), port("B", "input", 8), port(type === "ADDER" ? "CIN" : "BIN", "input", 1, "normal", false), port(type === "ADDER" ? "SUM" : "DIFF", "output", 8), port(type === "ADDER" ? "COUT" : "BOUT", "output")];
  if (type === "INCREMENTER") return [port("A", "input", 8), port("Y", "output", 8)];
  if (type === "CONCAT") return [port("A", "input", 4), port("B", "input", 4), port("Y", "output", 8)];
  if (type === "SPLITTER") return [port("A", "input", 8), port("HI", "output", 4), port("LO", "output", 4)];
  return [port("A", "input"), port("Y", "output")];
}

function makePage(name, parentId = null, description = "") {
  return { id: id("page"), name, parentId, description, isTop: false, ports: [], blocks: [], wires: [], view: { x: 100, y: 80, zoom: 1 } };
}

function identifierPart(value) {
  return String(value || "BLOCK").toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_").replaceAll(/^_+|_+$/g, "") || "BLOCK";
}

function instancePrefix(type, definition = "") {
  const fixed = {
    INPUT: "IN", OUTPUT: "OUT", INOUT: "IO", NET_LABEL: "NET", BUS: "BUS", BUS_TAP: "TAP", JUNCTION: "J",
    CONST_0: "C0", CONST_1: "C1", CLOCK: "CLK", GROUND: "GND", VCC: "VCC",
    D_FF: "FF", JK_FF: "JK", T_FF: "TFF", SR_FF: "SRFF", D_LATCH: "LAT",
    REGISTER: "REG", SHIFT_REGISTER: "SHIFT", COUNTER: "CTR", CLOCK_DIVIDER: "DIV",
    RISING_EDGE: "EDGE", FALLING_EDGE: "EDGE", ONE_SHOT: "PULSE",
  };
  if (type === "PAGE") return `U_${identifierPart(definition)}`;
  return fixed[type] || `U_${identifierPart(type)}`;
}

function nextNameForPrefix(prefix, page = currentPage(), reservedNames = new Set()) {
  const escaped = prefix.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`^${escaped}(\\d+)$`, "i");
  let highest = 0;
  for (const name of [...page.blocks.map((block) => block.name), ...reservedNames]) {
    const match = String(name).match(matcher);
    if (match) highest = Math.max(highest, Number(match[1]) || 0);
  }
  return `${prefix}${highest + 1}`;
}

function nextInstanceName(type, page = currentPage(), definition = "", reservedNames = new Set()) {
  return nextNameForPrefix(instancePrefix(type, definition), page, reservedNames);
}

function makeBlock(type, x, y, options = {}) {
  const entry = library.find((item) => item.type === type);
  const inputCount = options.inputCount || 2;
  return {
    id: id("block"),
    type,
    name: options.name || nextInstanceName(type, currentPage(), options.definition || entry?.label || type),
    definition: options.definition || entry?.label || type,
    definitionPageId: options.definitionPageId || null,
    description: options.description || "",
    x: snap(x), y: snap(y), w: options.w || 150, h: options.h || 130,
    z: options.z || 1,
    inputCount,
    ports: options.ports ? clone(options.ports) : portsForType(type, inputCount),
  };
}

function makeWire(from, to, width = 1, name = "") {
  return { id: id("wire"), from: clone(from), to: clone(to), width, name, signalType: width > 1 ? "bus" : "logic", routeStyle: "auto", waypoints: [] };
}

function createSampleProject() {
  const top = makePage("TheClock", null, "Four-digit HH:MM clock. One real clock domain; slower rates are synchronous enable pulses, not fabric-generated clocks.");
  const enables = makePage("ClockEnables", top.id, "Generates one-cycle TICK_1S and TICK_SCAN clock-enable pulses from CLK_1MHZ.");
  const time = makePage("TimeCore", top.id, "Maintains four BCD digits and performs the synchronous 23:59 -> 00:00 rollover.");
  const counters = makePage("BCDTimeCounters", time.id, "Cascaded BCD counters. Hour ones uses a limit of 3 only while hour tens equals 2.");
  const display = makePage("Display", top.id, "Multiplexes four BCD digits, decodes one digit to seven segments, and drives active-low digit enables.");
  const scanner = makePage("DigitScanner", display.id, "Advances a 2-bit digit index on TICK_SCAN and decodes it to one-of-four active-low enables.");
  const bcdTo7 = makePage("BCDTo7Segment", display.id, "Combinational BCD-to-seven-segment decoder. Segment polarity must match the target board.");
  top.isTop = true;

  top.ports = [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("SEGMENT", "output", 7), port("DIGIT_N", "output", 4, "not")];
  enables.ports = [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("TICK_1S", "output", 1, "pulse"), port("TICK_SCAN", "output", 1, "pulse")];
  time.ports = [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("TICK_1S", "input", 1, "pulse"), port("HOUR_TENS", "output", 4), port("HOUR_ONES", "output", 4), port("MIN_TENS", "output", 4), port("MIN_ONES", "output", 4)];
  counters.ports = clone(time.ports);
  display.ports = [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("TICK_SCAN", "input", 1, "pulse"), port("HOUR_TENS", "input", 4), port("HOUR_ONES", "input", 4), port("MIN_TENS", "input", 4), port("MIN_ONES", "input", 4), port("SEGMENT", "output", 7), port("DIGIT_N", "output", 4, "not")];
  scanner.ports = [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("TICK_SCAN", "input", 1, "pulse"), port("DIGIT_INDEX", "output", 2), port("DIGIT_N", "output", 4, "not")];
  bcdTo7.ports = [port("BCD", "input", 4), port("SEGMENT", "output", 7)];

  const instance = (definition, x, y, name, w = 190, h = 190) => makeBlock("PAGE", x, y, { name, definition: definition.name, definitionPageId: definition.id, w, h });
  const connector = (direction, name, width, x, y, notation = "normal") => makeBlock(direction === "input" ? "INPUT" : "OUTPUT", x, y, {
    name,
    definition: direction === "input" ? "PAGE INPUT" : "PAGE OUTPUT",
    w: 126,
    h: 78,
    ports: [port(name, direction === "input" ? "output" : "input", width, notation)],
  });
  const pin = (block, ports, name) => ({ blockId: block.id, portId: ports.find((targetPort) => targetPort.name === name)?.id });
  const connect = (page, fromBlock, fromPorts, fromName, toBlock, toPorts, toName, label = fromName) => {
    const source = fromPorts.find((targetPort) => targetPort.name === fromName);
    const target = toPorts.find((targetPort) => targetPort.name === toName);
    if (!source || !target) throw new Error(`Clock example connection is missing ${fromName} or ${toName}.`);
    page.wires.push(makeWire(pin(fromBlock, fromPorts, fromName), pin(toBlock, toPorts, toName), source.width, label));
  };

  const topClk = connector("input", "CLK_1MHZ", 1, 20, 70, "clock");
  const topReset = connector("input", "RESET_N", 1, 20, 190, "not");
  const enableInstance = instance(enables, 230, 70, "U_ENABLES", 200, 190);
  const timeInstance = instance(time, 510, 170, "U_TIME", 210, 250);
  const displayInstance = instance(display, 820, 150, "U_DISPLAY", 220, 310);
  const segmentOut = connector("output", "SEGMENT", 7, 1120, 210);
  const digitOut = connector("output", "DIGIT_N", 4, 1120, 350, "not");
  top.blocks.push(topClk, topReset, enableInstance, timeInstance, displayInstance, segmentOut, digitOut);
  for (const [block, ports] of [[enableInstance, enables.ports], [timeInstance, time.ports], [displayInstance, display.ports]]) {
    connect(top, topClk, topClk.ports, "CLK_1MHZ", block, ports, "CLK_1MHZ", "");
    connect(top, topReset, topReset.ports, "RESET_N", block, ports, "RESET_N", "");
  }
  connect(top, enableInstance, enables.ports, "TICK_1S", timeInstance, time.ports, "TICK_1S");
  connect(top, enableInstance, enables.ports, "TICK_SCAN", displayInstance, display.ports, "TICK_SCAN");
  for (const name of ["HOUR_TENS", "HOUR_ONES", "MIN_TENS", "MIN_ONES"]) connect(top, timeInstance, time.ports, name, displayInstance, display.ports, name, `${name}[3:0]`);
  connect(top, displayInstance, display.ports, "SEGMENT", segmentOut, segmentOut.ports, "SEGMENT", "SEGMENT[6:0]");
  connect(top, displayInstance, display.ports, "DIGIT_N", digitOut, digitOut.ports, "DIGIT_N", "DIGIT_N[3:0]");

  const enableClk = connector("input", "CLK_1MHZ", 1, 20, 100, "clock");
  const enableReset = connector("input", "RESET_N", 1, 20, 240, "not");
  const tick1 = makeBlock("COUNTER", 300, 70, { name: "CE_1HZ", definition: "1 MHz -> 1 Hz enable", w: 230, h: 170, ports: [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("PULSE", "output", 1, "pulse")] });
  const tickScan = makeBlock("COUNTER", 300, 300, { name: "CE_SCAN", definition: "1 MHz -> scan enable", w: 230, h: 170, ports: [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("PULSE", "output", 1, "pulse")] });
  const tick1Out = connector("output", "TICK_1S", 1, 670, 120, "pulse");
  const tickScanOut = connector("output", "TICK_SCAN", 1, 670, 350, "pulse");
  enables.blocks.push(enableClk, enableReset, tick1, tickScan, tick1Out, tickScanOut);
  for (const block of [tick1, tickScan]) {
    connect(enables, enableClk, enableClk.ports, "CLK_1MHZ", block, block.ports, "CLK_1MHZ", "");
    connect(enables, enableReset, enableReset.ports, "RESET_N", block, block.ports, "RESET_N", "");
  }
  connect(enables, tick1, tick1.ports, "PULSE", tick1Out, tick1Out.ports, "TICK_1S", "TICK_1S");
  connect(enables, tickScan, tickScan.ports, "PULSE", tickScanOut, tickScanOut.ports, "TICK_SCAN", "TICK_SCAN");

  const timeClk = connector("input", "CLK_1MHZ", 1, 20, 80, "clock");
  const timeReset = connector("input", "RESET_N", 1, 20, 190, "not");
  const timeTick = connector("input", "TICK_1S", 1, 20, 300, "pulse");
  const counterInstance = instance(counters, 310, 100, "U_BCD_TIME", 250, 330);
  const timeOutputs = ["HOUR_TENS", "HOUR_ONES", "MIN_TENS", "MIN_ONES"].map((name, index) => connector("output", name, 4, 740, 40 + index * 110));
  time.blocks.push(timeClk, timeReset, timeTick, counterInstance, ...timeOutputs);
  connect(time, timeClk, timeClk.ports, "CLK_1MHZ", counterInstance, counters.ports, "CLK_1MHZ", "");
  connect(time, timeReset, timeReset.ports, "RESET_N", counterInstance, counters.ports, "RESET_N", "");
  connect(time, timeTick, timeTick.ports, "TICK_1S", counterInstance, counters.ports, "TICK_1S");
  timeOutputs.forEach((block) => connect(time, counterInstance, counters.ports, block.name, block, block.ports, block.name, `${block.name}[3:0]`));

  const counterClk = connector("input", "CLK_1MHZ", 1, 20, 60, "clock");
  const counterReset = connector("input", "RESET_N", 1, 20, 170, "not");
  const counterTick = connector("input", "TICK_1S", 1, 20, 280, "pulse");
  const counterPorts = (withLimit = false) => [port("EN", "input", 1, "pulse"), port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), ...(withLimit ? [port("LIMIT_3", "input")] : []), port("Q", "output", 4), port("CARRY", "output", 1, "pulse")];
  const minOnes = makeBlock("COUNTER", 230, 100, { name: "MIN_ONES", definition: "Modulo-10 BCD", w: 190, h: 230, ports: counterPorts() });
  const minTens = makeBlock("COUNTER", 490, 100, { name: "MIN_TENS", definition: "Modulo-6 BCD", w: 190, h: 230, ports: counterPorts() });
  const hourOnes = makeBlock("COUNTER", 750, 100, { name: "HOUR_ONES", definition: "Modulo-10 / modulo-4 BCD", w: 210, h: 250, ports: counterPorts(true) });
  const hourTens = makeBlock("COUNTER", 1030, 100, { name: "HOUR_TENS", definition: "Modulo-3 BCD", w: 190, h: 230, ports: counterPorts() });
  const limit23 = makeBlock("COMPARATOR", 760, 430, { name: "HOUR_IS_2", definition: "Hour-tens equals 2", w: 210, h: 150, ports: [port("HOUR_TENS", "input", 4), port("LIMIT_3", "output")] });
  const counterOutputs = [minOnes, minTens, hourOnes, hourTens].map((block, index) => connector("output", block.name, 4, 250 + index * 270, 650));
  counters.blocks.push(counterClk, counterReset, counterTick, minOnes, minTens, hourOnes, hourTens, limit23, ...counterOutputs);
  for (const block of [minOnes, minTens, hourOnes, hourTens]) {
    connect(counters, counterClk, counterClk.ports, "CLK_1MHZ", block, block.ports, "CLK_1MHZ", "");
    connect(counters, counterReset, counterReset.ports, "RESET_N", block, block.ports, "RESET_N", "");
  }
  connect(counters, counterTick, counterTick.ports, "TICK_1S", minOnes, minOnes.ports, "EN", "TICK_1S");
  connect(counters, minOnes, minOnes.ports, "CARRY", minTens, minTens.ports, "EN", "MIN_CARRY");
  connect(counters, minTens, minTens.ports, "CARRY", hourOnes, hourOnes.ports, "EN", "HOUR_CARRY");
  connect(counters, hourOnes, hourOnes.ports, "CARRY", hourTens, hourTens.ports, "EN", "DAY_CARRY");
  connect(counters, hourTens, hourTens.ports, "Q", limit23, limit23.ports, "HOUR_TENS", "HOUR_TENS[3:0]");
  connect(counters, limit23, limit23.ports, "LIMIT_3", hourOnes, hourOnes.ports, "LIMIT_3", "LIMIT_3");
  [minOnes, minTens, hourOnes, hourTens].forEach((block, index) => connect(counters, block, block.ports, "Q", counterOutputs[index], counterOutputs[index].ports, block.name, `${block.name}[3:0]`));

  const displayInputs = [
    connector("input", "CLK_1MHZ", 1, 20, 40, "clock"), connector("input", "RESET_N", 1, 20, 130, "not"), connector("input", "TICK_SCAN", 1, 20, 220, "pulse"),
    ...["HOUR_TENS", "HOUR_ONES", "MIN_TENS", "MIN_ONES"].map((name, index) => connector("input", name, 4, 20, 330 + index * 100)),
  ];
  const scannerInstance = instance(scanner, 290, 80, "U_SCAN", 210, 210);
  const mux = makeBlock("MUX", 550, 300, { name: "DIGIT_MUX", definition: "4-to-1 BCD multiplexer", w: 220, h: 300, ports: [port("HOUR_TENS", "input", 4), port("HOUR_ONES", "input", 4), port("MIN_TENS", "input", 4), port("MIN_ONES", "input", 4), port("SEL", "input", 2), port("BCD", "output", 4)] });
  const decoderInstance = instance(bcdTo7, 840, 330, "U_SEGMENT_DECODER", 210, 170);
  const displaySegment = connector("output", "SEGMENT", 7, 1130, 350);
  const displayDigit = connector("output", "DIGIT_N", 4, 1130, 160, "not");
  display.blocks.push(...displayInputs, scannerInstance, mux, decoderInstance, displaySegment, displayDigit);
  for (const name of ["CLK_1MHZ", "RESET_N", "TICK_SCAN"]) {
    const source = displayInputs.find((block) => block.name === name);
    connect(display, source, source.ports, name, scannerInstance, scanner.ports, name, name === "TICK_SCAN" ? name : "");
  }
  for (const name of ["HOUR_TENS", "HOUR_ONES", "MIN_TENS", "MIN_ONES"]) {
    const source = displayInputs.find((block) => block.name === name);
    connect(display, source, source.ports, name, mux, mux.ports, name, `${name}[3:0]`);
  }
  connect(display, scannerInstance, scanner.ports, "DIGIT_INDEX", mux, mux.ports, "SEL", "DIGIT_INDEX[1:0]");
  connect(display, scannerInstance, scanner.ports, "DIGIT_N", displayDigit, displayDigit.ports, "DIGIT_N", "DIGIT_N[3:0]");
  connect(display, mux, mux.ports, "BCD", decoderInstance, bcdTo7.ports, "BCD", "BCD[3:0]");
  connect(display, decoderInstance, bcdTo7.ports, "SEGMENT", displaySegment, displaySegment.ports, "SEGMENT", "SEGMENT[6:0]");

  const scanClk = connector("input", "CLK_1MHZ", 1, 20, 70, "clock");
  const scanReset = connector("input", "RESET_N", 1, 20, 180, "not");
  const scanTick = connector("input", "TICK_SCAN", 1, 20, 290, "pulse");
  const scanCounter = makeBlock("COUNTER", 300, 90, { name: "DIGIT_INDEX", definition: "Modulo-4 scan counter", w: 220, h: 220, ports: [port("CLK_1MHZ", "input", 1, "clock"), port("RESET_N", "input", 1, "not"), port("EN", "input", 1, "pulse"), port("Q", "output", 2)] });
  const scanDecoder = makeBlock("DECODER", 620, 110, { name: "DIGIT_SELECT", definition: "2-to-4 active-low decoder", w: 230, h: 190, ports: [port("A", "input", 2), port("Y_N", "output", 4, "not")] });
  const scanIndexOut = connector("output", "DIGIT_INDEX", 2, 980, 90);
  const scanDigitOut = connector("output", "DIGIT_N", 4, 980, 240, "not");
  scanner.blocks.push(scanClk, scanReset, scanTick, scanCounter, scanDecoder, scanIndexOut, scanDigitOut);
  connect(scanner, scanClk, scanClk.ports, "CLK_1MHZ", scanCounter, scanCounter.ports, "CLK_1MHZ", "");
  connect(scanner, scanReset, scanReset.ports, "RESET_N", scanCounter, scanCounter.ports, "RESET_N", "");
  connect(scanner, scanTick, scanTick.ports, "TICK_SCAN", scanCounter, scanCounter.ports, "EN", "TICK_SCAN");
  connect(scanner, scanCounter, scanCounter.ports, "Q", scanDecoder, scanDecoder.ports, "A", "DIGIT_INDEX[1:0]");
  connect(scanner, scanCounter, scanCounter.ports, "Q", scanIndexOut, scanIndexOut.ports, "DIGIT_INDEX", "DIGIT_INDEX[1:0]");
  connect(scanner, scanDecoder, scanDecoder.ports, "Y_N", scanDigitOut, scanDigitOut.ports, "DIGIT_N", "DIGIT_N[3:0]");

  const bcdIn = connector("input", "BCD", 4, 30, 120);
  const decoder = makeBlock("DECODER", 310, 90, { name: "BCD_DECODE", definition: "BCD truth-table decoder", w: 240, h: 180, ports: [port("BCD", "input", 4), port("SEGMENT", "output", 7)] });
  const segmentSink = connector("output", "SEGMENT", 7, 760, 120);
  bcdTo7.blocks.push(bcdIn, decoder, segmentSink);
  connect(bcdTo7, bcdIn, bcdIn.ports, "BCD", decoder, decoder.ports, "BCD", "BCD[3:0]");
  connect(bcdTo7, decoder, decoder.ports, "SEGMENT", segmentSink, segmentSink.ports, "SEGMENT", "SEGMENT[6:0]");

  for (const page of [enables, time, counters, display, scanner, bcdTo7]) page.view.autoFit = true;

  return normalizeProject({ schema: "block-schematic-studio", version: 1, name: "Corrected Top-Down Clock", currentPageId: top.id, pages: [top, enables, time, counters, display, scanner, bcdTo7], updatedAt: new Date().toISOString() });
}

function validProject(candidate) {
  return candidate && candidate.schema === "block-schematic-studio" && Number(candidate.version) === 1 && Array.isArray(candidate.pages) && candidate.pages.length > 0;
}

function normalizeProject(candidate) {
  for (const page of candidate.pages || []) {
    page.ports ||= [];
    page.blocks ||= [];
    page.wires ||= [];
    page.view ||= { x: 100, y: 80, zoom: 1 };
    const legacyBounds = schematicBounds(page);
    const removable = new Set();
    for (const block of page.blocks) {
      if (!["INPUT", "OUTPUT"].includes(block.type) || block.ports?.length !== 1) continue;
      const blockPort = block.ports[0];
      const expectedDirection = block.type === "INPUT" ? "input" : "output";
      const targetPort = page.ports.find((item) => item.direction === expectedDirection && item.name.trim().toLowerCase() === blockPort.name.trim().toLowerCase());
      if (!targetPort) continue;
      if (!Number.isFinite(targetPort.edgePosition)) {
        targetPort.edgePosition = clamp((block.y + block.h / 2 - legacyBounds.y) / legacyBounds.h, .08, .92);
      }
      for (const wire of page.wires) {
        for (const endpoint of [wire.from, wire.to]) {
          if (endpoint.blockId === block.id && endpoint.portId === blockPort.id) {
            endpoint.blockId = PAGE_INTERFACE_BLOCK_ID;
            endpoint.portId = targetPort.id;
          }
        }
      }
      removable.add(block.id);
    }
    if (removable.size) page.blocks = page.blocks.filter((block) => !removable.has(block.id));
    for (const targetPort of page.ports) {
      if (targetPort.direction === "inout" && !["left", "right"].includes(targetPort.side)) targetPort.side = "left";
      if (!Number.isFinite(targetPort.edgePosition)) targetPort.edgePosition = defaultPagePortPosition(page, targetPort);
      targetPort.edgePosition = clamp(targetPort.edgePosition, .08, .92);
    }
  }
  return candidate;
}

function loadInitialProject() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (validProject(stored)) return normalizeProject(stored);
  } catch (error) {
    console.warn("Stored project could not be loaded; using the sample project.", error);
  }
  return createSampleProject();
}

let project = loadInitialProject();
project.pages.forEach((page) => ui.expandedPages.add(page.id));

function currentPage() { return project.pages.find((page) => page.id === project.currentPageId) || project.pages[0]; }
function getPage(pageId) { return project.pages.find((page) => page.id === pageId); }
function getBlock(blockId, page = currentPage()) { return page.blocks.find((block) => block.id === blockId); }
function blockPorts(block) { return block.definitionPageId ? (getPage(block.definitionPageId)?.ports || block.ports) : block.ports; }
function getPort(blockId, portId, page = currentPage()) {
  if (blockId === PAGE_INTERFACE_BLOCK_ID) return internalPagePort(page.ports.find((item) => item.id === portId));
  const block = getBlock(blockId, page);
  return block ? blockPorts(block).find((item) => item.id === portId) : null;
}

function snapshotProject() { return JSON.stringify(project); }

function markChanged() {
  project.updatedAt = new Date().toISOString();
  els.saveStatus.classList.add("is-dirty");
  els.saveStatus.lastChild.textContent = " Saving…";
  clearTimeout(ui.saveTimer);
  ui.saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    els.saveStatus.classList.remove("is-dirty");
    els.saveStatus.lastChild.textContent = " Autosaved";
  }, 180);
}

function recordBefore(before) {
  ui.history.push(before);
  if (ui.history.length > HISTORY_LIMIT) ui.history.shift();
  ui.future.length = 0;
}

function transaction(label, mutate) {
  const before = snapshotProject();
  mutate();
  if (snapshotProject() !== before) {
    recordBefore(before);
    markChanged();
    render();
  }
}

function restoreSnapshot(value) {
  project = JSON.parse(value);
  clearSelection();
  ui.wireDraft = null;
  markChanged();
  render();
}

function undo() {
  const previous = ui.history.pop();
  if (!previous) return;
  ui.future.push(snapshotProject());
  restoreSnapshot(previous);
  toast("Undo");
}

function redo() {
  const next = ui.future.pop();
  if (!next) return;
  ui.history.push(snapshotProject());
  restoreSnapshot(next);
  toast("Redo");
}

function clearSelection() {
  ui.selectedBlocks.clear();
  ui.selectedWireId = null;
}

function toast(message, type = "info") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  els.toastRegion.append(item);
  setTimeout(() => item.remove(), 2600);
}

function portPosition(block, targetPort) {
  const ports = blockPorts(block);
  const sidePorts = ports.filter((item) => item.direction === targetPort.direction || (targetPort.direction === "inout" && item.direction === "inout"));
  const index = Math.max(0, sidePorts.findIndex((item) => item.id === targetPort.id));
  const count = Math.max(1, sidePorts.length);
  const y = block.y + 48 + ((block.h - 58) * (index + 1)) / (count + 1);
  const isRight = targetPort.direction === "output";
  return { x: block.x + (isRight ? block.w : 0), y };
}

function endpointPosition(endpoint, page = currentPage()) {
  if (endpoint?.blockId === PAGE_INTERFACE_BLOCK_ID) {
    const targetPort = page.ports.find((item) => item.id === endpoint.portId);
    return targetPort ? pagePortPosition(page, targetPort, schematicBounds(page)) : null;
  }
  const block = getBlock(endpoint?.blockId, page);
  const targetPort = block ? getPort(block.id, endpoint?.portId, page) : null;
  return block && targetPort ? portPosition(block, targetPort) : null;
}

function segmentIntersectsBlock(first, second, block, clearance = 16) {
  const left = block.x - clearance;
  const right = block.x + block.w + clearance;
  const top = block.y - clearance;
  const bottom = block.y + block.h + clearance;
  if (first.y === second.y) {
    const minX = Math.min(first.x, second.x);
    const maxX = Math.max(first.x, second.x);
    return first.y > top && first.y < bottom && maxX > left && minX < right;
  }
  if (first.x === second.x) {
    const minY = Math.min(first.y, second.y);
    const maxY = Math.max(first.y, second.y);
    return first.x > left && first.x < right && maxY > top && minY < bottom;
  }
  return true;
}

function routeCollisionCount(points, wire, page = currentPage()) {
  const obstacles = page.blocks.filter((block) => block.id !== wire.from.blockId && block.id !== wire.to.blockId);
  let count = 0;
  for (let index = 1; index < points.length; index += 1) {
    for (const block of obstacles) if (segmentIntersectsBlock(points[index - 1], points[index], block)) count += 1;
  }
  return count;
}

function autoRouteCandidates(wire, start, end) {
  const page = currentPage();
  const fromPort = getPort(wire.from.blockId, wire.from.portId, page);
  const toPort = getPort(wire.to.blockId, wire.to.portId, page);
  const clearance = GRID * 2;
  const startEscapeX = snap(start.x + (fromPort?.direction === "output" ? clearance : -clearance));
  const endEscapeX = snap(end.x + (toPort?.direction === "input" ? -clearance : clearance));
  const middleX = snap((startEscapeX + endEscapeX) / 2);
  const middleY = snap((start.y + end.y) / 2);
  const obstacleBlocks = page.blocks.filter((block) => block.id !== wire.from.blockId && block.id !== wire.to.blockId);
  const topY = snap(Math.min(start.y, end.y, ...obstacleBlocks.map((block) => block.y)) - GRID * 3);
  const bottomY = snap(Math.max(start.y, end.y, ...obstacleBlocks.map((block) => block.y + block.h)) + GRID * 3);
  const horizontal = [start, { x: startEscapeX, y: start.y }, { x: middleX, y: start.y }, { x: middleX, y: end.y }, { x: endEscapeX, y: end.y }, end];
  const vertical = [start, { x: startEscapeX, y: start.y }, { x: startEscapeX, y: middleY }, { x: endEscapeX, y: middleY }, { x: endEscapeX, y: end.y }, end];
  const top = [start, { x: startEscapeX, y: start.y }, { x: startEscapeX, y: topY }, { x: endEscapeX, y: topY }, { x: endEscapeX, y: end.y }, end];
  const bottom = [start, { x: startEscapeX, y: start.y }, { x: startEscapeX, y: bottomY }, { x: endEscapeX, y: bottomY }, { x: endEscapeX, y: end.y }, end];
  return { horizontal, vertical, top, bottom };
}

function orthogonalPoints(wire) {
  const start = endpointPosition(wire.from);
  const end = endpointPosition(wire.to);
  if (!start || !end) return [];
  if (wire.waypoints?.length) {
    const result = [start];
    for (const target of [...wire.waypoints, end]) {
      const previous = result[result.length - 1];
      if (previous.x !== target.x && previous.y !== target.y) result.push({ x: target.x, y: previous.y });
      result.push({ x: target.x, y: target.y });
    }
    return removeDuplicatePoints(result);
  }
  const candidates = autoRouteCandidates(wire, start, end);
  const preferred = wire.routeStyle === "vertical"
    ? [candidates.vertical, candidates.horizontal, candidates.top, candidates.bottom]
    : wire.routeStyle === "horizontal"
      ? [candidates.horizontal, candidates.vertical, candidates.top, candidates.bottom]
      : end.x < start.x
        ? [candidates.top, candidates.bottom, candidates.horizontal, candidates.vertical]
        : [candidates.horizontal, candidates.vertical, candidates.top, candidates.bottom];
  const normalized = preferred.map(removeDuplicatePoints);
  return normalized.find((points) => routeCollisionCount(points, wire) === 0)
    || normalized.toSorted((a, b) => routeCollisionCount(a, wire) - routeCollisionCount(b, wire))[0];
}

function removeDuplicatePoints(points) {
  return points.filter((point, index) => !index || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
}

function pointsPath(points) {
  return points.length ? `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}` : "";
}

function nearestSegmentIndex(points, target) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    const first = points[index];
    const second = points[index + 1];
    const closest = first.y === second.y
      ? { x: clamp(target.x, Math.min(first.x, second.x), Math.max(first.x, second.x)), y: first.y }
      : { x: first.x, y: clamp(target.y, Math.min(first.y, second.y), Math.max(first.y, second.y)) };
    const distance = Math.abs(target.x - closest.x) + Math.abs(target.y - closest.y);
    if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
  }
  return bestIndex;
}

function pathMidpoint(points) {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  const segments = [];
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    const segmentLength = Math.abs(points[index].x - points[index - 1].x) + Math.abs(points[index].y - points[index - 1].y);
    segments.push({ from: points[index - 1], to: points[index], length: segmentLength });
    length += segmentLength;
  }
  let remaining = length / 2;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length ? remaining / segment.length : 0;
      return { x: segment.from.x + (segment.to.x - segment.from.x) * ratio, y: segment.from.y + (segment.to.y - segment.from.y) * ratio };
    }
    remaining -= segment.length;
  }
  return points.at(-1);
}

function isConnectionCompatible(first, second) {
  if (!first || !second || first.blockId === second.blockId && first.portId === second.portId) return false;
  const firstPort = getPort(first.blockId, first.portId);
  const secondPort = getPort(second.blockId, second.portId);
  if (!firstPort || !secondPort) return false;
  if (firstPort.direction === "inout" || secondPort.direction === "inout") return true;
  return firstPort.direction !== secondPort.direction;
}

function normalizedEndpoints(first, second) {
  const firstPort = getPort(first.blockId, first.portId);
  if (firstPort?.direction === "input") return { from: second, to: first };
  return { from: first, to: second };
}

function getValidationIssues() {
  const issues = [];
  for (const page of project.pages) {
    const inputDrivers = new Map();
    for (const targetPort of page.ports) {
      const connected = page.wires.some((wire) => [wire.from, wire.to].some((endpoint) => endpoint.blockId === PAGE_INTERFACE_BLOCK_ID && endpoint.portId === targetPort.id));
      if (targetPort.required !== false && !connected) {
        issues.push({ type: "Unconnected page port", message: `${page.name}.${targetPort.name} is not connected inside the page.`, pageId: page.id });
      }
    }
    for (const block of page.blocks) {
      if (block.definitionPageId && !getPage(block.definitionPageId)) {
        issues.push({ type: "Missing page definition", message: `${block.name} refers to a page that does not exist.`, pageId: page.id, blockId: block.id });
      }
      const names = new Map();
      for (const targetPort of blockPorts(block)) {
        const key = targetPort.name.trim().toLowerCase();
        if (names.has(key)) issues.push({ type: "Duplicate port name", message: `${block.name} contains more than one port named ${targetPort.name}.`, pageId: page.id, blockId: block.id });
        names.set(key, true);
        if (targetPort.required && targetPort.direction === "input") {
          const connected = page.wires.some((wire) => wire.to.blockId === block.id && wire.to.portId === targetPort.id || wire.from.blockId === block.id && wire.from.portId === targetPort.id);
          if (!connected) issues.push({ type: "Unconnected required input", message: `${block.name}.${targetPort.name} is not connected.`, pageId: page.id, blockId: block.id });
        }
      }
    }
    for (const wire of page.wires) {
      const fromPort = getPort(wire.from?.blockId, wire.from?.portId, page);
      const toPort = getPort(wire.to?.blockId, wire.to?.portId, page);
      if (!fromPort || !toPort) {
        issues.push({ type: "Missing endpoint", message: `${wire.name || wire.id} has a missing block or port endpoint.`, pageId: page.id, wireId: wire.id });
        continue;
      }
      if (fromPort.direction === toPort.direction && fromPort.direction !== "inout") {
        issues.push({ type: "Same-direction connection", message: `${fromPort.direction} cannot connect to ${toPort.direction}.`, pageId: page.id, wireId: wire.id });
      }
      if (fromPort.width !== toPort.width || wire.width !== fromPort.width || wire.width !== toPort.width) {
        issues.push({ type: "Width mismatch", message: `${fromPort.name} (${fromPort.width}) → ${toPort.name} (${toPort.width}), net width ${wire.width}.`, pageId: page.id, wireId: wire.id });
      }
      const driven = toPort.direction === "input" ? `${wire.to.blockId}:${wire.to.portId}` : null;
      if (driven) {
        const count = (inputDrivers.get(driven) || 0) + 1;
        inputDrivers.set(driven, count);
        if (count > 1) issues.push({ type: "Multiple drivers", message: `${endpointLabel(wire.to, page)} has more than one driver.`, pageId: page.id, wireId: wire.id });
      }
    }
  }

  const references = new Map(project.pages.map((page) => [page.id, page.blocks.filter((block) => block.definitionPageId).map((block) => block.definitionPageId)]));
  for (const page of project.pages) {
    const visit = (pageId, path) => {
      if (path.includes(pageId)) {
        issues.push({ type: "Recursive page reference", message: `${[...path, pageId].map((target) => getPage(target)?.name || target).join(" → ")}.`, pageId: page.id });
        return;
      }
      for (const target of references.get(pageId) || []) visit(target, [...path, pageId]);
    };
    visit(page.id, []);
  }
  return issues.filter((issue, index, list) => list.findIndex((candidate) => candidate.type === issue.type && candidate.message === issue.message && candidate.pageId === issue.pageId) === index);
}

function pageAncestors(page) {
  const result = [];
  let current = page;
  while (current) {
    result.unshift(current);
    current = current.parentId ? getPage(current.parentId) : null;
  }
  return result;
}

function pageDepth(page) {
  return Math.max(0, pageAncestors(page).length - 1);
}

function layerRole(page) {
  const depth = pageDepth(page);
  if (page.isTop || depth === 0) return "TOP LAYER";
  if (depth === 1) return "SUBSYSTEM";
  return "DETAIL LAYER";
}

function renderPageTree() {
  const children = (parentId) => project.pages.filter((page) => page.parentId === parentId);
  const renderBranch = (page, depth) => {
    const descendants = children(page.id);
    const expanded = ui.expandedPages.has(page.id);
    return `<div class="tree-group">
      <div class="tree-row ${page.id === project.currentPageId ? "is-current" : ""}" style="--depth:${depth}" draggable="true" data-page-id="${page.id}" tabindex="0">
        <button type="button" class="tree-toggle" data-page-toggle="${page.id}" aria-label="${expanded ? "Collapse" : "Expand"} ${escapeHtml(page.name)}">${descendants.length ? (expanded ? "▾" : "▸") : ""}</button>
        <span class="tree-level">L${depth}</span>
        <span class="tree-name" title="${escapeHtml(page.name)}">${escapeHtml(page.name)}</span>
        ${page.isTop ? '<span class="tree-top">TOP</span>' : ""}
        <span class="tree-actions">
          <button type="button" data-page-place="${page.id}" title="Place as block">＋</button>
          <button type="button" data-page-menu="${page.id}" title="Page actions">•••</button>
        </span>
      </div>
      ${expanded ? descendants.map((child) => renderBranch(child, depth + 1)).join("") : ""}
    </div>`;
  };
  const roots = children(null);
  els.pageTree.innerHTML = roots.map((page) => renderBranch(page, 0)).join("");
}

function renderPartsLibrary() {
  const query = els.partsSearch.value.trim().toLowerCase();
  const filtered = library.filter((part) => !part.legacyOnly && `${part.label} ${part.type} ${part.category}`.toLowerCase().includes(query));
  const categories = [...new Set(filtered.map((part) => part.category))];
  els.partsLibrary.innerHTML = categories.map((category) => `<details class="part-section" open>
    <summary>${escapeHtml(category)}</summary>
    <div class="part-grid">${filtered.filter((part) => part.category === category).map((part) => `<button type="button" class="part-item" draggable="true" data-part-type="${part.type}" title="Place ${escapeHtml(part.label)}">
      <span class="part-symbol">${escapeHtml(part.symbol)}</span><span>${escapeHtml(part.label)}</span>
    </button>`).join("")}</div>
  </details>`).join("") || '<p class="panel-hint">No matching parts.</p>';
}

function notationMarkup(targetPort, x, y, side) {
  const direction = side === "right" ? 1 : -1;
  const innerX = x - direction * 8;
  if (targetPort.notation === "not") return `<circle class="notation" cx="${x - direction * 5}" cy="${y}" r="4"/>`;
  if (["clock", "rising", "falling"].includes(targetPort.notation)) {
    const bubble = targetPort.notation === "falling" ? `<circle class="notation" cx="${x - direction * 5}" cy="${y}" r="4"/>` : "";
    const shift = targetPort.notation === "falling" ? 10 : 3;
    return `${bubble}<path class="notation" d="M ${innerX - direction * shift} ${y - 5} L ${innerX + direction * (7 - shift)} ${y} L ${innerX - direction * shift} ${y + 5} Z"/>`;
  }
  if (targetPort.notation === "pulse") return `<text class="notation-text" x="${innerX - direction * 8}" y="${y + 3}" text-anchor="middle">↑</text>`;
  return "";
}

function symbolBodyMarkup(block) {
  const x = block.x + 28;
  const y = block.y + 42;
  const width = Math.max(44, block.w - 56);
  const height = Math.max(42, block.h - 54);
  const right = x + width;
  const bottom = y + height;
  const middleY = y + height / 2;
  let shape = "";

  if (["BUFFER", "NOT"].includes(block.type)) {
    shape = `<path class="symbol-body" d="M ${x} ${y} L ${right} ${middleY} L ${x} ${bottom} Z"/>`;
  } else if (["AND", "NAND"].includes(block.type)) {
    const shoulder = x + width * .46;
    shape = `<path class="symbol-body" d="M ${x} ${y} L ${shoulder} ${y} C ${right + width * .08} ${y} ${right + width * .08} ${bottom} ${shoulder} ${bottom} L ${x} ${bottom} Z"/>`;
  } else if (["OR", "NOR", "XOR", "XNOR"].includes(block.type)) {
    const extra = ["XOR", "XNOR"].includes(block.type)
      ? `<path class="symbol-detail" d="M ${x - 8} ${y} Q ${x + width * .18} ${middleY} ${x - 8} ${bottom}"/>`
      : "";
    shape = `${extra}<path class="symbol-body" d="M ${x} ${y} Q ${x + width * .24} ${middleY} ${x} ${bottom} Q ${x + width * .62} ${bottom + height * .04} ${right} ${middleY} Q ${x + width * .62} ${y - height * .04} ${x} ${y} Z"/>`;
  } else if (block.type === "MUX") {
    shape = `<path class="symbol-body" d="M ${x} ${y} L ${right} ${y + 12} L ${right} ${bottom - 12} L ${x} ${bottom} Z"/><text class="symbol-glyph" x="${x + width * .56}" y="${middleY + 4}" text-anchor="middle">MUX</text>`;
  } else if (block.type === "DEMUX") {
    shape = `<path class="symbol-body" d="M ${x} ${y + 12} L ${right} ${y} L ${right} ${bottom} L ${x} ${bottom - 12} Z"/><text class="symbol-glyph" x="${x + width * .46}" y="${middleY + 4}" text-anchor="middle">DMX</text>`;
  } else if (["ADDER", "SUBTRACTOR", "INCREMENTER"].includes(block.type)) {
    const glyph = block.type === "ADDER" ? "+" : block.type === "SUBTRACTOR" ? "−" : "+1";
    shape = `<path class="symbol-body" d="M ${x + 12} ${y} L ${right - 12} ${y} L ${right} ${middleY} L ${right - 12} ${bottom} L ${x + 12} ${bottom} L ${x} ${middleY} Z"/><text class="symbol-glyph is-large" x="${x + width / 2}" y="${middleY + 7}" text-anchor="middle">${glyph}</text>`;
  } else if (block.type === "COMPARATOR") {
    shape = `<path class="symbol-body" d="M ${x + width / 2} ${y} L ${right} ${middleY} L ${x + width / 2} ${bottom} L ${x} ${middleY} Z"/><text class="symbol-glyph" x="${x + width / 2}" y="${middleY + 4}" text-anchor="middle">CMP</text>`;
  }

  if (!shape) return "";
  return `<g class="primitive-symbol">${shape}</g>`;
}

function isShapedPrimitive(type) {
  return ["BUFFER", "NOT", "AND", "NAND", "OR", "NOR", "XOR", "XNOR", "MUX", "DEMUX", "ADDER", "SUBTRACTOR", "INCREMENTER", "COMPARATOR"].includes(type);
}

function blockMarkup(block) {
  const ports = blockPorts(block);
  const selected = ui.selectedBlocks.has(block.id);
  const shaped = isShapedPrimitive(block.type);
  const portItems = ports.map((targetPort) => {
    const point = portPosition(block, targetPort);
    const side = targetPort.direction === "output" ? "right" : "left";
    const labelX = point.x + (side === "right" ? -10 : 10);
    const anchor = side === "right" ? "end" : "start";
    const terminalInnerX = point.x + (side === "right" ? -11 : 11);
    let compatibility = "";
    if (ui.wireDraft) compatibility = isConnectionCompatible(ui.wireDraft.endpoint, { blockId: block.id, portId: targetPort.id }) ? "is-compatible" : "is-incompatible";
    return `<g class="port ${compatibility}" data-block-id="${block.id}" data-port-id="${targetPort.id}" data-direction="${targetPort.direction}">
      <rect class="port-hit-target" x="${point.x - 7}" y="${point.y - 7}" width="14" height="14"/>
      <line class="port-terminal" x1="${point.x}" y1="${point.y}" x2="${terminalInnerX}" y2="${point.y}"/>
      ${notationMarkup(targetPort, point.x, point.y, side)}
      <text class="port-label" x="${labelX}" y="${point.y - 2}" text-anchor="${anchor}">${escapeHtml(targetPort.name)}</text>
      ${targetPort.width > 1 ? `<text class="port-width" x="${labelX}" y="${point.y + 9}" text-anchor="${anchor}">[${targetPort.width}]</text>` : ""}
    </g>`;
  }).join("");
  return `<g class="block ${selected ? "is-selected" : ""} ${block.definitionPageId ? "is-definition" : ""} ${shaped ? "is-symbol" : "is-functional"}" data-block-id="${block.id}" style="--z:${block.z}">
    <rect class="block-hit-area" x="${block.x}" y="${block.y}" width="${block.w}" height="${block.h}"/>
    ${shaped ? `${symbolBodyMarkup(block)}<rect class="symbol-selection-outline" x="${block.x}" y="${block.y}" width="${block.w}" height="${block.h}"/>` : `<rect class="block-body" x="${block.x}" y="${block.y}" width="${block.w}" height="${block.h}"/><line class="block-divider" x1="${block.x}" y1="${block.y + 39}" x2="${block.x + block.w}" y2="${block.y + 39}"/>`}
    <text class="block-title" x="${block.x + 12}" y="${block.y + 18}">${escapeHtml(block.name)}</text>
    <text class="block-type" x="${block.x + 12}" y="${block.y + 32}">${escapeHtml(block.definition)}</text>
    ${ports.length ? portItems : `<text class="block-type" x="${block.x + block.w / 2}" y="${block.y + block.h / 2}" text-anchor="middle">NO PORTS</text>`}
    ${selected ? `<rect class="resize-handle" data-resize-id="${block.id}" x="${block.x + block.w - 6}" y="${block.y + block.h - 6}" width="12" height="12"/>` : ""}
  </g>`;
}

function wireMarkup(wire, errorWireIds) {
  const points = orthogonalPoints(wire);
  if (!points.length) return "";
  const path = pointsPath(points);
  const middle = pathMidpoint(points);
  const selected = ui.selectedWireId === wire.id;
  const width = clamp(Number(wire.width) || 1, 1, 64);
  const accessibleLabel = `${wire.name || "Unnamed net"} · ${width}-bit ${wire.signalType || "logic"} · ${endpointLabel(wire.from)} to ${endpointLabel(wire.to)}`;
  return `<g class="wire-group ${width > 1 ? "is-bus" : ""} ${selected ? "is-selected" : ""} ${errorWireIds.has(wire.id) ? "is-error" : ""}" data-wire-id="${wire.id}">
    <title>${escapeHtml(accessibleLabel)}</title>
    <path class="wire-hit" data-wire-id="${wire.id}" d="${path}"/>
    <path class="wire-line" d="${path}"/>
    ${wire.name ? `<text class="wire-label" x="${middle.x + 8}" y="${middle.y - 9}">${escapeHtml(wire.name)}</text>` : ""}
    ${width > 1 ? `<line class="bus-slash" x1="${middle.x - 5}" y1="${middle.y + 7}" x2="${middle.x + 5}" y2="${middle.y - 7}"/><text class="bus-width" x="${middle.x + 9}" y="${middle.y + 12}">${width}</text>` : ""}
  </g>`;
}

function renderCanvas() {
  const page = currentPage();
  const issues = getValidationIssues();
  const errorWireIds = new Set(issues.filter((issue) => issue.pageId === page.id && issue.wireId).map((issue) => issue.wireId));
  const bounds = schematicBounds(page);
  els.viewport.setAttribute("transform", `translate(${page.view.x} ${page.view.y}) scale(${page.view.zoom})`);
  els.pageFrameLayer.innerHTML = pageFrameMarkup(page, bounds);
  els.pagePortLayer.innerHTML = pagePortsMarkup(page, bounds);
  els.blockLayer.innerHTML = [...page.blocks].sort((a, b) => a.z - b.z).map(blockMarkup).join("");
  els.wireLayer.innerHTML = page.wires.map((wire) => wireMarkup(wire, errorWireIds)).join("");
  els.overlayLayer.innerHTML = renderOverlay();
  els.canvasWrap.classList.toggle("grid-off", !ui.grid);
  els.emptyPage.hidden = page.blocks.length > 0 || page.ports.length > 0;
  els.draftStatus.hidden = !ui.wireDraft;
  els.zoomStatus.textContent = `${Math.round(page.view.zoom * 100)}%`;
  els.pageSummary.textContent = `${page.ports.length} page port${page.ports.length === 1 ? "" : "s"} · ${page.blocks.length} block${page.blocks.length === 1 ? "" : "s"} · ${page.wires.length} net${page.wires.length === 1 ? "" : "s"}`;
  const pageIssues = issues.filter((issue) => issue.pageId === page.id);
  els.validationStatus.textContent = pageIssues.length ? `${pageIssues.length} design issue${pageIssues.length === 1 ? "" : "s"}` : "✓ Structural checks pass";
  els.validationStatus.classList.toggle("has-issues", pageIssues.length > 0);
  document.querySelector("[data-action='undo']").disabled = !ui.history.length;
  document.querySelector("[data-action='redo']").disabled = !ui.future.length;
}

function renderOverlay() {
  const selectedWire = currentPage().wires.find((wire) => wire.id === ui.selectedWireId);
  const waypointHandles = selectedWire ? (selectedWire.waypoints || []).map((point, index) => `<rect class="waypoint" data-wire-id="${selectedWire.id}" data-waypoint-index="${index}" x="${point.x - 5}" y="${point.y - 5}" width="10" height="10"/>`).join("") : "";
  const selectedPoints = selectedWire ? orthogonalPoints(selectedWire) : [];
  const segmentHandles = selectedWire ? selectedPoints.slice(1, -2).map((first, offset) => {
    const index = offset + 1;
    const second = selectedPoints[index + 1];
    const horizontal = first.y === second.y;
    const length = Math.abs(second.x - first.x) + Math.abs(second.y - first.y);
    if (length < GRID * 2) return "";
    const x = (first.x + second.x) / 2;
    const y = (first.y + second.y) / 2;
    return `<rect class="segment-handle ${horizontal ? "is-horizontal" : "is-vertical"}" data-wire-id="${selectedWire.id}" data-segment-index="${index}" data-segment-orientation="${horizontal ? "horizontal" : "vertical"}" x="${x - (horizontal ? 7 : 4)}" y="${y - (horizontal ? 4 : 7)}" width="${horizontal ? 14 : 8}" height="${horizontal ? 8 : 14}"/>`;
  }).join("") : "";
  const editHandles = `${segmentHandles}${waypointHandles}`;
  if (ui.interaction?.type === "selection") {
    const { start, current } = ui.interaction;
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    return `${editHandles}<rect class="selection-box" x="${x}" y="${y}" width="${Math.abs(current.x - start.x)}" height="${Math.abs(current.y - start.y)}"/>`;
  }
  if (ui.wireDraft?.current) {
    const start = endpointPosition(ui.wireDraft.endpoint);
    if (!start) return editHandles;
    const end = ui.wireDraft.current;
    const middleX = snap((start.x + end.x) / 2);
    return `${editHandles}<path class="wire-preview" d="${pointsPath([start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end])}"/>`;
  }
  return editHandles;
}

function renderBreadcrumbs() {
  const page = currentPage();
  els.breadcrumbs.innerHTML = pageAncestors(page).map((item, index, list) => `<button type="button" data-open-page="${item.id}">${escapeHtml(item.name)}</button>${index < list.length - 1 ? "<i>/</i>" : ""}`).join("");
  els.layerContext.textContent = `LEVEL ${pageDepth(page)} · ${layerRole(page)}`;
}

function field(label, name, value, options = {}) {
  const escaped = escapeHtml(value);
  if (options.type === "textarea") return `<div class="field"><label for="field-${name}">${label}</label><textarea id="field-${name}" data-field="${name}">${escaped}</textarea></div>`;
  if (options.choices) return `<div class="field"><label for="field-${name}">${label}</label><select id="field-${name}" data-field="${name}">${options.choices.map((choice) => `<option value="${escapeHtml(choice.value)}" ${String(choice.value) === String(value) ? "selected" : ""}>${escapeHtml(choice.label)}</option>`).join("")}</select></div>`;
  return `<div class="field"><label for="field-${name}">${label}</label><input id="field-${name}" data-field="${name}" type="${options.type || "text"}" value="${escaped}" ${options.min != null ? `min="${options.min}"` : ""} ${options.max != null ? `max="${options.max}"` : ""}></div>`;
}

function renderPortEditor(block) {
  const ports = blockPorts(block);
  return `<div class="port-editor">
    ${ports.map((targetPort, index) => `<div class="port-row" data-port-row="${targetPort.id}">
      <input aria-label="Port name" data-port-field="name" value="${escapeHtml(targetPort.name)}">
      <select aria-label="Port direction" data-port-field="direction">${["input", "output", "inout"].map((value) => `<option ${targetPort.direction === value ? "selected" : ""}>${value}</option>`).join("")}</select>
      <input aria-label="Port width" data-port-field="width" type="number" min="1" max="64" value="${targetPort.width}">
      <select aria-label="Port notation" data-port-field="notation">${["normal", "not", "clock", "rising", "falling", "pulse"].map((value) => `<option ${targetPort.notation === value ? "selected" : ""}>${value}</option>`).join("")}</select>
      <button type="button" data-delete-port="${targetPort.id}" aria-label="Delete ${escapeHtml(targetPort.name)}">×</button>
      <span class="port-reorder"><button type="button" data-move-port="${targetPort.id}" data-offset="-1" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-move-port="${targetPort.id}" data-offset="1" ${index === ports.length - 1 ? "disabled" : ""}>↓</button></span>
    </div>`).join("")}
    <button type="button" class="add-port-button" data-add-port>＋ Add port</button>
  </div>`;
}

function pageInspector(page, issues) {
  els.inspectorTitle.textContent = "PAGE";
  els.selectionCount.textContent = "No selection";
  return `<section class="inspector-section">
    <h3>Page definition</h3>
    ${field("Page name", "page-name", page.name)}
    ${field("Description", "page-description", page.description, { type: "textarea" })}
  </section>
  <section class="inspector-section">
    <h3>Page ports</h3>
    ${renderPagePortEditor(page)}
  </section>
  <section class="inspector-section">
    <h3>Design metrics</h3>
    <div class="metric-list"><span>Layer</span><output>L${pageDepth(page)} · ${layerRole(page)}</output><span>Interface</span><output>${page.ports.length} ports</output><span>Blocks</span><output>${page.blocks.length}</output><span>Nets</span><output>${page.wires.length}</output><span>Bus nets</span><output>${page.wires.filter((wire) => wire.width > 1).length}</output><span>Issues</span><output>${issues.length}</output></div>
  </section>
  <section class="inspector-section design-rules">
    <h3>Design discipline</h3>
    <ul><li>Use one physical clock and synchronous enable pulses.</li><li>Declare every interface width and active level.</li><li>Verify terminal counts and rollover conditions.</li><li>Keep one driver per signal; decode outputs combinationally.</li></ul>
  </section>
  <section class="inspector-section">
    <h3>Page actions</h3>
    <div class="page-inline-actions"><button type="button" data-page-command="rename">Rename</button><button type="button" data-page-command="duplicate">Duplicate</button><button type="button" data-page-command="set-top">Set top</button><button type="button" data-page-command="move-up">Move ↑</button><button type="button" data-page-command="move-down">Move ↓</button><button type="button" data-page-command="delete">Delete</button></div>
    <div class="inspector-actions" style="margin-top:6px"><button type="button" data-project-command="new">New project</button><button type="button" data-action="save">Export JSON</button></div>
  </section>
  <section class="inspector-section"><h3>Validation</h3>${validationMini(issues)}</section>`;
}

function renderPagePortEditor(page) {
  return `<div class="port-editor page-port-editor"><p class="page-port-help">Input appears on the left, output on the right. Drag its label on the canvas to move it vertically.</p>${page.ports.map((targetPort, index) => `<div class="page-port-editor-row" data-page-port-row="${targetPort.id}">
    <div class="port-row">
      <input aria-label="Port name" data-port-field="name" value="${escapeHtml(targetPort.name)}">
      <select aria-label="Port direction" data-port-field="direction">${["input", "output", "inout"].map((value) => `<option ${targetPort.direction === value ? "selected" : ""}>${value}</option>`).join("")}</select>
      <input aria-label="Port width" data-port-field="width" type="number" min="1" max="64" value="${targetPort.width}">
      <select aria-label="Port notation" data-port-field="notation">${["normal", "not", "clock", "rising", "falling", "pulse"].map((value) => `<option ${targetPort.notation === value ? "selected" : ""}>${value}</option>`).join("")}</select>
      <button type="button" data-delete-page-port="${targetPort.id}" aria-label="Delete ${escapeHtml(targetPort.name)}">×</button>
      <span class="port-reorder"><button type="button" data-move-page-port="${targetPort.id}" data-offset="-1" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-move-page-port="${targetPort.id}" data-offset="1" ${index === page.ports.length - 1 ? "disabled" : ""}>↓</button></span>
    </div>
    ${targetPort.direction === "inout" ? `<label class="page-port-side-editor">Canvas edge <select aria-label="InOut canvas edge" data-port-field="side"><option value="left" ${pagePortSide(targetPort) === "left" ? "selected" : ""}>Left</option><option value="right" ${pagePortSide(targetPort) === "right" ? "selected" : ""}>Right</option></select></label>` : `<span class="page-port-edge-note">${pagePortSide(targetPort) === "left" ? "Left edge · source inside page" : "Right edge · destination inside page"}</span>`}
  </div>`).join("")}<button type="button" class="add-port-button" data-add-page-port>＋ Add page port</button></div>`;
}

function validationMini(issues) {
  if (!issues.length) return '<div class="validation-mini"><p class="ok">✓ Structural checks pass</p></div>';
  return `<div class="validation-mini"><p class="error">${issues.length} issue${issues.length === 1 ? "" : "s"} on this page</p>${issues.slice(0, 4).map((issue) => `<p>${escapeHtml(issue.type)} — ${escapeHtml(issue.message)}</p>`).join("")}<button type="button" data-action="show-validation">View all</button></div>`;
}

function blockInspector(block, issues) {
  els.inspectorTitle.textContent = "BLOCK INSTANCE";
  els.selectionCount.textContent = `${ui.selectedBlocks.size} selected`;
  const gate = library.find((part) => part.type === block.type)?.gate;
  return `<section class="inspector-section">
    <h3>Identity</h3>
    ${field("Instance", "block-name", block.name)}
    ${field("Definition", "block-definition", block.definition)}
    ${field("Description", "block-description", block.description, { type: "textarea" })}
    ${gate ? field("Gate inputs", "block-input-count", block.inputCount, { type: "number", min: 2, max: 8 }) : ""}
  </section>
  <section class="inspector-section">
    <h3>Transform</h3>
    <div class="field-row">${field("X", "block-x", block.x, { type: "number" })}${field("Y", "block-y", block.y, { type: "number" })}${field("W", "block-w", block.w, { type: "number", min: 100 })}${field("H", "block-h", block.h, { type: "number", min: 90 })}</div>
  </section>
  <section class="inspector-section"><h3>Ports · name / dir / width / notation</h3>${renderPortEditor(block)}</section>
  <section class="inspector-section"><h3>Actions</h3><div class="inspector-actions">${block.definitionPageId ? '<button type="button" data-open-definition>Open page</button>' : ""}<button type="button" data-block-command="duplicate">Duplicate</button><button type="button" data-block-command="forward">Bring forward</button><button type="button" data-block-command="backward">Send backward</button><button type="button" class="danger" data-block-command="delete">Delete block</button></div></section>
  <section class="inspector-section"><h3>Validation</h3>${validationMini(issues)}</section>`;
}

function wireInspector(wire, issues) {
  els.inspectorTitle.textContent = "NET / SIGNAL";
  els.selectionCount.textContent = "1 net selected";
  return `<section class="inspector-section"><h3>Signal</h3>
    ${field("Net name", "wire-name", wire.name)}
    ${field("Bus width", "wire-width", wire.width, { type: "number", min: 1, max: 64 })}
    ${field("Signal type", "wire-signal-type", wire.signalType, { choices: [{ value: "logic", label: "Logic" }, { value: "bus", label: "Bus" }, { value: "clock", label: "Clock" }, { value: "reset", label: "Reset" }, { value: "control", label: "Control" }] })}
    ${field("Route style", "wire-route-style", wire.routeStyle, { choices: [{ value: "auto", label: "Auto route" }, { value: "horizontal", label: "Horizontal-first" }, { value: "vertical", label: "Vertical-first" }, { value: "custom", label: "Custom route" }] })}
  </section>
  <section class="inspector-section"><h3>Routing</h3><div class="inspector-actions"><button type="button" data-wire-command="reset">Reset route</button><button type="button" data-wire-command="flip">Flip bend</button><button type="button" data-wire-command="add-waypoint">Add waypoint</button><button type="button" class="danger" data-wire-command="delete">Delete signal</button></div></section>
  <section class="inspector-section"><h3>Validation</h3>${validationMini(issues)}</section>`;
}

function renderInspector() {
  const page = currentPage();
  const allIssues = getValidationIssues();
  const pageIssues = allIssues.filter((issue) => issue.pageId === page.id);
  if (ui.selectedWireId) {
    const wire = page.wires.find((item) => item.id === ui.selectedWireId);
    if (wire) els.inspector.innerHTML = wireInspector(wire, pageIssues.filter((issue) => issue.wireId === wire.id));
    else { ui.selectedWireId = null; els.inspector.innerHTML = pageInspector(page, pageIssues); }
  } else if (ui.selectedBlocks.size) {
    const block = getBlock([...ui.selectedBlocks][0]);
    if (block) els.inspector.innerHTML = blockInspector(block, pageIssues.filter((issue) => issue.blockId === block.id));
    else { ui.selectedBlocks.clear(); els.inspector.innerHTML = pageInspector(page, pageIssues); }
  } else {
    els.inspector.innerHTML = pageInspector(page, pageIssues);
  }
}

function schematicBounds(page = currentPage()) {
  let minX = -140;
  let minY = -100;
  let maxX = 660;
  let maxY = 440;

  if (page.blocks.length) {
    minX = Math.min(...page.blocks.map((block) => block.x - FRAME_BLOCK_PADDING_X));
    minY = Math.min(...page.blocks.map((block) => block.y - FRAME_BLOCK_PADDING_Y));
    maxX = Math.max(...page.blocks.map((block) => block.x + block.w + FRAME_BLOCK_PADDING_X));
    maxY = Math.max(...page.blocks.map((block) => block.y + block.h + FRAME_BLOCK_PADDING_Y));
  }

  const routedPoints = page.wires.flatMap((wire) => wire.waypoints || []);
  if (routedPoints.length) {
    minX = Math.min(minX, ...routedPoints.map((point) => point.x - FRAME_WIRE_PADDING));
    minY = Math.min(minY, ...routedPoints.map((point) => point.y - FRAME_WIRE_PADDING));
    maxX = Math.max(maxX, ...routedPoints.map((point) => point.x + FRAME_WIRE_PADDING));
    maxY = Math.max(maxY, ...routedPoints.map((point) => point.y + FRAME_WIRE_PADDING));
  }

  minX = Math.floor(minX / GRID) * GRID;
  minY = Math.floor(minY / GRID) * GRID;
  maxX = Math.ceil(maxX / GRID) * GRID;
  maxY = Math.ceil(maxY / GRID) * GRID;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function pagePortPosition(page, targetPort, bounds = schematicBounds(page)) {
  const side = pagePortSide(targetPort);
  const rawY = bounds.y + clamp(Number(targetPort.edgePosition) || defaultPagePortPosition(page, targetPort), .08, .92) * bounds.h;
  return {
    x: side === "right" ? bounds.x + bounds.w : bounds.x,
    y: clamp(snap(rawY), bounds.y + 28, bounds.y + bounds.h - 28),
    side,
  };
}

function pagePortMarkup(page, targetPort, bounds) {
  const point = pagePortPosition(page, targetPort, bounds);
  const side = point.side;
  const inside = side === "right" ? -1 : 1;
  const labelX = point.x + inside * 24;
  const anchor = side === "right" ? "end" : "start";
  const endpoint = { blockId: PAGE_INTERFACE_BLOCK_ID, portId: targetPort.id };
  let compatibility = "";
  if (ui.wireDraft) compatibility = isConnectionCompatible(ui.wireDraft.endpoint, endpoint) ? "is-compatible" : "is-incompatible";
  const internalDirection = internalPagePort(targetPort).direction;
  const widthText = targetPort.width > 1 ? ` [${targetPort.width}]` : "";
  const roleText = targetPort.direction === "input" ? "source inside this page" : targetPort.direction === "output" ? "destination inside this page" : "bidirectional page terminal";
  const handleX = side === "right" ? point.x - 150 : point.x + 18;
  return `<g class="page-interface-port" data-page-port-id="${targetPort.id}">
    <title>${escapeHtml(`${targetPort.name}${widthText} · ${roleText} · drag label vertically`)}</title>
    <g class="port page-interface-terminal ${compatibility}" data-block-id="${PAGE_INTERFACE_BLOCK_ID}" data-port-id="${targetPort.id}" data-direction="${internalDirection}">
      <rect class="port-hit-target" x="${point.x - 9}" y="${point.y - 9}" width="18" height="18"/>
      <line class="port-terminal" x1="${point.x}" y1="${point.y}" x2="${point.x + inside * 16}" y2="${point.y}"/>
      ${notationMarkup(targetPort, point.x, point.y, side)}
    </g>
    <g class="page-port-drag-handle" data-page-port-id="${targetPort.id}" role="slider" aria-label="Move ${escapeHtml(targetPort.name)} vertically">
      <rect class="page-port-label-hit" x="${handleX}" y="${point.y - 12}" width="132" height="24" rx="2"/>
      <path class="page-port-grip" d="M ${point.x + inside * 19} ${point.y - 4} v 8 M ${point.x + inside * 22} ${point.y - 4} v 8"/>
      <text class="page-port-label" x="${labelX}" y="${point.y - 2}" text-anchor="${anchor}">${escapeHtml(targetPort.name)}</text>
      ${targetPort.width > 1 ? `<text class="page-port-width" x="${labelX}" y="${point.y + 9}" text-anchor="${anchor}">[${targetPort.width}]</text>` : ""}
    </g>
  </g>`;
}

function pageFrameMarkup(page, bounds = schematicBounds(page)) {
  const label = `LEVEL ${pageDepth(page)} · ${layerRole(page)} · ${page.name}`;
  return `<g class="page-frame-group">
    <rect class="page-frame" x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}"/>
    <rect class="page-frame-label-bg" x="${bounds.x + 16}" y="${bounds.y - 12}" width="${Math.max(164, label.length * 7.2)}" height="24"/>
    <text class="page-frame-label" x="${bounds.x + 26}" y="${bounds.y + 4}">${escapeHtml(label)}</text>
  </g>`;
}

function pagePortsMarkup(page, bounds = schematicBounds(page)) {
  return page.ports.map((targetPort) => pagePortMarkup(page, targetPort, bounds)).join("");
}

function renderMinimap() {
  const page = currentPage();
  const bounds = schematicBounds(page);
  const width = 154;
  const height = 96;
  const scale = Math.min((width - 12) / bounds.w, (height - 12) / bounds.h);
  const offsetX = (width - bounds.w * scale) / 2 - bounds.x * scale;
  const offsetY = (height - bounds.h * scale) / 2 - bounds.y * scale;
  ui.minimapMap = { scale, offsetX, offsetY, width, height };
  const canvasBounds = els.canvasWrap.getBoundingClientRect();
  const viewX = -page.view.x / page.view.zoom;
  const viewY = -page.view.y / page.view.zoom;
  const viewW = canvasBounds.width / page.view.zoom;
  const viewH = canvasBounds.height / page.view.zoom;
  els.minimapSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  els.minimapSvg.innerHTML = `${page.wires.map((wire) => `<path class="minimap-wire" d="${pointsPath(orthogonalPoints(wire).map((point) => ({ x: point.x * scale + offsetX, y: point.y * scale + offsetY })))}"/>`).join("")}
    ${page.blocks.map((block) => `<rect class="minimap-block" x="${block.x * scale + offsetX}" y="${block.y * scale + offsetY}" width="${Math.max(2, block.w * scale)}" height="${Math.max(2, block.h * scale)}"/>`).join("")}
    <rect class="minimap-view" x="${viewX * scale + offsetX}" y="${viewY * scale + offsetY}" width="${viewW * scale}" height="${viewH * scale}"/>`;
}

function renderValidationDialog() {
  const issues = getValidationIssues();
  els.validationList.innerHTML = issues.length ? issues.map((issue) => `<div class="validation-item"><i>!</i><div><strong>${escapeHtml(issue.type)} · ${escapeHtml(getPage(issue.pageId)?.name || "Unknown page")}</strong><p>${escapeHtml(issue.message)}</p></div></div>`).join("") : '<div class="validation-ok">✓ Width, direction, driver, endpoint, and hierarchy checks pass.</div>';
}

function render() {
  renderPageTree();
  renderPartsLibrary();
  renderBreadcrumbs();
  renderCanvas();
  renderInspector();
  renderMinimap();
}

function scheduleCanvasRender() {
  if (ui.renderQueued) return;
  ui.renderQueued = true;
  requestAnimationFrame(() => {
    ui.renderQueued = false;
    renderCanvas();
    renderMinimap();
  });
}

function screenToWorld(clientX, clientY) {
  const rect = els.svg.getBoundingClientRect();
  const view = currentPage().view;
  return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
}

function viewCenterWorld() {
  const rect = els.canvasWrap.getBoundingClientRect();
  return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function setCurrentPage(pageId) {
  const page = getPage(pageId);
  if (!page) return;
  const shouldAutoFit = page.view?.autoFit === true;
  if (shouldAutoFit) delete page.view.autoFit;
  project.currentPageId = pageId;
  clearSelection();
  ui.wireDraft = null;
  markChanged();
  render();
  if (shouldAutoFit) requestAnimationFrame(fitView);
}

function findFreeBlockPosition(block, center) {
  const page = currentPage();
  const origin = { x: snap(center.x - block.w / 2), y: snap(center.y - block.h / 2) };
  const overlaps = (candidate) => page.blocks.some((item) => (
    candidate.x < item.x + item.w + GRID
    && candidate.x + block.w + GRID > item.x
    && candidate.y < item.y + item.h + GRID
    && candidate.y + block.h + GRID > item.y
  ));
  if (!overlaps(origin)) return origin;
  for (let ring = 1; ring <= 10; ring += 1) {
    const step = GRID * 2;
    const offsets = [];
    for (let x = -ring; x <= ring; x += 1) offsets.push({ x, y: -ring }, { x, y: ring });
    for (let y = -ring + 1; y < ring; y += 1) offsets.push({ x: -ring, y }, { x: ring, y });
    for (const offset of offsets) {
      const candidate = { x: origin.x + offset.x * step, y: origin.y + offset.y * step };
      if (!overlaps(candidate)) return candidate;
    }
  }
  return { x: origin.x + GRID * 2, y: origin.y + GRID * 2 };
}

function placePart(type, point = viewCenterWorld()) {
  transaction(`Place ${type}`, () => {
    const block = makeBlock(type, point.x - 75, point.y - 65);
    const position = findFreeBlockPosition(block, point);
    block.x = position.x;
    block.y = position.y;
    const maxZ = Math.max(0, ...currentPage().blocks.map((item) => item.z));
    block.z = maxZ + 1;
    currentPage().blocks.push(block);
    clearSelection();
    ui.selectedBlocks.add(block.id);
  });
}

function placePageBlock(pageId, point = viewCenterWorld()) {
  const definition = getPage(pageId);
  if (!definition) return;
  transaction("Place page block", () => {
    const block = makeBlock("PAGE", point.x - 90, point.y - 70, { name: nextInstanceName("PAGE", currentPage(), definition.name), definition: definition.name, definitionPageId: definition.id, w: 180, h: Math.max(120, 58 + Math.max(2, definition.ports.length) * 22) });
    const position = findFreeBlockPosition(block, point);
    block.x = position.x;
    block.y = position.y;
    block.z = Math.max(0, ...currentPage().blocks.map((item) => item.z)) + 1;
    currentPage().blocks.push(block);
    clearSelection();
    ui.selectedBlocks.add(block.id);
  });
}

function createPage(parentId = currentPage().id) {
  const name = prompt("Page name", "NewPage");
  if (!name?.trim()) return;
  transaction("Create page", () => {
    const page = makePage(name.trim(), parentId, "New schematic page.");
    project.pages.push(page);
    project.currentPageId = page.id;
    ui.expandedPages.add(parentId);
    clearSelection();
  });
}

function renamePage(page = currentPage(), requestedName = null) {
  const name = requestedName === null ? prompt("Rename page", page.name) : requestedName;
  if (!name?.trim() || name.trim() === page.name) return;
  transaction("Rename page", () => {
    page.name = name.trim();
    for (const candidate of project.pages) {
      for (const block of candidate.blocks) if (block.definitionPageId === page.id) block.definition = page.name;
    }
  });
}

function duplicatePage(page = currentPage()) {
  transaction("Duplicate page", () => {
    const copy = clone(page);
    copy.id = id("page");
    copy.name = `${page.name} Copy`;
    copy.isTop = false;
    const portMap = new Map();
    copy.ports = copy.ports.map((item) => { const old = item.id; item.id = id("port"); portMap.set(old, item.id); return item; });
    const blockMap = new Map();
    copy.blocks = copy.blocks.map((block) => {
      const oldBlockId = block.id;
      block.id = id("block");
      blockMap.set(oldBlockId, block.id);
      const ownPortMap = new Map();
      block.ports = block.ports.map((item) => { const old = item.id; item.id = id("port"); ownPortMap.set(old, item.id); return item; });
      block.__portMap = ownPortMap;
      return block;
    });
    copy.wires = copy.wires.map((wire) => {
      wire.id = id("wire");
      for (const endpoint of [wire.from, wire.to]) {
        if (endpoint.blockId === PAGE_INTERFACE_BLOCK_ID) {
          endpoint.portId = portMap.get(endpoint.portId) || endpoint.portId;
          continue;
        }
        const originalBlock = page.blocks.find((block) => block.id === endpoint.blockId);
        const copiedBlock = copy.blocks.find((block) => blockMap.get(originalBlock?.id) === block.id);
        endpoint.blockId = blockMap.get(endpoint.blockId) || endpoint.blockId;
        endpoint.portId = copiedBlock?.__portMap.get(endpoint.portId) || endpoint.portId;
      }
      return wire;
    });
    copy.blocks.forEach((block) => delete block.__portMap);
    project.pages.push(copy);
    project.currentPageId = copy.id;
    clearSelection();
  });
}

function pageDescendantIds(pageId) {
  const result = [];
  const visit = (parent) => project.pages.filter((page) => page.parentId === parent).forEach((page) => { result.push(page.id); visit(page.id); });
  visit(pageId);
  return result;
}

function deletePage(page = currentPage(), confirmed = false) {
  if (project.pages.length === 1) return toast("A project must contain at least one page.", "error");
  const descendants = pageDescendantIds(page.id);
  const message = descendants.length ? `Delete ${page.name} and ${descendants.length} sub-page(s)?` : `Delete ${page.name}?`;
  if (!confirmed && !confirm(message)) return;
  transaction("Delete page", () => {
    const removing = new Set([page.id, ...descendants]);
    project.pages = project.pages.filter((candidate) => !removing.has(candidate.id));
    const fallback = getPage(page.parentId) || project.pages[0];
    project.currentPageId = fallback.id;
    if (!project.pages.some((candidate) => candidate.isTop)) fallback.isTop = true;
    clearSelection();
  });
}

function movePage(page, offset) {
  const siblings = project.pages.filter((candidate) => candidate.parentId === page.parentId);
  const sourceIndex = siblings.findIndex((candidate) => candidate.id === page.id);
  const target = siblings[sourceIndex + offset];
  if (!target) return;
  transaction("Reorder page", () => {
    const firstIndex = project.pages.findIndex((candidate) => candidate.id === page.id);
    const secondIndex = project.pages.findIndex((candidate) => candidate.id === target.id);
    [project.pages[firstIndex], project.pages[secondIndex]] = [project.pages[secondIndex], project.pages[firstIndex]];
  });
}

function setTopPage(page = currentPage()) {
  transaction("Set top page", () => project.pages.forEach((candidate) => { candidate.isTop = candidate.id === page.id; }));
}

function deleteSelection() {
  if (!ui.selectedBlocks.size && !ui.selectedWireId) return;
  transaction("Delete selection", () => {
    const page = currentPage();
    if (ui.selectedWireId) page.wires = page.wires.filter((wire) => wire.id !== ui.selectedWireId);
    if (ui.selectedBlocks.size) {
      page.blocks = page.blocks.filter((block) => !ui.selectedBlocks.has(block.id));
      page.wires = page.wires.filter((wire) => !ui.selectedBlocks.has(wire.from.blockId) && !ui.selectedBlocks.has(wire.to.blockId));
    }
    clearSelection();
  });
}

function copySelection() {
  const page = currentPage();
  const blocks = page.blocks.filter((block) => ui.selectedBlocks.has(block.id));
  if (!blocks.length) return;
  const blockIds = new Set(blocks.map((block) => block.id));
  ui.clipboard = { blocks: clone(blocks), wires: clone(page.wires.filter((wire) => blockIds.has(wire.from.blockId) && blockIds.has(wire.to.blockId))) };
  toast(`${blocks.length} block${blocks.length === 1 ? "" : "s"} copied`);
}

function pasteSelection() {
  if (!ui.clipboard?.blocks.length) return;
  transaction("Paste", () => {
    const map = new Map();
    const portMaps = new Map();
    const reservedNames = new Set(currentPage().blocks.map((block) => block.name));
    const pasted = ui.clipboard.blocks.map((source) => {
      const block = clone(source);
      const oldBlockId = block.id;
      block.id = id("block");
      block.name = nextInstanceName(block.type, currentPage(), block.definition, reservedNames);
      reservedNames.add(block.name);
      block.x += GRID * 2;
      block.y += GRID * 2;
      map.set(oldBlockId, block.id);
      const targetMap = new Map();
      if (!block.definitionPageId) block.ports = block.ports.map((targetPort) => { const old = targetPort.id; targetPort.id = id("port"); targetMap.set(old, targetPort.id); return targetPort; });
      portMaps.set(oldBlockId, targetMap);
      return block;
    });
    const wires = ui.clipboard.wires.map((source) => {
      const wire = clone(source);
      wire.id = id("wire");
      const oldFromBlock = wire.from.blockId;
      const oldToBlock = wire.to.blockId;
      wire.from.blockId = map.get(oldFromBlock);
      wire.to.blockId = map.get(oldToBlock);
      wire.from.portId = portMaps.get(oldFromBlock)?.get(wire.from.portId) || wire.from.portId;
      wire.to.portId = portMaps.get(oldToBlock)?.get(wire.to.portId) || wire.to.portId;
      wire.waypoints = wire.waypoints.map((point) => ({ x: point.x + GRID * 2, y: point.y + GRID * 2 }));
      return wire;
    });
    currentPage().blocks.push(...pasted);
    currentPage().wires.push(...wires);
    clearSelection();
    pasted.forEach((block) => ui.selectedBlocks.add(block.id));
    ui.clipboard = { blocks: clone(pasted), wires: clone(wires) };
  });
}

function duplicateSelection() {
  copySelection();
  pasteSelection();
}

function arrangeSelection(action) {
  const blocks = currentPage().blocks.filter((block) => ui.selectedBlocks.has(block.id));
  if (!blocks.length) return;
  if (["left", "right", "top", "bottom"].includes(action) && blocks.length < 2) return;
  if (["distribute-h", "distribute-v"].includes(action) && blocks.length < 3) return;
  transaction(`Arrange ${action}`, () => {
    if (action === "left") { const x = Math.min(...blocks.map((block) => block.x)); blocks.forEach((block) => { block.x = x; }); }
    if (action === "right") { const x = Math.max(...blocks.map((block) => block.x + block.w)); blocks.forEach((block) => { block.x = x - block.w; }); }
    if (action === "top") { const y = Math.min(...blocks.map((block) => block.y)); blocks.forEach((block) => { block.y = y; }); }
    if (action === "bottom") { const y = Math.max(...blocks.map((block) => block.y + block.h)); blocks.forEach((block) => { block.y = y - block.h; }); }
    if (action === "distribute-h") {
      const sorted = blocks.toSorted((a, b) => a.x - b.x);
      const start = sorted[0].x; const end = sorted.at(-1).x;
      sorted.forEach((block, index) => { block.x = snap(start + (end - start) * index / (sorted.length - 1)); });
    }
    if (action === "distribute-v") {
      const sorted = blocks.toSorted((a, b) => a.y - b.y);
      const start = sorted[0].y; const end = sorted.at(-1).y;
      sorted.forEach((block, index) => { block.y = snap(start + (end - start) * index / (sorted.length - 1)); });
    }
    if (action === "forward") blocks.forEach((block) => { block.z += 1; });
    if (action === "backward") blocks.forEach((block) => { block.z = Math.max(0, block.z - 1); });
  });
}

function fitView() {
  const bounds = schematicBounds();
  const rect = els.canvasWrap.getBoundingClientRect();
  const zoom = clamp(Math.min((rect.width - 100) / bounds.w, (rect.height - 100) / bounds.h), MIN_ZOOM, MAX_ZOOM);
  currentPage().view.zoom = zoom;
  currentPage().view.x = (rect.width - bounds.w * zoom) / 2 - bounds.x * zoom;
  currentPage().view.y = (rect.height - bounds.h * zoom) / 2 - bounds.y * zoom;
  markChanged();
  render();
}

function zoomAt(clientX, clientY, nextZoom) {
  const page = currentPage();
  const rect = els.canvasWrap.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const worldX = (x - page.view.x) / page.view.zoom;
  const worldY = (y - page.view.y) / page.view.zoom;
  page.view.zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  page.view.x = x - worldX * page.view.zoom;
  page.view.y = y - worldY * page.view.zoom;
  markChanged();
  scheduleCanvasRender();
}

function connectPorts(first, second) {
  if (!isConnectionCompatible(first, second)) {
    toast("Ports are not compatible. Input-input and output-output connections are blocked.", "error");
    ui.wireDraft = null;
    render();
    return;
  }
  const normalized = normalizedEndpoints(first, second);
  const fromPort = getPort(normalized.from.blockId, normalized.from.portId);
  const toPort = getPort(normalized.to.blockId, normalized.to.portId);
  const existingDriver = currentPage().wires.some((wire) => wire.to.blockId === normalized.to.blockId && wire.to.portId === normalized.to.portId);
  if (existingDriver && toPort.direction === "input") {
    toast("This input already has a driver.", "error");
    ui.wireDraft = null;
    render();
    return;
  }
  transaction("Connect ports", () => {
    const width = fromPort.width;
    const wire = makeWire(normalized.from, normalized.to, width, width > 1 ? `NET[${width - 1}:0]` : "");
    currentPage().wires.push(wire);
    clearSelection();
    ui.selectedWireId = wire.id;
    ui.wireDraft = null;
  });
  if (fromPort.width !== toPort.width) toast(`Connected with width mismatch: ${fromPort.width} → ${toPort.width}`, "error");
}

function resetRoute(wire) { wire.waypoints = []; wire.routeStyle = "auto"; }

function flipBend(wire) {
  wire.waypoints = [];
  wire.routeStyle = wire.routeStyle === "vertical" ? "horizontal" : "vertical";
}

function addWireWaypoint(wire, point = null) {
  const points = orthogonalPoints(wire);
  const target = point || pathMidpoint(points);
  const snappedTarget = { x: snap(target.x), y: snap(target.y) };
  const insertAt = nearestSegmentIndex(points, snappedTarget) + 1;
  const customPoints = points.map((item) => ({ x: item.x, y: item.y }));
  customPoints.splice(insertAt, 0, snappedTarget);
  wire.waypoints = removeDuplicatePoints(customPoints).slice(1, -1);
  wire.routeStyle = "custom";
}

function customRoutePoints(wire) {
  const points = orthogonalPoints(wire).map((point) => ({ x: point.x, y: point.y }));
  wire.waypoints = points.slice(1, -1);
  wire.routeStyle = "custom";
  return points;
}

function selectedBlock() { return getBlock([...ui.selectedBlocks][0]); }

function portOwnerArray(block) {
  if (block?.definitionPageId) return getPage(block.definitionPageId)?.ports || block.ports;
  return block?.ports || [];
}

function removePagePort(page, portId) {
  page.ports = page.ports.filter((item) => item.id !== portId);
  for (const candidatePage of project.pages) {
    const instanceIds = new Set(candidatePage.blocks.filter((block) => block.definitionPageId === page.id).map((block) => block.id));
    candidatePage.wires = candidatePage.wires.filter((wire) => ![wire.from, wire.to].some((endpoint) => (
      endpoint.portId === portId
      && (candidatePage.id === page.id && endpoint.blockId === PAGE_INTERFACE_BLOCK_ID || instanceIds.has(endpoint.blockId))
    )));
  }
}

function addPagePort(page) {
  const targetPort = port(`P${page.ports.length + 1}`, "input");
  page.ports.push(targetPort);
  targetPort.edgePosition = defaultPagePortPosition(page, targetPort);
}

function handleInspectorChange(event) {
  const fieldName = event.target.dataset.field;
  if (fieldName) {
    const page = currentPage();
    const block = selectedBlock();
    const wire = page.wires.find((item) => item.id === ui.selectedWireId);
    transaction(`Change ${fieldName}`, () => {
      if (fieldName === "page-name") {
        page.name = event.target.value.trim() || "Untitled";
        project.pages.forEach((candidate) => candidate.blocks.forEach((item) => { if (item.definitionPageId === page.id) item.definition = page.name; }));
      }
      if (fieldName === "page-description") page.description = event.target.value;
      if (block && fieldName.startsWith("block-")) {
        const key = fieldName.slice(6);
        if (["x", "y", "w", "h"].includes(key)) block[key] = snap(clamp(Number(event.target.value) || 0, key === "w" ? 100 : key === "h" ? 90 : -10000, 10000));
        else if (key === "input-count") {
          block.inputCount = clamp(Number(event.target.value) || 2, 2, 8);
          const output = block.ports.find((targetPort) => targetPort.direction === "output");
          block.ports = [...Array.from({ length: block.inputCount }, (_, index) => port(String.fromCharCode(65 + index), "input", output?.width || 1)), output || port("Y", "output")];
        } else block[key] = event.target.value;
      }
      if (wire && fieldName.startsWith("wire-")) {
        const key = fieldName.slice(5).replaceAll("-", "_");
        if (fieldName === "wire-width") {
          wire.width = clamp(Number(event.target.value) || 1, 1, 64);
          if (wire.width > 1 && wire.signalType === "logic") wire.signalType = "bus";
        } else if (fieldName === "wire-signal-type") wire.signalType = event.target.value;
        else if (fieldName === "wire-route-style") { wire.routeStyle = event.target.value; if (wire.routeStyle !== "custom") wire.waypoints = []; }
        else wire[key] = event.target.value;
      }
    });
    return;
  }

  const portRow = event.target.closest("[data-port-row], [data-page-port-row]");
  if (portRow && event.target.dataset.portField) {
    const targetPortId = portRow.dataset.portRow || portRow.dataset.pagePortRow;
    const ports = portRow.dataset.pagePortRow ? currentPage().ports : portOwnerArray(selectedBlock());
    const targetPort = ports.find((item) => item.id === targetPortId);
    if (!targetPort) return;
    transaction("Edit port", () => {
      const key = event.target.dataset.portField;
      targetPort[key] = key === "width" ? clamp(Number(event.target.value) || 1, 1, 64) : event.target.value;
    });
  }
}

function handleInspectorClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) return handleAction(actionButton.dataset.action);
  const block = selectedBlock();
  const page = currentPage();
  const wire = page.wires.find((item) => item.id === ui.selectedWireId);

  if (event.target.closest("[data-open-definition]") && block?.definitionPageId) return setCurrentPage(block.definitionPageId);
  const blockCommand = event.target.closest("[data-block-command]")?.dataset.blockCommand;
  if (blockCommand === "duplicate") return duplicateSelection();
  if (blockCommand === "delete") return deleteSelection();
  if (blockCommand === "forward" || blockCommand === "backward") return arrangeSelection(blockCommand);

  const wireCommand = event.target.closest("[data-wire-command]")?.dataset.wireCommand;
  if (wireCommand && wire) {
    if (wireCommand === "delete") return deleteSelection();
    transaction(`Wire ${wireCommand}`, () => {
      if (wireCommand === "reset") resetRoute(wire);
      if (wireCommand === "flip") flipBend(wire);
      if (wireCommand === "add-waypoint") addWireWaypoint(wire);
    });
    return;
  }

  const pageCommand = event.target.closest("[data-page-command]")?.dataset.pageCommand;
  if (pageCommand === "rename") return renamePage(page);
  if (pageCommand === "duplicate") return duplicatePage(page);
  if (pageCommand === "delete") return deletePage(page);
  if (pageCommand === "set-top") return setTopPage(page);
  if (pageCommand === "move-up") return movePage(page, -1);
  if (pageCommand === "move-down") return movePage(page, 1);

  if (event.target.closest("[data-project-command='new']")) {
    if (!confirm("Create a new project? The current project remains available only if it was exported.")) return;
    const name = prompt("Project name", "Untitled Project") || "Untitled Project";
    transaction("New project", () => {
      const top = makePage("System", null, "Top-level page.");
      top.isTop = true;
      project = { schema: "block-schematic-studio", version: 1, name, currentPageId: top.id, pages: [top], updatedAt: new Date().toISOString() };
      clearSelection();
    });
    return;
  }

  const deletePortId = event.target.closest("[data-delete-port]")?.dataset.deletePort;
  if (deletePortId && block) transaction("Delete port", () => {
    if (block.definitionPageId) removePagePort(getPage(block.definitionPageId), deletePortId);
    else {
      const ports = portOwnerArray(block);
      ports.splice(ports.findIndex((item) => item.id === deletePortId), 1);
    }
  });
  if (event.target.closest("[data-add-port]") && block) transaction("Add port", () => {
    if (block.definitionPageId) addPagePort(getPage(block.definitionPageId));
    else portOwnerArray(block).push(port(`P${portOwnerArray(block).length + 1}`, "input"));
  });
  const movePortButton = event.target.closest("[data-move-port]");
  if (movePortButton && block) transaction("Reorder port", () => reorderArrayItem(portOwnerArray(block), movePortButton.dataset.movePort, Number(movePortButton.dataset.offset)));

  const deletePagePortId = event.target.closest("[data-delete-page-port]")?.dataset.deletePagePort;
  if (deletePagePortId) transaction("Delete page port", () => removePagePort(page, deletePagePortId));
  if (event.target.closest("[data-add-page-port]")) transaction("Add page port", () => addPagePort(page));
  const movePagePortButton = event.target.closest("[data-move-page-port]");
  if (movePagePortButton) transaction("Reorder page port", () => reorderArrayItem(page.ports, movePagePortButton.dataset.movePagePort, Number(movePagePortButton.dataset.offset)));
}

function reorderArrayItem(items, itemId, offset) {
  const index = items.findIndex((item) => item.id === itemId);
  const nextIndex = index + offset;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
}

function pageMenuMarkup(page) {
  const siblings = project.pages.filter((candidate) => candidate.parentId === page.parentId);
  const siblingIndex = siblings.findIndex((candidate) => candidate.id === page.id);
  const descendants = pageDescendantIds(page.id);
  const heading = `<div class="page-menu-heading"><small>Page actions</small><strong title="${escapeHtml(page.name)}">${escapeHtml(page.name)}</strong></div>`;

  if (ui.pageMenuMode === "rename") {
    return `${heading}<div class="page-menu-form">
      <label for="page-menu-name">Page name</label>
      <input id="page-menu-name" type="text" value="${escapeHtml(page.name)}" maxlength="80" autocomplete="off">
      <div class="page-menu-form-actions"><button type="button" data-page-menu-command="cancel">Cancel</button><button type="button" data-page-menu-command="rename-save">Save</button></div>
    </div>`;
  }

  if (ui.pageMenuMode === "delete") {
    const detail = descendants.length
      ? `This also removes ${descendants.length} nested sub-page${descendants.length === 1 ? "" : "s"}.`
      : "Blocks using this definition will be reported as missing.";
    return `${heading}<div class="page-menu-form">
      <p>Delete <strong>${escapeHtml(page.name)}</strong>?</p>
      <p>${detail}</p>
      <div class="page-menu-form-actions"><button type="button" data-page-menu-command="cancel">Cancel</button><button type="button" class="is-danger" data-page-menu-command="delete-confirm">Delete</button></div>
    </div>`;
  }

  return `${heading}<div class="page-menu-items">
    <button type="button" class="page-menu-item" role="menuitem" data-page-menu-command="rename"><span>✎</span><span>Rename</span><kbd>↵</kbd></button>
    <button type="button" class="page-menu-item" role="menuitem" data-page-menu-command="duplicate"><span>⧉</span><span>Duplicate</span></button>
    <button type="button" class="page-menu-item" role="menuitem" data-page-menu-command="set-top" ${page.isTop ? "disabled" : ""}><span>◆</span><span>Set as top page</span></button>
    <div class="page-menu-separator" aria-hidden="true"></div>
    <button type="button" class="page-menu-item" role="menuitem" data-page-menu-command="move-up" ${siblingIndex <= 0 ? "disabled" : ""}><span>↑</span><span>Move up</span></button>
    <button type="button" class="page-menu-item" role="menuitem" data-page-menu-command="move-down" ${siblingIndex < 0 || siblingIndex >= siblings.length - 1 ? "disabled" : ""}><span>↓</span><span>Move down</span></button>
    <div class="page-menu-separator" aria-hidden="true"></div>
    <button type="button" class="page-menu-item is-danger" role="menuitem" data-page-menu-command="delete" ${project.pages.length === 1 ? "disabled" : ""}><span>×</span><span>Delete page</span></button>
  </div>`;
}

function positionPageActions() {
  const anchor = ui.pageMenuAnchor;
  if (!anchor?.isConnected || els.pageActionMenu.hidden) return;
  const anchorRect = anchor.getBoundingClientRect();
  const menuRect = els.pageActionMenu.getBoundingClientRect();
  const left = clamp(anchorRect.right + 6, 8, window.innerWidth - menuRect.width - 8);
  const top = clamp(anchorRect.top - 4, 8, window.innerHeight - menuRect.height - 8);
  els.pageActionMenu.style.left = `${Math.round(left)}px`;
  els.pageActionMenu.style.top = `${Math.round(top)}px`;
}

function renderPageActions({ focus = true } = {}) {
  const page = getPage(ui.pageMenuPageId);
  if (!page) return closePageActions();
  els.pageActionMenu.innerHTML = pageMenuMarkup(page);
  els.pageActionMenu.hidden = false;
  positionPageActions();
  if (!focus) return;
  const target = ui.pageMenuMode === "rename"
    ? els.pageActionMenu.querySelector("#page-menu-name")
    : els.pageActionMenu.querySelector("button:not(:disabled)");
  target?.focus();
  if (ui.pageMenuMode === "rename") target?.select();
}

function closePageActions({ restoreFocus = false } = {}) {
  const anchor = ui.pageMenuAnchor;
  anchor?.closest(".tree-row")?.classList.remove("is-menu-open");
  els.pageActionMenu.hidden = true;
  els.pageActionMenu.innerHTML = "";
  ui.pageMenuPageId = null;
  ui.pageMenuAnchor = null;
  ui.pageMenuMode = "actions";
  if (restoreFocus && anchor?.isConnected) anchor.focus();
}

function openPageActions(pageId, anchor) {
  const page = getPage(pageId);
  if (!page) return;
  if (!els.pageActionMenu.hidden && ui.pageMenuPageId === pageId) return closePageActions({ restoreFocus: true });
  closePageActions();
  ui.pageMenuPageId = pageId;
  ui.pageMenuAnchor = anchor;
  ui.pageMenuMode = "actions";
  anchor.closest(".tree-row")?.classList.add("is-menu-open");
  renderPageActions();
}

function handlePageActionMenuClick(event) {
  event.stopPropagation();
  const command = event.target.closest("[data-page-menu-command]")?.dataset.pageMenuCommand;
  if (!command) return;
  const page = getPage(ui.pageMenuPageId);
  if (!page) return closePageActions();
  if (command === "cancel") {
    ui.pageMenuMode = "actions";
    renderPageActions();
    return;
  }
  if (command === "rename") {
    ui.pageMenuMode = "rename";
    renderPageActions();
    return;
  }
  if (command === "delete") {
    ui.pageMenuMode = "delete";
    renderPageActions();
    return;
  }
  if (command === "rename-save") {
    const nextName = els.pageActionMenu.querySelector("#page-menu-name")?.value;
    if (!nextName?.trim()) {
      els.pageActionMenu.querySelector("#page-menu-name")?.focus();
      return;
    }
    closePageActions();
    renamePage(page, nextName);
    return;
  }
  closePageActions();
  if (command === "duplicate") duplicatePage(page);
  if (command === "set-top") setTopPage(page);
  if (command === "move-up") movePage(page, -1);
  if (command === "move-down") movePage(page, 1);
  if (command === "delete-confirm") deletePage(page, true);
}

function saveProject() {
  downloadBlob(`${project.name.replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/^-|-$/g, "") || "schematic"}.schematic.json`, new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
  toast("Project JSON exported");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSvgText() {
  const page = currentPage();
  const bounds = schematicBounds(page);
  const titleHeight = 44;
  const issues = getValidationIssues();
  const errorWireIds = new Set(issues.filter((issue) => issue.pageId === page.id && issue.wireId).map((issue) => issue.wireId));
  const frameContent = `${pageFrameMarkup(page, bounds)}${pagePortsMarkup(page, bounds)}`
    .replaceAll(/<rect class="page-port-label-hit"[^>]*\/>/g, "")
    .replaceAll(/<rect class="port-hit-target"[^>]*\/>/g, "");
  const blockContent = [...page.blocks].sort((a, b) => a.z - b.z).map(blockMarkup).join("")
    .replaceAll(/<rect class="resize-handle"[^>]*\/>/g, "")
    .replaceAll(/<rect class="block-hit-area"[^>]*\/>/g, "")
    .replaceAll(/<rect class="port-hit-target"[^>]*\/>/g, "");
  const wireContent = page.wires.map((wire) => wireMarkup(wire, errorWireIds)).join("")
    .replaceAll(/<path class="wire-hit"[^>]*\/>/g, "")
    .replaceAll(/<rect class="waypoint"[^>]*\/>/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${Math.ceil(bounds.w)}" height="${Math.ceil(bounds.h + titleHeight)}" viewBox="${bounds.x} ${bounds.y - titleHeight} ${bounds.w} ${bounds.h + titleHeight}">
  <style>
text{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.block-body,.symbol-body{fill:#12171b;stroke:#8d9997;stroke-width:1.5}.symbol-detail{fill:none;stroke:#8d9997;stroke-width:1.5}.symbol-selection-outline{display:none}.symbol-glyph{fill:#b8c3c1;font-size:10px}.symbol-glyph.is-large{font-size:20px}.block-divider{stroke:#333b42}.block-title{fill:#edf2f1;font:bold 12px sans-serif}.block-type{fill:#7f8b8d;font-size:9px}.port-terminal{stroke:#a2adab;stroke-width:1.5}.port-label,.page-port-label{fill:#b5bfbd;font-size:9px}.port-width,.page-port-width{fill:#707c7e;font-size:8px}.page-port-grip{fill:none;stroke:#52c6b0;stroke-width:1}.notation{fill:#12171b;stroke:#d1d9d8;stroke-width:1.3}.notation-text{fill:#c0cac8;font-size:10px}path.notation{fill:none}.wire-line{fill:none;stroke:#93a09f;stroke-width:2;stroke-linejoin:miter}.is-bus .wire-line{stroke:#b0bfbd;stroke-width:4}.is-error .wire-line{stroke:#dc7777;stroke-dasharray:7 5}.wire-label,.bus-width{fill:#c3cecc;font-size:10px;paint-order:stroke;stroke:#080a0c;stroke-width:4px}.bus-slash{stroke:#edf2f1;stroke-width:1.5}.page-title{fill:#edf2f1;font:bold 15px sans-serif}.page-meta{fill:#7f8b8d;font-size:9px}.page-frame{fill:none;stroke:#566169;stroke-width:1.2;stroke-dasharray:8 6}.page-frame-label-bg{fill:#080a0c}.page-frame-label{fill:#7f8a8b;font-size:9px;letter-spacing:.08em}</style>
<rect x="${bounds.x}" y="${bounds.y - titleHeight}" width="${bounds.w}" height="${bounds.h + titleHeight}" fill="#080a0c"/>
<text class="page-title" x="${bounds.x + 14}" y="${bounds.y - 18}">${escapeHtml(page.name)}</text><text class="page-meta" x="${bounds.x + 14}" y="${bounds.y - 5}">BLOCK SCHEMATIC STUDIO · ${page.blocks.length} BLOCKS · ${page.wires.length} NETS</text>
<g>${frameContent}${wireContent}${blockContent}</g></svg>`;
}

function exportSvg() {
  downloadBlob(`${currentPage().name}.svg`, new Blob([exportSvgText()], { type: "image/svg+xml" }));
  toast("SVG exported");
}

function exportPng() {
  const source = exportSvgText();
  const bounds = schematicBounds();
  const scale = Math.min(2, 3000 / Math.max(bounds.w, bounds.h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(bounds.w * scale));
  canvas.height = Math.max(1, Math.ceil((bounds.h + 44) * scale));
  const context = canvas.getContext("2d");
  const image = new Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  image.onload = () => {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => { if (blob) downloadBlob(`${currentPage().name}.png`, blob); }, "image/png");
    toast("PNG exported");
  };
  image.onerror = () => { URL.revokeObjectURL(url); toast("PNG export failed.", "error"); };
  image.src = url;
}

function savePanelPrefs() {
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(panelPrefs));
}

function applyPanelPrefs({ resizeCanvas = true } = {}) {
  els.studioShell.style.setProperty("--left-panel-width", `${panelPrefs.leftWidth}px`);
  els.studioShell.style.setProperty("--right-panel-width", `${panelPrefs.rightWidth}px`);
  document.body.classList.toggle("left-panel-collapsed", !panelPrefs.leftOpen);
  document.body.classList.toggle("right-panel-collapsed", !panelPrefs.rightOpen);
  for (const side of ["left", "right"]) {
    const open = panelPrefs[`${side}Open`];
    const button = document.querySelector(`[data-action='toggle-${side}-panel']`);
    button?.classList.toggle("is-active", open);
    button?.setAttribute("aria-pressed", String(open));
  }
  if (resizeCanvas) requestAnimationFrame(scheduleCanvasRender);
}

function togglePanel(side) {
  panelPrefs[`${side}Open`] = !panelPrefs[`${side}Open`];
  savePanelPrefs();
  applyPanelPrefs();
}

function beginPanelResize(event) {
  const side = event.currentTarget.dataset.resizePanel;
  if (!panelPrefs[`${side}Open`]) return;
  event.preventDefault();
  ui.panelResize = { side, pointerId: event.pointerId };
  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing-panel");
}

function updatePanelResize(event) {
  if (!ui.panelResize) return;
  const rect = els.studioShell.getBoundingClientRect();
  const { side } = ui.panelResize;
  panelPrefs[`${side}Width`] = side === "left"
    ? clamp(event.clientX - rect.left, 190, 440)
    : clamp(rect.right - event.clientX, 240, 520);
  applyPanelPrefs();
}

function endPanelResize(event) {
  if (!ui.panelResize) return;
  const resizer = document.querySelector(`[data-resize-panel='${ui.panelResize.side}']`);
  try { resizer?.releasePointerCapture(event.pointerId); } catch { /* Capture may already be released. */ }
  ui.panelResize = null;
  document.body.classList.remove("is-resizing-panel");
  savePanelPrefs();
}

function handlePanelResizerKey(event) {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const side = event.currentTarget.dataset.resizePanel;
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const delta = side === "right" ? -direction * 20 : direction * 20;
  const limits = side === "left" ? [190, 440] : [240, 520];
  panelPrefs[`${side}Width`] = clamp(panelPrefs[`${side}Width`] + delta, ...limits);
  savePanelPrefs();
  applyPanelPrefs();
}

function endpointLabel(endpoint, page = currentPage()) {
  if (endpoint?.blockId === PAGE_INTERFACE_BLOCK_ID) {
    const targetPort = page.ports.find((item) => item.id === endpoint.portId);
    return targetPort ? `${page.name}.${targetPort.name} (page edge)` : "Unknown page port";
  }
  const block = getBlock(endpoint?.blockId, page);
  const targetPort = block ? getPort(block.id, endpoint?.portId, page) : null;
  return block && targetPort ? `${block.name}.${targetPort.name}` : "Unknown port";
}

function hideWireTooltip() {
  ui.hoveredWireId = null;
  els.wireTooltip.hidden = true;
}

function updateWireTooltip(event) {
  const target = event.target.closest?.(".wire-hit, .wire-group");
  const wireId = target?.dataset.wireId || target?.closest?.(".wire-group")?.dataset.wireId;
  const wire = currentPage().wires.find((item) => item.id === wireId);
  if (!wire) return hideWireTooltip();
  ui.hoveredWireId = wire.id;
  const width = clamp(Number(wire.width) || 1, 1, 64);
  els.wireTooltip.innerHTML = `<strong>${escapeHtml(wire.name || "Unnamed net")}</strong><span>${width}-bit ${escapeHtml(wire.signalType || "logic")}</span><small>${escapeHtml(endpointLabel(wire.from))} → ${escapeHtml(endpointLabel(wire.to))}</small>`;
  els.wireTooltip.hidden = false;
  const canvasRect = els.canvasWrap.getBoundingClientRect();
  const left = clamp(event.clientX - canvasRect.left + 14, 8, Math.max(8, canvasRect.width - 250));
  const top = clamp(event.clientY - canvasRect.top + 14, 8, Math.max(8, canvasRect.height - 88));
  els.wireTooltip.style.left = `${left}px`;
  els.wireTooltip.style.top = `${top}px`;
}

function handleAction(action) {
  if (action === "toggle-left-panel") togglePanel("left");
  if (action === "toggle-right-panel") togglePanel("right");
  if (action === "load-clock-example") {
    if (!confirm("Replace the current project with the corrected top-down clock example? Save the current project first if you want to keep it.")) return;
    const before = snapshotProject();
    project = createSampleProject();
    recordBefore(before);
    clearSelection();
    ui.expandedPages = new Set(project.pages.map((page) => page.id));
    markChanged();
    render();
    requestAnimationFrame(fitView);
    toast("Corrected clock example opened");
  }
  if (action === "new-page") createPage();
  if (action === "save") saveProject();
  if (action === "load") els.projectFile.click();
  if (action === "undo") undo();
  if (action === "redo") redo();
  if (action === "fit") fitView();
  if (action === "zoom-in" || action === "zoom-out") {
    const rect = els.canvasWrap.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, currentPage().view.zoom * (action === "zoom-in" ? 1.15 : 0.87));
  }
  if (action === "export-svg") exportSvg();
  if (action === "export-png") exportPng();
  if (action === "show-validation") {
    renderValidationDialog();
    els.validationDialog.showModal();
  }
}

function onCanvasPointerDown(event) {
  els.canvasWrap.focus({ preventScroll: true });
  const point = screenToWorld(event.clientX, event.clientY);
  const segmentHandle = event.target.closest?.(".segment-handle");
  const waypointHandle = event.target.closest?.(".waypoint");
  const resizeHandle = event.target.closest?.(".resize-handle");
  const pagePortHandle = event.target.closest?.(".page-port-drag-handle");
  const targetPort = event.target.closest?.(".port");
  const wireHit = event.target.closest?.(".wire-hit");
  const wireGroup = event.target.closest?.(".wire-group");
  const blockGroup = event.target.closest?.(".block");

  if (pagePortHandle) {
    event.stopPropagation();
    clearSelection();
    ui.wireDraft = null;
    ui.interaction = { type: "page-port", portId: pagePortHandle.dataset.pagePortId, before: snapshotProject() };
    els.svg.setPointerCapture(event.pointerId);
    render();
    return;
  }

  if (segmentHandle) {
    event.stopPropagation();
    const wire = currentPage().wires.find((item) => item.id === segmentHandle.dataset.wireId);
    if (!wire) return;
    clearSelection();
    ui.selectedWireId = wire.id;
    const before = snapshotProject();
    ui.interaction = {
      type: "segment",
      wireId: wire.id,
      index: Number(segmentHandle.dataset.segmentIndex),
      orientation: segmentHandle.dataset.segmentOrientation,
      points: customRoutePoints(wire),
      before,
    };
    hideWireTooltip();
    els.svg.setPointerCapture(event.pointerId);
    render();
    return;
  }

  if (waypointHandle) {
    event.stopPropagation();
    const wire = currentPage().wires.find((item) => item.id === waypointHandle.dataset.wireId);
    if (!wire) return;
    const waypointKey = `${wire.id}:${waypointHandle.dataset.waypointIndex}`;
    const now = performance.now();
    if (ui.lastWaypointPointer?.key === waypointKey && now - ui.lastWaypointPointer.time < 420) {
      ui.lastWaypointPointer = null;
      transaction("Remove waypoint", () => wire.waypoints.splice(Number(waypointHandle.dataset.waypointIndex), 1));
      return;
    }
    ui.lastWaypointPointer = { key: waypointKey, time: now };
    ui.interaction = { type: "waypoint", wireId: wire.id, index: Number(waypointHandle.dataset.waypointIndex), before: snapshotProject() };
    els.svg.setPointerCapture(event.pointerId);
    return;
  }

  if (resizeHandle) {
    event.stopPropagation();
    const block = getBlock(resizeHandle.dataset.resizeId);
    ui.interaction = { type: "resize", blockId: block.id, start: point, original: { w: block.w, h: block.h }, before: snapshotProject() };
    els.svg.setPointerCapture(event.pointerId);
    return;
  }

  if (targetPort) {
    event.stopPropagation();
    const endpoint = { blockId: targetPort.dataset.blockId, portId: targetPort.dataset.portId };
    if (ui.wireDraft) {
      connectPorts(ui.wireDraft.endpoint, endpoint);
    } else {
      clearSelection();
      ui.wireDraft = { endpoint, current: point };
      render();
    }
    els.svg.setPointerCapture(event.pointerId);
    return;
  }

  if (wireHit || wireGroup) {
    event.stopPropagation();
    const wireId = wireHit?.dataset.wireId || wireGroup.dataset.wireId;
    const now = performance.now();
    if (ui.lastWirePointer?.wireId === wireId && now - ui.lastWirePointer.time < 420) {
      ui.lastWirePointer = null;
      ui.suppressWireDoubleClickUntil = now + 500;
      const wire = currentPage().wires.find((item) => item.id === wireId);
      if (wire) transaction("Add waypoint", () => addWireWaypoint(wire, point));
      return;
    }
    ui.lastWirePointer = { wireId, time: now };
    clearSelection();
    ui.selectedWireId = wireId;
    ui.wireDraft = null;
    render();
    return;
  }

  if (blockGroup) {
    event.stopPropagation();
    const blockId = blockGroup.dataset.blockId;
    const now = performance.now();
    if (ui.lastBlockPointer?.blockId === blockId && now - ui.lastBlockPointer.time < 420) {
      ui.lastBlockPointer = null;
      const block = getBlock(blockId);
      if (block?.definitionPageId) setCurrentPage(block.definitionPageId);
      return;
    }
    ui.lastBlockPointer = { blockId, time: now };
    if (event.shiftKey) {
      if (ui.selectedBlocks.has(blockId)) ui.selectedBlocks.delete(blockId);
      else ui.selectedBlocks.add(blockId);
    } else if (!ui.selectedBlocks.has(blockId)) {
      clearSelection();
      ui.selectedBlocks.add(blockId);
    }
    ui.selectedWireId = null;
    ui.wireDraft = null;
    const positions = new Map(currentPage().blocks.filter((block) => ui.selectedBlocks.has(block.id)).map((block) => [block.id, { x: block.x, y: block.y }]));
    ui.interaction = { type: "blocks", start: point, positions, before: snapshotProject(), moved: false };
    els.svg.setPointerCapture(event.pointerId);
    render();
    return;
  }

  if (event.button === 1 || ui.spaceDown) {
    event.preventDefault();
    ui.interaction = { type: "pan", startClient: { x: event.clientX, y: event.clientY }, original: { x: currentPage().view.x, y: currentPage().view.y } };
    els.svg.setPointerCapture(event.pointerId);
    return;
  }

  if (event.button !== 0) return;
  if (ui.wireDraft) {
    ui.wireDraft = null;
    render();
    return;
  }
  if (!event.shiftKey) clearSelection();
  ui.interaction = { type: "selection", start: point, current: point, additive: event.shiftKey };
  els.svg.setPointerCapture(event.pointerId);
  render();
}

function onCanvasPointerMove(event) {
  const point = screenToWorld(event.clientX, event.clientY);
  if (!ui.interaction && !ui.wireDraft) updateWireTooltip(event);
  else hideWireTooltip();
  if (ui.wireDraft && !ui.interaction) {
    ui.wireDraft.current = point;
    scheduleCanvasRender();
  }
  const interaction = ui.interaction;
  if (!interaction) return;
  if (interaction.type === "pan") {
    currentPage().view.x = interaction.original.x + event.clientX - interaction.startClient.x;
    currentPage().view.y = interaction.original.y + event.clientY - interaction.startClient.y;
    scheduleCanvasRender();
  }
  if (interaction.type === "selection") {
    interaction.current = point;
    scheduleCanvasRender();
  }
  if (interaction.type === "blocks") {
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    interaction.moved ||= Math.abs(dx) > 1 || Math.abs(dy) > 1;
    for (const [blockId, position] of interaction.positions) {
      const block = getBlock(blockId);
      if (block) { block.x = snap(position.x + dx); block.y = snap(position.y + dy); }
    }
    scheduleCanvasRender();
  }
  if (interaction.type === "resize") {
    const block = getBlock(interaction.blockId);
    if (block) {
      block.w = snap(clamp(interaction.original.w + point.x - interaction.start.x, 100, 800));
      block.h = snap(clamp(interaction.original.h + point.y - interaction.start.y, 90, 1000));
    }
    scheduleCanvasRender();
  }
  if (interaction.type === "page-port") {
    const page = currentPage();
    const targetPort = page.ports.find((item) => item.id === interaction.portId);
    if (targetPort) {
      const bounds = schematicBounds(page);
      const y = clamp(snap(point.y), bounds.y + 28, bounds.y + bounds.h - 28);
      targetPort.edgePosition = clamp((y - bounds.y) / bounds.h, .08, .92);
    }
    scheduleCanvasRender();
  }
  if (interaction.type === "waypoint") {
    const wire = currentPage().wires.find((item) => item.id === interaction.wireId);
    if (wire?.waypoints[interaction.index]) {
      wire.waypoints[interaction.index] = { x: snap(point.x), y: snap(point.y) };
      wire.routeStyle = "custom";
    }
    scheduleCanvasRender();
  }
  if (interaction.type === "segment") {
    const wire = currentPage().wires.find((item) => item.id === interaction.wireId);
    if (wire) {
      const points = interaction.points.map((item) => ({ ...item }));
      const first = points[interaction.index];
      const second = points[interaction.index + 1];
      if (first && second && interaction.orientation === "horizontal") first.y = second.y = snap(point.y);
      if (first && second && interaction.orientation === "vertical") first.x = second.x = snap(point.x);
      wire.waypoints = removeDuplicatePoints(points).slice(1, -1);
      wire.routeStyle = "custom";
    }
    scheduleCanvasRender();
  }
}

function onCanvasPointerUp(event) {
  const interaction = ui.interaction;
  const releasedOnPort = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".port");
  if (ui.wireDraft && releasedOnPort) {
    const endpoint = { blockId: releasedOnPort.dataset.blockId, portId: releasedOnPort.dataset.portId };
    if (endpoint.blockId !== ui.wireDraft.endpoint.blockId || endpoint.portId !== ui.wireDraft.endpoint.portId) connectPorts(ui.wireDraft.endpoint, endpoint);
  }
  if (!interaction) return;
  if (interaction.type === "selection") {
    const left = Math.min(interaction.start.x, interaction.current.x);
    const right = Math.max(interaction.start.x, interaction.current.x);
    const top = Math.min(interaction.start.y, interaction.current.y);
    const bottom = Math.max(interaction.start.y, interaction.current.y);
    if (!interaction.additive) ui.selectedBlocks.clear();
    if (right - left > 3 || bottom - top > 3) {
      currentPage().blocks.forEach((block) => {
        if (block.x < right && block.x + block.w > left && block.y < bottom && block.y + block.h > top) ui.selectedBlocks.add(block.id);
      });
    }
  }
  if (["blocks", "resize", "waypoint", "segment", "page-port"].includes(interaction.type) && snapshotProject() !== interaction.before) {
    recordBefore(interaction.before);
    markChanged();
  }
  if (interaction.type === "pan") markChanged();
  ui.interaction = null;
  try { els.svg.releasePointerCapture(event.pointerId); } catch { /* Pointer capture may already be released. */ }
  render();
}

function onCanvasDoubleClick(event) {
  const waypointHandle = event.target.closest?.(".waypoint");
  if (waypointHandle) {
    event.stopPropagation();
    const wire = currentPage().wires.find((item) => item.id === waypointHandle.dataset.wireId);
    if (wire) transaction("Remove waypoint", () => wire.waypoints.splice(Number(waypointHandle.dataset.waypointIndex), 1));
    return;
  }
  const wireHit = event.target.closest?.(".wire-hit");
  if (wireHit) {
    if (performance.now() < ui.suppressWireDoubleClickUntil) return;
    const wire = currentPage().wires.find((item) => item.id === wireHit.dataset.wireId);
    if (wire) transaction("Add waypoint", () => addWireWaypoint(wire, screenToWorld(event.clientX, event.clientY)));
    return;
  }
  const blockGroup = event.target.closest?.(".block");
  const block = blockGroup ? getBlock(blockGroup.dataset.blockId) : null;
  if (block?.definitionPageId) setCurrentPage(block.definitionPageId);
}

function handleKeyboard(event) {
  const editing = event.target.closest?.("input, textarea, select, [contenteditable='true']");
  if (event.code === "Space" && !editing) { ui.spaceDown = true; event.preventDefault(); }
  if (editing) return;
  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
  if (command && event.key.toLowerCase() === "c") { event.preventDefault(); copySelection(); }
  if (command && event.key.toLowerCase() === "v") { event.preventDefault(); pasteSelection(); }
  if (command && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelection(); }
  if (["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); deleteSelection(); }
  if (event.key === "Escape") { ui.wireDraft = null; ui.interaction = null; render(); }
  if (event.key.toLowerCase() === "f" && !command) { event.preventDefault(); fitView(); }
  if (["+", "="].includes(event.key)) { event.preventDefault(); handleAction("zoom-in"); }
  if (event.key === "-") { event.preventDefault(); handleAction("zoom-out"); }
}

function handleWheel(event) {
  event.preventDefault();
  const page = currentPage();
  if (event.ctrlKey || event.metaKey) {
    const factor = Math.exp(-event.deltaY * 0.003);
    zoomAt(event.clientX, event.clientY, page.view.zoom * factor);
  } else {
    page.view.x -= event.deltaX;
    page.view.y -= event.deltaY;
    markChanged();
    scheduleCanvasRender();
  }
}

function handleMinimapPointer(event) {
  const map = ui.minimapMap;
  if (!map) return;
  const rect = els.minimap.getBoundingClientRect();
  const worldX = ((event.clientX - rect.left) * map.width / rect.width - map.offsetX) / map.scale;
  const worldY = ((event.clientY - rect.top) * map.height / rect.height - map.offsetY) / map.scale;
  const canvasRect = els.canvasWrap.getBoundingClientRect();
  currentPage().view.x = canvasRect.width / 2 - worldX * currentPage().view.zoom;
  currentPage().view.y = canvasRect.height / 2 - worldY * currentPage().view.zoom;
  markChanged();
  scheduleCanvasRender();
}

function initializeEvents() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#page-action-menu") && !event.target.closest("[data-page-menu]")) closePageActions();
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action && !event.target.closest("#inspector")) handleAction(action);
    const toggle = event.target.closest("[data-toggle]");
    if (toggle) {
      const key = toggle.dataset.toggle;
      ui[key] = !ui[key];
      toggle.classList.toggle("is-active", ui[key]);
      toggle.setAttribute("aria-pressed", String(ui[key]));
      render();
    }
    const tab = event.target.closest("[data-tab]")?.dataset.tab;
    if (tab) {
      ui.activeTab = tab;
      document.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tab)));
      document.querySelector("#pages-panel").hidden = tab !== "pages";
      document.querySelector("#parts-panel").hidden = tab !== "parts";
    }
    if (event.target.closest("[data-open-parts]")) document.querySelector("[data-tab='parts']").click();
    const arrange = event.target.closest("[data-arrange]")?.dataset.arrange;
    if (arrange) arrangeSelection(arrange);
  });

  els.pageTree.addEventListener("click", (event) => {
    const toggleId = event.target.closest("[data-page-toggle]")?.dataset.pageToggle;
    if (toggleId) { ui.expandedPages.has(toggleId) ? ui.expandedPages.delete(toggleId) : ui.expandedPages.add(toggleId); renderPageTree(); return; }
    const placeId = event.target.closest("[data-page-place]")?.dataset.pagePlace;
    if (placeId) return placePageBlock(placeId);
    const menuButton = event.target.closest("[data-page-menu]");
    if (menuButton) return openPageActions(menuButton.dataset.pageMenu, menuButton);
    const row = event.target.closest("[data-page-id]");
    if (row) setCurrentPage(row.dataset.pageId);
  });
  els.pageTree.addEventListener("keydown", (event) => { if (event.key === "Enter") setCurrentPage(event.target.closest("[data-page-id]")?.dataset.pageId); });
  els.pageTree.addEventListener("dragstart", (event) => { const pageId = event.target.closest("[data-page-id]")?.dataset.pageId; if (pageId) event.dataTransfer.setData("application/x-schematic-page", pageId); });
  els.partsLibrary.addEventListener("click", (event) => { const type = event.target.closest("[data-part-type]")?.dataset.partType; if (type) placePart(type); });
  els.partsLibrary.addEventListener("dragstart", (event) => { const type = event.target.closest("[data-part-type]")?.dataset.partType; if (type) event.dataTransfer.setData("application/x-schematic-part", type); });
  els.partsSearch.addEventListener("input", renderPartsLibrary);
  els.breadcrumbs.addEventListener("click", (event) => { const pageId = event.target.closest("[data-open-page]")?.dataset.openPage; if (pageId) setCurrentPage(pageId); });
  els.pageActionMenu.addEventListener("click", handlePageActionMenuClick);
  els.pageActionMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePageActions({ restoreFocus: true });
    }
    if (event.key === "Enter" && event.target.id === "page-menu-name") {
      event.preventDefault();
      els.pageActionMenu.querySelector("[data-page-menu-command='rename-save']")?.click();
    }
  });
  document.querySelector("#pages-panel").addEventListener("scroll", () => closePageActions());

  els.canvasWrap.addEventListener("dragover", (event) => event.preventDefault());
  els.canvasWrap.addEventListener("drop", (event) => {
    event.preventDefault();
    const point = screenToWorld(event.clientX, event.clientY);
    const pageId = event.dataTransfer.getData("application/x-schematic-page");
    const partType = event.dataTransfer.getData("application/x-schematic-part");
    if (pageId) placePageBlock(pageId, point);
    if (partType) placePart(partType, point);
  });
  els.canvasWrap.addEventListener("wheel", handleWheel, { passive: false });
  els.svg.addEventListener("pointerdown", onCanvasPointerDown);
  els.svg.addEventListener("pointermove", onCanvasPointerMove);
  els.svg.addEventListener("pointerup", onCanvasPointerUp);
  els.svg.addEventListener("pointercancel", onCanvasPointerUp);
  els.svg.addEventListener("dblclick", onCanvasDoubleClick);
  els.svg.addEventListener("pointerleave", hideWireTooltip);

  document.querySelectorAll("[data-resize-panel]").forEach((resizer) => {
    resizer.addEventListener("pointerdown", beginPanelResize);
    resizer.addEventListener("pointermove", updatePanelResize);
    resizer.addEventListener("pointerup", endPanelResize);
    resizer.addEventListener("pointercancel", endPanelResize);
    resizer.addEventListener("keydown", handlePanelResizerKey);
    resizer.addEventListener("dblclick", () => {
      const side = resizer.dataset.resizePanel;
      panelPrefs[`${side}Width`] = side === "left" ? 252 : 286;
      savePanelPrefs();
      applyPanelPrefs();
    });
  });

  els.inspector.addEventListener("change", handleInspectorChange);
  els.inspector.addEventListener("input", (event) => {
    if (event.target.dataset.field !== "wire-width") return;
    const selectedWireId = ui.selectedWireId;
    const value = event.target.value;
    clearTimeout(ui.inspectorInputTimer);
    ui.inspectorInputTimer = setTimeout(() => {
      const wire = currentPage().wires.find((item) => item.id === selectedWireId);
      if (!wire) return;
      transaction("Change wire width", () => {
        wire.width = clamp(Number(value) || 1, 1, 64);
        if (wire.width > 1 && wire.signalType === "logic") wire.signalType = "bus";
      });
    }, 180);
  });
  els.inspector.addEventListener("click", handleInspectorClick);
  els.projectFile.addEventListener("change", async () => {
    const file = els.projectFile.files[0];
    if (!file) return;
    try {
      const loaded = JSON.parse(await file.text());
      if (!validProject(loaded)) throw new Error("Unsupported project schema or version.");
      recordBefore(snapshotProject());
      project = normalizeProject(loaded);
      clearSelection();
      ui.wireDraft = null;
      markChanged();
      render();
      toast(`Loaded ${file.name}`);
    } catch (error) {
      toast(error.message || "Project could not be loaded.", "error");
    } finally {
      els.projectFile.value = "";
    }
  });
  els.minimap.addEventListener("pointerdown", (event) => { handleMinimapPointer(event); els.minimap.setPointerCapture(event.pointerId); });
  els.minimap.addEventListener("pointermove", (event) => { if (els.minimap.hasPointerCapture(event.pointerId)) handleMinimapPointer(event); });
  document.addEventListener("keydown", handleKeyboard);
  document.addEventListener("keyup", (event) => { if (event.code === "Space") ui.spaceDown = false; });
  window.addEventListener("blur", () => { ui.spaceDown = false; });
  window.addEventListener("resize", () => { closePageActions(); scheduleCanvasRender(); });
  document.querySelector("[data-close-dialog]").addEventListener("click", () => els.validationDialog.close());
  els.validationDialog.addEventListener("click", (event) => { if (event.target === els.validationDialog) els.validationDialog.close(); });
}

initializeEvents();
applyPanelPrefs({ resizeCanvas: false });
render();
requestAnimationFrame(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    fitView();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }
});
