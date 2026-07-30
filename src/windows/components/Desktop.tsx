import { useEffect, useRef } from "react";
import { profile } from "../../content/profile";
import { DESKTOP_ORDER, REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import type { WindowId, WindowInstance } from "../types";
import DesktopIcon from "./DesktopIcon";
import Taskbar from "./Taskbar";
import WindowLayer from "./WindowLayer";

type ButtonRefs = Partial<Record<WindowId, HTMLButtonElement | null>>;

export default function Desktop() {
  const { windows, open } = useWindows();

  const iconRefs = useRef<ButtonRefs>({});
  const taskbarRefs = useRef<ButtonRefs>({});

  // Tracks the previous render's window list so the effect below can tell, for each
  // window, whether it just closed or just minimised — as opposed to firing on every
  // unrelated state change (a drag commit, a background window being focused, ...).
  const previousWindowsRef = useRef<readonly WindowInstance[]>(windows);

  /**
   * Gap closed from Task 8: closing or minimising a window used to leave focus on
   * `document.body` once the `<div role="dialog">` was removed from the DOM. Standard
   * desktop-UI practice is to return focus to whatever invoked the window, so this hands
   * it back to:
   *  - the desktop icon, when the window closed outright (nothing else represents it any
   *    more, and the icon is what reopens it), or
   *  - the taskbar button, when the window was minimised (it still exists there, and is
   *    what restores it).
   *
   * Only a window that was previously open and *not already minimised* can trigger this:
   * every path that closes or minimises a window (the title-bar buttons, Escape, and the
   * taskbar toggle) first focuses that window via `Window`'s `onPointerDown`/keydown
   * handling, so "was open and unminimised" is a reliable proxy for "just held focus" —
   * see `Window.tsx` and `state.ts`'s `TOGGLE_FROM_TASKBAR` branch. A window minimised via
   * its own taskbar button keeps DOM focus on that button throughout (it is never removed
   * from the DOM), so re-focusing it here is a harmless no-op in that case.
   */
  useEffect(() => {
    const previous = previousWindowsRef.current;
    for (const before of previous) {
      if (before.minimised) continue;
      const after = windows.find(w => w.id === before.id);
      if (!after) {
        iconRefs.current[before.id]?.focus();
      } else if (after.minimised) {
        taskbarRefs.current[before.id]?.focus();
      }
    }
    previousWindowsRef.current = windows;
  }, [windows]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#008080]">
      <main className="relative flex-1 overflow-hidden">
        <div className="flex flex-col items-start gap-2 p-4">
          {DESKTOP_ORDER.map(id => (
            <DesktopIcon
              key={id}
              ref={el => {
                iconRefs.current[id] = el;
              }}
              label={REGISTRY[id].title}
              icon={REGISTRY[id].icon}
              onOpen={() => open(id)}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-8 right-8 max-w-md text-right text-white md:max-w-lg">
          <h1 className="mb-2 text-4xl font-bold">{profile.name}</h1>
          <p className="mb-2 text-sm">{profile.headline}</p>
          <p className="text-sm leading-snug">{profile.summary}</p>
        </div>

        <WindowLayer />
      </main>

      <Taskbar
        onButtonRef={(id, el) => {
          taskbarRefs.current[id] = el;
        }}
      />
    </div>
  );
}
