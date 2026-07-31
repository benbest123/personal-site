import { render, screen } from "@testing-library/react";
import PointerTrail from "./PointerTrail";

/**
 * jsdom does not implement `matchMedia`, so the hook reports "no preference" unless a
 * test installs this. `matches` is the only field the hook reads.
 */
function stubMatchMedia(matches: boolean) {
  const media = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media)
  );
  return media;
}

/** jsdom's PointerEvent has no `pointerType`, so build the event by hand. */
function pointerMove(pointerType: string, clientX: number, clientY: number) {
  const event = new Event("pointermove", { bubbles: true });
  Object.assign(event, { pointerType, clientX, clientY });
  return event;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PointerTrail", () => {
  it("renders a ghost cursor per trail step, hidden from assistive technology", () => {
    render(<PointerTrail />);
    const trail = screen.getByTestId("pointer-trail");

    expect(trail).toHaveAttribute("aria-hidden", "true");
    expect(trail).toHaveClass("pointer-events-none");
    expect(trail.querySelectorAll("img")).toHaveLength(5);
  });

  it("renders nothing at all when the OS asks for reduced motion", () => {
    stubMatchMedia(true);
    render(<PointerTrail />);
    // Not merely hidden: a trail is exactly the kind of incidental motion the setting
    // exists to stop, so there is nothing to keep animating in the background.
    expect(screen.queryByTestId("pointer-trail")).not.toBeInTheDocument();
  });

  it("stays hidden until the mouse actually moves", () => {
    render(<PointerTrail />);
    // Without this the chain would be parked at the top-left corner, showing five
    // stacked arrows over the desktop icons before the visitor has touched anything.
    expect(screen.getByTestId("pointer-trail")).toHaveStyle({ opacity: "0" });

    window.dispatchEvent(pointerMove("mouse", 400, 300));
    expect(screen.getByTestId("pointer-trail")).toHaveStyle({ opacity: "1" });
  });

  it("ignores touch, so a phone never strands a trail where the finger lifted", () => {
    render(<PointerTrail />);
    window.dispatchEvent(pointerMove("touch", 400, 300));
    expect(screen.getByTestId("pointer-trail")).toHaveStyle({ opacity: "0" });
  });

  it("hides the ghosts when the pointer leaves the window", () => {
    render(<PointerTrail />);
    window.dispatchEvent(pointerMove("mouse", 400, 300));

    document.documentElement.dispatchEvent(new Event("pointerleave", { bubbles: true }));
    expect(screen.getByTestId("pointer-trail")).toHaveStyle({ opacity: "0" });
  });

  it("stops animating and unsubscribes on unmount", () => {
    const cancelAnimationFrame = vi.spyOn(window, "cancelAnimationFrame");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<PointerTrail />);
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));

    // A leaked rAF loop would keep running after unmount, so prove the handler is gone
    // rather than only that removeEventListener was called with something.
    expect(() => window.dispatchEvent(pointerMove("mouse", 10, 10))).not.toThrow();
  });
});
