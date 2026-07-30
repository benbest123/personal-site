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
    const { origin } = start.current;
    const moved = offset ?? { x: 0, y: 0 };
    start.current = null;
    setOffset(null);
    onCommit({ x: origin.x + moved.x, y: origin.y + moved.y });
  }

  const dragPosition = offset
    ? { x: position.x + offset.x, y: position.y + offset.y }
    : position;

  return {
    dragPosition,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
