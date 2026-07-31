# personal-site

My personal site: a Windows 95 desktop in the browser, holding my CV, my projects and
my contact details.

Built with Vite, React 19, TypeScript and Tailwind v4. Window chrome comes from
[98.css](https://jdan.github.io/98.css/); the window manager — opening, focusing,
stacking, minimising and dragging — is a custom reducer in `src/windows/state.ts`.

## What's here

A teal desktop with three draggable, focusable windows — CV, Projects and
Contact — opened from desktop icons, tracked in a taskbar with a clock, and minimisable
back to that taskbar. Centred on the background: an "Available for work" chip, my name
and a short summary. Below 768px, windows go full-screen and only one is open at a
time. The CV is readable inline and downloadable as a PDF. Everything is a static
build: no backend, no router, no data fetching.

**Hosting is not yet chosen.** v1 is a plain static build with no host-specific code, so
picking a target (and adding a deploy workflow) is deliberately deferred — see
`docs/DESIGN.md` and the "Follow-ups" section of `PLAN.md`.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b --noEmit` |

## Design

`docs/DESIGN.md` records the architecture and the decisions behind it, including the
alternatives that were rejected and why. `PLAN.md` is the implementation plan.
