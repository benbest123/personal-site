import { useEffect, useState } from "react";
import type { Viewport } from "./types";

export const MOBILE_BREAKPOINT = 768;

function read(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewport(): { viewport: Viewport; isMobile: boolean } {
  const [viewport, setViewport] = useState<Viewport>(read);

  useEffect(() => {
    const onResize = () => setViewport(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { viewport, isMobile: viewport.width < MOBILE_BREAKPOINT };
}
