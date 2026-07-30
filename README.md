# personal-site

My personal site: a Windows 95 desktop in the browser, holding my CV, my projects and
my contact details.

Built with Vite, React 19, TypeScript and Tailwind v4. Window chrome comes from
[98.css](https://jdan.github.io/98.css/); the window manager — opening, focusing,
stacking, minimising and dragging — is a hand-written reducer in `src/windows/state.ts`.

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
| `npm run typecheck` | `tsc --noEmit` |

## Design

`docs/DESIGN.md` records the architecture and the decisions behind it, including the
alternatives that were rejected and why. `PLAN.md` is the implementation plan.
