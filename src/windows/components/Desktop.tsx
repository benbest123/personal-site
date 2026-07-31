import { profile } from "../../content/profile";
import { DESKTOP_ORDER, REGISTRY } from "../registry";
import { useWindows } from "../useWindows";
import DesktopIcon from "./DesktopIcon";
import Taskbar from "./Taskbar";
import WindowLayer from "./WindowLayer";

export default function Desktop() {
  const { open, isMobile, focused } = useWindows();

  // On mobile a window goes full-screen and covers the icons and summary block entirely
  // (see Window.tsx's mobile frame), but without this they would stay in the tab order —
  // invisible stops for keyboard and screen-reader users navigating past the window that
  // is actually on screen. `focused !== null` means an unminimised window is being shown
  // (see `focusedId` in state.ts), which is exactly when there is something covering them.
  const hiddenBehindMobileWindow = isMobile && focused !== null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#008080]">
      <main className="relative flex-1 overflow-hidden">
        <div
          // Test-only: lets tests target this exact container regardless of icon count or
          // label text (see Desktop.test.tsx's `inert` assertions).
          data-testid="desktop-icons"
          className="flex flex-col items-start gap-2 p-4"
          inert={hiddenBehindMobileWindow}
        >
          {DESKTOP_ORDER.map(id => (
            <DesktopIcon
              key={id}
              id={`icon-${id}`}
              label={REGISTRY[id].title}
              icon={REGISTRY[id].icon}
              onOpen={() => open(id)}
            />
          ))}
        </div>

        <div
          // Test-only: see the `data-testid="desktop-icons"` note above.
          data-testid="desktop-summary"
          // pointer-events-none keeps this decorative block from swallowing clicks meant
          // for a window rendered beneath it (see WindowLayer, which is a sibling below).
          // `items-end` until `md` keeps the text at the bottom on narrow screens, where a
          // vertically centred block would run into the icon column above it; from `md` up
          // there is room to centre it properly.
          className="pointer-events-none absolute inset-0 flex items-end justify-center p-8 md:items-center"
          inert={hiddenBehindMobileWindow}
        >
          <div className="max-w-md text-center text-white md:max-w-lg">
            <h1 className="mb-2 text-4xl font-bold">{profile.name}</h1>
            <p className="mb-2 text-sm">{profile.headline}</p>
            <p className="text-sm leading-snug">{profile.summary}</p>
          </div>
        </div>

        <WindowLayer />
      </main>

      <Taskbar />
    </div>
  );
}
