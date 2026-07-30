import { clampToViewport } from "./clampToViewport";
import type { DesktopState, Point, WindowAction, WindowId, WindowInstance } from "./types";

export const CASCADE_BASE: Point = { x: 48, y: 32 };
export const CASCADE_STEP = 24;
export const CASCADE_SLOTS = 6;

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
 */
export function cascadePosition(openCount: number): Point {
  const slot = openCount % CASCADE_SLOTS;
  return {
    x: CASCADE_BASE.x + slot * CASCADE_STEP,
    y: CASCADE_BASE.y + slot * CASCADE_STEP,
  };
}

function moveToEnd(windows: WindowInstance[], id: WindowId): WindowInstance[] {
  const target = windows.find(w => w.id === id);
  if (!target) return windows;
  return [...windows.filter(w => w.id !== id), target];
}

function update(
  windows: WindowInstance[],
  id: WindowId,
  change: (instance: WindowInstance) => WindowInstance
): WindowInstance[] {
  return windows.map(w => (w.id === id ? change(w) : w));
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

    case "CLOSE":
      return { windows: state.windows.filter(w => w.id !== action.id) };

    case "FOCUS":
      return { windows: moveToEnd(state.windows, action.id) };

    case "MINIMISE":
      return { windows: update(state.windows, action.id, w => ({ ...w, minimised: true })) };

    case "TOGGLE_FROM_TASKBAR": {
      if (focusedId(state) === action.id) {
        return { windows: update(state.windows, action.id, w => ({ ...w, minimised: true })) };
      }
      const restored = update(state.windows, action.id, w => ({ ...w, minimised: false }));
      return { windows: moveToEnd(restored, action.id) };
    }

    case "MOVE":
      return {
        windows: update(state.windows, action.id, w => ({
          ...w,
          position: clampToViewport(action.position, w.size, action.viewport),
        })),
      };

    default:
      return state;
  }
}
