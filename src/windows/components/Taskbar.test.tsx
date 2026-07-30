import { render } from "@testing-library/react";
import { WindowsProvider } from "../WindowsProvider";
import Taskbar from "./Taskbar";

describe("Taskbar clock", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("clears its interval on unmount, rather than leaking a timer past the component's life", () => {
    vi.useFakeTimers();
    const setSpy = vi.spyOn(window, "setInterval");
    const clearSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = render(
      <WindowsProvider>
        <Taskbar />
      </WindowsProvider>
    );

    expect(setSpy).toHaveBeenCalledTimes(1);
    // Under vi.useFakeTimers() this is a Timeout-like object, not a real `number` (despite
    // the DOM-typed signature) — no cast to `number`, just pass whatever came back through.
    const timerId = setSpy.mock.results[0]?.value;

    unmount();

    // This is the load-bearing assertion: it fails if the effect's cleanup stops returning
    // `() => window.clearInterval(timer)`, which is the only thing standing between an
    // unmounted Taskbar and a timer that keeps firing for the rest of the test run.
    expect(clearSpy).toHaveBeenCalledWith(timerId);

    vi.useRealTimers();
  });
});
