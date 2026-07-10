const categories = [
  "All",
  "Mathematics",
  "Digital Systems",
  "Automata",
  "Embedded Systems",
  "Programming",
];

const tools = [
  {
    title: "Automata Studio",
    description: "Create and simulate DFA, NFA, PDA, and Turing Machines.",
    category: "Automata",
    path: "./automata/",
    tags: ["DFA", "NFA", "PDA", "Turing Machine", "Simulation"],
    status: "available",
    recentlyAdded: true,
  },
  {
    title: "Vector Addition Visualizer",
    description: "Explore 2D and 3D vector addition, resultant vectors, magnitude, and head-to-tail geometry.",
    category: "Mathematics",
    path: "./vectors/",
    tags: ["Vectors", "2D", "3D", "Resultant", "Geometry"],
    status: "available",
    recentlyAdded: true,
  },
  {
    title: "Logic Gates Lab",
    description: "Build and simulate digital circuits, inspect truth tables, simplify Boolean equations, and synthesize gates from a truth table.",
    category: "Digital Systems",
    path: "./logic-gates/",
    tags: ["Logic Gates", "Truth Tables", "Boolean Algebra", "Circuits"],
    status: "available",
    recentlyAdded: true,
  },
];

const state = {
  query: "",
  category: "All",
};

const els = {
  search: document.querySelector("#tool-search"),
  filters: document.querySelector("#category-filters"),
  toolsGrid: document.querySelector("#tools-grid"),
  recentTools: document.querySelector("#recent-tools"),
  count: document.querySelector("#tool-count"),
  empty: document.querySelector("#empty-state"),
};

function normalize(value) {
  return value.toLowerCase().trim();
}

function statusLabel(status) {
  return status === "available" ? "Available" : "Coming Soon";
}

function toolMatches(tool) {
  const query = normalize(state.query);
  const inCategory = state.category === "All" || tool.category === state.category;
  const searchable = normalize([
    tool.title,
    tool.description,
    tool.category,
    tool.status,
    ...tool.tags,
  ].join(" "));

  return inCategory && (!query || searchable.includes(query));
}

function renderTags(tags) {
  return tags.map((tag) => `<li class="tag">${tag}</li>`).join("");
}

function renderCard(tool) {
  const availableClass = tool.status === "available" ? " available" : "";

  return `
    <article class="tool-card">
      <div class="card-topline">
        <span class="category-pill">${tool.category}</span>
        <span class="status-pill${availableClass}">${statusLabel(tool.status)}</span>
      </div>
      <div>
        <h3>${tool.title}</h3>
        <p class="card-description">${tool.description}</p>
      </div>
      <ul class="tag-list" aria-label="${tool.title} tags">
        ${renderTags(tool.tags)}
      </ul>
      <a class="tool-link" href="${tool.path}">Open Tool</a>
    </article>
  `;
}

function renderFilters() {
  els.filters.innerHTML = categories.map((category) => `
    <button class="filter-button" type="button" data-category="${category}" aria-pressed="${category === state.category}">
      ${category}
    </button>
  `).join("");

  els.filters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    });
  });
}

function renderToolGrid() {
  const filtered = tools.filter(toolMatches);
  els.toolsGrid.innerHTML = filtered.map(renderCard).join("");
  els.count.textContent = `${filtered.length} of ${tools.length} tools shown`;
  els.empty.hidden = filtered.length > 0;
}

function renderRecentlyAdded() {
  const recent = tools.filter((tool) => tool.recentlyAdded);
  els.recentTools.innerHTML = recent.length
    ? recent.map(renderCard).join("")
    : '<p class="empty-state">No recently added tools yet.</p>';
}

function render() {
  renderFilters();
  renderToolGrid();
  renderRecentlyAdded();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderToolGrid();
});

render();
