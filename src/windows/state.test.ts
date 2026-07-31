import { windowReducer, initialState, focusedId, cascadePosition } from "./state";
import type { DesktopState, WindowAction, WindowId } from "./types";

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

  it("opens the first window clear of the desktop icon column", () => {
    // The icon column ends 112px from the left edge: a `p-4` (16px) container in
    // Desktop.tsx wrapping `.desktop-icon`, which index.css sizes at 6rem. A window
    // starting left of that opens on top of the icons.
    const ICON_COLUMN_RIGHT_EDGE = 112;
    expect(cascadePosition(0).x).toBeGreaterThanOrEqual(ICON_COLUMN_RIGHT_EDGE);
  });

  it("cascades a second window instead of stacking it exactly", () => {
    const state = open(open(initialState, "cv"), "projects");
    expect(state.windows[1].position).not.toEqual(state.windows[0].position);
  });

  it("places by open count, so focusing does not change where the next window lands", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    state = open(state, "contact");
    const contact = state.windows.find(w => w.id === "contact")!;
    expect(contact.position).toEqual(cascadePosition(2));
  });

  it("drops every other window when singleWindow is set", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "contact", true);
    expect(ids(state)).toEqual(["contact"]);
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

  it("preserves a moved window's position and size when it is re-opened", () => {
    let state = open(initialState, "cv");
    state = windowReducer(state, {
      type: "MOVE",
      id: "cv",
      position: { x: 300, y: 250 },
      viewport,
    });
    const moved = state.windows.find(w => w.id === "cv")!;

    state = open(state, "projects");
    state = open(state, "cv");

    const cv = state.windows.find(w => w.id === "cv")!;
    expect(cv.position).toEqual(moved.position);
    expect(cv.size).toEqual(moved.size);
  });

  it("drops every other window when singleWindow is set on an already-open window", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = open(state, "cv", true);
    expect(ids(state)).toEqual(["cv"]);
  });

  it("stays a single window when singleWindow is set and the target is already the only one open", () => {
    let state = open(initialState, "cv");
    state = open(state, "cv", true);
    expect(ids(state)).toEqual(["cv"]);
    expect(focusedId(state)).toBe("cv");
  });

  it("handles a zero-size viewport without throwing", () => {
    const zeroViewport = { width: 0, height: 0 };
    const state = windowReducer(initialState, {
      type: "OPEN",
      id: "cv",
      size,
      viewport: zeroViewport,
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

  it("removes a minimised window", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = windowReducer(state, { type: "CLOSE", id: "cv" });
    expect(ids(state)).toEqual(["projects"]);
  });

  it("does nothing for a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "CLOSE", id: "contact" })).toBe(state);
  });
});

describe("FOCUS", () => {
  it("moves the window to the top of the stack", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    expect(ids(state)).toEqual(["projects", "cv"]);
  });

  it("restores a minimised window", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = windowReducer(state, { type: "FOCUS", id: "cv" });
    expect(state.windows.find(w => w.id === "cv")!.minimised).toBe(false);
    expect(focusedId(state)).toBe("cv");
  });

  it("does nothing when the window is already the focused, visible window", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "FOCUS", id: "cv" })).toBe(state);
  });

  it("does nothing for a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "FOCUS", id: "contact" })).toBe(state);
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

  it("does nothing for a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "MINIMISE", id: "contact" })).toBe(state);
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

  it("does nothing for a window that has never been opened", () => {
    const state = open(initialState, "cv");
    expect(windowReducer(state, { type: "TOGGLE_FROM_TASKBAR", id: "contact" })).toBe(state);
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

  it("does nothing for a window that is not open", () => {
    const state = open(initialState, "cv");
    expect(
      windowReducer(state, { type: "MOVE", id: "contact", position: { x: 10, y: 10 }, viewport })
    ).toBe(state);
  });
});

describe("focusedId", () => {
  it("returns null when every open window is minimised", () => {
    let state = open(open(initialState, "cv"), "projects");
    state = windowReducer(state, { type: "MINIMISE", id: "cv" });
    state = windowReducer(state, { type: "MINIMISE", id: "projects" });
    expect(focusedId(state)).toBeNull();
  });
});

describe("immutability", () => {
  it("never mutates the state object passed in, for any of the six action types", () => {
    let seed = open(open(initialState, "cv"), "projects");
    seed = windowReducer(seed, { type: "MINIMISE", id: "projects" });

    const actions: WindowAction[] = [
      { type: "OPEN", id: "contact", size, viewport, singleWindow: false },
      { type: "MOVE", id: "cv", position: { x: 10, y: 10 }, viewport },
      { type: "CLOSE", id: "cv" },
      { type: "FOCUS", id: "projects" },
      { type: "MINIMISE", id: "cv" },
      { type: "TOGGLE_FROM_TASKBAR", id: "projects" },
    ];

    for (const action of actions) {
      const before = JSON.stringify(seed);
      windowReducer(seed, action);
      expect(JSON.stringify(seed)).toBe(before);
    }
  });
});
