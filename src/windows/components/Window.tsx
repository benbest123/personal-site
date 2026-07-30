import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useWindows } from "../useWindows";
import { useDrag } from "../useDrag";
import type { Point, Size, WindowId } from "../types";

/**
 * Focus-return targets for closing/minimising a window, keyed by id (see `DesktopIcon.tsx`
 * and `Taskbar.tsx`, which render elements with exactly these ids). Reconstructing "what
 * should get focus" from a state diff after the fact was tried and dropped — see Task 9's
 * fix round 1 report — because it cannot tell "this window closed" apart from "this window
 * was discarded by another OPEN on mobile", where the reducer clears every other window
 * (`singleWindow: true`). The control that causes the change knows unambiguously what it
 * did, so it is what restores focus.
 */
function focusIcon(id: WindowId) {
  document.getElementById(`icon-${id}`)?.focus();
}

function focusTaskbarButton(id: WindowId) {
  document.getElementById(`taskbar-${id}`)?.focus();
}

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

  // `flushSync` forces the close state update — and, on mobile, the resulting `inert`
  // removal from the icon column (see Desktop.tsx) — to commit before the next line runs.
  // Without it, the remaining synchronous code below would still be looking at last
  // render's DOM, where the icon could still be `inert` and refuse a programmatic
  // `.focus()` call.
  const handleClose = useCallback(() => {
    flushSync(() => close(id));
    focusIcon(id);
  }, [close, id]);

  // No `flushSync` needed here, unlike `handleClose` above: `<Taskbar />` is a sibling of
  // `<main>` (see Desktop.tsx), so its buttons are never made `inert`, and a window's
  // taskbar button stays mounted for as long as the window itself exists (minimising
  // never removes it), so there is no stale-DOM race for a synchronous `.focus()` call to
  // lose.
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

  const frame = isMobile
    ? // `main` (this element's positioned ancestor) already excludes the taskbar's height —
      // see Desktop.tsx's flex column — so `100%` here already stops above it. Subtracting
      // TASKBAR_HEIGHT again left a teal gap the height of the taskbar above the real one.
      { left: 0, top: 0, width: "100%", height: "100%" }
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
        // With up to four dialogs open at once, this is the only visual cue for which
        // one is active, for sighted users and not just for the Escape-key behaviour.
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
          <button type="button" aria-label="Minimize" onClick={handleMinimise} />
          <button type="button" aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div ref={bodyRef} tabIndex={-1} className="window-body flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
