import { useEffect, useRef, type ReactNode } from "react";
import { useWindows } from "../useWindows";
import { useDrag } from "../useDrag";
import { TASKBAR_HEIGHT } from "../clampToViewport";
import type { Point, Size, WindowId } from "../types";

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

  useEffect(() => {
    if (!focused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(id);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focused, close, id]);

  const frame = isMobile
    ? { left: 0, top: 0, width: "100%", height: `calc(100% - ${TASKBAR_HEIGHT}px)` }
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
        className="title-bar"
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
          <button type="button" aria-label="Minimize" onClick={() => minimise(id)} />
          <button type="button" aria-label="Close" onClick={() => close(id)} />
        </div>
      </div>
      <div ref={bodyRef} tabIndex={-1} className="window-body flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
