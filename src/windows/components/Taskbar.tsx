import { useEffect, useState } from "react";
import { REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import { TASKBAR_HEIGHT } from "../clampToViewport";

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // A 30s tick is coarse enough not to matter for a HH:MM clock but frequent enough to
    // look live. `window.setInterval`/`clearInterval` (not the bare globals) keep this on
    // the DOM timer types rather than Node's, and the cleanup below is what stops it from
    // outliving the component — including in tests, where an unmounted-but-still-ticking
    // Taskbar would otherwise keep scheduling `setState` calls for the rest of the run.
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function Taskbar() {
  const { windows, focused, toggleFromTaskbar } = useWindows();
  const time = useClock();

  return (
    <footer
      className="flex shrink-0 items-center justify-between gap-2 px-2"
      style={{ height: TASKBAR_HEIGHT, background: "#c0c0c0" }}
    >
      <div role="toolbar" aria-label="Open windows" className="flex flex-1 items-center gap-1">
        {windows.map(instance => (
          <button
            key={instance.id}
            // `Window.tsx`'s Minimize handler focuses this id directly after minimising,
            // rather than Desktop reconstructing intent from a state diff — see Window.tsx.
            id={`taskbar-${instance.id}`}
            type="button"
            onClick={() => toggleFromTaskbar(instance.id)}
            aria-pressed={focused === instance.id}
            className="max-w-40 truncate"
          >
            {REGISTRY[instance.id].title}
          </button>
        ))}
      </div>
      <div className="status-bar m-0">
        <p className="status-bar-field">{time}</p>
      </div>
    </footer>
  );
}
