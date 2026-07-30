import { useEffect, useRef, useState, type RefObject } from "react";
import type { Viewport } from "./types";

export const MOBILE_BREAKPOINT = 768;

function read(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isBelowBreakpoint(viewport: Viewport): boolean {
  return viewport.width < MOBILE_BREAKPOINT;
}

/**
 * The viewport is exposed as a ref, not state. It changes on every resize
 * event, and `WindowsProvider`'s `open`/`move` callbacks only need its
 * current value at the moment they dispatch, not a fresh render every time
 * it changes. Putting it in state (as an object — always a new reference)
 * would churn those callbacks' identity on every resize, which cascades
 * through the memoised context value and re-renders the whole desktop even
 * when nothing observable changed. That would defeat the same-reference
 * no-op optimisation `windowReducer` was hardened to provide (see Task 6).
 *
 * `isMobile` is the only piece of viewport information that genuinely needs
 * to trigger a re-render, and the state setter below only fires it when the
 * boolean actually flips — a resize that stays on the same side of the
 * breakpoint must not cause a re-render either.
 */
export function useViewport(): { viewportRef: RefObject<Viewport>; isMobile: boolean } {
  const viewportRef = useRef<Viewport>(read());
  // Read directly rather than via `viewportRef.current`: refs must not be read during
  // render (react-hooks/refs), and this initial snapshot is taken at the same moment
  // the ref above was seeded, so the two agree.
  const [isMobile, setIsMobile] = useState(() => isBelowBreakpoint(read()));

  useEffect(() => {
    const onResize = () => {
      const next = read();
      viewportRef.current = next;
      const mobile = isBelowBreakpoint(next);
      setIsMobile(prev => (prev === mobile ? prev : mobile));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { viewportRef, isMobile };
}
