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
