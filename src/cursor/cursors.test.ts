import arrowSvg from "./arrow.svg?raw";
import handSvg from "./hand.svg?raw";
import trailSource from "./PointerTrail.tsx?raw";

/**
 * The cursor art is referenced three ways — a `url()` in index.css, an `import` in
 * PointerTrail, and two size constants there — and nothing in the type system connects
 * the constants to the file.
 *
 * These do not read index.css: Vitest stubs CSS out, so `index.css?raw` is an empty
 * string and any assertion against it passes vacuously. The CSS side is covered by the
 * build instead — Vite fails on a `url()` it cannot resolve, and CI runs `npm run build`.
 */

/** The ASCII grid the generator embeds in each SVG, with transparent pixels as `·`. */
function grid(svg: string): string[] {
  return svg
    .split("\n")
    .filter(line => /^ {5}[#.·]+$/.test(line))
    .map(line => line.slice(5));
}

describe("cursor assets", () => {
  it.each([
    ["arrow", arrowSvg],
    ["hand", handSvg],
  ])("%s.svg carries its source grid, so the art can be reviewed", (_name, svg) => {
    expect(svg).toContain("<svg");
    // Without the grid comment the committed file is a wall of <rect>s that nobody can
    // check against a screenshot.
    expect(svg).toContain("# is the black outline");
    expect(grid(svg).length).toBeGreaterThan(0);
  });

  it.each([
    ["arrow", arrowSvg],
    ["hand", handSvg],
  ])("%s.svg declares the size its own grid implies", (_name, svg) => {
    const rows = grid(svg);
    expect(svg).toContain(`width="${rows[0].length}"`);
    expect(svg).toContain(`height="${rows.length}"`);
  });

  it("sizes the trail's ghosts to match the arrow SVG", () => {
    const rows = grid(arrowSvg);
    expect(trailSource).toContain(`const CURSOR_WIDTH = ${rows[0].length}`);
    expect(trailSource).toContain(`const CURSOR_HEIGHT = ${rows.length}`);
  });

  it("keeps the hand's fingertip where index.css puts its hotspot", () => {
    // index.css sets `url("./cursor/hand.svg") 4 0`, so column 4 has to be the inside of
    // the index finger. If the art is redrawn and the finger moves, this fails and the
    // hotspot in index.css needs the same nudge — nothing else would catch it, since the
    // hand would still look right and just click from the wrong pixel.
    const rows = grid(handSvg);
    expect(rows[0][4]).toBe("#");
    expect(rows[1][4]).toBe(".");
  });
});
