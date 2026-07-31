import { useEffect, useRef } from "react";
import arrowCursor from "./arrow.svg";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Ghost copies of the cursor lagging behind it — Windows 95's "Show pointer trails"
 * (Control Panel → Mouse → Motion), which offered a slider from short to long. Five is
 * around the middle of that range.
 */
const GHOSTS = 5;

/**
 * How much of the gap to the ghost in front each ghost closes per frame. Lower trails
 * further behind. This is a chain rather than a recording of past positions: a recording
 * bunches every ghost into one blob whenever the pointer is still, whereas a chain
 * collapses to a single arrow at rest and stretches out with speed.
 */
const EASE = 0.3;

/** Matches the grid in `arrow.svg`. Guarded by `cursors.test.ts`. */
const CURSOR_WIDTH = 12;
const CURSOR_HEIGHT = 18;

interface Position {
  x: number;
  y: number;
}

export default function PointerTrail() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const ghosts = Array.from(container.children) as HTMLElement[];
    const positions: Position[] = Array.from({ length: ghosts.length }, () => ({ x: 0, y: 0 }));
    const pointer: Position = { x: 0, y: 0 };
    let tracking = false;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      // Touch and pen would leave a trail stranded wherever the finger last lifted, and
      // on a phone the windows are full-screen anyway. Mouse only.
      if (event.pointerType !== "mouse") return;

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!tracking) {
        // Snap the whole chain to the pointer on the first move, otherwise the trail
        // flies in from the top-left corner.
        for (const position of positions) {
          position.x = pointer.x;
          position.y = pointer.y;
        }
        tracking = true;
        container.style.opacity = "1";
      }
    };

    // The real cursor is gone once the pointer leaves the window, so its ghosts should go
    // too rather than hang in the corner.
    const onPointerLeave = () => {
      tracking = false;
      container.style.opacity = "0";
    };

    const step = () => {
      frame = requestAnimationFrame(step);
      if (!tracking) return;

      for (let i = 0; i < positions.length; i += 1) {
        const target = i === 0 ? pointer : positions[i - 1];
        positions[i].x += (target.x - positions[i].x) * EASE;
        positions[i].y += (target.y - positions[i].y) * EASE;
        // The arrow's hotspot is its top-left pixel, so the untranslated image already
        // has its tip at the position — no offset needed.
        ghosts[i].style.transform = `translate3d(${positions[i].x}px, ${positions[i].y}px, 0)`;
      }
    };

    frame = requestAnimationFrame(step);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      data-testid="pointer-trail"
      // Above the windows (z-index 1..3 in WindowLayer) so ghosts are never clipped by
      // one, and inert to both the pointer and assistive technology: this is decoration
      // that duplicates a cursor the user can already see.
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      // Inline rather than an `opacity-0` utility because the effect writes
      // `style.opacity` to show and hide the trail; two owners for one property is how
      // it ends up stuck visible.
      style={{ opacity: 0 }}
    >
      {Array.from({ length: GHOSTS }, (_, index) => (
        <img
          key={index}
          src={arrowCursor}
          alt=""
          width={CURSOR_WIDTH}
          height={CURSOR_HEIGHT}
          className="absolute left-0 top-0 will-change-transform"
          // Fades from just behind the real cursor out to nearly nothing. The real
          // cursor is drawn by the browser at full opacity, so the first ghost has to
          // start below that to read as a trail rather than a second cursor.
          style={{ opacity: 0.55 * (1 - index / GHOSTS) }}
        />
      ))}
    </div>
  );
}
