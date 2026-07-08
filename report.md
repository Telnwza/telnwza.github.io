# Visual Learning Tools Report

## What Was Created

This project was organized as a static website that collects multiple interactive learning visualizers for Computer Engineering topics. It uses only HTML, CSS, and JavaScript, so it can run locally in a browser and deploy directly with GitHub Pages.

## Current Project Structure

```text
visual-learning/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
├── automata/
│   └── index.html
├── vectors/
│   └── index.html
├── logic-gates/
│   └── index.html
├── README.md
├── report.md
└── .gitignore
```

## Work Completed

1. Created the main dashboard page at `index.html`.
2. Added a dark theme shared stylesheet at `css/style.css`.
3. Added dashboard logic at `js/main.js`.
4. Moved `automata_studio_dark.html` into `automata/index.html`.
5. Copied `vector_addition_visualizer_v3.html` into `vectors/index.html`.
6. Created a placeholder page for `logic-gates/index.html`.
7. Added shared navigation to the dashboard and visualizer pages.
8. Added search and category filtering on the dashboard.
9. Added a Recently Added section.
10. Added `README.md` with project instructions.
11. Added `.gitignore` for common local, OS, and editor files.
12. Checked JavaScript syntax and static routes.

## Available Visualizers

- Automata Studio
- Vector Addition Visualizer

## Planned Visualizers

- Logic Gates Lab
- Embedded Systems visualizers
- Programming visualizers
- More Mathematics visualizers

## How To Use Locally

Open the project folder:

```sh
cd visual-learning
```

Option 1: Open directly in a browser:

```text
index.html
```

Option 2: Run a local static server:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How The Dashboard Works

The dashboard page is `index.html`.

The visualizer card data is stored in `js/main.js` inside the `tools` array:

```js
const tools = [
  {
    title: "Automata Studio",
    description: "Create and simulate DFA, NFA, PDA, and Turing Machines.",
    category: "Automata",
    path: "./automata/",
    tags: ["DFA", "NFA", "PDA", "Turing Machine", "Simulation"],
    status: "available",
    recentlyAdded: true,
  }
];
```

The dashboard automatically renders cards from this array. Search and category filtering are handled in the same file.

## How To Add A New Visualizer

Create a new folder for the visualizer:

```sh
mkdir my-new-tool
```

Create an `index.html` file inside it:

```text
my-new-tool/index.html
```

Use relative paths for shared files:

```html
<link rel="stylesheet" href="../css/style.css">
<a href="../">Back to dashboard</a>
<a href="../#tools">Tools</a>
```

Do not use root-relative paths like:

```html
<a href="/automata/">
```

Root-relative paths can break on GitHub Pages project URLs.

## How To Add A New Dashboard Card

Open:

```text
js/main.js
```

Add a new object to the `tools` array:

```js
{
  title: "Logic Gates Lab",
  description: "Build digital circuits from gates and inspect truth tables interactively.",
  category: "Digital Systems",
  path: "./logic-gates/",
  tags: ["Logic Gates", "Truth Tables", "Circuits"],
  status: "available",
  recentlyAdded: true,
}
```

Supported current categories:

```js
[
  "Mathematics",
  "Digital Systems",
  "Automata",
  "Embedded Systems",
  "Programming"
]
```

If you need a new category, add it to the `categories` array in `js/main.js`.

## How To Push To GitHub

If `visual-learning` should be its own GitHub repository, run these commands from inside the folder:

```sh
cd visual-learning
git init
git add .
git commit -m "Create visual learning tools static site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace:

```text
YOUR-USERNAME
YOUR-REPOSITORY
```

with your real GitHub username and repository name.

## How To Deploy With GitHub Pages

1. Push the project to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings`.
4. Go to `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select branch `main`.
7. Select folder `/root`.
8. Click `Save`.

GitHub will publish the site at a URL similar to:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## Important GitHub Pages Path Rule

Always use relative paths:

```html
<a href="./automata/">Automata Studio</a>
<a href="../">Back to dashboard</a>
<script src="./js/main.js"></script>
<link rel="stylesheet" href="./css/style.css">
```

Avoid absolute paths beginning with `/`:

```html
<a href="/automata/">
<script src="/js/main.js"></script>
```

This project must work at:

```text
https://username.github.io/repository-name/
```

not only at:

```text
https://username.github.io/
```

## Testing Done

The following checks were run:

- Dashboard JavaScript syntax check.
- Automata Studio embedded JavaScript syntax check.
- Vector Visualizer embedded JavaScript syntax check.
- Search for broken root-relative paths.
- Local HTTP route check for dashboard and visualizer routes.

Checked routes included:

```text
/
/automata/
/vectors/
/logic-gates/
/css/style.css
/js/main.js
```

## Known Limitations

- The GitHub navigation link currently points to `https://github.com/`. Replace it with the real repository URL after creating the GitHub repository.
- `logic-gates/index.html` is currently a placeholder.
- No backend exists, by design.
- No build step exists, by design.
- Browser-based visual testing was not automated with Playwright or Puppeteer because those tools were not installed.

## Recommended Next Steps

1. Create a GitHub repository.
2. Push the `visual-learning` folder as the repository content.
3. Replace the generic GitHub links with the actual repository URL.
4. Enable GitHub Pages.
5. Add the real Logic Gates visualizer.
6. Continue adding visualizers as separate folders.
7. Keep all links relative for GitHub Pages compatibility.
