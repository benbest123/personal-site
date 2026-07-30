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
