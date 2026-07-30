import "@testing-library/jest-dom/vitest";

// jsdom does not implement pointer capture. The title bar calls it on pointerdown, so
// any click that bubbles from inside the title bar would throw without these stubs.
// Drag behaviour itself is deliberately not under test — see docs/DESIGN.md §8.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}
