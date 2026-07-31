# Design: personal-site v1

**Date:** 2026-07-30
**Status:** approved

A Windows 95 desktop-style personal website, to be linked from job applications. This
document specifies **v1 only**. Spotify stats, a scrum board and a RAG chatbot are
deliberately out of scope and get their own design cycles.

---

## 1. Goals and non-goals

### Goals

- A recruiter landing on the site learns who Benjamin Best is without clicking anything,
  and can reach the CV in one click.
- The CV is readable in the browser and downloadable as a PDF.
- Projects are presented honestly: what each one is, what it demonstrates, and whether it
  can be seen running.
- Usable on a phone, because that is where a lot of recruiters open links.
- The code is clean, tested, and defensible in an interview. The window manager is the
  part an interviewer can poke at, so it is the part with real state modelling and real
  test coverage.

### Non-goals for v1

Spotify integration · scrum board · RAG chat · Start menu · window resizing · boot and
shutdown sequences · deep-linking (`?open=cv`) · analytics · any backend · any
hosting-specific configuration.

None of these constrain the design below: each would touch only the window registry and
the reducer, both of which are designed as extension points.

### Decisions taken during design

| Decision | Choice | Reason |
|---|---|---|
| v1 scope | Desktop + CV + Projects, frontend only | Ships in days and is genuinely applicable-ready. Only Spotify forces backend, secrets and caching questions, so all of those defer with it. |
| Hosting | Deferred | v1 is a pure static build with no host-specific code, so the choice can be made in the Spotify design instead of guessed at now. |
| CV content source | Hand-copied typed TS module | Zero coupling to the `cv` repo, fully typed, and allows web prose rather than ATS prose. The cost is a manual edit once or twice a year. |
| Window chrome | Own window manager + 98.css | The state logic stays custom and testable; the fiddly pixel work (title bars, scrollbars, tabs) comes from ~10KB of plain CSS with no JS and no styling-system conflict with Tailwind. |
| Mobile | Windows maximise, drag disabled | One responsive branch, same components, same reducer. The Win95 concept survives on a phone instead of being replaced by a second UI. |
| Repo layout | Fresh repo, flat Vite app, single repo | See §7. |
| First load | Name and summary centred on the desktop background | Chosen over an auto-opening Welcome dialog, which may be added later. There is no About window: it would only repeat this text. |
| Contact details | Email, LinkedIn, GitHub on the page; no phone on the page | The PDF remains the existing master build with the phone number included, accepted as a known trade-off. |
| Project framing | Factual `status` chip plus a "Why I built it" line on every card | See §5. |

---

## 2. Architecture

A single static React SPA. No backend, no router, no data fetching. Everything rendered
comes from typed content modules compiled into the bundle.

Three layers, deliberately separated so each can be understood and tested alone:

**`src/windows/state.ts` — pure reducer.** No React, no DOM. All window behaviour lives
here: opening, closing, focusing, minimising, moving, stacking. Testable without
rendering anything, and where the majority of the test suite points.

**`src/windows/` — React shell.** A provider holding the reducer; a `Window` component
that draws chrome and binds drag; a `WindowLayer` rendering open windows in order; plus
`Desktop`, `DesktopIcon` and `Taskbar`.

**`src/apps/` — window contents.** `CvWindow`, `ProjectsWindow`, `ContactWindow`.
Ordinary presentational components reading from `src/content/`. They
know nothing about windowing, so they can be tested by rendering them directly.

### The registry is the extension point

```ts
// src/windows/registry.ts
export const REGISTRY: Record<WindowId, WindowDef> = {
  cv: {
    title: "My CV",
    icon: cvIcon,
    component: CvWindow,
    defaultSize: { width: 720, height: 560 },
  },
  // ...
};
```

Adding a window is one registry entry plus one component. Nothing else changes. This is
what keeps Spotify and the scrum board from becoming invasive later.

### State model

```ts
type WindowId = "cv" | "projects" | "contact";

interface WindowInstance {
  id: WindowId;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimised: boolean;
}

interface DesktopState {
  windows: WindowInstance[]; // last element = topmost = focused
}
```

**Z-order is array order.** The last element is topmost and focused. Focusing moves an
entry to the end; rendering sets `zIndex` from the array index. There is no `zIndex`
counter to keep in sync and no stale-maximum bug, because "which window is on top" has
exactly one representation.

**There is no `focused` field.** Focus is derived from the array's last non-minimised
entry. A derived value cannot disagree with the array it is derived from.

### Actions

| Action | Behaviour |
|---|---|
| `OPEN` | If already present: unminimise and move to the end. Otherwise append a new instance at a cascade offset (see below). If `singleWindow` is set, drop all other instances first. |
| `CLOSE` | Remove the instance. The next entry down becomes topmost by construction. |
| `FOCUS` | Move the instance to the end of the array. |
| `MINIMISE` | Set `minimised: true`. The instance stays in the array so its taskbar button remains. |
| `TOGGLE_FROM_TASKBAR` | Minimise if the instance is currently focused; otherwise unminimise and focus it. |
| `MOVE` | Replace `position`, clamped via `clampToViewport`. |

**Cascade placement.** A new window's position is
`{ x: BASE.x + (openCount % 6) * STEP, y: BASE.y + (openCount % 6) * STEP }`, where
`openCount` is `windows.length` before the append. Derived from the count rather than from
"the last-opened window", because focusing reorders the array and so the last array entry
is not reliably the most recently opened one. The result is then clamped, so a cascade
cannot push a window off a short viewport.

### How viewport reaches a pure reducer

`clampToViewport` needs viewport dimensions and the mobile rule needs to know it is on
mobile, but `state.ts` must not read `window`. Both arrive as action payload:

```ts
type Action =
  | { type: "OPEN"; id: WindowId; size: Size; viewport: Viewport; singleWindow: boolean }
  | { type: "MOVE"; id: WindowId; position: Point; viewport: Viewport }
  | { type: "CLOSE" | "FOCUS" | "MINIMISE" | "TOGGLE_FROM_TASKBAR"; id: WindowId };
```

`size` travels in the payload for the same reason: a new window's default size lives in
the registry, and the registry imports React components. Passing it in keeps `state.ts`
free of that dependency.

`WindowsProvider` owns a single `useViewport()` hook — the only place `window.innerWidth`
and the `768px` breakpoint are read — and stamps `viewport` and `singleWindow` onto the
actions that need them. It also exposes `isMobile` on context for `Window` to consume, so
the breakpoint is defined once and every consumer reads the same value.

The reducer therefore stays a pure function of `(state, action)`, and every viewport-
dependent case is testable by passing a viewport literal.

### Dragging

A `useDrag` hook built on pointer events. The in-flight offset is held in local component
state and a single `MOVE` is dispatched on `pointerup`, so a drag does not re-render the
whole desktop on every frame.

Position is clamped by a pure `clampToViewport(position, size, viewport)` so a window's
title bar can never be dragged out of reach. It is extracted as a standalone pure
function specifically so the logic that can actually be wrong is unit-testable without
simulating pointer events.

---

## 3. File layout

```
personal-site/
├── .github/workflows/ci.yml
├── .gitignore
├── PLAN.md                   committed
├── IDEAS.md                  gitignored
├── README.md
├── docs/DESIGN.md            this document
├── public/
│   ├── Benjamin_Best_CV.pdf
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                 Tailwind + 98.css + W95FA font
    ├── fonts/W95FA/              copied from ben-fullstack-win95-portfolio
    ├── content/
    │   ├── types.ts              CvData, Project, Profile
    │   ├── profile.ts            name, summary, contact links
    │   ├── cv.ts                 transcribed from the cv repo's cv.yml
    │   └── projects.ts
    ├── windows/
    │   ├── state.ts              pure reducer, actions, types
    │   ├── registry.ts
    │   ├── WindowsProvider.tsx
    │   ├── useWindows.ts
    │   ├── clampToViewport.ts
    │   ├── useDrag.ts
    │   └── components/
    │       ├── Window.tsx
    │       ├── WindowLayer.tsx
    │       ├── Desktop.tsx
    │       ├── DesktopIcon.tsx
    │       └── Taskbar.tsx
    └── apps/
        ├── CvWindow.tsx
        ├── ProjectsWindow.tsx
        └── ContactWindow.tsx
```

Flat at the root, with no `frontend/` directory, because there is nothing to nest against
in v1. When Spotify arrives it becomes `api/` or `server/` beside `src/`.

Files carried over from `ben-fullstack-win95-portfolio`: the `W95FA` font, and the
`shadow-w95*` Tailwind bevel utilities in `index.css` if and only if a gap in 98.css
turns up. Its history is not cloned — it carries a todo app, auth code, and a committed
`frontend/.vite/deps/` build cache.

---

## 4. Content model

`src/content/cv.ts` is a typed transcription of the `cv` repo's `cv.yml`. Bullet text ships
**verbatim**: those bullets are governed by that repo's verified-facts process, and only
Ben can approve a deviation. Shortening them for the web is a deliberate follow-up he signs
off separately, not something to do in passing during transcription. The phone number is
omitted. `profile.ts` carries name, headline, availability, summary, email, LinkedIn and
GitHub only.

`profile.summary` and `profile.availability` are the one piece of content authored for this
site rather than transcribed: they state that Ben is available, that he is looking for data
engineering roles, and that the more software-focused final stretch of the Visa role has
him open to software engineering ones too. That last claim is his own framing of his
experience, not an inference drawn from the CV, and is his to change. `content.test.ts`
guards all three so an edit cannot quietly drop one.

`public/Benjamin_Best_CV.pdf` is the existing master build from the `cv` repo, phone
number included. It is refreshed by copying the file across after a rebuild there. This is
an accepted trade-off: a static PDF on a public URL is crawlable.

The `cv` repo remains the source of truth for CV facts. Any change to a bullet's substance
belongs there first, in accordance with that repo's verified-facts process, and is then
transcribed here.

---

## 5. Projects

Each project renders as a card with title, tech-stack tags, a factual status chip, a
blurb, a "Why I built it" line, and repo / live links.

```ts
interface Project {
  name: string;
  status: "live" | "published" | "local";  // Live · Published · Runs locally
  stack: string[];
  blurb: string;
  why: string;
  repoUrl?: string;
  liveUrl?: string;
}
```

Two fields carrying two distinct kinds of information, kept separate on purpose:

- **`status`** is factual and answers the visitor's real question — can I click this and
  see it running? The `cv` repo already draws this distinction and only claims deployment
  where it is true.
- **`why`** is a one-line statement of intent, present on **every** card without
  exception. This is the mechanism for admitting that a project was built to learn a
  tool, framed as deliberate scoping rather than as a disclaimer.

A "Learning project" tag applied to only some cards was considered and rejected. It is
asymmetric: tagging two of five implicitly claims the other three are production
software, which is a larger overclaim than the one it avoids. It is also inaccurate,
since `cv.yml` describes the URL shortener as built to explore backend and DevOps
concepts. A uniform `why` line carries the same honesty with the context that makes it
read as calibration.

v1 project set: **URL Shortener** (live), **thelook-analytics** (runs locally),
**EPL Score Tracker** (runs locally, not deployed), **RYM Hide Ratings** (published on
Firefox Add-ons), and **this site**. Outcome claims follow what `cv.yml` treats as
defensible; no project claims a deployment it does not have.

---

## 6. Presentation, responsiveness and accessibility

The desktop is `#008080` teal, with icons in a left-hand column and an "Available for
work" chip, the name and a one-paragraph summary set as large text on the background,
centred in the desktop area
(bottom-centred below `md`, where centring it vertically would collide with the icon
column). Windows cascade in from `x: 144` so they open clear of that column. The taskbar
is pinned to the bottom with one button per open window — pressed-in when focused — and a
clock.

98.css supplies window frames, title bars, scrollbars, tabs and form controls. Tailwind
handles layout. W95FA remains the body font, overriding 98.css's bundled `ms_sans_serif`.
98.css is the single source of chrome; the `shadow-w95*` utilities are ported only where
it has no equivalent, so there is never more than one bevel system in play.

### Mobile

The `768px` breakpoint is read in exactly one place — `useViewport()` inside
`WindowsProvider` (§2) — and consumed from context by everything that needs it:

- `Window` renders full-screen beneath the taskbar and disables drag
- `OPEN` receives `singleWindow: true`, so only one window is up at a time

Same components, same reducer, one definition of "mobile". No second UI to keep in sync.

### Accessibility

Cheap to do here and already a claimed CV skill:

- desktop icons and title-bar controls are real `<button>` elements
- each window is `role="dialog"` with an `aria-label` from its registry title
- `Escape` closes the focused window
- focus moves into a window when it opens

---

## 7. Repository strategy

**One repository.** Not microservices.

A Spotify proxy is roughly 150 lines. Giving it a separate repository would double the CI,
secrets and deployment surface while providing no isolation that is actually needed —
there is no independent deploy lifecycle, no independent scaling requirement, and no
second team. The concern about the repo becoming bloated is real, but it is solved by
module boundaries, which §2 already provides, not by repository boundaries.

The scrum board is the one future piece that might genuinely earn a separate service,
because it is the only one with real persistent state. That is a decision for its own
design cycle, on its own evidence.

---

## 8. Testing

Vitest, React Testing Library and jsdom. Red-green TDD: test before implementation.

### Reducer tests

These carry the weight, because this is where the logic is:

- opening an already-open window focuses it rather than duplicating it
- opening a minimised window restores and focuses it
- closing the topmost window promotes the one beneath it
- a second window cascades rather than landing exactly on top of the first
- cascade placement is unaffected by focus order: opening A, opening B, focusing A, then
  opening C puts C at the third cascade slot
- taskbar toggle minimises a focused window, and unminimises plus focuses an unfocused one
- `MOVE` applies clamping
- `OPEN` with `singleWindow: true` drops every other instance
- `clampToViewport` boundary cases: each edge, and a window larger than the viewport

### Component tests

- clicking a desktop icon renders that window
- the close button removes the window
- the taskbar shows one button per open window
- `Escape` closes the focused window
- focus lands inside a window when it opens
- `CvWindow` renders every role present in `cv.ts`
- `ProjectsWindow` renders a status chip and a `why` line for every project
- the PDF link carries the correct `href` and the `download` attribute

### Deliberately not tested

Drag gestures. jsdom's pointer capture is unreliable, and such tests would assert the
behaviour of a mock more than the behaviour of the component. The part that can actually
be wrong — clamping — is tested as a pure function instead. This is a stated choice rather
than a coverage gap, and is written down here so it can be defended rather than
explained away.

---

## 9. CI and git workflow

`.github/workflows/ci.yml`, adapted from the `url-shortener` repo. On pull request to
`main`:

- one job running `eslint`, `tsc --noEmit` and `vite build` (Task 10 added the build step,
  after an earlier task's dependency broke the production build and it was only caught
  locally)
- one job running `vitest --coverage`

Both on Node 26, matching the existing workflow. Codecov is omitted for now: it needs a
token and adds nothing to a repo with no coverage history. It is easy to add later.

Workflow: a feature branch per plan phase, a pull request to `main`, CI green before
merge. Commit messages use the `feat:` / `test:` / `chore:` prefixes already used in these
repos. The work lands as roughly 8–10 pull requests, not one.

Benjamin Best is the sole author of every commit. No `Co-Authored-By` trailer and no
generated-by footer. This is recorded as a global rule in `~/.claude/CLAUDE.md`.

`IDEAS.md` is gitignored. `PLAN.md` and this document are committed.
