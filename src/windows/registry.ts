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
