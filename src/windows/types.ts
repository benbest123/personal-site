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
