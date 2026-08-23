import fs from "node:fs";
import path from "node:path";

const [sourceArg, destinationArg] = process.argv.slice(2);

if (!sourceArg) {
  console.error("Usage: node scripts/fix-lab4ing-project.mjs <source.json> [destination.json]");
  process.exit(1);
}

const source = path.resolve(sourceArg);
const destination = path.resolve(
  destinationArg || path.join(process.cwd(), "lab4ing.fixed.schproj.json"),
);
const document = JSON.parse(fs.readFileSync(source, "utf8"));
const project = document.project;

if (!project?.schematics) {
  throw new Error("Invalid Schematic Studio project: project.schematics is missing");
}

const schematics = project.schematics;

function sanitizeIdentifier(value) {
  let identifier = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!identifier) identifier = "net";
  if (/^[0-9]/.test(identifier)) identifier = `n_${identifier}`;
  return identifier;
}

function schematicPortIds(schematic) {
  const used = new Set();
  const components = [
    ...schematic.components.filter((component) => component.type === "IN"),
    ...schematic.components.filter((component) => component.type === "OUT"),
  ];

  return components.map((component) => {
    const base = sanitizeIdentifier(component.params?.name || "net");
    let id = base;
    let suffix = 1;
    while (used.has(id)) id = `${base}_${suffix++}`;
    used.add(id);
    return { componentId: component.id, id };
  });
}

function rewriteInstancePorts(schematicId, oldPorts, newPorts) {
  const portMap = new Map(
    oldPorts.map((oldPort) => {
      const newPort = newPorts.find(
        (candidate) => candidate.componentId === oldPort.componentId,
      );
      return [oldPort.id, newPort.id];
    }),
  );

  for (const schematic of Object.values(schematics)) {
    const instanceIds = new Set(
      schematic.components
        .filter((component) => component.type === `SCH:${schematicId}`)
        .map((component) => component.id),
    );

    for (const wire of schematic.wires) {
      for (const endpointName of ["from", "to"]) {
        const endpoint = wire[endpointName];
        if (instanceIds.has(endpoint.cid) && portMap.has(endpoint.pid)) {
          endpoint.pid = portMap.get(endpoint.pid);
        }
      }
    }
  }
}

function renameIo(schematicId, renames) {
  const schematic = schematics[schematicId];
  if (!schematic) throw new Error(`Missing schematic ${schematicId}`);

  const oldPorts = schematicPortIds(schematic);
  for (const component of schematic.components) {
    if (component.type !== "IN" && component.type !== "OUT") continue;
    const key = `${component.type}:${component.params.name}`;
    if (renames[key]) component.params.name = renames[key];
  }
  const newPorts = schematicPortIds(schematic);
  rewriteInstancePorts(schematicId, oldPorts, newPorts);
}

function numberedRenames(type, oldRoot, newRoot, highestIndex) {
  const renames = {};
  for (let index = 0; index <= highestIndex; index += 1) {
    const oldName = index === 0 ? oldRoot : `${oldRoot}_${index}`;
    renames[`${type}:${oldName}`] = `${newRoot}${index}`;
  }
  return renames;
}

// Make numeric significance explicit: bit 0 is LSB and the largest index is MSB.
renameIo("sch2057", {
  ...numberedRenames("IN", "a", "a", 7),
  ...numberedRenames("IN", "b", "b", 7),
  ...numberedRenames("OUT", "bit", "sum", 8),
});

renameIo("sch2215", {
  ...numberedRenames("IN", "a", "a", 7),
  ...numberedRenames("IN", "b", "b", 7),
  "OUT:out_s": "seg_a",
  "OUT:out_s_1": "seg_b",
  "OUT:out_s_2": "seg_c",
  "OUT:out_s_3": "seg_d",
  "OUT:out_s_4": "seg_e",
  "OUT:out_s_5": "seg_f",
  "OUT:out_s_6": "seg_g",
  "OUT:a": "digit0",
  "OUT:a_1": "digit1",
  "OUT:a_2": "digit2",
  "OUT:a_3": "digit3",
});

renameIo("sch701", {
  "OUT:a0": "digit0",
  "OUT:a1": "digit1",
  "OUT:a2": "digit2",
  "OUT:a3": "digit3",
});

renameIo("sch1719", {
  "OUT:d_0": "count0",
  "OUT:d_1": "count1",
  "OUT:d_2": "count2",
  "OUT:d_3": "count3",
});

renameIo("sch2467", {
  "IN:b1": "sel0",
  "IN:b2": "sel1",
  "OUT:d1": "digit0",
  "OUT:d2": "digit1",
  "OUT:d3": "digit2",
  "OUT:d4": "digit3",
});

function wireById(schematic, wireId) {
  const wire = schematic.wires.find((candidate) => candidate.id === wireId);
  if (!wire) throw new Error(`Missing wire ${wireId} in ${schematic.name}`);
  return wire;
}

// Repair the 4-bit counter. The first external clock was connected to K while
// CLK was tied high. For an up-counting rising-edge ripple counter, subsequent
// stages clock from Q-bar and the visible count comes from Q.
const counter = schematics.sch1719;
wireById(counter, "w2367").to.pid = "clk";
wireById(counter, "w2372").to.pid = "k";
for (const wireId of ["w2388", "w2391", "w2412"]) {
  wireById(counter, wireId).from.pid = "qn";
}
for (const wireId of ["w2413", "w2414", "w2415", "w2416"]) {
  wireById(counter, wireId).from.pid = "q";
}

function nextId(prefix) {
  const ids = [];
  for (const schematic of Object.values(schematics)) {
    ids.push(...schematic.components.map((component) => component.id));
    ids.push(...schematic.wires.map((wire) => wire.id));
  }
  let next = Math.max(
    0,
    ...ids
      .map((id) => new RegExp(`^${prefix}(\\d+)$`).exec(id))
      .filter(Boolean)
      .map((match) => Number(match[1])),
  ) + 1;
  return () => `${prefix}${next++}`;
}

// Segment f is active-low. The original sum-of-products omitted input 0111,
// so hexadecimal 7 incorrectly lit the upper-left segment. Add the missing
// d0*d1*d2*~d3 minterm to the existing OR gate.
const sevenSegment = schematics.sch701;
const newComponentId = nextId("c")();
const newWireId = nextId("w");
sevenSegment.components.push({
  id: newComponentId,
  type: "AND",
  x: 935,
  y: -407,
  params: { inputs: 4 },
  label: "",
});

const segmentFOr = sevenSegment.components.find(
  (component) => component.id === "c1642",
);
if (!segmentFOr || segmentFOr.type !== "OR") {
  throw new Error("Could not locate the segment-f OR gate (c1642)");
}
segmentFOr.params.inputs = 4;

const mintermSources = [
  ["c1638", "j"], // d0
  ["c1663", "j"], // d1
  ["c1596", "j"], // d2
  ["c1592", "j"], // ~d3
];
mintermSources.forEach(([cid, pid], index) => {
  sevenSegment.wires.push({
    id: newWireId(),
    from: { cid, pid },
    to: { cid: newComponentId, pid: `i${index}` },
    name: "",
  });
});
sevenSegment.wires.push({
  id: newWireId(),
  from: { cid: newComponentId, pid: "o" },
  to: { cid: "c1642", pid: "i3" },
  name: "",
});

fs.writeFileSync(destination, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(destination);
