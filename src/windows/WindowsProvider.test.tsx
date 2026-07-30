import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WindowsProvider } from "./WindowsProvider";
import { useWindows } from "./useWindows";
import { REGISTRY } from "./registry";

const wrapper = ({ children }: { children: ReactNode }) => (
  <WindowsProvider>{children}</WindowsProvider>
);

function setViewportWidth(width: number) {
  window.innerWidth = width;
  window.innerHeight = 900;
  window.dispatchEvent(new Event("resize"));
}

describe("WindowsProvider", () => {
  beforeEach(() => setViewportWidth(1200));

  it("starts with no windows open", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    expect(result.current.windows).toEqual([]);
    expect(result.current.focused).toBeNull();
  });

  it("opens a window at its registered default size", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    expect(result.current.windows).toHaveLength(1);
    expect(result.current.focused).toBe("cv");
    expect(result.current.windows[0].size).toEqual(REGISTRY.cv.defaultSize);
  });

  it("keeps two windows open on a desktop viewport", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    expect(result.current.windows).toHaveLength(2);
    expect(result.current.isMobile).toBe(false);
  });

  it("allows only one window at a time below the mobile breakpoint", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => setViewportWidth(400));
    expect(result.current.isMobile).toBe(true);
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects"]);
  });

  it("does not change context identity on a resize that stays on the same side of the breakpoint", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    const before = result.current;
    act(() => setViewportWidth(1201));
    expect(result.current).toBe(before);
  });

  it("closes a window, leaving the others open", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    act(() => result.current.close("cv"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects"]);
    expect(result.current.focused).toBe("projects");
  });

  it("focus brings a background window to the top and makes it the focused one", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    // projects is on top after the second open; focus the one underneath.
    act(() => result.current.focus("cv"));
    expect(result.current.windows.map(w => w.id)).toEqual(["projects", "cv"]);
    expect(result.current.focused).toBe("cv");
  });

  it("minimising the focused window hands focus to the window beneath it", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    act(() => result.current.open("projects"));
    expect(result.current.focused).toBe("projects");
    act(() => result.current.minimise("projects"));
    const minimised = result.current.windows.find(w => w.id === "projects");
    expect(minimised?.minimised).toBe(true);
    expect(result.current.focused).toBe("cv");
  });

  it("toggleFromTaskbar minimises the focused window, then restores and refocuses it", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    expect(result.current.focused).toBe("cv");

    act(() => result.current.toggleFromTaskbar("cv"));
    expect(result.current.windows[0].minimised).toBe(true);
    expect(result.current.focused).toBeNull();

    act(() => result.current.toggleFromTaskbar("cv"));
    expect(result.current.windows[0].minimised).toBe(false);
    expect(result.current.focused).toBe("cv");
  });

  it("move clamps the requested position to stay inside the viewport", () => {
    const { result } = renderHook(() => useWindows(), { wrapper });
    act(() => result.current.open("cv"));
    const { width, height } = REGISTRY.cv.defaultSize;
    act(() => result.current.move("cv", { x: 100_000, y: 100_000 }));
    const moved = result.current.windows[0];
    expect(moved.position.x).toBeLessThanOrEqual(1200 - width);
    expect(moved.position.y).toBeLessThanOrEqual(900 - height);
    expect(moved.position.x).toBeGreaterThanOrEqual(0);
    expect(moved.position.y).toBeGreaterThanOrEqual(0);
  });
});

describe("useWindows", () => {
  it("throws when rendered outside a WindowsProvider", () => {
    expect(() => renderHook(() => useWindows())).toThrow(
      "useWindows must be used inside a WindowsProvider"
    );
  });
});
