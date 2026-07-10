# Visual Learning Tools

Visual Learning Tools is a static website for interactive Computer Engineering learning visualizers. It uses only HTML, CSS, and JavaScript, requires no backend, and is designed to deploy directly with GitHub Pages.

## Folder Structure

```text
visual-learning/
├── index.html
├── css/
│   ├── style.css
│   └── simulator-shell.css
├── js/
│   ├── main.js
│   └── simulator-shell.js
├── assets/
├── automata/
│   └── index.html
├── vectors/
│   └── index.html
└── logic-gates/
    ├── index.html
    ├── style.css
    ├── logic-engine.js
    ├── logic-engine.test.js
    └── app.js
```

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static file server:

```sh
cd visual-learning
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy With GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open the repository settings.
3. Go to **Pages**.
4. Set the source to the branch and folder that contains `index.html`.
5. Save the settings and open the generated Pages URL.

The site uses relative links so it works at URLs such as:

```text
https://username.github.io/repository-name/
```

An optional `scripts/build-sites-worker.mjs` build packages the same static files into a self-contained worker for OpenAI Sites deployment. It does not change the GitHub Pages workflow.

## Add a New Visualizer

1. Create a new folder at the site root, for example `cpu-scheduler/`.
2. Add the visualizer page as `cpu-scheduler/index.html`.
3. Link shared styles with a relative path such as `../css/style.css`.
4. Add navigation links using relative paths.
5. Add a new tool card object in `js/main.js`.

## Add a New Card to `main.js`

Add an object to the `tools` array:

```js
{
  title: "CPU Scheduler",
  description: "Compare scheduling algorithms with interactive timelines.",
  category: "Programming",
  path: "./cpu-scheduler/",
  tags: ["Scheduling", "Operating Systems", "Algorithms"],
  status: "available",
  recentlyAdded: true,
}
```

Categories are defined in the `categories` array in `js/main.js`. Add new categories there if needed.

## Relative Path Rules

Use relative paths only. Do not use paths that start with `/`.

Examples:

```html
<!-- From the root dashboard -->
<a href="./automata/">Automata Studio</a>

<!-- From a visualizer folder -->
<a href="../">Back to dashboard</a>
<link rel="stylesheet" href="../css/style.css">
```

This keeps the site compatible with GitHub Pages project URLs and direct browser opening.

## Current Available Tools

- Automata Studio: DFA, NFA, epsilon-NFA, PDA, and Turing Machine creation and simulation.
- Vector Addition Visualizer: 2D and 3D vector addition, resultant vectors, magnitude, ordering, import/export, and local browser saving.
- Logic Gates Lab: drag-and-drop combinational circuits, live signal simulation, circuit-to-truth-table analysis, Boolean equation parsing and minimization, truth-table-to-circuit synthesis, presets, autosave, and JSON/image/table export.

## Logic Gates Lab Tests

Run the pure logic-engine tests with Node.js:

```sh
node --test logic-gates/logic-engine.test.js
```

The tests cover circuit evaluation, truth-table generation, Boolean minimization, equation parsing, and combinational-loop detection.

All three simulators share a focus-first shell with an auto-hiding top bar, collapsible tool/analysis panels, Focus Mode, progressive disclosure for advanced controls, and consistent shortcuts.

## Planned Tools

- Embedded Systems visualizers
- Programming and algorithm visualizers

## Notes

The navigation includes a generic GitHub link. Replace it with the actual repository URL after the project is published.
