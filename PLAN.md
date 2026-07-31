# Personal Site v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static Windows 95 desktop-style personal site with a CV window (plus PDF download), a Projects window, and About/Contact windows, backed by a custom window manager.

> **Amended after v1 shipped.** The task bodies below still describe the site as built at
> the end of Task 10. Since then: the About window was removed (it only repeated the name
> and summary already shown on the desktop), the CV window and icon were retitled "My CV",
> windows now cascade in clear of the icon column, the desktop name/summary block is
> centred rather than pinned to a corner and carries an availability chip, and the site
> has Win95 cursors with a pointer trail (`src/cursor/`). `docs/DESIGN.md` and the code
> are the current record; this plan is kept as the build history.

**Architecture:** A single static React SPA with no backend, no router and no data fetching. A pure reducer in `src/windows/state.ts` owns all window behaviour; a React shell renders it; presentational "app" components read from typed content modules. Adding a window later is one registry entry plus one component.

**Tech Stack:** Vite 6, React 19, TypeScript 5.7 (strict), Tailwind v4, 98.css, Vitest + React Testing Library + jsdom, ESLint 9 flat config, GitHub Actions.

**Design document:** `docs/DESIGN.md`. Read it before starting.

## Global Constraints

- **Node 26** in CI, matching the `url-shortener` workflow.
- **TypeScript strict. No `any`.** Every content module is typed.
- **`async`/`await` only** — no `.then()` chains.
- **Red-green TDD.** Write the failing test, watch it fail, then implement. Never write implementation before its test.
- **`src/windows/state.ts` must not import React, touch `window`, or import `registry.ts`.** It is a pure function of `(state, action)`. Viewport and window size arrive as action payload. This is what makes it testable and it is a review gate.
- **The `768px` mobile breakpoint is defined exactly once**, in `useViewport()`. No other file may read `window.innerWidth` or hardcode `768`.
- **Tailwind for layout, 98.css for chrome.** No second bevel system. Only port a `shadow-w95*` utility from `ben-fullstack-win95-portfolio` if 98.css genuinely has no equivalent.
- **British spelling in identifiers and copy** (`minimised`, `Summarise`). The one exception is 98.css's title-bar controls, which require `aria-label="Minimize"` and `aria-label="Close"` verbatim to render the correct glyphs.
- **No new CV claims.** Bullet text is transcribed from the `cv` repo's `cv.yml`, which is governed by its own verified-facts process. Never add a number, superlative or outcome that is not already there.
- **Commits:** `feat:` / `test:` / `chore:` / `docs:` prefixes. Sole author `benbest123`. No `Co-Authored-By` trailer, no generated-by footer.
- **Branching:** one feature branch and one PR per task, `main` protected by CI. Never commit directly to `main`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/content/types.ts` | `Profile`, `CvData`, `Role`, `Project` and friends. No logic. |
| `src/content/profile.ts` | Name, headline, summary, contact links. No phone number. |
| `src/content/cv.ts` | CV data transcribed from `cv.yml`. |
| `src/content/projects.ts` | Project cards with `status` and `why`. |
| `src/apps/*.tsx` | Presentational window contents. Know nothing about windowing. |
| `src/windows/types.ts` | `WindowId`, `WindowInstance`, `DesktopState`, `WindowAction`. |
| `src/windows/clampToViewport.ts` | Pure geometry. Keeps a window inside the desktop area. |
| `src/windows/state.ts` | Pure reducer. All window behaviour. |
| `src/windows/useViewport.ts` | The only reader of `window.innerWidth` and the only definition of the breakpoint. |
| `src/windows/WindowsProvider.tsx` | Holds the reducer, stamps viewport onto actions, exposes context. |
| `src/windows/useWindows.ts` | Context consumer hook. |
| `src/windows/registry.ts` | `WindowId` → title, icon, component, default size. The extension point. |
| `src/windows/useDrag.ts` | Pointer-event drag. Commits one `MOVE` on release. |
| `src/windows/components/Window.tsx` | Chrome, title bar, controls, a11y, mobile full-screen branch. |
| `src/windows/components/WindowLayer.tsx` | Renders open windows in array order. |
| `src/windows/components/Desktop.tsx` | Teal background, name and summary, icon column. |
| `src/windows/components/DesktopIcon.tsx` | One icon button. |
| `src/windows/components/Taskbar.tsx` | Button per open window, plus clock. |

**Task order is dependency order.** Content and app components come first because they have no dependencies; the window system is built underneath them; Task 9 wires everything together and is the first point at which the site looks like a desktop.

---

### Task 1: Scaffolding, tooling and CI

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `index.html`, `README.md`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Create: `src/test/setup.ts`, `src/App.test.tsx`
- Create: `.github/workflows/ci.yml`
- Copy: `src/fonts/W95FA/W95FA.woff` and `W95FA.woff2` from `../ben-fullstack-win95-portfolio/frontend/src/fonts/W95FA/`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:coverage`. Everything downstream assumes these exist.

- [ ] **Step 1: Scaffold the Vite app**

```bash
cd C:/Users/benbe/Repos/personal-site
npm create vite@latest . -- --template react-swc-ts
```

Answer "yes" to proceeding in a non-empty directory. It will not overwrite `docs/`, `PLAN.md`, `.gitignore` or `.gitattributes`.

- [ ] **Step 2: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/vite 98.css
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8
```

- [ ] **Step 3: Copy the W95FA font across**

```bash
mkdir -p src/fonts/W95FA
cp ../ben-fullstack-win95-portfolio/frontend/src/fonts/W95FA/W95FA.woff  src/fonts/W95FA/
cp ../ben-fullstack-win95-portfolio/frontend/src/fonts/W95FA/W95FA.woff2 src/fonts/W95FA/
```

- [ ] **Step 4: Configure Vite and Vitest**

`vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: { provider: "v8", reporter: ["text", "lcov"] },
  },
});
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";

// jsdom does not implement pointer capture. The title bar calls it on pointerdown, so
// any click that bubbles from inside the title bar would throw without these stubs.
// Drag behaviour itself is deliberately not under test — see docs/DESIGN.md §8.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}
```

- [ ] **Step 5: Write the stylesheet**

**Cascade note, and it matters.** Tailwind v4 puts everything in `@layer` (`theme`, `base`,
`components`, `utilities`). 98.css is **unlayered**, and unlayered CSS beats every layer
regardless of source order. Two consequences:

1. Overrides of 98.css must also be unlayered — putting them in `@layer base` would lose.
2. 98.css styles every `<button>` element, which is what we want for the taskbar and
   dialogs, but not for desktop icons. Fighting that with Tailwind utilities does not work
   for the same reason, so `.desktop-icon` is written as plain unlayered CSS. This is the
   only bespoke chrome CSS in the project.

`src/index.css`:

```css
@import "tailwindcss";
@import "98.css";

@font-face {
  font-family: "W95FA";
  src:
    url("./fonts/W95FA/W95FA.woff2") format("woff2"),
    url("./fonts/W95FA/W95FA.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Unlayered, so it beats 98.css's own bundled font on body and form controls. */
body,
button,
input,
select,
textarea,
.window,
.title-bar {
  font-family: "W95FA", ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  overflow: hidden; /* the desktop owns the viewport; windows scroll internally */
}

/* A desktop icon is a <button> for keyboard and screen-reader users, but it is not
   chrome — undo 98.css's button styling rather than trying to out-specify it. */
.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 6rem;
  min-width: 0;
  padding: 0.5rem;
  border: none;
  box-shadow: none;
  background: transparent;
  color: #fff;
  font-family: inherit;
  cursor: pointer;
}

.desktop-icon:focus-visible {
  outline: 1px dotted #fff;
  outline-offset: -2px;
  background: rgb(255 255 255 / 0.25);
}
```

- [ ] **Step 6: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 7: Write the failing smoke test**

`src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the desktop region", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run it and watch it fail**

Run: `npm test`
Expected: FAIL — the scaffolded `App` renders the Vite starter, so there is no `main` landmark.

- [ ] **Step 9: Replace `App.tsx` with a minimal shell**

```tsx
export default function App() {
  return <main className="h-screen w-screen bg-[#008080]" />;
}
```

Also delete the scaffold leftovers: `src/App.css`, `src/assets/react.svg`, and the `import "./App.css"` line. Ensure `src/main.tsx` imports `./index.css`.

- [ ] **Step 10: Run the test and the full check**

Run: `npm test && npm run lint && npm run typecheck && npm run build`
Expected: test PASSes; lint, typecheck and build all clean.

- [ ] **Step 11: Add the CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  check-types-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 26
          cache: "npm"
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type check
        run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 26
          cache: "npm"
      - run: npm ci
      - name: Run tests with coverage
        run: npm run test:coverage
```

- [ ] **Step 12: Write `README.md`**

````markdown
# personal-site

My personal site: a Windows 95 desktop in the browser, holding my CV, my projects and
my contact details.

Built with Vite, React 19, TypeScript and Tailwind v4. Window chrome comes from
[98.css](https://jdan.github.io/98.css/); the window manager — opening, focusing,
stacking, minimising and dragging — is a custom reducer in `src/windows/state.ts`.

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
````

- [ ] **Step 13: Commit**

```bash
git checkout -b chore/scaffold
git add -A
git commit -m "chore: scaffold vite react app with tailwind, 98.css, vitest and CI"
```

---

### Task 2: Content types, profile and projects

**Files:**
- Create: `src/content/types.ts`, `src/content/profile.ts`, `src/content/projects.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Profile`, `CvData`, `Role`, `Education`, `Certificate`, `SkillGroup`, `Project`, `ProjectStatus`; the values `profile` and `projects`. Tasks 3–5 and 9 import these.

- [ ] **Step 1: Write the failing test**

`src/content/content.test.ts`:

```ts
import { profile } from "./profile";
import { projects } from "./projects";

describe("profile", () => {
  it("has a name, headline and summary", () => {
    expect(profile.name).toBe("Benjamin Best");
    expect(profile.headline.length).toBeGreaterThan(0);
    expect(profile.summary.length).toBeGreaterThan(0);
  });

  it("exposes contact links but never a phone number", () => {
    expect(profile.email).toContain("@");
    expect(profile.links.map(l => l.label)).toEqual(
      expect.arrayContaining(["LinkedIn", "GitHub"])
    );
    const serialised = JSON.stringify(profile);
    expect(serialised).not.toMatch(/\+44|07\d{9}/);
  });
});

describe("projects", () => {
  it("gives every project a status and a reason it was built", () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(["live", "published", "local"]).toContain(project.status);
      expect(project.why.length).toBeGreaterThan(0);
      expect(project.blurb.length).toBeGreaterThan(0);
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("only claims a live or published URL when one is present", () => {
    for (const project of projects) {
      if (project.status === "live" || project.status === "published") {
        expect(project.liveUrl).toBeTruthy();
      }
    }
  });
});
```

The last test is the mechanical guard on §5 of the design: a project cannot claim a deployment it does not have.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test src/content/content.test.ts`
Expected: FAIL — cannot resolve `./profile`.

- [ ] **Step 3: Write `src/content/types.ts`**

```ts
export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  headline: string;
  summary: string;
  location: string;
  email: string;
  links: Link[];
}

export interface Role {
  company: string;
  title: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  qualification: string;
  start: string;
  end: string;
  detail: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  year: string;
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface CvData {
  roles: Role[];
  education: Education[];
  certificates: Certificate[];
  skillGroups: SkillGroup[];
}

/** live = deployed and reachable · published = shipped to a store · local = runs locally only */
export type ProjectStatus = "live" | "published" | "local";

export interface Project {
  name: string;
  status: ProjectStatus;
  stack: string[];
  blurb: string;
  /** Why this was built. Present on every project — see docs/DESIGN.md §5. */
  why: string;
  repoUrl?: string;
  liveUrl?: string;
}
```

- [ ] **Step 4: Write `src/content/profile.ts`**

Summary transcribed from the `cv.yml` Data Engineer variant, with the phone number omitted.

```ts
import type { Profile } from "./types";

export const profile: Profile = {
  name: "Benjamin Best",
  headline: "Data engineer, London",
  summary:
    "Data engineer with four years' commercial experience across financial services, " +
    "law, and technology, most recently in a data-engineering and full-stack role at " +
    "Visa. Comfortable owning projects end to end, from cloud infrastructure and ETL " +
    "through to the interfaces that surface data to users. Based in London with full " +
    "right to work.",
  location: "London, UK",
  email: "benbest987@gmail.com",
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/benjamin-s-best" },
    { label: "GitHub", url: "https://github.com/benbest123" },
  ],
};
```

- [ ] **Step 5: Write `src/content/projects.ts`**

```ts
import type { Project } from "./types";

export const projects: Project[] = [
  {
    name: "Snip — URL Shortener",
    status: "live",
    stack: ["TypeScript", "Next.js", "PostgreSQL", "Zod", "Vercel"],
    blurb:
      "A full-stack URL shortener with JWT auth over httpOnly cookies, raw SQL against " +
      "Postgres with no ORM, and Zod validation on every API route.",
    why:
      "To build something end to end with no framework hand-holding — owning the schema, " +
      "the auth, and the deploy pipeline rather than inheriting them.",
    repoUrl: "https://github.com/benbest123/url-shortener",
    liveUrl: "https://snip-iota.vercel.app",
  },
  {
    name: "thelook-analytics",
    status: "local",
    stack: ["dbt", "BigQuery", "SQL"],
    blurb:
      "A dbt project over BigQuery's public thelook_ecommerce dataset: staging models, " +
      "a star schema of fact and dimension tables, tests, and generated documentation.",
    why:
      "To learn dbt's model, test and docs workflow end to end. A public dataset was a " +
      "deliberate choice — it needs no cleaning, so the modelling is the point, and a " +
      "reviewer already knows the data well enough to judge the schema.",
    repoUrl: "https://github.com/benbest123/thelook-analytics",
  },
  {
    name: "EPL Score Tracker",
    status: "local",
    stack: ["React", "Node.js", "Express", "PostgreSQL", "REST API"],
    blurb:
      "A Premier League score tracker: a React front-end over a Node and Express backend " +
      "that syncs fixture data from an external API into Postgres and serves it over REST.",
    why:
      "To practise designing a REST API and a sync job against a third-party feed I did " +
      "not control. Not deployed — the free API tier omits the current season.",
    repoUrl: "https://github.com/benbest123/epl-tracker-backend",
  },
  {
    name: "RYM Hide Ratings",
    status: "published",
    stack: ["JavaScript", "WebExtensions"],
    blurb:
      "A Firefox extension that hides RateYourMusic ratings on a release page until you " +
      "have rated it yourself.",
    why:
      "To scratch my own itch, and to learn what shipping through a real review process " +
      "involves — manifest permissions, store policy, and updates.",
    repoUrl: "https://github.com/benbest123/rym-hide-ratings",
    liveUrl: "https://addons.mozilla.org/en-GB/firefox/addon/rym-hide-ratings/",
  },
  {
    name: "This site",
    status: "local",
    stack: ["React", "TypeScript", "Vite", "Tailwind", "98.css"],
    blurb:
      "A Windows 95 desktop in the browser: a custom window manager with draggable, " +
      "focusable, minimisable windows built on a pure reducer.",
    why:
      "To have somewhere to put my CV that is more memorable than a PDF, and because a " +
      "window manager is a genuinely interesting bit of state modelling.",
    repoUrl: "https://github.com/benbest123/personal-site",
  },
];
```

- [ ] **Step 6: Run the tests**

Run: `npm test src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git checkout -b feat/content-model
git add src/content
git commit -m "feat: add typed profile and project content"
```

---

### Task 3: CV data module

**Files:**
- Create: `src/content/cv.ts`
- Test: `src/content/cv.test.ts`

**Interfaces:**
- Consumes: `CvData`, `Role`, `Education`, `Certificate`, `SkillGroup` from `./types`.
- Produces: `cv: CvData`. Task 4 renders it.

Bullet text is transcribed **verbatim** from `cv.yml`. Do not paraphrase, shorten, or add figures — those bullets are governed by the `cv` repo's verified-facts process, and only Ben can approve a change. A shortening pass for the web is a follow-up he signs off separately.

- [ ] **Step 1: Write the failing test**

`src/content/cv.test.ts`:

```ts
import { cv } from "./cv";

describe("cv", () => {
  it("lists roles in reverse-chronological order", () => {
    expect(cv.roles.map(r => r.company)).toEqual([
      "Visa",
      "Russell McVeagh",
      "Technology Investment Network",
    ]);
  });

  it("gives every role at least one bullet", () => {
    for (const role of cv.roles) {
      expect(role.bullets.length).toBeGreaterThan(0);
      for (const bullet of role.bullets) {
        expect(bullet.trim()).not.toBe("");
      }
    }
  });

  it("has education, a certificate and skill groups", () => {
    expect(cv.education.length).toBeGreaterThan(0);
    expect(cv.certificates.length).toBeGreaterThan(0);
    expect(cv.skillGroups.length).toBeGreaterThan(0);
    for (const group of cv.skillGroups) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test src/content/cv.test.ts`
Expected: FAIL — cannot resolve `./cv`.

- [ ] **Step 3: Write `src/content/cv.ts`**

```ts
import type { CvData } from "./types";

export const cv: CvData = {
  roles: [
    {
      company: "Visa",
      title: "Associate Data Engineer",
      start: "May 2024",
      end: "Jun 2026",
      bullets: [
        "As feature lead, designed and delivered an AWS data pipeline that produces monthly billing and reporting data for 8 banking partners, using AWS Glue (PySpark) for the ETL and AWS CDK (TypeScript) to provision separate S3 buckets, Glue jobs, KMS keys and IAM roles for each partner.",
        "Recreated a legacy black-box billing process as a transparent Spark SQL pipeline over a cloud data warehouse, aggregating transaction-level payment data into per-company monthly metrics with currency conversion and change-data-capture deduplication.",
        "Built the Qlik-embedding layer (iframe orchestration and cross-frame communication) of a React and Node.js analytics microsite, migrating around 25 dashboards onto a compliant Content Security Policy.",
        "Independently maintained the Qlik dashboards and Qlik infrastructure through a five-week absence of the team's senior engineer that coincided with a company-wide on-premise-to-cloud migration, resolving configuration and infrastructure issues alongside the operations team.",
        "Developed a reliable load-completion detection mechanism for third-party dashboards that exposed no official data-ready API, and debugged a data race condition in the async provisioning flow, iterating from polling to a timestamp-based heuristic.",
        "Delivered SQL Server stored procedures and end-to-end Google Analytics instrumentation (per-partner enablement, server-side initialisation, security-header updates, and form event capture) across a multi-tenant .NET monolith.",
      ],
    },
    {
      company: "Russell McVeagh",
      title: "Business Intelligence Analyst",
      start: "Jun 2022",
      end: "Aug 2023",
      bullets: [
        "Owned the firm's business-intelligence reporting, delivering revenue, client-activity and time-allocation reporting to senior stakeholders.",
        "Created self-service Power BI dashboards, end to end, for the firm's ~300 lawyers, replacing legacy SSRS reports and eliminating the recurring ad-hoc requests that previously required manual SQL extracts.",
      ],
    },
    {
      company: "Technology Investment Network",
      title: "Research Analyst",
      start: "Nov 2021",
      end: "Jun 2022",
      bullets: [
        "Automated the data-collection process with Python, replacing legacy Excel queries and manual data entry.",
        "Produced the data analysis and written content that fed the organisation's published reports on the New Zealand technology sector.",
      ],
    },
  ],
  education: [
    {
      institution: "University of Auckland",
      qualification: "BEng (Hons), Engineering Science",
      start: "Feb 2018",
      end: "Nov 2021",
      detail:
        "First Class Honours. Relevant coursework: programming (Python, MATLAB), statistics, machine learning, and optimisation.",
    },
  ],
  certificates: [
    {
      name: "AWS Certified AI Practitioner (AIF-C01)",
      issuer: "Amazon Web Services",
      year: "2025",
    },
  ],
  skillGroups: [
    { name: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL"] },
    { name: "Frontend", skills: ["React", "HTML/CSS", "Tailwind CSS"] },
    {
      name: "Backend & Data",
      skills: [
        "Node.js",
        "Express.js",
        "PostgreSQL",
        "SQL Server (T-SQL)",
        "Stored Procedures",
        "PySpark",
        "REST APIs",
        "ETL",
        "Data Warehousing",
      ],
    },
    {
      name: "Cloud & DevOps",
      skills: [
        "AWS (Glue, CDK, S3, CloudFormation, IAM, CodePipeline, Athena, KMS)",
        "Git",
        "GitHub Actions",
        "CI/CD",
        "Infrastructure as Code",
      ],
    },
    { name: "BI & Reporting", skills: ["Power BI", "Qlik", "SSRS"] },
    {
      name: "Practices",
      skills: ["Agile", "Unit Testing (Jest, pytest)", "Accessibility"],
    },
  ],
};
```

- [ ] **Step 4: Run the tests**

Run: `npm test src/content/cv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/cv-content
git add src/content/cv.ts src/content/cv.test.ts
git commit -m "feat: add cv content transcribed from the cv repo"
```

---

### Task 4: CV window

**Files:**
- Create: `src/apps/CvWindow.tsx`
- Test: `src/apps/CvWindow.test.tsx`
- Add: `public/Benjamin_Best_CV.pdf` (copy from `../cv/Benjamin_Best_CV.pdf`)

**Interfaces:**
- Consumes: `cv` from `../content/cv`, `profile` from `../content/profile`.
- Produces: `default export CvWindow: () => JSX.Element`. Task 8 registers it.

- [ ] **Step 1: Copy the PDF in**

```bash
mkdir -p public
cp ../cv/Benjamin_Best_CV.pdf public/Benjamin_Best_CV.pdf
```

- [ ] **Step 2: Write the failing test**

`src/apps/CvWindow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CvWindow from "./CvWindow";
import { cv } from "../content/cv";

describe("CvWindow", () => {
  it("renders every role with its company, title and bullets", () => {
    render(<CvWindow />);
    for (const role of cv.roles) {
      expect(screen.getByText(role.company)).toBeInTheDocument();
      expect(screen.getByText(role.title)).toBeInTheDocument();
      for (const bullet of role.bullets) {
        expect(screen.getByText(bullet)).toBeInTheDocument();
      }
    }
  });

  it("renders every skill group", () => {
    render(<CvWindow />);
    for (const group of cv.skillGroups) {
      expect(screen.getByText(group.name)).toBeInTheDocument();
    }
  });

  it("offers the CV as a download", () => {
    render(<CvWindow />);
    const link = screen.getByRole("link", { name: /download cv/i });
    expect(link).toHaveAttribute("href", "/Benjamin_Best_CV.pdf");
    expect(link).toHaveAttribute("download");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm test src/apps/CvWindow.test.tsx`
Expected: FAIL — cannot resolve `./CvWindow`.

- [ ] **Step 4: Implement `CvWindow.tsx`**

```tsx
import { cv } from "../content/cv";
import { profile } from "../content/profile";

export default function CvWindow() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-1 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{profile.name}</h2>
          <p className="text-xs">{profile.location}</p>
        </div>
        {/* A plain anchor, not an <a> wrapping a <button> — that nesting is invalid HTML
            and confuses assistive technology about what the control actually is. */}
        <a href="/Benjamin_Best_CV.pdf" download className="whitespace-nowrap">
          Download CV (PDF)
        </a>
      </header>

      <p>{profile.summary}</p>

      <section>
        <h3 className="mb-2 font-bold">Experience</h3>
        {cv.roles.map(role => (
          <article key={`${role.company}-${role.start}`} className="mb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>{role.company}</strong>
              <span className="text-xs">
                {role.start} – {role.end}
              </span>
            </div>
            <div className="text-xs italic">{role.title}</div>
            <ul className="mt-1 list-disc pl-5">
              {role.bullets.map(bullet => (
                <li key={bullet} className="mb-1">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Education</h3>
        {cv.education.map(item => (
          <article key={item.institution} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>{item.institution}</strong>
              <span className="text-xs">
                {item.start} – {item.end}
              </span>
            </div>
            <div className="text-xs italic">{item.qualification}</div>
            <p className="mt-1">{item.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Technical Skills</h3>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
          {cv.skillGroups.map(group => (
            <div key={group.name} className="contents">
              <dt className="font-bold">{group.name}</dt>
              <dd className="m-0">{group.skills.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Certifications</h3>
        <ul className="list-disc pl-5">
          {cv.certificates.map(cert => (
            <li key={cert.name}>
              {cert.name} — {cert.issuer}, {cert.year}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test src/apps/CvWindow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/cv-window
git add src/apps public/Benjamin_Best_CV.pdf
git commit -m "feat: add cv window with pdf download"
```

---

### Task 5: Projects, About and Contact windows

**Files:**
- Create: `src/apps/ProjectsWindow.tsx`, `src/apps/AboutWindow.tsx`, `src/apps/ContactWindow.tsx`
- Test: `src/apps/ProjectsWindow.test.tsx`, `src/apps/ContactWindow.test.tsx`

**Interfaces:**
- Consumes: `projects` from `../content/projects`, `profile` from `../content/profile`.
- Produces: three default-exported components. Task 8 registers all three.

- [ ] **Step 1: Write the failing tests**

`src/apps/ProjectsWindow.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import ProjectsWindow from "./ProjectsWindow";
import { projects } from "../content/projects";

const STATUS_LABELS = { live: "Live", published: "Published", local: "Runs locally" };

describe("ProjectsWindow", () => {
  it("renders one article per project", () => {
    render(<ProjectsWindow />);
    expect(screen.getAllByRole("article")).toHaveLength(projects.length);
  });

  it("shows a status chip and a reason for every project", () => {
    render(<ProjectsWindow />);
    for (const project of projects) {
      const card = screen.getByRole("article", { name: project.name });
      expect(within(card).getByText(STATUS_LABELS[project.status])).toBeInTheDocument();
      expect(within(card).getByText(project.why)).toBeInTheDocument();
    }
  });

  it("links to the repo and, where present, the live site", () => {
    render(<ProjectsWindow />);
    for (const project of projects) {
      const card = screen.getByRole("article", { name: project.name });
      if (project.repoUrl) {
        expect(within(card).getByRole("link", { name: /repo/i })).toHaveAttribute(
          "href",
          project.repoUrl
        );
      }
      if (project.liveUrl) {
        expect(within(card).getByRole("link", { name: /visit/i })).toHaveAttribute(
          "href",
          project.liveUrl
        );
      }
    }
  });
});
```

`src/apps/ContactWindow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import ContactWindow from "./ContactWindow";
import { profile } from "../content/profile";

describe("ContactWindow", () => {
  it("links to email and every profile link", () => {
    render(<ContactWindow />);
    expect(screen.getByRole("link", { name: profile.email })).toHaveAttribute(
      "href",
      `mailto:${profile.email}`
    );
    for (const link of profile.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.url);
    }
  });

  it("does not show a phone number", () => {
    const { container } = render(<ContactWindow />);
    expect(container.textContent).not.toMatch(/\+44|07\d{9}/);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test src/apps`
Expected: FAIL — cannot resolve `./ProjectsWindow` or `./ContactWindow`.

- [ ] **Step 3: Implement `ProjectsWindow.tsx`**

`aria-labelledby` on each `<article>` is what makes `getByRole("article", { name })` work.

```tsx
import { projects } from "../content/projects";
import type { ProjectStatus } from "../content/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  published: "Published",
  local: "Runs locally",
};

export default function ProjectsWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      {projects.map(project => {
        const headingId = `project-${project.name.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <article key={project.name} aria-labelledby={headingId}>
            {/* `.sunken-panel` is 98.css's inset-border primitive. Do not use
                <fieldset>/<legend> here: that element groups form controls, and
                borrowing it for chrome means the project name is exposed only as a
                fieldset's accessible name, so heading navigation never reaches it. */}
            <div className="sunken-panel p-3">
              <h3 id={headingId} className="mb-2 text-sm font-bold">
                {project.name}
              </h3>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="border border-black px-1 text-xs">
                  {STATUS_LABELS[project.status]}
                </span>
                {project.stack.map(tech => (
                  <span key={tech} className="text-xs">
                    {tech}
                  </span>
                ))}
              </div>

              <p className="mb-2">{project.blurb}</p>
              <p className="mb-2 text-xs italic">
                <strong>Why I built it: </strong>
                {project.why}
              </p>

              <div className="flex gap-2">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    View repo
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
                    Visit site
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `AboutWindow.tsx`**

```tsx
import { profile } from "../content/profile";

export default function AboutWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      <h2 className="text-lg font-bold">{profile.name}</h2>
      <p className="text-xs">{profile.headline}</p>
      <p>{profile.summary}</p>
      <p>
        This site is a Windows 95 desktop in the browser. The windows are draggable,
        focusable and minimisable, all driven by a custom reducer — open a few at
        once and stack them.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Implement `ContactWindow.tsx`**

```tsx
import { profile } from "../content/profile";

export default function ContactWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      <p>The quickest way to reach me is email.</p>
      <ul className="list-none p-0">
        <li className="mb-1">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        {profile.links.map(link => (
          <li key={link.url} className="mb-1">
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs">Based in {profile.location}.</p>
    </div>
  );
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test src/apps`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git checkout -b feat/projects-about-contact-windows
git add src/apps
git commit -m "feat: add projects, about and contact windows"
```

---

### Task 6: Window types, viewport clamping and the reducer

This is the core of the project. The reducer is where the review attention goes.

**Files:**
- Create: `src/windows/types.ts`, `src/windows/clampToViewport.ts`, `src/windows/state.ts`
- Test: `src/windows/clampToViewport.test.ts`, `src/windows/state.test.ts`

**Interfaces:**
- Consumes: nothing. **`state.ts` must not import React, `registry.ts`, or touch `window`.**
- Produces:
  - `type WindowId = "cv" | "projects" | "about" | "contact"`
  - `interface Point { x: number; y: number }`, `Size { width, height }`, `Viewport { width, height }`
  - `interface WindowInstance { id, position, size, minimised }`
  - `interface DesktopState { windows: readonly WindowInstance[] }` — `readonly` so the
    module's immutability claim is compiler-enforced, not just convention
  - `type WindowAction` (see Step 3)
  - `clampToViewport(position: Point, size: Size, viewport: Viewport): Point`
  - `windowReducer(state: DesktopState, action: WindowAction): DesktopState`
  - `focusedId(state: DesktopState): WindowId | null`
  - `cascadePosition(openCount: number): Point`
  - `initialState: DesktopState`
  - `TASKBAR_HEIGHT: number`

- [x] **Step 1: Write the failing clamp test**

`src/windows/clampToViewport.test.ts`:

```ts
import { clampToViewport, TASKBAR_HEIGHT } from "./clampToViewport";

const viewport = { width: 1000, height: 800 };
const size = { width: 400, height: 300 };

describe("clampToViewport", () => {
  it("leaves a position that is already inside untouched", () => {
    expect(clampToViewport({ x: 100, y: 100 }, size, viewport)).toEqual({ x: 100, y: 100 });
  });

  it("clamps against the left and top edges", () => {
    expect(clampToViewport({ x: -50, y: -20 }, size, viewport)).toEqual({ x: 0, y: 0 });
  });

  it("clamps against the right edge", () => {
    expect(clampToViewport({ x: 5000, y: 0 }, size, viewport).x).toBe(
      viewport.width - size.width
    );
  });

  it("clamps against the bottom edge, keeping clear of the taskbar", () => {
    expect(clampToViewport({ x: 0, y: 5000 }, size, viewport).y).toBe(
      viewport.height - TASKBAR_HEIGHT - size.height
    );
  });

  it("pins a window larger than the viewport to the origin", () => {
    const huge = { width: 2000, height: 2000 };
    expect(clampToViewport({ x: 300, y: 300 }, huge, viewport)).toEqual({ x: 0, y: 0 });
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npm test src/windows/clampToViewport.test.ts`
Expected: FAIL — cannot resolve `./clampToViewport`.

- [x] **Step 3: Write `src/windows/types.ts` and `clampToViewport.ts`**

`src/windows/types.ts` (as shipped, after the round-1 hardening pass described at the
end of this section — `windows` is `readonly`):

```ts
export type WindowId = "about" | "cv" | "projects" | "contact";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Viewport = Size;

export interface WindowInstance {
  id: WindowId;
  position: Point;
  size: Size;
  minimised: boolean;
}

export interface DesktopState {
  /**
   * Array order is z-order: the last element is topmost and focused (see
   * `focusedId`). There is deliberately no separate `zIndex` counter or
   * stored "focused" field — a value derived from this array can never
   * drift out of sync with it. `readonly` makes the reducer's immutability
   * compiler-enforced rather than a convention callers have to trust.
   */
  windows: readonly WindowInstance[];
}

export type WindowAction =
  | { type: "OPEN"; id: WindowId; size: Size; viewport: Viewport; singleWindow: boolean }
  | { type: "MOVE"; id: WindowId; position: Point; viewport: Viewport }
  | { type: "CLOSE"; id: WindowId }
  | { type: "FOCUS"; id: WindowId }
  | { type: "MINIMISE"; id: WindowId }
  | { type: "TOGGLE_FROM_TASKBAR"; id: WindowId };
```

`src/windows/clampToViewport.ts` (as shipped — coordinates are rounded to whole
pixels):

```ts
import type { Point, Size, Viewport } from "./types";

export const TASKBAR_HEIGHT = 40;

/**
 * Keeps a window fully inside the desktop area, so its title bar can never be
 * dragged out of reach. A window larger than the viewport is pinned to the
 * origin. Coordinates are rounded to whole pixels to keep the pixel-crisp
 * Windows 95 look intact.
 */
export function clampToViewport(position: Point, size: Size, viewport: Viewport): Point {
  const maxX = Math.max(0, viewport.width - size.width);
  const maxY = Math.max(0, viewport.height - TASKBAR_HEIGHT - size.height);
  return {
    x: Math.round(Math.min(Math.max(position.x, 0), maxX)),
    y: Math.round(Math.min(Math.max(position.y, 0), maxY)),
  };
}
```

- [x] **Step 4: Run the clamp tests**

Run: `npm test src/windows/clampToViewport.test.ts`
Expected: PASS.

- [x] **Step 5: Write the failing reducer tests**

`src/windows/state.test.ts`:

```ts
import { windowReducer, initialState, focusedId, cascadePosition } from "./state";
import type { DesktopState, WindowId } from "./types";

const viewport = { width: 1200, height: 900 };
const size = { width: 400, height: 300 };

const open = (state: DesktopState, id: WindowId, singleWindow = false) =>
  windowReducer(state, { type: "OPEN", id, size, viewport, singleWindow });

const ids = (state: DesktopState) => state.windows.map(w => w.id);

describe("OPEN", () => {
  it("appends a new window and focuses it", () => {
    const state = open(initialState, "cv");
    expect(ids(state)).toEqual(["cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("focuses an already-open window instead of duplicating it", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "cv");
    expect(ids(state)).toEqual(["projects", "cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("restores and focuses a minimised window", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = open(state, "cv");
    expect(state.windows[0].minimised).toBe(false);
    expect(focusedId(state)).toBe("cv");
  });

  it("cascades a second window instead of stacking it exactly", () => {
    const state = open(open(initialState, "cv"), "projects");
    expect(state.windows[1].position).not.toEqual(state.windows[0].position);
  });

  it("places by open count, so focusing does not change where the next window lands", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    state = open(state, "about");
    const about = state.windows.find(w => w.id === "about")!;
    expect(about.position).toEqual(cascadePosition(2));
  });

  it("drops every other window when singleWindow is set", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "about", true);
    expect(ids(state)).toEqual(["about"]);
  });

  it("clamps the cascade position into a short viewport", () => {
    const shortViewport = { width: 300, height: 200 };
    const state = windowReducer(initialState, {
      type: "OPEN",
      id: "cv",
      size,
      viewport: shortViewport,
      singleWindow: false,
    });
    expect(state.windows[0].position).toEqual({ x: 0, y: 0 });
  });
});

describe("CLOSE", () => {
  it("removes the window and promotes the one beneath it", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "CLOSE", id: "projects" });
    expect(ids(state)).toEqual(["cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("ignores a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "CLOSE", id: "about" })).toEqual(state);
  });
});

describe("FOCUS", () => {
  it("moves the window to the top of the stack", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    expect(ids(state)).toEqual(["projects", "cv"]);
  });
});

describe("MINIMISE", () => {
  it("keeps the window in the array so its taskbar button remains", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    expect(ids(state)).toEqual(["cv"]);
    expect(state.windows[0].minimised).toBe(true);
  });

  it("hands focus to the next window down", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "MINIMISE", id: "projects" });
    expect(focusedId(state)).toBe("cv");
  });

  it("leaves nothing focused when the last window is minimised", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    expect(focusedId(state)).toBeNull();
  });
});

describe("TOGGLE_FROM_TASKBAR", () => {
  it("minimises a window that is currently focused", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(state.windows[0].minimised).toBe(true);
  });

  it("focuses an open but unfocused window", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(focusedId(state)).toBe("cv");
    expect(state.windows[1].minimised).toBe(false);
  });

  it("restores a minimised window", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(state.windows[0].minimised).toBe(false);
    expect(focusedId(state)).toBe("cv");
  });
});

describe("MOVE", () => {
  it("applies the new position", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MOVE", id: "cv", position: { x: 200, y: 150 }, viewport });
    expect(state.windows[0].position).toEqual({ x: 200, y: 150 });
  });

  it("clamps a position dragged off-screen", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, {
      type: "MOVE",
      id: "cv",
      position: { x: -400, y: -400 },
      viewport,
    });
    expect(state.windows[0].position).toEqual({ x: 0, y: 0 });
  });
});
```

- [x] **Step 6: Run them and watch them fail**

Run: `npm test src/windows/state.test.ts`
Expected: FAIL — cannot resolve `./state`.

- [x] **Step 7: Implement `src/windows/state.ts`**

The version below is what actually shipped, after a review pass ("fix round 1",
see the note at the end of this section) hardened the first draft. The first
draft used `export const CASCADE_SLOTS = 6` with a modulo in `cascadePosition`
and a bare `default: return state`; both were found to be dead/unsound and
replaced as described below.

```ts
import { clampToViewport } from "./clampToViewport";
import type { DesktopState, Point, WindowAction, WindowId, WindowInstance } from "./types";

const CASCADE_BASE: Point = { x: 48, y: 32 };
const CASCADE_STEP = 24;

export const initialState: DesktopState = { windows: [] };

/** Focus is derived, never stored, so it cannot disagree with the array. */
export function focusedId(state: DesktopState): WindowId | null {
  for (let i = state.windows.length - 1; i >= 0; i -= 1) {
    if (!state.windows[i].minimised) return state.windows[i].id;
  }
  return null;
}

/**
 * Placement is derived from how many windows are already open, not from the last
 * array entry: focusing reorders the array, so the last entry is not reliably the
 * most recently opened window.
 *
 * There are only four `WindowId` variants, so at most four windows can ever be
 * open at once and this is never asked to place a fifth — no modulo/wraparound
 * is needed to keep the cascade sane.
 */
export function cascadePosition(openCount: number): Point {
  return {
    x: CASCADE_BASE.x + openCount * CASCADE_STEP,
    y: CASCADE_BASE.y + openCount * CASCADE_STEP,
  };
}

/**
 * Moves a window to the end of the array. This is where the z-order trick
 * lives: array position stands in for stacking order (see `DesktopState` and
 * `focusedId`), which was chosen over a stored `zIndex`/`focused` field so
 * that focus can never drift out of sync with the array it is derived from.
 */
function moveToEnd(windows: readonly WindowInstance[], id: WindowId): WindowInstance[] {
  const target = windows.find(w => w.id === id);
  if (!target) return [...windows];
  return [...windows.filter(w => w.id !== id), target];
}

function updateWindow(
  windows: readonly WindowInstance[],
  id: WindowId,
  change: (instance: WindowInstance) => WindowInstance
): WindowInstance[] {
  return windows.map(w => (w.id === id ? change(w) : w));
}

/**
 * Makes a window the active, visible one: un-minimises it if needed and moves
 * it to the top of the stack. Shared by `FOCUS` and by `TOGGLE_FROM_TASKBAR`'s
 * restore branch, so there is exactly one place that implements what
 * "focus" means.
 */
function focusWindow(state: DesktopState, id: WindowId): DesktopState {
  const restored = updateWindow(state.windows, id, w => (w.minimised ? { ...w, minimised: false } : w));
  return { windows: moveToEnd(restored, id) };
}

export function windowReducer(state: DesktopState, action: WindowAction): DesktopState {
  switch (action.type) {
    case "OPEN": {
      const existing = state.windows.find(w => w.id === action.id);

      if (existing) {
        const others = action.singleWindow ? [] : state.windows.filter(w => w.id !== action.id);
        return { windows: [...others, { ...existing, minimised: false }] };
      }

      const others = action.singleWindow ? [] : state.windows;
      const position = clampToViewport(
        cascadePosition(others.length),
        action.size,
        action.viewport
      );
      return {
        windows: [...others, { id: action.id, position, size: action.size, minimised: false }],
      };
    }

    case "CLOSE": {
      if (!state.windows.some(w => w.id === action.id)) return state;
      return { windows: state.windows.filter(w => w.id !== action.id) };
    }

    case "FOCUS": {
      const target = state.windows.find(w => w.id === action.id);
      if (!target) return state;
      if (!target.minimised && focusedId(state) === action.id) return state;
      return focusWindow(state, action.id);
    }

    case "MINIMISE": {
      if (!state.windows.some(w => w.id === action.id)) return state;
      return { windows: updateWindow(state.windows, action.id, w => ({ ...w, minimised: true })) };
    }

    case "TOGGLE_FROM_TASKBAR": {
      if (!state.windows.some(w => w.id === action.id)) return state;
      if (focusedId(state) === action.id) {
        return { windows: updateWindow(state.windows, action.id, w => ({ ...w, minimised: true })) };
      }
      return focusWindow(state, action.id);
    }

    case "MOVE": {
      if (!state.windows.some(w => w.id === action.id)) return state;
      return {
        windows: updateWindow(state.windows, action.id, w => ({
          ...w,
          position: clampToViewport(action.position, w.size, action.viewport),
        })),
      };
    }

    default: {
      // Exhaustiveness check: if a WindowAction variant above is ever left
      // unhandled, `action` will not narrow to `never` here and this
      // assignment fails to compile.
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
```

- [x] **Step 8: Run the tests**

Run: `npm test src/windows`
Expected: PASS — all of `clampToViewport.test.ts` and `state.test.ts`.

- [x] **Step 9: Verify the purity constraint**

Run: `grep -nE "react|innerWidth|registry" src/windows/state.ts`
Expected: no matches. If anything matches, the reducer has picked up a dependency it must not have.

- [x] **Step 10: Commit**

```bash
git checkout -b feat/window-reducer
git add src/windows
git commit -m "feat: add pure window reducer with viewport clamping"
```

- [x] **Fix round 1 (post-review hardening)**

Code review found no live bugs, but flagged gaps the test suite would not have
caught and one broken safety mechanism. Fixed on the same branch, in a second
commit:

- **Exhaustiveness checking was dead.** `default: return state` swallowed any
  unhandled `WindowAction` variant silently. Replaced with `const exhaustive:
  never = action; return exhaustive;`, which fails to compile if a variant is
  ever left unhandled. Proved with a temporary seventh `MAXIMISE` variant
  (`npm run typecheck` failed with it present, passed with it removed).
  This also surfaced a real, independent defect: `npm run typecheck` (`tsc
  --noEmit` against the root solution-style `tsconfig.json`, which has `files:
  []`) silently checked zero files and always exited 0 — it had never actually
  type-checked anything. Only `tsc -b` (used by `npm run build`) walks the
  project references. Fixed by changing the `typecheck` script to `tsc -b
  --noEmit`.
- **`FOCUS` now un-minimises.** Previously `MINIMISE cv` then `FOCUS cv` left
  `cv` last in the array (nominally topmost) while still minimised — a
  violation of the module's own "last entry is focused" invariant. `FOCUS` on
  a minimised window now restores it. `TOGGLE_FROM_TASKBAR`'s restore branch
  reuses the same `focusWindow` helper rather than duplicating the logic.
- **`OPEN`-on-an-already-open-window is now covered by tests**: re-opening
  preserves a moved window's position and size, and `singleWindow` is
  respected even when the target is already open. The original implementation
  was already correct on both; only the tests were missing.
- **No-op actions now return the identical `state` reference** rather than an
  equal-but-new object — e.g. `FOCUS` on the window that is already focused
  and visible, or any action naming a `WindowId` that isn't open. This matters
  under `useReducer`: a fresh object reference re-renders the whole desktop on
  every dispatch even when nothing changed.
- **`DesktopState.windows` is now `readonly WindowInstance[]`**, so the
  reducer's immutability claim is compiler-enforced, not just convention.
- **`clampToViewport` rounds to whole pixels**, matching the pixel-crisp
  Windows 95 aesthetic; fractional coordinates were previously passed through
  unchanged.
- Dead cascade-wraparound logic removed: `CASCADE_SLOTS` (originally 6) could
  never be reached, since there are only four `WindowId` variants and thus at
  most four windows ever open — `cascadePosition` no longer uses a modulo, and
  a comment explains why that's safe.
- `CASCADE_BASE`, `CASCADE_STEP` are now module-private (nothing outside
  `state.ts` used them).
- `update` renamed to `updateWindow`.
- Added an immutability test that dispatches all six action types against a
  populated state and asserts the input `DesktopState` is never mutated
  (compared via a serialised snapshot before/after).
- Added tests for previously-untested but already-correct behaviour: `MOVE` /
  `MINIMISE` / `FOCUS` / `TOGGLE_FROM_TASKBAR` on an unknown/never-opened
  `WindowId`, `CLOSE` of a minimised window, `focusedId` returning `null` when
  every open window is minimised, `OPEN` with `singleWindow` when the target
  is already the only window open, and a zero-size viewport.

Test count grew from 23 to 37 in `src/windows` (55 across the whole suite).
`npm run lint && npm run typecheck && npm test && npm run build` all pass, and
the purity grep (`grep -nE "react|innerWidth|registry" src/windows/state.ts`)
is still empty.

---

### Task 7: Viewport hook, provider and consumer hook

**Files:**
- Create: `src/windows/useViewport.ts`, `src/windows/WindowsProvider.tsx`, `src/windows/useWindows.ts`, `src/windows/context.ts`
- Test: `src/windows/WindowsProvider.test.tsx`

**Interfaces:**
- Consumes: everything Task 6 produced.
- Produces (as shipped, after the round-1 hardening pass described at the end of this
  section — `useViewport` returns a ref, not a plain value):
  - `MOBILE_BREAKPOINT = 768` and `useViewport(): { viewportRef: RefObject<Viewport>; isMobile: boolean }`
  - `WindowsProvider: ({ children }: { children: ReactNode }) => JSX.Element`
  - `useWindows(): WindowsContextValue` with fields `windows` (`readonly WindowInstance[]`, matching
    `DesktopState.windows`), `focused`, `isMobile`, and methods `open`, `close`, `focus`, `minimise`,
    `toggleFromTaskbar`, `move`
- The context value and its methods are what Tasks 8 and 9 consume. Names are fixed here.

`context.ts` holds the `createContext` call on its own so that `WindowsProvider.tsx` exports only a component, which keeps the `react-refresh/only-export-components` ESLint rule quiet.

- [x] **Step 1: Write the failing test**

`src/windows/WindowsProvider.test.tsx` — the version below is what actually shipped, after
the round-1 hardening pass (see the note at the end of this section) added five behavioural
tests, a resize-identity test and a `useWindows`-outside-provider test, and strengthened the
`open()` size assertion. The first draft matched the brief's snippet verbatim (four tests, a
`toBeGreaterThan(0)` size check); all of that was found insufficient by review:

```tsx
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WindowsProvider } from "./WindowsProvider";
import { useWindows } from "./useWindows";
import { REGISTRY } from "./registry";

const wrapper = ({ children }: { children: ReactNode }) => (
  <WindowsProvider>{children}</WindowsProvider>
);

function setViewportWidth(width: number) {
  window.innerWidth = width;
  window.innerHeight = 900;
  window.dispatchEvent(new Event("resize"));
}

describe("WindowsProvider", () => {
  beforeEach(() => setViewportWidth(1200));

  it("starts with no windows open", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    expect(result.current.windows).toEqual([]);
    expect(result.current.focused).toBeNull();
  });

  it("opens a window at its registered default size", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    expect(result.current.windows).toHaveLength(1);
    expect(result.current.focused).toBe("cv");
    expect(result.current.windows[0].size).toEqual(REGISTRY.cv.defaultSize);
  });

  it("keeps two windows open on a desktop viewport", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    expect(result.current.windows).toHaveLength(2);
    expect(result.current.isMobile).toBe(false);
  });

  it("allows only one window at a time below the mobile breakpoint", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => setViewportWidth(400));
    expect(result.current.isMobile).toBe(true);
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects"]);
  });

  it("does not change context identity on a resize that stays on the same side of the breakpoint", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    const before = result.current;
    act(() => setViewportWidth(1201));
    expect(result.current).toBe(before);
  });

  it("closes a window, leaving the others open", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    act(() => result.current.close("cv"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects"]);
    expect(result.current.focused).toBe("projects");
  });

  it("focus brings a background window to the top and makes it the focused one", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    act(() => result.current.focus("cv"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects", "cv"]);
    expect(result.current.focused).toBe("cv");
  });

  it("minimising the focused window hands focus to the window beneath it", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    act(() => result.current.minimise("projects"));
    const minimised = result.current.windows.find(w => w.id === "projects");
    expect(minimised?.minimised).toBe(true);
    expect(result.current.focused).toBe("cv");
  });

  it("toggleFromTaskbar minimises the focused window, then restores and refocuses it", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.toggleFromTaskbar("cv"));
    expect(result.current.windows[0].minimised).toBe(true);
    expect(result.current.focused).toBeNull();
    act(() => result.current.toggleFromTaskbar("cv"));
    expect(result.current.windows[0].minimised).toBe(false);
    expect(result.current.focused).toBe("cv");
  });

  it("move clamps the requested position to stay inside the viewport", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    const { width, height } = REGISTRY.cv.defaultSize;
    act(() => result.current.move("cv", { x: 100_000, y: 100_000 }));
    const moved = result.current.windows[0];
    expect(moved.position.x).toBeLessThanOrEqual(1200 - width);
    expect(moved.position.y).toBeLessThanOrEqual(900 - height);
    expect(moved.position.x).toBeGreaterThanOrEqual(0);
    expect(moved.position.y).toBeGreaterThanOrEqual(0);
  });
});

describe("useWindows", () => {
  it("throws when rendered outside a WindowsProvider", () => {
    expect(() => renderHook(() => useWindows())).toThrow(
      "useWindows must be used inside a WindowsProvider"
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test src/windows/WindowsProvider.test.tsx`
Expected: FAIL — cannot resolve `./WindowsProvider`.

- [x] **Step 3: Implement `useViewport.ts`**

The only place in the codebase that reads `window.innerWidth` or knows the breakpoint. The
version below is what actually shipped, after the round-1 hardening pass at the end of this
section replaced the brief's plain-state version: the viewport is now exposed via a `useRef`
that `WindowsProvider` reads at dispatch time, and `isMobile` state only updates when the
boolean actually flips, so a resize that doesn't cross the breakpoint causes no re-render at
all.

```ts
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Viewport } from "./types";

export const MOBILE_BREAKPOINT = 768;

function read(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isBelowBreakpoint(viewport: Viewport): boolean {
  return viewport.width < MOBILE_BREAKPOINT;
}

/**
 * The viewport is exposed as a ref, not state. It changes on every resize
 * event, and `WindowsProvider`'s `open`/`move` callbacks only need its
 * current value at the moment they dispatch, not a fresh render every time
 * it changes. Putting it in state (as an object — always a new reference)
 * would churn those callbacks' identity on every resize, which cascades
 * through the memoised context value and re-renders the whole desktop even
 * when nothing observable changed. That would defeat the same-reference
 * no-op optimisation `windowReducer` was hardened to provide (see Task 6).
 *
 * `isMobile` is the only piece of viewport information that genuinely needs
 * to trigger a re-render, and the state setter below only fires it when the
 * boolean actually flips — a resize that stays on the same side of the
 * breakpoint must not cause a re-render either.
 */
export function useViewport(): { viewportRef: RefObject<Viewport>; isMobile: boolean } {
  const viewportRef = useRef<Viewport>(read());
  // Read directly rather than via `viewportRef.current`: refs must not be read during
  // render (react-hooks/refs), and this initial snapshot is taken at the same moment
  // the ref above was seeded, so the two agree.
  const [isMobile, setIsMobile] = useState(() => isBelowBreakpoint(read()));

  useEffect(() => {
    const onResize = () => {
      const next = read();
      viewportRef.current = next;
      const mobile = isBelowBreakpoint(next);
      setIsMobile(prev => (prev === mobile ? prev : mobile));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { viewportRef, isMobile };
}
```

- [x] **Step 4: Implement `context.ts`**

The shipped `windows` field is `readonly WindowInstance[]`, not the brief's
`WindowInstance[]` — `DesktopState.windows` is `readonly` (Task 6 hardening), and
`WindowsProvider` passes `state.windows` straight through with no copy, so the context
field must match rather than silently widen the guarantee.

```ts
import { createContext } from "react";
import type { Point, WindowId, WindowInstance } from "./types";

export interface WindowsContextValue {
  windows: readonly WindowInstance[];
  focused: WindowId | null;
  isMobile: boolean;
  open: (id: WindowId) => void;
  close: (id: WindowId) => void;
  focus: (id: WindowId) => void;
  minimise: (id: WindowId) => void;
  toggleFromTaskbar: (id: WindowId) => void;
  move: (id: WindowId, position: Point) => void;
}

export const WindowsContext = createContext<WindowsContextValue | null>(null);
```

- [x] **Step 5: Implement `WindowsProvider.tsx`**

The shipped version reads `viewportRef.current` at dispatch time instead of closing over a
`viewport` value, so `open`'s dependency array is `[isMobile, viewportRef]` and `move`'s is
`[viewportRef]` — neither churns on a resize, only `open` on an `isMobile` flip. (`viewportRef`
is included for lint completeness; a ref's identity from `useRef` never changes, so this has
no effect on how often the callbacks are recreated.)

```tsx
import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import { WindowsContext, type WindowsContextValue } from "./context";
import { REGISTRY } from "./registry";
import { focusedId, initialState, windowReducer } from "./state";
import { useViewport } from "./useViewport";
import type { Point, WindowId } from "./types";

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, initialState);
  const { viewportRef, isMobile } = useViewport();

  const open = useCallback(
    (id: WindowId) =>
      dispatch({
        type: "OPEN",
        id,
        size: REGISTRY[id].defaultSize,
        viewport: viewportRef.current,
        singleWindow: isMobile,
      }),
    [isMobile, viewportRef]
  );

  const move = useCallback(
    (id: WindowId, position: Point) =>
      dispatch({ type: "MOVE", id, position, viewport: viewportRef.current }),
    [viewportRef]
  );

  const close = useCallback((id: WindowId) => dispatch({ type: "CLOSE", id }), []);
  const focus = useCallback((id: WindowId) => dispatch({ type: "FOCUS", id }), []);
  const minimise = useCallback((id: WindowId) => dispatch({ type: "MINIMISE", id }), []);
  const toggleFromTaskbar = useCallback(
    (id: WindowId) => dispatch({ type: "TOGGLE_FROM_TASKBAR", id }),
    []
  );

  const value = useMemo<WindowsContextValue>(
    () => ({
      windows: state.windows,
      focused: focusedId(state),
      isMobile,
      open,
      close,
      focus,
      minimise,
      toggleFromTaskbar,
      move,
    }),
    [state, isMobile, open, close, focus, minimise, toggleFromTaskbar, move]
  );

  return <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>;
}
```

- [x] **Step 6: Implement `useWindows.ts`**

```ts
import { useContext } from "react";
import { WindowsContext, type WindowsContextValue } from "./context";

export function useWindows(): WindowsContextValue {
  const value = useContext(WindowsContext);
  if (!value) {
    throw new Error("useWindows must be used inside a WindowsProvider");
  }
  return value;
}
```

- [x] **Step 7: Create a provisional `registry.ts` so the provider compiles**

The full registry with components lands in Task 8. Sizes are what the provider needs now.

```ts
import type { Size, WindowId } from "./types";

export interface WindowSizes {
  defaultSize: Size;
}

export const REGISTRY: Record<WindowId, WindowSizes> = {
  about: { defaultSize: { width: 460, height: 340 } },
  cv: { defaultSize: { width: 720, height: 560 } },
  projects: { defaultSize: { width: 640, height: 480 } },
  contact: { defaultSize: { width: 420, height: 300 } },
};
```

- [x] **Step 8: Run the tests**

Run: `npm test src/windows`
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git checkout -b feat/windows-provider
git add src/windows
git commit -m "feat: add viewport hook and windows provider"
```

- [x] **Fix round 1 (post-review hardening)**

Code review found no live logic bugs in the reducer usage itself, but found one
substantive defect and three test-coverage gaps, all traced to the brief rather than to
implementation error. Fixed on the same branch, in a second commit:

- **A resize defeated the memoisation Task 6 was hardened to provide.** The brief's
  `useViewport` stored `viewport` in `useState` as a plain object; `read()` returns a
  fresh object on every resize, so `open`/`move`'s `useCallback` deps (which included
  `viewport`) churned identity on every resize event, cascading through the `useMemo`'d
  context value and re-rendering every consumer — even for a resize that stayed on the
  same side of the mobile breakpoint. Proved with a test that resizes 1200→1201px (no
  breakpoint crossing) and asserts the context value's identity is unchanged; the test
  failed against the original implementation (`AssertionError: expected {...} to be
  {...} // Object.is equality`) and passes after the fix. Fixed by moving the viewport
  into a `useRef` that `open`/`move` read at dispatch time (deps become `[isMobile,
  viewportRef]` and `[viewportRef]`), and by only calling `setIsMobile` when the
  boolean actually flips, so a same-side resize causes no re-render at all — React's
  own same-value-bailout means the whole provider tree skips rendering. (An earlier
  draft of the fix computed the initial `isMobile` state via
  `viewportRef.current` inside `useState`'s lazy initialiser; ESLint's
  `react-hooks/refs` rule correctly flagged this as reading a ref during render, so the
  initial read uses a direct `read()` call instead.)
- **Provider-level tests never exercised `move`, `close`, `focus`, `minimise` or
  `toggleFromTaskbar`.** Reviewer proof: temporarily replacing `focused: focusedId(state)`
  with a naive "last array element, ignoring minimised" implementation left the entire
  suite green. Added five behavioural tests (minimise-falls-through-to-the-window-beneath,
  explicit focus reordering the stack, toggleFromTaskbar minimising then restoring,
  close leaving siblings open, move clamping an out-of-bounds drag) and confirmed each is
  load-bearing: the injected `focusedId` bug failed the minimise and toggleFromTaskbar
  tests; a no-op `close`/`focus` failed their respective tests; an unclamped `move` failed
  its test. All four mutations were reverted after confirming green.
- **The `open()` size assertion (`toBeGreaterThan(0)`) could not tell "used the registry"
  from "used any positive number."** Reviewer proof: hardcoding `{width: 100, height: 100}`
  in `open` still passed. Replaced with `toEqual(REGISTRY.cv.defaultSize)`; confirmed the
  same hardcoded-size mutation now fails it.
- **`useWindows`'s throw outside a provider was untested.** Added a test rendering the hook
  with no wrapper and asserting it throws the expected message; confirmed a mutation that
  swallows the missing-context case instead of throwing fails the new test.

Test count grew from 41 to 48 in `src/windows` (66 across the whole suite).
`npm run lint && npm run typecheck && npm test && npm run build` all pass, and the
breakpoint-isolation grep (`grep -rnE "innerWidth|innerHeight|768" src/`) still only matches
`useViewport.ts` and its test.

---

### Task 8: Registry, drag hook, window chrome and window layer

**Files:**
- Modify: `src/windows/registry.ts` (replace the provisional version from Task 7)
- Create: `src/windows/useDrag.ts`, `src/windows/components/Window.tsx`, `src/windows/components/WindowLayer.tsx`
- Test: `src/windows/components/Window.test.tsx`, `src/windows/useDrag.test.ts` (added in the
  round-1 hardening pass described at the end of this section)

**Interfaces:**
- Consumes: `useWindows()` from Task 7; the four app components from Tasks 4–5.
- Produces (as shipped, after the round-1 hardening pass described at the end of this
  section — `WindowLayer` renders in `DESKTOP_ORDER`, not reducer array order, and
  `useDrag`'s `onPointerCancel` is its own handler rather than an alias for `onPointerUp`):
  - `REGISTRY: Record<WindowId, WindowDef>` where `WindowDef = { title: string; icon: string; component: ComponentType; defaultSize: Size }`
  - `DESKTOP_ORDER: WindowId[]` — the order icons appear on the desktop, and now also the
    fixed DOM order `WindowLayer` renders windows in, independent of stacking order
  - `WindowLayer: () => JSX.Element` — Task 9 renders this

- [x] **Step 1: Replace `registry.ts`**

Icons are emoji, matching the approach in `ben-fullstack-win95-portfolio`. Swapping in 16×16 PNGs later changes only this file.

```ts
import type { ComponentType } from "react";
import AboutWindow from "../apps/AboutWindow";
import ContactWindow from "../apps/ContactWindow";
import CvWindow from "../apps/CvWindow";
import ProjectsWindow from "../apps/ProjectsWindow";
import type { Size, WindowId } from "./types";

export interface WindowDef {
  title: string;
  icon: string;
  component: ComponentType;
  defaultSize: Size;
}

export const REGISTRY: Record<WindowId, WindowDef> = {
  about: {
    title: "About Me",
    icon: "👤",
    component: AboutWindow,
    defaultSize: { width: 460, height: 340 },
  },
  cv: {
    title: "Benjamin_Best_CV",
    icon: "📄",
    component: CvWindow,
    defaultSize: { width: 720, height: 560 },
  },
  projects: {
    title: "Projects",
    icon: "📁",
    component: ProjectsWindow,
    defaultSize: { width: 640, height: 480 },
  },
  contact: {
    title: "Contact",
    icon: "✉️",
    component: ContactWindow,
    defaultSize: { width: 420, height: 300 },
  },
};

/** Order the icons appear down the left of the desktop. */
export const DESKTOP_ORDER: WindowId[] = ["about", "cv", "projects", "contact"];
```

- [x] **Step 2: Write the failing test**

`src/windows/components/Window.test.tsx` — the version below is what actually shipped,
after the round-1 hardening pass (see the note at the end of this section) fixed the DOM
order used for the stacking assertion, strengthened two tests that passed without
exercising what they claimed to, and added a test for the `.inactive` title bar. The first
draft matched the brief's snippet verbatim (7 tests, dialogs compared by document position);
review found the stacking test's document-position comparison would break once windows
render in a fixed `DESKTOP_ORDER` rather than open order, and that two tests were not
load-bearing:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WindowsProvider } from "../WindowsProvider";
import { useWindows } from "../useWindows";
import WindowLayer from "./WindowLayer";

function Harness() {
  const { open, windows } = useWindows();
  return (
    <>
      <button onClick={() => open("cv")}>open cv</button>
      <button onClick={() => open("projects")}>open projects</button>
      {/* Test-only: exposes what a taskbar (Task 9) would show, so a test at this layer can
          tell "minimised" apart from "closed" without reaching into the reducer directly. */}
      <p data-testid="open-count">{windows.length}</p>
      <WindowLayer />
    </>
  );
}

const renderDesktop = () =>
  render(
    <WindowsProvider>
      <Harness />
    </WindowsProvider>
  );

describe("Window", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("renders nothing until a window is opened", () => {
    renderDesktop();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an accessible dialog with the registered title", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    expect(screen.getByRole("dialog", { name: "Benjamin_Best_CV" })).toBeInTheDocument();
  });

  it("closes when the close control is clicked", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("open-count")).toHaveTextContent("0");
  });

  it("hides a minimised window but keeps it open", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Minimize" }));
    // The dialog itself is gone either way (closed or minimised) — the thing that actually
    // distinguishes minimising from closing is that the instance survives in `windows`, so
    // its taskbar button (Task 9) would still be there. Assert that survival, not just the
    // dialog's absence.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("open-count")).toHaveTextContent("1");
  });

  it("moves focus into the window when it opens", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes the focused window on Escape, leaving unfocused windows open", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    // projects was opened last, so it is focused; only it should close.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Projects" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Benjamin_Best_CV" })).toBeInTheDocument();
  });

  it("stacks the most recently opened window on top", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    const cvZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Benjamin_Best_CV" })).zIndex
    );
    const projectsZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Projects" })).zIndex
    );
    expect(projectsZIndex).toBeGreaterThan(cvZIndex);
  });

  it("keeps windows in a stable DOM order when a background window is focused", async () => {
    // Focusing a background window changes its `zIndex` (asserted above) but must not
    // reorder the DOM: `WindowLayer` renders in a fixed order (`DESKTOP_ORDER`) precisely
    // so that focusing never moves a window's DOM node. If it did, a real browser would
    // implicitly release that window's pointer capture the instant the node moved — a bug
    // jsdom's pointer-capture stub cannot surface, so the meaningful thing to assert here
    // is the precondition it depends on: DOM order is unaffected by which window is on top.
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    const namesBefore = screen.getAllByRole("dialog").map(d => d.getAttribute("aria-label"));

    // projects opened last, so it is focused; clicking cv brings the background window forward.
    await user.click(screen.getByRole("dialog", { name: "Benjamin_Best_CV" }));
    const namesAfter = screen.getAllByRole("dialog").map(d => d.getAttribute("aria-label"));

    expect(namesAfter).toEqual(namesBefore);
    const cvZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Benjamin_Best_CV" })).zIndex
    );
    const projectsZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Projects" })).zIndex
    );
    expect(cvZIndex).toBeGreaterThan(projectsZIndex);
  });

  it("marks the focused window's title bar active and background windows inactive", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));

    const cvTitleBar = screen
      .getByRole("dialog", { name: "Benjamin_Best_CV" })
      .querySelector(".title-bar");
    const projectsTitleBar = screen
      .getByRole("dialog", { name: "Projects" })
      .querySelector(".title-bar");

    expect(cvTitleBar).toHaveClass("inactive");
    expect(projectsTitleBar).not.toHaveClass("inactive");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm test src/windows/components/Window.test.tsx`
Expected: FAIL — cannot resolve `./WindowLayer`.

- [x] **Step 4: Implement `useDrag.ts`**

The in-flight offset stays local, so dragging does not re-render the whole desktop. One `MOVE` is dispatched on release.

The version below is what actually shipped, after the round-1 hardening pass (see the note
at the end of this section) replaced the brief's snippet, which had two real bugs jsdom
cannot detect: `onPointerCancel` was aliased to `onPointerUp` (committing an aborted gesture
instead of discarding it, and calling `releasePointerCapture` on an already-inactive
pointer, which real browsers throw on), and `onPointerUp` read the in-flight offset from
React state rather than from the event, which is stale if pointerdown/pointermove/pointerup
land inside a single React batch.

```ts
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "./types";

interface UseDragOptions {
  position: Point;
  disabled: boolean;
  onCommit: (position: Point) => void;
}

export function useDrag({ position, disabled, onCommit }: UseDragOptions) {
  const [offset, setOffset] = useState<Point | null>(null);
  const start = useRef<{ pointer: Point; origin: Point } | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = {
      pointer: { x: event.clientX, y: event.clientY },
      origin: position,
    };
    setOffset({ x: 0, y: 0 });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current) return;
    setOffset({
      x: event.clientX - start.current.pointer.x,
      y: event.clientY - start.current.pointer.y,
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const { origin, pointer } = start.current;
    start.current = null;
    setOffset(null);
    // Computed from the event's own coordinates, not from `offset` state: if pointerdown,
    // pointermove and pointerup all land inside a single React batch, `offset` here can
    // still hold the stale `{ x: 0, y: 0 }` set by pointerdown, even though the pointer has
    // genuinely moved in between. `event.clientX/clientY` are always current, so the
    // commit can never fall behind the gesture that produced it.
    onCommit({
      x: origin.x + (event.clientX - pointer.x),
      y: origin.y + (event.clientY - pointer.y),
    });
  }

  // A `pointercancel` means the browser took the gesture away — a touch-scroll takeover, a
  // pen leaving range, the window losing focus — not that the user released the pointer at
  // its current position. The gesture must be abandoned, not committed: no `onCommit`, and
  // no `releasePointerCapture` either, since per the Pointer Events spec the pointer is
  // already inactive by the time `pointercancel` fires and real browsers throw calling it
  // again (jsdom's stub does not model this, which is why aliasing this to `onPointerUp`
  // stayed silent under test).
  function onPointerCancel() {
    if (!start.current) return;
    start.current = null;
    setOffset(null);
  }

  const dragPosition = offset
    ? { x: position.x + offset.x, y: position.y + offset.y }
    : position;

  return {
    dragPosition,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
```

- [x] **Step 5: Implement `Window.tsx`**

98.css requires the exact `aria-label` values `"Minimize"` and `"Close"` on the title-bar controls to render the right glyphs — the one place American spelling is used.

The version below is what actually shipped, after the round-1 hardening pass (see the note
at the end of this section) applied 98.css's `.inactive` class to the title bar when the
window is not focused. Without it, focus state had no visible representation at all — with
up to four dialogs open, nothing distinguished the active window from the background ones
for a sighted user.

```tsx
import { useEffect, useRef, type ReactNode } from "react";
import { useWindows } from "../useWindows";
import { useDrag } from "../useDrag";
import { TASKBAR_HEIGHT } from "../clampToViewport";
import type { Point, Size, WindowId } from "../types";

interface WindowProps {
  id: WindowId;
  title: string;
  position: Point;
  size: Size;
  zIndex: number;
  focused: boolean;
  children: ReactNode;
}

export default function Window({
  id,
  title,
  position,
  size,
  zIndex,
  focused,
  children,
}: WindowProps) {
  const { close, focus, minimise, move, isMobile } = useWindows();
  const bodyRef = useRef<HTMLDivElement>(null);

  const { dragPosition, handlers } = useDrag({
    position,
    disabled: isMobile,
    onCommit: next => move(id, next),
  });

  // Move focus into the window when it opens, so keyboard users land inside it.
  useEffect(() => {
    bodyRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(id);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focused, close, id]);

  const frame = isMobile
    ? { left: 0, top: 0, width: "100%", height: `calc(100% - ${TASKBAR_HEIGHT}px)` }
    : {
        left: dragPosition.x,
        top: dragPosition.y,
        width: size.width,
        height: size.height,
      };

  return (
    <div
      className="window absolute flex flex-col"
      role="dialog"
      aria-label={title}
      style={{ ...frame, zIndex }}
      onPointerDown={() => focus(id)}
    >
      <div
        // 98.css draws an active (blue) vs. inactive (grey) title bar via this class.
        // With up to four dialogs open at once, this is the only visual cue for which one
        // is active, for sighted users and not just for the Escape-key behaviour.
        className={focused ? "title-bar" : "title-bar inactive"}
        style={{ cursor: isMobile ? "default" : "move" }}
        {...handlers}
        onPointerDown={event => {
          // Pressing minimise or close must not begin a drag.
          if ((event.target as HTMLElement).closest(".title-bar-controls")) return;
          handlers.onPointerDown(event);
        }}
      >
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button type="button" aria-label="Minimize" onClick={() => minimise(id)} />
          <button type="button" aria-label="Close" onClick={() => close(id)} />
        </div>
      </div>
      <div ref={bodyRef} tabIndex={-1} className="window-body flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

- [x] **Step 6: Implement `WindowLayer.tsx`**

The version below is what actually shipped, after the round-1 hardening pass (see the note
at the end of this section) replaced the brief's `windows.map(...)`, which rendered windows
in reducer array order — the same order that changes on every `FOCUS`. Since the array
order was also the DOM order, focusing a background window reordered the keyed list and
React moved that window's DOM node in the tree, which implicitly releases pointer capture
per the Pointer Events spec. The fix renders in the fixed `DESKTOP_ORDER` instead, and uses
the window's position in the reducer's array *only* to compute `zIndex` — stacking is still
fully array-order-derived, but the DOM itself never reorders.

```tsx
import { DESKTOP_ORDER, REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import Window from "./Window";

/**
 * Rendered in the fixed `DESKTOP_ORDER`, never in the reducer's array order. Stacking is
 * still fully determined by array order via `zIndex` below — but if the DOM order tracked
 * the array too, focusing a background window would reorder this keyed list and React
 * would move that window's DOM node. Moving the element that currently holds pointer
 * capture implicitly releases it (Pointer Events spec), which would silently break a drag
 * that starts on a window brought forward by the same gesture. A fixed DOM order sidesteps
 * that entirely: only `style.zIndex` changes, never which node sits where in the tree.
 */
export default function WindowLayer() {
  const { windows, focused } = useWindows();

  return (
    <>
      {DESKTOP_ORDER.map(id => {
        const instance = windows.find(w => w.id === id);
        if (!instance || instance.minimised) return null;
        const zIndex = windows.indexOf(instance) + 1;
        const def = REGISTRY[id];
        const Body = def.component;
        return (
          <Window
            key={id}
            id={id}
            title={def.title}
            position={instance.position}
            size={instance.size}
            zIndex={zIndex}
            focused={focused === id}
          >
            <Body />
          </Window>
        );
      })}
    </>
  );
}
```

- [x] **Step 7: Run the tests**

Run: `npm test src/windows`
Expected: PASS.

- [x] **Step 8: Commit**

```bash
git checkout -b feat/window-chrome
git add src/windows
git commit -m "feat: add window chrome, drag handling and window layer"
```

- [x] **Fix round 1 (post-review hardening)**

Code review found three real browser bugs that jsdom's pointer-event/pointer-capture stubs
structurally cannot detect (which is exactly why the suite was green with them present),
plus one missing accessibility affordance and two tests that passed without exercising what
they claimed to. Fixed on the same branch, in a second commit:

- **`pointercancel` committed an aborted gesture instead of reverting it.** `useDrag`
  aliased `onPointerCancel` to `onPointerUp`, so a cancelled gesture (touch-scroll takeover,
  pen leaving range) left the window at the moved position instead of snapping back, and
  called `releasePointerCapture` on a pointer the Pointer Events spec already considers
  inactive by the time `pointercancel` fires — real browsers throw there; jsdom's stub does
  not model it. `onPointerCancel` is now its own handler: it clears `start.current` and the
  offset without calling `onCommit` and without releasing capture.
- **`onPointerUp` read the in-flight offset from a stale closure.** If pointerdown,
  pointermove and pointerup land inside a single React batch, `offset` state can still hold
  the value set by pointerdown, silently discarding the drag. The commit is now computed
  from the event's own `clientX`/`clientY` against the coordinates captured at
  `pointerdown`, which removes the whole class of staleness rather than patching around it.
- **Focusing a background window defeated its own pointer capture.** `Window`'s outer
  `<div>` dispatches `focus(id)` on pointerdown, which moves that window's entry to the end
  of the reducer's array; `WindowLayer` rendered a keyed list in that same array order, so
  React reparented the DOM node the instant the gesture began — and moving the element
  holding pointer capture implicitly releases it. Fixed by rendering `WindowLayer` in the
  fixed `DESKTOP_ORDER` (see Step 6 above) and using array position only to compute
  `zIndex`. The DOM order is proved stable across a focus change by a new test; the earlier
  stacking test (which compared dialogs by document position) was rewritten to select by
  accessible name, since document position is no longer tied to open order.
- **Nothing ever looked unfocused.** `focused` only gated the Escape listener; 98.css ships
  a `.title-bar.inactive` style that nothing in `src/` used, so with up to four `role="dialog"`
  windows open, no sighted or assistive-technology user could tell which was active.
  `Window` now applies `inactive` to the title bar whenever it is not focused; covered by a
  new test asserting the focused window's title bar lacks the class and a background
  window's has it.
- **Two tests were not load-bearing**, both proved by injection: "hides a minimised window
  but keeps it open" asserted only that the dialog was gone, which is equally true if the
  window had been closed — it never tested the "keeps it open" half of its own name. It now
  also asserts the window survives in `windows` (exposed test-only via an `open-count`
  element in the harness, standing in for what a taskbar button would show). "closes the
  focused window on Escape" opened only one window, so the `if (!focused) return` guard was
  provably unnecessary to pass it. It now opens two windows and asserts Escape closes only
  the focused one.
- **Title-bar controls had no visible focus indicator.** 98.css sets `outline: none` on
  `.title-bar-controls button:focus`. `src/index.css` already solves the identical problem
  for `.desktop-icon:focus-visible`; the same fix (`outline: 1px dotted #000; outline-offset:
  1px;`) is now applied to `.title-bar-controls button:focus-visible`.
- Added `src/windows/useDrag.test.ts`: two unit tests calling the hook's handlers directly
  with hand-built pointer events, rather than firing a real gesture through jsdom (which
  is deliberately out of scope, per docs/DESIGN.md §8, precisely because jsdom's pointer
  capture cannot be trusted). One proves the stale-closure fix by dispatching
  pointerdown/pointermove/pointerup inside a single `act` and asserting the commit still
  uses the moved coordinates; the other proves `pointercancel` never calls `onCommit`.

Test count grew from 55 to 59 in `src/windows` (77 across the whole suite).
`npm run lint && npm run typecheck && npm test && npm run build` all pass.

---

### Task 9: Desktop, icons and taskbar

The first task where the site looks like a desktop.

**Files:**
- Create: `src/windows/components/DesktopIcon.tsx`, `src/windows/components/Desktop.tsx`, `src/windows/components/Taskbar.tsx`
- Modify: `src/App.tsx`, `src/windows/components/Window.tsx` (round-1 hardening only — see below)
- Test: `src/windows/components/Desktop.test.tsx`, `src/windows/components/Taskbar.test.tsx`

**Interfaces:**
- Consumes: `useWindows()`, `REGISTRY`, `DESKTOP_ORDER`, `WindowLayer`, `profile`.
- Produces: the finished `App`.

- [x] **Step 1: Write the failing test**

`src/windows/components/Desktop.test.tsx` — the version below is what actually shipped,
after the round-1 hardening pass (see the note at the end of this section) added tests for
the mobile focus-restoration bug, `aria-pressed`, `pointer-events-none`, and `inert`, and
scoped every icon lookup with `within(desktop)` (`desktop = screen.getByRole("main")`)
rather than the brief's bare `screen.getByRole("button", { name: ... })` — a taskbar button
and a desktop icon can share an accessible name, so an unscoped query is only unambiguous by
coincidence of which test action happens to have removed the taskbar button first:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { profile } from "../../content/profile";
import { DESKTOP_ORDER, REGISTRY } from "../registry";

describe("Desktop", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("shows the name and summary without any interaction", () => {
    render(<App />);
    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByText(profile.summary)).toBeInTheDocument();
  });

  it("renders one icon per registered window", () => {
    render(<App />);
    const desktop = screen.getByRole("main");
    for (const id of DESKTOP_ORDER) {
      expect(within(desktop).getByRole("button", { name: REGISTRY[id].title })).toBeInTheDocument();
    }
  });

  it("opens a window when its icon is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("dialog", { name: "Projects" })).toBeInTheDocument();
  });

  it("adds a taskbar button per open window", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).queryAllByRole("button")).toHaveLength(0);
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(within(taskbar).getAllByRole("button")).toHaveLength(1);
  });

  it("minimises and restores from the taskbar", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    const taskbarButton = within(taskbar).getByRole("button", { name: /projects/i });

    await user.click(taskbarButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(taskbarButton);
    expect(screen.getByRole("dialog", { name: "Projects" })).toBeInTheDocument();
  });

  it("returns focus to the desktop icon after closing a window", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(desktop).getByRole("button", { name: "Projects" })).toHaveFocus();
  });

  it("returns focus to the taskbar button after minimising a window from its title bar", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Minimize" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).getByRole("button", { name: /projects/i })).toHaveFocus();
  });

  it("keeps focus inside the newly opened window when opening it discards another window on mobile", async () => {
    window.innerWidth = 500;
    window.innerHeight = 700;
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");

    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    await user.click(within(desktop).getByRole("button", { name: "Contact" }));

    expect(screen.queryAllByRole("dialog")).toHaveLength(1);
    const dialog = screen.getByRole("dialog", { name: "Contact" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("marks only the focused window's taskbar button as pressed", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    await user.click(within(desktop).getByRole("button", { name: "Contact" }));

    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    const projectsButton = within(taskbar).getByRole("button", { name: /projects/i });
    const contactButton = within(taskbar).getByRole("button", { name: /contact/i });

    expect(contactButton).toHaveAttribute("aria-pressed", "true");
    expect(projectsButton).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the name and summary block non-interactive so it does not swallow clicks meant for windows beneath it", () => {
    render(<App />);
    expect(screen.getByTestId("desktop-summary")).toHaveClass("pointer-events-none");
  });

  it("leaves the icon column and summary block interactive on desktop even with a window open", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByTestId("desktop-icons")).not.toHaveAttribute("inert");
    expect(screen.getByTestId("desktop-summary")).not.toHaveAttribute("inert");
  });

  it("makes the icon column and summary block inert while a window covers them on mobile", async () => {
    window.innerWidth = 500;
    window.innerHeight = 700;
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByTestId("desktop-icons")).toHaveAttribute("inert");
    expect(screen.getByTestId("desktop-summary")).toHaveAttribute("inert");
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npm test src/windows/components/Desktop.test.tsx`
Expected: FAIL — no `toolbar` role and no icon buttons. (The tests above are the final,
post-review set; the first draft matched the brief's five tests verbatim and failed the
same way.)

- [x] **Step 3: Implement `DesktopIcon.tsx`**

The first draft used `forwardRef` so `Desktop` could focus an icon after a state-diffing
effect decided it should. Round-1 review found that diffing approach unsound (see the note
at the end of this section) and replaced it with a plain `id` prop that `Window.tsx` looks
up directly — `forwardRef` is gone, which also resolves I3 (React 19 treats `ref` as a
normal prop; `forwardRef` is deprecated):

```tsx
interface DesktopIconProps {
  /** DOM id, e.g. `icon-projects` — `Window.tsx` looks this up by id to return focus here
   *  after this window closes (see the comment on its Close/Escape handlers). */
  id: string;
  label: string;
  icon: string;
  onOpen: () => void;
}

export default function DesktopIcon({ id, label, icon, onOpen }: DesktopIconProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onOpen}
      aria-label={label}
      /* `.desktop-icon` is unlayered CSS in index.css. Tailwind utilities cannot undo
         98.css's button styling here — see the cascade note in Task 1, Step 5. */
      className="desktop-icon"
    >
      <span aria-hidden="true" className="text-4xl">
        {icon}
      </span>
      <span className="text-center text-xs leading-tight">{label}</span>
    </button>
  );
}
```

- [x] **Step 4: Implement `Taskbar.tsx`**

The clock is unchanged from the brief. The `onButtonRef` prop from the first draft (paired
with `DesktopIcon`'s `forwardRef`) is gone for the same reason: each taskbar button now
carries its own `id={`taskbar-${instance.id}`}`, which `Window.tsx`'s Minimize handler looks
up directly instead of `Desktop` reconstructing intent from a ref map and a state diff:

```tsx
import { useEffect, useState } from "react";
import { REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import { TASKBAR_HEIGHT } from "../clampToViewport";

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // A 30s tick is coarse enough not to matter for a HH:MM clock but frequent enough to
    // look live. `window.setInterval`/`clearInterval` (not the bare globals) keep this on
    // the DOM timer types rather than Node's, and the cleanup below is what stops it from
    // outliving the component — including in tests, where an unmounted-but-still-ticking
    // Taskbar would otherwise keep scheduling `setState` calls for the rest of the run.
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function Taskbar() {
  const { windows, focused, toggleFromTaskbar } = useWindows();
  const time = useClock();

  return (
    <footer
      className="flex shrink-0 items-center justify-between gap-2 px-2"
      style={{ height: TASKBAR_HEIGHT, background: "#c0c0c0" }}
    >
      <div role="toolbar" aria-label="Open windows" className="flex flex-1 items-center gap-1">
        {windows.map(instance => (
          <button
            key={instance.id}
            // `Window.tsx`'s Minimize handler focuses this id directly after minimising,
            // rather than Desktop reconstructing intent from a state diff — see Window.tsx.
            id={`taskbar-${instance.id}`}
            type="button"
            onClick={() => toggleFromTaskbar(instance.id)}
            aria-pressed={focused === instance.id}
            className="max-w-40 truncate"
          >
            {REGISTRY[instance.id].title}
          </button>
        ))}
      </div>
      <div className="status-bar m-0">
        <p className="status-bar-field">{time}</p>
      </div>
    </footer>
  );
}
```

- [x] **Step 5: Implement `Desktop.tsx`**

The first draft matched the brief closely, plus two ref maps and a `useEffect` that diffed
`windows` across renders to decide whether a window had just closed or been minimised, and
sent focus to that window's icon or taskbar button accordingly. Round-1 review found that
diff ambiguous in exactly the case that matters most for mobile: on mobile, opening a second
window discards the first outright (`singleWindow: true`), which the diff could not
distinguish from that first window closing — so opening Contact while Projects was open
sent focus backwards, to Projects' now-hidden icon, instead of leaving it in the new Contact
window. The fix moves focus restoration into the control that causes the change (see
`Window.tsx` below) and deletes the ref maps, the diffing effect and `forwardRef` entirely —
about 45 lines down to a handful of `id` props. `Desktop.tsx` also now applies `inert` (I5)
to the icon column and summary block while a mobile window covers them, so they drop out of
the tab order instead of staying reachable while invisible, and both get a `data-testid` so
tests can target them without depending on icon count or label text:

```tsx
import { profile } from "../../content/profile";
import { DESKTOP_ORDER, REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import DesktopIcon from "./DesktopIcon";
import Taskbar from "./Taskbar";
import WindowLayer from "./WindowLayer";

export default function Desktop() {
  const { open, isMobile, focused } = useWindows();

  // On mobile a window goes full-screen and covers the icons and summary block entirely
  // (see Window.tsx's mobile frame), but without this they would stay in the tab order —
  // invisible stops for keyboard and screen-reader users navigating past the window that
  // is actually on screen. `focused !== null` means an unminimised window is being shown
  // (see `focusedId` in state.ts), which is exactly when there is something covering them.
  const hiddenBehindMobileWindow = isMobile && focused !== null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#008080]">
      <main className="relative flex-1 overflow-hidden">
        <div
          // Test-only: lets tests target this exact container regardless of icon count or
          // label text (see Desktop.test.tsx's `inert` assertions).
          data-testid="desktop-icons"
          className="flex flex-col items-start gap-2 p-4"
          inert={hiddenBehindMobileWindow}
        >
          {DESKTOP_ORDER.map(id => (
            <DesktopIcon
              key={id}
              id={`icon-${id}`}
              label={REGISTRY[id].title}
              icon={REGISTRY[id].icon}
              onOpen={() => open(id)}
            />
          ))}
        </div>

        <div
          // Test-only: see the `data-testid="desktop-icons"` note above.
          data-testid="desktop-summary"
          // pointer-events-none keeps this decorative block from swallowing clicks meant
          // for a window rendered beneath it (see WindowLayer, which is a sibling below).
          className="pointer-events-none absolute bottom-8 right-8 max-w-md text-right text-white md:max-w-lg"
          inert={hiddenBehindMobileWindow}
        >
          <h1 className="mb-2 text-4xl font-bold">{profile.name}</h1>
          <p className="mb-2 text-sm">{profile.headline}</p>
          <p className="text-sm leading-snug">{profile.summary}</p>
        </div>

        <WindowLayer />
      </main>

      <Taskbar />
    </div>
  );
}
```

`pointer-events-none` on the summary block keeps it from swallowing clicks meant for windows beneath it.

- [x] **Step 5a (round-1 addition): move focus restoration into `Window.tsx`**

`Window.tsx` is Task 8 code, but this is the step that changed it, so it belongs here. The
Close and Minimize handlers, and the Escape handler, now call `close`/`minimise` and then
look up their own focus-return target by id (`icon-${id}` or `taskbar-${id}`) rather than
`Desktop` inferring it after the fact; Close additionally wraps its call in `flushSync` (see
below):

```tsx
/**
 * Focus-return targets for closing/minimising a window, keyed by id (see `DesktopIcon.tsx`
 * and `Taskbar.tsx`, which render elements with exactly these ids). Reconstructing "what
 * should get focus" from a state diff after the fact was tried and dropped — see this
 * section's fix round 1 note — because it cannot tell "this window closed" apart from
 * "this window was discarded by another OPEN on mobile", where the reducer clears every
 * other window (`singleWindow: true`). The control that causes the change knows
 * unambiguously what it did, so it is what restores focus.
 */
function focusIcon(id: WindowId) {
  document.getElementById(`icon-${id}`)?.focus();
}

function focusTaskbarButton(id: WindowId) {
  document.getElementById(`taskbar-${id}`)?.focus();
}

// ...inside Window():

// `flushSync` forces the close state update (and, on mobile, the resulting `inert`
// removal from the icon column — see Desktop.tsx) to commit before the next line runs.
// Without it, the remaining synchronous code below would still be looking at last
// render's DOM, where the icon could still be `inert` and refuse a programmatic
// `.focus()` call.
const handleClose = useCallback(() => {
  flushSync(() => close(id));
  focusIcon(id);
}, [close, id]);

// No `flushSync` needed here, unlike `handleClose` above: `<Taskbar />` is a sibling of
// `<main>` (see Desktop.tsx), so its buttons are never made `inert`, and a taskbar button
// stays mounted for as long as its window exists, so there is no stale-DOM race for the
// synchronous `.focus()` call below to lose.
const handleMinimise = useCallback(() => {
  minimise(id);
  focusTaskbarButton(id);
}, [minimise, id]);

useEffect(() => {
  if (!focused) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") handleClose();
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [focused, handleClose]);
```

`flushSync` on close is the one addition beyond what review specified: without it, `inert`
(added in the same round, to the icon column's container) could still be true on the icon
at the exact moment `.focus()` runs, since the state update it depends on has not yet
committed — the DOM a synchronous handler sees between two of its own statements is still
last render's. `flushSync` forces the commit first. React 19 flushing discrete event updates
synchronously is true of *existence* (the icon and taskbar button are always mounted, never
conditionally, so neither needed the flush to be found at all) but not of *attribute
freshness*, which is what `inert` depends on. Minimise never gains an `inert` target in the
first place — `<Taskbar />` is a sibling of `<main>`, outside the subtree `inert` is ever
applied to — so `handleMinimise` does not call `flushSync` at all.

I4 was also fixed on `Window.tsx` in this pass: the mobile frame's height was
`calc(100% - ${TASKBAR_HEIGHT}px)`, double-subtracting the taskbar's height because the
`100%` it starts from already resolves against `main`, whose height already excludes the
taskbar (see `Desktop.tsx`'s flex column). It is now plain `height: "100%"`.

- [x] **Step 6: Rewrite `App.tsx`**

```tsx
import Desktop from "./windows/components/Desktop";
import { WindowsProvider } from "./windows/WindowsProvider";

export default function App() {
  return (
    <WindowsProvider>
      <Desktop />
    </WindowsProvider>
  );
}
```

`src/App.test.tsx` needed no changes — its existing `getByRole("main")` assertion already
holds against `Desktop`'s `<main>`.

- [x] **Step 7: Run the whole suite**

Run: `npm test`
Expected: PASS, including the Task 1 smoke test — `Desktop` renders a `main` landmark.
Shipped at 90 tests (77 before this task, +7 in the first Desktop.test.tsx draft, +1 in
Taskbar.test.tsx, +5 added during round-1 review: the mobile focus-restoration regression
test, `aria-pressed`, `pointer-events-none`, and two `inert` tests).

- [ ] **Step 8: Verify it in a browser**

Run: `npm run dev`

Check by hand, because these are the parts the tests deliberately do not cover:
- windows drag by their title bar and cannot be dragged off-screen
- clicking a background window brings it to the front
- at a narrow window width, windows go full-screen and the title bar no longer drags
- the CV downloads

Deliberately not run by the implementing agent in either round — the coordinator verifies this manually.

- [x] **Step 9: Commit**

```bash
git checkout -b feat/desktop-and-taskbar
git add src
git commit -m "feat: add desktop, icons and taskbar"
```

- [x] **Fix round 1 (post-review hardening)**

Code review found one Critical and five Important issues. Fixed on the same branch, in a
second commit:

- **C1 (Critical) — on mobile, opening a second window sent focus to the wrong icon.**
  `Desktop`'s first draft restored focus by diffing the reducer's `windows` array across
  renders: a window that was previously open and unminimised, and is now absent, was
  assumed to have *closed*, and focus went to its icon. But on mobile `OPEN` carries
  `singleWindow: true`, which discards every other window — so opening Contact while
  Projects was open also made Projects "absent", and the diff could not tell that apart
  from Projects having closed. Focus jumped to Projects' icon, now sitting behind a
  full-screen Contact window that Window.tsx's own mount effect had *already* focused
  correctly — `Desktop`'s effect ran after and silently overwrote it, because child effects
  flush before parent effects. Proven at 500px: tap Projects, then Contact, and
  `document.activeElement` was the Projects icon.
- **C2 — the fix: move focus restoration into the control that causes the change.**
  Reconstructing intent from a state diff is inherently ambiguous; C1 is that ambiguity
  surfacing. `DesktopIcon` and each taskbar button now carry derivable ids (`icon-${id}`,
  `taskbar-${id}`), and `Window.tsx`'s Close/Minimize/Escape handlers call
  `close`/`minimise` and then focus their own known target by id directly (see Step 5a
  above). This deletes both ref maps, the diffing effect, `previousWindowsRef` and
  `forwardRef` — roughly 45 lines down to a handful of `id` props and two focus-lookup
  functions — and fixes C1 for free: opening a second window no longer runs any effect that
  second-guesses which window Window.tsx's own mount-focus effect just focused correctly.
  The two original focus-return tests (close → icon, minimise → taskbar button) still pass
  unchanged; a new test proves the mobile regression is gone by opening Projects then
  Contact at 500px and asserting focus stays inside the Contact dialog.
- **I1 — `aria-pressed` was untested.** Inverting it entirely
  (`focused !== instance.id`) left all 85 tests passing. Added a test that opens two
  windows and asserts the focused one's taskbar button is `aria-pressed="true"` and the
  other's is `"false"`.
- **I2 — `pointer-events-none` was untested.** Removing it left all 85 tests passing. A
  true click-through test is awkward in jsdom, so the added test asserts the class directly
  on the summary block (now reachable via `data-testid="desktop-summary"`), with a comment
  on why the class matters.
- **I3 — dropped `forwardRef` from `DesktopIcon`.** Moot once C2 removed the ref entirely,
  but the deprecated pattern would otherwise have been left behind.
- **I4 — mobile windows were 40px too short.** See Step 5a above: `Window.tsx`'s mobile
  frame double-subtracted `TASKBAR_HEIGHT`, since the `100%` it started from (`main`'s
  height) already excluded the taskbar. Now plain `height: "100%"`. This is Task 8 code, but
  Task 9 is the first commit where a mobile window actually renders, so the gap was only
  visible here.
- **I5 — desktop icons stayed tabbable behind a full-screen mobile window.** Non-modal is
  right on desktop, but at mobile widths the open window covers everything and the four
  icons (plus the name/summary block) were still reachable by keyboard while invisible.
  `Desktop.tsx` now applies `inert` to both when `isMobile && focused !== null`. Two tests
  cover both branches: inert on mobile with a window open, not inert on desktop with a
  window open.
- **Test/report accuracy fixes:** `Taskbar.test.tsx`'s `as number` cast on the interval id
  was removed — under `vi.useFakeTimers()` it is a `Timeout`-like object, not a real
  `number`, despite the DOM-typed signature. Its dead `vi.advanceTimersByTime(60_000)` line
  (asserted nothing; React 19 silently ignores `setState` after unmount regardless) was
  deleted, leaving `expect(clearSpy).toHaveBeenCalledWith(timerId)` as the one load-bearing
  assertion. Every icon lookup in `Desktop.test.tsx` is now scoped with
  `within(screen.getByRole("main"))`, including the one flagged in review that happened to
  work only because closing (unlike minimising) also removes the matching taskbar button.
  The task-9 report's claim that focus restoration "diffs ... each render" was corrected —
  it ran in a `useEffect`, not during render; that distinction is the difference between a
  sound pattern and an anti-pattern, and StrictMode safety depends on it.

Test count grew from 85 to 90 across the whole suite (72 of those in `src/windows`).
`npm run lint && npm run typecheck && npm test && npm run build` all pass.

---

### Task 10: Favicon, metadata and final verification

**Files:**
- Create: `public/favicon.ico`
- Modify: `index.html`, `README.md`

**Interfaces:**
- Consumes: everything.
- Produces: a deployable build.

- [ ] **Step 1: Add the favicon and page metadata**

Replace the Vite default favicon. In `index.html`:

```html
<title>Benjamin Best — Data Engineer</title>
<meta name="description" content="Benjamin Best — data engineer in London. CV, projects and contact details." />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<link rel="icon" href="/favicon.ico" />
```

Also add Open Graph tags, since the link will be pasted into applications and messages:

```html
<meta property="og:title" content="Benjamin Best — Data Engineer" />
<meta property="og:description" content="CV, projects and contact details, in a Windows 95 desktop." />
<meta property="og:type" content="website" />
```

- [ ] **Step 2: Confirm nothing private shipped**

```bash
npm run build
grep -rE "\+44|07[0-9]{9}" dist/assets/ || echo "no phone number in the bundle"
```

Expected: `no phone number in the bundle`. The PDF in `public/` still contains it, which is the accepted trade-off recorded in `docs/DESIGN.md` §4.

- [ ] **Step 3: Run every check**

Run: `npm run lint && npm run typecheck && npm run test:coverage && npm run build`
Expected: all clean.

- [ ] **Step 4: Update the README**

Add a short "What's here" section and note that hosting is not yet chosen.

- [ ] **Step 5: Commit**

```bash
git checkout -b chore/metadata-and-favicon
git add -A
git commit -m "chore: add favicon, page metadata and open graph tags"
```

---

## Follow-ups, deliberately not in this plan

- **Hosting.** Design decision deferred; pick a target and add a deploy workflow.
- **Web-shortened CV bullets.** Currently verbatim from `cv.yml`. Any trimming needs Ben's sign-off against `docs/Verified_Facts_and_Bullets.md` in the `cv` repo.
- **Welcome dialog** on first load — considered during design and deferred.
- **Window resizing**, Start menu, boot sequence.
- **Deep-linking** (`?open=cv`), so an application can link straight to the CV window.
- **Spotify, scrum board, RAG chat** — each gets its own design cycle.
- **16×16 pixel icons** to replace the emoji, changing only `registry.ts`.
