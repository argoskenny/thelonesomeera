# Repository Guidelines

## Site Scope and Information Architecture

The public site has four primary areas only:

- `/` for the homepage
- `/demo` for projects, games, and AI experiments
- `/blog` for the static article index
- `/about` for the site and author introduction

Keep global navigation and primary calls to action within this structure. Demo runtime files remain available under `/showcase/**`, and individual Blog posts remain directly accessible as `/blog/<slug>.html`; these are content targets, not additional top-level navigation sections.

## Project Structure

- `src/app/(site)/`: the four main Next.js App Router pages.
- `src/components/`: shared navigation, footer, layout, cards, buttons, and page sections.
- `src/data/demos.ts`: the static Demo catalog.
- `src/data/blog-posts.ts`: the static Blog metadata catalog.
- `public/blog/`: standalone Blog HTML and the shared `article.css` reading stylesheet.
- `showcase/<project>/`: editable sources for independently built demos.
- `public/showcase/<project>/`: deployed demo output and static-only demos.
- `scripts/`: standalone build and source-to-public sync workflows.

The site does not use a Blog database, CMS, admin console, article API, or upload service. Do not introduce one for article authoring.

## Build and Development Commands

- `npm run dev` runs the main Next.js site.
- `npm run lint` checks the main source tree.
- `npm run build` creates the production Next.js build.
- `npm run build:standalone` refreshes all source-backed demo outputs.
- `npm run sync:static` syncs static demo sources into `public/showcase/`.
- `npm run build:androidtest` refreshes the Android WebView demo.
- `cd showcase/androidtest && npm run dev` runs the Android demo's Vite server.

Run a focused demo build when only one standalone project changed; run `build:standalone` before a release that must refresh every published demo.

## Blog Authoring

Each post is a complete kebab-case HTML file in `public/blog/` and must:

- reference `/blog/article.css`;
- contain a useful `<title>` and meta description;
- show its date, category, and reading time;
- use semantic headings and readable article markup;
- link back to `/blog`;
- work when opened directly at `/blog/<slug>.html`.

Add the post metadata to `src/data/blog-posts.ts` and update `public/rss.xml` when the article should appear in RSS. Do not add a build-time HTML converter, seed process, or hidden content store.

## Showcase Source and Output Rules

- When `showcase/<project>/` exists, it is the source of truth. Never hand-edit its generated bundle under `public/showcase/<project>/`.
- When a demo exists only under `public/showcase/<project>/`, that static directory is its source of truth.
- New standalone demos should use matching source and public paths: `showcase/<project>/` to `public/showcase/<project>/`.
- New public demo links use `/showcase/<project>/...`; do not add root-level aliases for individual demos. `public/selfiecat.html` is the documented product-page exception, not a route alias.
- Preserve each demo's required Vite `base` or HTML `<base>` so nested assets resolve from its `/showcase/<project>/` URL.

## Coding Style and UI Conventions

- Follow nearby formatting; use 2-space indentation in CSS, JavaScript, TypeScript, and Vue.
- Use kebab-case for standalone HTML filenames and lowercase asset names.
- Keep reusable visual primitives in shared components rather than duplicating page-specific variants.
- Prefer CSS and the existing stack for restrained motion; respect `prefers-reduced-motion`.
- Maintain clear typography, visible focus states, sufficient contrast, and responsive layouts from mobile through desktop.
- Avoid adding a dependency for a small effect that can be implemented clearly with CSS.

## Testing Guidelines

For main-site changes, run lint and the production build, then verify `/`, `/demo`, `/blog`, and `/about` navigation in a browser. For Blog changes, also open the new HTML URL directly and check narrow-screen reading layout. For demo changes, confirm the matching `public/showcase/` output was refreshed and test the exact public route and its assets.

Tests and builds do not replace browser verification for interaction, responsive layout, or console errors.

## Commit and Pull Request Guidelines

Use a short, present-tense commit subject. Pull requests should include:

- a clear description of the affected page or demo;
- screenshots or recordings for visible UI changes;
- the build, lint, and browser checks performed;
- a note when generated `public/showcase/` output changed.

## Security and Deployment

- Never commit secrets; none are required for static Blog authoring.
- Production continues to use the checked-in Next.js standalone, PM2, and Nginx deployment model.
- Keep canonical main routes on the primary host. Serve new demos beneath `/showcase/**`; preserve `/selfiecat.html` only as the documented existing product-page exception.
- For Herd and Android WebView development, follow `showcase/androidtest/HERD_SETUP.md`.
