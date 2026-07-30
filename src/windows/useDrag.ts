import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "./types";

interface UseDragOptions {
  position: Point;
  disabled: boolean;
  onCommit: (position: Point) => void;
}

export function useDrag({ position, disabled, onCommit }: UseDragOptions) {
  const [offset, setOffset] = useState<Point | null>(null);
  const start = useRef<{ pointer: Point; origin: Point } | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = {
      pointer: { x: event.clientX, y: event.clientY },
      origin: position,
    };
    setOffset({ x: 0, y: 0 });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current) return;
    setOffset({
      x: event.clientX - start.current.pointer.x,
      y: event.clientY - start.current.pointer.y,
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!start.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const { origin, pointer } = start.current;
    start.current = null;
    setOffset(null);
    // Computed from the event's own coordinates, not from `offset` state: if pointerdown,
    // pointermove and pointerup all land inside a single React batch, `offset` here can
    // still hold the stale `{ x: 0, y: 0 }` set by pointerdown, even though the pointer has
    // genuinely moved in between. `event.clientX/clientY` are always current, so the
    // commit can never fall behind the gesture that produced it.
    onCommit({
      x: origin.x + (event.clientX - pointer.x),
      y: origin.y + (event.clientY - pointer.y),
    });
  }

  // A `pointercancel` means the browser took the gesture away — a touch-scroll takeover, a
  // pen leaving range, the window losing focus — not that the user released the pointer at
  // its current position. The gesture must be abandoned, not committed: no `onCommit`, and
  // no `releasePointerCapture` either, since per the Pointer Events spec the pointer is
  // already inactive by the time `pointercancel` fires and real browsers throw calling it
  // again (jsdom's stub does not model this, which is why aliasing this to `onPointerUp`
  // stayed silent under test).
  function onPointerCancel() {
    if (!start.current) return;
    start.current = null;
    setOffset(null);
  }

  const dragPosition = offset
    ? { x: position.x + offset.x, y: position.y + offset.y }
    : position;

  return {
    dragPosition,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
