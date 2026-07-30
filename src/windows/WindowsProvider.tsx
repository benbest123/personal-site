import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import { WindowsContext, type WindowsContextValue } from "./context";
import { REGISTRY } from "./registry";
import { focusedId, initialState, windowReducer } from "./state";
import { useViewport } from "./useViewport";
import type { Point, WindowId } from "./types";

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, initialState);
  const { viewport, isMobile } = useViewport();

  const open = useCallback(
    (id: WindowId) =>
      dispatch({
        type: "OPEN",
        id,
        size: REGISTRY[id].defaultSize,
        viewport,
        singleWindow: isMobile,
      }),
    [viewport, isMobile]
  );

  const move = useCallback(
    (id: WindowId, position: Point) => dispatch({ type: "MOVE", id, position, viewport }),
    [viewport]
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
