import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `matchMedia` is optional-chained throughout because jsdom does not implement it, so the
 * hook reports "no preference" under test unless a test stubs it deliberately. The
 * `MediaQueryList` is fetched fresh each call rather than cached in a module-level
 * variable, so a test that stubs `matchMedia` after import still sees its own stub.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY);
  if (!media) return () => {};

  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia?.(QUERY).matches ?? false;
}

/**
 * Tracks the OS "reduce motion" setting, and keeps tracking it: someone can turn it on
 * while the page is open, and a trail that only checked on mount would keep moving.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect` because that is exactly
 * what this is — a subscription to state owned outside React — and it closes the gap
 * where the setting flips between the first render and the effect running.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
