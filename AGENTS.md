# Repository Guidelines

## Project Structure & Module Organization
This repository mixes a Next.js site with legacy static pages and a few standalone demos. Key locations:
- `src/app`, `src/components`, `src/lib`: the main Next.js site, admin UI, and shared logic.
- `showcase/<project>/`: source projects for standalone demos and AI experiments.
- `public/showcase/<project>/`: deployable showcase output and static-only demos.
- `public/`: main-site assets and remaining legacy pages.

## Build, Test, and Development Commands
Most legacy pages are static and can be opened directly in a browser. Common commands:
- `npm run dev` to run the main Next.js site.
- `npm run build:androidtest` to build the Android WebView demo into `public/showcase/androidtest/`.
- `npm run sync:static` to sync standalone static app sources (currently `sox/`) into `public/`.
- `npm run build:standalone` to refresh all standalone app outputs before deployment.
- `cd showcase/androidtest && npm run dev` to run the Vite dev server for the Android demo.
- `cd showcase/sox && npm install && npm run start` to run the Node server (`server.js`).

## Coding Style & Naming Conventions
- Indentation: 2 spaces in CSS/JS/Vue (follow existing files).
- Filenames: use kebab-case for HTML (`selfiecat_tickets.html`) and lowercase for assets.
- Keep JavaScript minimal in root pages; prefer linking shared styles via `style.css`.
- No repo-wide formatter is configured; keep edits consistent with nearby code.

## Testing Guidelines
When changing interactive pages, verify manually in a browser. For `androidtest/`, confirm `public/showcase/androidtest/` is refreshed and loads correctly.

## Commit & Pull Request Guidelines
Commit history mixes concise English and Chinese messages and favors present-tense summaries (e.g., “fix url”, “update UI”). Use a short, descriptive subject line.
PRs should include:
- A clear description of the affected page/app.
- Screenshots or screen recordings for UI changes.
- Notes about any build steps run (e.g., `androidtest` rebuild).

## Security & Configuration Tips
- Avoid committing secrets; none are expected in this repo.
- For Herd development, see `showcase/androidtest/HERD_SETUP.md` for local URLs and Android WebView integration notes.
