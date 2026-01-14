# Repository Guidelines

## Project Structure & Module Organization
This repository is a collection of static web pages and small web apps. Key locations:
- Root: standalone HTML pages like `index.html`, `ai-hub.html`, and `stock.html`, plus shared `style.css` and `app.js`.
- `assets/`: shared images, audio, and built bundles used across pages.
- `androidtest/`: Vue 3 + Vite source for an Android WebView demo; build output lives in `dist-androidtest/`, and the Herd entry page is `androidtest.html`.
- `sox/`: a Three.js FPS prototype with a simple Node dev server.
- Other mini-apps: `hellrider/`, `mini-minecraft/`, `earthmoonsystem/`, `blackhole/`, etc., each mostly self-contained HTML/CSS/JS.

## Build, Test, and Development Commands
Most pages are static and can be opened directly in a browser. For subprojects:
- `cd androidtest && npm install` to install dependencies.
- `cd androidtest && npm run dev` to run the Vite dev server.
- `cd androidtest && npm run build` to build into `dist-androidtest/`.
- `cd androidtest && npm run preview` to preview the build.
- `cd sox && npm install && npm run start` to run the Node server (`server.js`).

## Coding Style & Naming Conventions
- Indentation: 2 spaces in CSS/JS/Vue (follow existing files).
- Filenames: use kebab-case for HTML (`selfiecat_tickets.html`) and lowercase for assets.
- Keep JavaScript minimal in root pages; prefer linking shared styles via `style.css`.
- No repo-wide formatter is configured; keep edits consistent with nearby code.

## Testing Guidelines
There is no automated test suite in this repo. When changing interactive pages, verify manually in a browser and, for `androidtest/`, confirm the built output loads via `androidtest.html`.

## Commit & Pull Request Guidelines
Commit history mixes concise English and Chinese messages and favors present-tense summaries (e.g., “fix url”, “update UI”). Use a short, descriptive subject line.
PRs should include:
- A clear description of the affected page/app.
- Screenshots or screen recordings for UI changes.
- Notes about any build steps run (e.g., `androidtest` rebuild).

## Security & Configuration Tips
- Avoid committing secrets; none are expected in this repo.
- For Herd development, see `androidtest/HERD_SETUP.md` for local URLs and Android WebView integration notes.
