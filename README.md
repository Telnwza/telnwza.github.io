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

- Automata Studio: DFA, NFA, lambda-NFA, PDA, and Turing Machine creation and simulation, including an exact two-way Set-style / equation-style Regular Expression converter, output as a minimal DFA, compact lambda-free NFA, or Thompson lambda-NFA, DFA/NFA generation from transition equations, exact language-equivalence checking with shortest counterexamples, and randomized DFA/NFA practice in both diagram-to-Regex and equation-to-diagram directions.
- Vector Addition Visualizer: 2D and 3D vector addition, resultant vectors, magnitude, ordering, import/export, and local browser saving.
- Logic Gates Lab: drag-and-drop combinational circuits, live signal simulation, circuit-to-truth-table analysis, Boolean equation parsing and minimization, truth-table-to-circuit synthesis, presets, autosave, and JSON/image/table export.

## Logic Gates Lab Tests

Run the pure logic-engine tests with Node.js:

```sh
node --test logic-gates/logic-engine.test.js
```

The tests cover circuit evaluation, truth-table generation, Boolean minimization, equation parsing, and combinational-loop detection.

## Automata Equation Tests

Run the Regular Expression and transition-equation parser tests with Node.js:

```sh
node --test automata/automata-equation.test.js
```

The tests cover classroom and legacy Regular Expression notation, lambda spellings, Thompson lambda-NFA generation, compact position-NFA construction, subset construction, minimal DFA generation, language equivalence, syntax errors, DFA/NFA transition definitions, parallel-transition merging, and automatic state layout.

### Regex Notation Converter and Practice Lab

- Enter either Set-style notation such as `{ab*,bb}*` or equation notation such as `(a.b* + b.b)*`; both fields can generate a DFA/NFA directly.
- Conversion is exact and bidirectional. Braces plus commas express union in Set-style notation, while `+` expresses union in the equation field.
- Practice Lab can show a DFA/NFA diagram for a Regex answer, or show a Regex in either classroom style for the learner to draw on the main canvas.
- Answers are checked by exact language equivalence rather than visual shape. A mismatch reports the shortest counterexample.
- The Automata canvas supports cursor-centered zoom, trackpad/mouse-wheel panning, Space-drag panning, content-aware Fit, optional grid snapping, marquee/Shift multi-selection, group dragging, keyboard nudging, and copy/paste/duplicate.
- Drag the transition handle on the right side of a state to another state for a live transition preview. Selection quick actions provide Initial/Final toggles, alignment, duplication, and deletion.
- Automata Studio includes Light, Dark, and System themes with persisted preference and reduced-motion support.
- A visible Dark/Light button sits in the main toolbar. The tool rail, settings drawer, and right-side analysis drawer are resizable on desktop, and their sizes persist locally.
- DFA/NFA Simulation supports animated Run, one-symbol-at-a-time Step, live state/transition highlighting, current configuration, an execution trace, and Reset.

### Check a Drawn Automaton Against a Regex

1. Open Automata Studio and choose DFA or NFA.
2. Draw the states and transitions, then mark exactly one Initial state and any Final states.
3. Open the `ตรวจ Regex` analysis tab.
4. Enter a Regular Expression such as `{0,1}*.0.1`.
5. Select `ตรวจคำตอบ`.

The checker proves equivalence over all strings. When the languages differ, it reports the shortest counterexample and whether the drawn automaton and the Regular Expression accept or reject it.

### Classroom Regular Expression Notation

- `{a,b}` means `a` or `b`.
- `a U b` and `a ∪ b` are also accepted as union; use `\U` for a literal uppercase U.
- `a.b` and `ab` both mean `a` followed by `b`.
- `a^5` means exactly five repetitions of `a`; fixed exponents from 0 through 40 are supported.
- `a*` means zero or more repetitions.
- `λ`, `lambda`, and `lamda` mean the empty word.
- Legacy notation such as `(a|b)`, `ε`, `epsilon`, and `eps` remains supported.

For example, `{a,b.a*.{a,b}.a}*` is accepted as the classroom-style equivalent of `(a*|ba*(a|b)a)*`.

All three simulators share a focus-first shell with an auto-hiding top bar, collapsible tool/analysis panels, Focus Mode, progressive disclosure for advanced controls, and consistent shortcuts.

## Planned Tools

- Embedded Systems visualizers
- Programming and algorithm visualizers

## Notes

The navigation includes a generic GitHub link. Replace it with the actual repository URL after the project is published.
