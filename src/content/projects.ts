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
      "A Windows 95 desktop in the browser: a hand-written window manager with draggable, " +
      "focusable, minimisable windows built on a pure reducer.",
    why:
      "To have somewhere to put my CV that is more memorable than a PDF, and because a " +
      "window manager is a genuinely interesting bit of state modelling.",
    repoUrl: "https://github.com/benbest123/personal-site",
  },
];
