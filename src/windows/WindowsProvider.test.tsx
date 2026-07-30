import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WindowsProvider } from "./WindowsProvider";
import { useWindows } from "./useWindows";

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
    expect(result.current.windows[0].size.width).toBeGreaterThan(0);
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
});
