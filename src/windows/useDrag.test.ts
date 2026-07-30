import { act, renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useDrag } from "./useDrag";

/**
 * Builds a fake pointer event and calls the hook's handlers directly, rather than firing a
 * real DOM pointer event through jsdom. jsdom's pointer-capture stubs (see
 * src/test/setup.ts) do not model the spec accurately enough to prove anything about a
 * *simulated gesture*, which is why drag gestures are deliberately not under test (see
 * docs/DESIGN.md §8). The hook's own logic — which handler commits, and what it computes —
 * is a plain function of its arguments, and that part is meaningfully testable by calling
 * it directly with a hand-built event rather than simulating pointer input on a real
 * element.
 */
function makeEvent(clientX: number, clientY: number): ReactPointerEvent<HTMLElement> {
  return {
    button: 0,
    pointerId: 1,
    clientX,
    clientY,
    currentTarget: document.createElement("div"),
  } as unknown as ReactPointerEvent<HTMLElement>;
}

describe("useDrag", () => {
  it("commits using the event's own coordinates, not stale offset state", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ position: { x: 10, y: 20 }, disabled: false, onCommit })
    );

    // pointerdown, pointermove and pointerup all dispatched inside a single `act`, with no
    // render in between — the scenario in which `offset` state has not yet committed to a
    // new value by the time pointerup's closure reads it, were it read from state instead
    // of from the event.
    act(() => {
      result.current.handlers.onPointerDown(makeEvent(100, 100));
      result.current.handlers.onPointerMove(makeEvent(140, 135));
      result.current.handlers.onPointerUp(makeEvent(140, 135));
    });

    expect(onCommit).toHaveBeenCalledWith({ x: 50, y: 55 });
  });

  it("does not commit a pointercancel", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ position: { x: 10, y: 20 }, disabled: false, onCommit })
    );

    act(() => {
      result.current.handlers.onPointerDown(makeEvent(100, 100));
      result.current.handlers.onPointerMove(makeEvent(140, 135));
      result.current.handlers.onPointerCancel();
    });

    expect(onCommit).not.toHaveBeenCalled();
  });
});
