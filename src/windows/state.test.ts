import { windowReducer, initialState, focusedId, cascadePosition } from "./state";
import type { DesktopState, WindowId } from "./types";

const viewport = { width: 1200, height: 900 };
const size = { width: 400, height: 300 };

const open = (state: DesktopState, id: WindowId, singleWindow = false) =>
  windowReducer(state, { type: "OPEN", id, size, viewport, singleWindow });

const ids = (state: DesktopState) => state.windows.map(w => w.id);

describe("OPEN", () => {
  it("appends a new window and focuses it", () => {
    const state = open(initialState, "cv");
    expect(ids(state)).toEqual(["cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("focuses an already-open window instead of duplicating it", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "cv");
    expect(ids(state)).toEqual(["projects", "cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("restores and focuses a minimised window", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = open(state, "cv");
    expect(state.windows[0].minimised).toBe(false);
    expect(focusedId(state)).toBe("cv");
  });

  it("cascades a second window instead of stacking it exactly", () => {
    const state = open(open(initialState, "cv"), "projects");
    expect(state.windows[1].position).not.toEqual(state.windows[0].position);
  });

  it("places by open count, so focusing does not change where the next window lands", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    state = open(state, "about");
    const about = state.windows.find(w => w.id === "about")!;
    expect(about.position).toEqual(cascadePosition(2));
  });

  it("drops every other window when singleWindow is set", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "about", true);
    expect(ids(state)).toEqual(["about"]);
  });

  it("clamps the cascade position into a short viewport", () => {
    const shortViewport = { width: 300, height: 200 };
    const state = windowReducer(initialState, {
      type: "OPEN",
      id: "cv",
      size,
      viewport: shortViewport,
      singleWindow: false,
    });
    expect(state.windows[0].position).toEqual({ x: 0, y: 0 });
  });
});

describe("CLOSE", () => {
  it("removes the window and promotes the one beneath it", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "CLOSE", id: "projects" });
    expect(ids(state)).toEqual(["cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("ignores a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "CLOSE", id: "about" })).toEqual(state);
  });
});

describe("FOCUS", () => {
  it("moves the window to the top of the stack", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    expect(ids(state)).toEqual(["projects", "cv"]);
  });
});

describe("MINIMISE", () => {
  it("keeps the window in the array so its taskbar button remains", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    expect(ids(state)).toEqual(["cv"]);
    expect(state.windows[0].minimised).toBe(true);
  });

  it("hands focus to the next window down", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "MINIMISE", id: "projects" });
    expect(focusedId(state)).toBe("cv");
  });

  it("leaves nothing focused when the last window is minimised", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    expect(focusedId(state)).toBeNull();
  });
});

describe("TOGGLE_FROM_TASKBAR", () => {
  it("minimises a window that is currently focused", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(state.windows[0].minimised).toBe(true);
  });

  it("focuses an open but unfocused window", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(focusedId(state)).toBe("cv");
    expect(state.windows[1].minimised).toBe(false);
  });

  it("restores a minimised window", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "cv" });
    expect(state.windows[0].minimised).toBe(false);
    expect(focusedId(state)).toBe("cv");
  });
});

describe("MOVE", () => {
  it("applies the new position", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, { type: "MOVE", id: "cv", position: { x: 200, y: 150 }, viewport });
    expect(state.windows[0].position).toEqual({ x: 200, y: 150 });
  });

  it("clamps a position dragged off-screen", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, {
      type: "MOVE",
      id: "cv",
      position: { x: -400, y: -400 },
      viewport,
    });
    expect(state.windows[0].position).toEqual({ x: 0, y: 0 });
  });
});
