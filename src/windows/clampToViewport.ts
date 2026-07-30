import type { Point, Size, Viewport } from "./types";

export const TASKBAR_HEIGHT = 40;

/**
 * Keeps a window fully inside the desktop area, so its title bar can never be
 * dragged out of reach. A window larger than the viewport is pinned to the
 * origin. Coordinates are rounded to whole pixels to keep the pixel-crisp
 * Windows 95 look intact.
 */
export function clampToViewport(position: Point, size: Size, viewport: Viewport): Point {
  const maxX = Math.max(0, viewport.width - size.width);
  const maxY = Math.max(0, viewport.height - TASKBAR_HEIGHT - size.height);
  return {
    x: Math.round(Math.min(Math.max(position.x, 0), maxX)),
    y: Math.round(Math.min(Math.max(position.y, 0), maxY)),
  };
}
