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
