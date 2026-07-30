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
    const timerId = setSpy.mock.results[0]?.value as number;

    unmount();

    expect(clearSpy).toHaveBeenCalledWith(timerId);

    // If the interval were not actually cleared, this would still fire and could try to
    // update the (now unmounted) component's state.
    vi.advanceTimersByTime(60_000);

    vi.useRealTimers();
  });
});
