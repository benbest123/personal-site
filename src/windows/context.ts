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
