import { clampToViewport, TASKBAR_HEIGHT } from "./clampToViewport";

const viewport = { width: 1000, height: 800 };
const size = { width: 400, height: 300 };

describe("clampToViewport", () => {
  it("leaves a position that is already inside untouched", () => {
    expect(clampToViewport({ x: 100, y: 100 }, size, viewport)).toEqual({ x: 100, y: 100 });
  });

  it("clamps against the left and top edges", () => {
    expect(clampToViewport({ x: -50, y: -20 }, size, viewport)).toEqual({ x: 0, y: 0 });
  });

  it("clamps against the right edge", () => {
    expect(clampToViewport({ x: 5000, y: 0 }, size, viewport).x).toBe(
      viewport.width - size.width
    );
  });

  it("clamps against the bottom edge, keeping clear of the taskbar", () => {
    expect(clampToViewport({ x: 0, y: 5000 }, size, viewport).y).toBe(
      viewport.height - TASKBAR_HEIGHT - size.height
    );
  });

  it("pins a window larger than the viewport to the origin", () => {
    const huge = { width: 2000, height: 2000 };
    expect(clampToViewport({ x: 300, y: 300 }, huge, viewport)).toEqual({ x: 0, y: 0 });
  });

  it("rounds fractional coordinates to whole pixels", () => {
    expect(clampToViewport({ x: 100.4, y: 100.6 }, size, viewport)).toEqual({ x: 100, y: 101 });
  });
});
