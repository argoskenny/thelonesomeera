# Architecture Notes

## Site information architecture

The main site uses Next.js App Router and exposes four primary areas:

| Route | Responsibility |
| --- | --- |
| `/` | Brand introduction, featured demos, recent writing, and primary calls to action |
| `/demo` | Curated games, applications, AI comparisons, and smaller experiments |
| `/blog` | Static article index and metadata |
| `/about` | Site story, values, capabilities, and contact information |

Navigation, footer, typography, layout, buttons, and cards are shared components. Standalone demos and article HTML use the same visual direction where practical, but remain independent static documents rather than additional Next.js application routes.

## Repository layout

### Main app

- `src/app/(site)/`: the four public routes and their route metadata
- `src/components/`: reusable site layout, navigation, cards, and page sections
- `src/data/demos.ts`: Demo groups, card copy, tags, and public URLs
- `src/data/blog-posts.ts`: Blog list metadata and static HTML URLs
- `src/app/globals.css`: site tokens, typography, responsive rules, and restrained motion

The main site has no article database, admin console, content API, or upload pipeline. Demo and Blog catalogs are checked-in static data.

### Static Blog

- `public/blog/article.css`: shared reading layout and article typography
- `public/blog/<slug>.html`: one complete, directly addressable article per file
- `public/rss.xml`: optional RSS catalog for published articles

The HTML file is the article source of truth. The Next.js `/blog` page only keeps the metadata needed to render its article cards; it does not fetch or transform article content at runtime.

To add an article:

1. Add a complete kebab-case HTML file under `public/blog/`.
2. Reference `/blog/article.css` and include title, description, date, category, reading time, and semantic article markup.
3. Point the article's back link to `/blog`.
4. Add the same title, slug, date, excerpt, category, and URL to `src/data/blog-posts.ts`.
5. Update `public/rss.xml` when RSS publication is desired.
6. Open the direct HTML URL and verify both desktop and mobile reading layouts.

No migration, seed, database connection, or deployment-time import is involved.

### Standalone demos

- `showcase/<project>/`: editable source for demos that have a build or sync workflow
- `public/showcase/<project>/`: deployable output and static-only historical experiments
- `scripts/build-standalone.mjs`: umbrella build for source-backed standalone apps
- `scripts/sync-static-apps.mjs`: controlled source-to-public synchronization

Source-backed apps currently follow these paths:

| App | Source of truth | Published path | Publish model |
| --- | --- | --- | --- |
| Android WebView demo | `showcase/androidtest/` | `public/showcase/androidtest/` | Vite build |
| SOX FPS | `showcase/sox/` | `public/showcase/sox/` | Static sync |
| COD2 FPS | `showcase/cod2/` | `public/showcase/cod2/` | Vite build, then sync |
| Room | `showcase/room/` | `public/showcase/room/` | Vite build, then sync |
| PulseSync | `showcase/pulsesync/` | `public/showcase/pulsesync/` | Vite build, then sync |
| Mythic Match | `showcase/mma/` | `public/showcase/mma/` | Static sync |
| Colorful Kart | `showcase/colorful_kart/` | `public/showcase/colorful_kart/` | Vite build, then sync |
| Sigil Keep | `showcase/bpd/` | `public/showcase/bpd/` | Static sync |
| Mini Fantasy | `showcase/mini_fantasy/` | `public/showcase/mini_fantasy/` | Vite build, then sync |

Other directories under `public/showcase/` may be intentionally static-only demos. They are content, not duplicate source projects, and can be edited in place when no corresponding `showcase/<project>/` exists.

`public/selfiecat.html` is the one intentional legacy product-page exception. It remains at `/selfiecat.html` because it has an established public URL and is linked from the Demo catalog; it is content, not a second main-site route or redirect fallback.

## Ownership rules

1. Edit main-site routes and components under `src/`.
2. Edit Blog content only in `public/blog/<slug>.html`; keep list metadata small and static.
3. For a source-backed demo, edit `showcase/<project>/` and regenerate its `public/showcase/<project>/` output.
4. Do not hand-edit generated JavaScript, CSS, or asset bundles in a source-backed public output.
5. For a static-only demo, `public/showcase/<project>/` is its source of truth.
6. New independent demos should default to `showcase/<project>/` source and publish to the matching `public/showcase/<project>/` path.
7. New Demo URLs use `/showcase/<project>/...`; do not recreate old root aliases such as `/cod2/` or `/pulsesync/`. Preserve the documented `/selfiecat.html` product-page exception.

## Build and verification

For the main site:

```bash
npm run verify
```

The build command also copies `public/` and `/_next/static/` into `.next/standalone/`, so `npm start` runs the same self-contained artifact used by PM2.

To refresh every source-backed standalone app before deployment:

```bash
npm run build:standalone
```

This command fails when a registered source project or publish entry is missing, so a release cannot silently retain stale output. `npm run build:standalone -- --allow-skip` is reserved for intentional partial local checkouts and must not be used for deployment.

For the complete production gate, run `npm run verify:release`. It covers root lint, type checks and tests; showcase lint, type checks and tests; all standalone builds; the Next.js production build; and HTTP smoke checks against the standalone server. CI then runs `npm run check:generated` to reject source/output drift.

After changing an interactive page, verify the affected route in a browser. A complete release check should cover `/`, `/demo`, `/blog`, `/about`, at least one direct `/blog/<slug>.html` article, and the changed `/showcase/**` route.

## Production request flow

Production keeps the existing Next.js standalone, PM2, and Nginx model:

1. Nginx serves immutable `/_next/static/` and content-hashed Vite assets.
2. Nginx resolves `/showcase/**` from `public/showcase/` and direct Blog HTML from `public/blog/`.
3. Stable-name public assets and static HTML are revalidated so updates cannot remain hidden behind a long browser cache.
4. Main routes and unmatched requests are proxied to the PM2-managed standalone Next.js server.

This keeps static content cacheable and inspectable while preserving one application process and one canonical host.

When Certbot has already added SSL directives to the production site file, `deploy.sh` deliberately keeps that file instead of replacing it. Merge new static-location rules from `nginx.conf` into the SSL-enabled file manually, back it up first, and validate with `nginx -t` before reload.
