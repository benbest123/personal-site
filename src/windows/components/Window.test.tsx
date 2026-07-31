import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WindowsProvider } from "../WindowsProvider";
import { useWindows } from "../useWindows";
import WindowLayer from "./WindowLayer";

function Harness() {
  const { open, windows } = useWindows();
  return (
    <>
      <button onClick={() => open("cv")}>open cv</button>
      <button onClick={() => open("projects")}>open projects</button>
      {/* Test-only: exposes what a taskbar (Task 9) would show, so a test at this layer can
          tell "minimised" apart from "closed" without reaching into the reducer directly. */}
      <p data-testid="open-count">{windows.length}</p>
      <WindowLayer />
    </>
  );
}

const renderDesktop = () =>
  render(
    <WindowsProvider>
      <Harness />
    </WindowsProvider>
  );

describe("Window", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("renders nothing until a window is opened", () => {
    renderDesktop();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an accessible dialog with the registered title", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    expect(screen.getByRole("dialog", { name: "My CV" })).toBeInTheDocument();
  });

  it("closes when the close control is clicked", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("open-count")).toHaveTextContent("0");
  });

  it("hides a minimised window but keeps it open", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Minimize" }));
    // The dialog itself is gone either way (closed or minimised) — the thing that actually
    // distinguishes minimising from closing is that the instance survives in `windows`, so
    // its taskbar button (Task 9) would still be there. Assert that survival, not just the
    // dialog's absence.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("open-count")).toHaveTextContent("1");
  });

  it("moves focus into the window when it opens", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes the focused window on Escape, leaving unfocused windows open", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    // projects was opened last, so it is focused; only it should close.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Projects" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "My CV" })).toBeInTheDocument();
  });

  it("stacks the most recently opened window on top", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    const cvZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "My CV" })).zIndex
    );
    const projectsZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Projects" })).zIndex
    );
    expect(projectsZIndex).toBeGreaterThan(cvZIndex);
  });

  it("keeps windows in a stable DOM order when a background window is focused", async () => {
    // Focusing a background window changes its `zIndex` (asserted above) but must not
    // reorder the DOM: `WindowLayer` renders in a fixed order (`DESKTOP_ORDER`) precisely
    // so that focusing never moves a window's DOM node. If it did, a real browser would
    // implicitly release that window's pointer capture the instant the node moved — a bug
    // jsdom's pointer-capture stub cannot surface, so the meaningful thing to assert here
    // is the precondition it depends on: DOM order is unaffected by which window is on top.
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    const namesBefore = screen.getAllByRole("dialog").map(d => d.getAttribute("aria-label"));

    // projects opened last, so it is focused; clicking cv brings the background window forward.
    await user.click(screen.getByRole("dialog", { name: "My CV" }));
    const namesAfter = screen.getAllByRole("dialog").map(d => d.getAttribute("aria-label"));

    expect(namesAfter).toEqual(namesBefore);
    const cvZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "My CV" })).zIndex
    );
    const projectsZIndex = Number(
      getComputedStyle(screen.getByRole("dialog", { name: "Projects" })).zIndex
    );
    expect(cvZIndex).toBeGreaterThan(projectsZIndex);
  });

  it("marks the focused window's title bar active and background windows inactive", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));

    const cvTitleBar = screen
      .getByRole("dialog", { name: "My CV" })
      .querySelector(".title-bar");
    const projectsTitleBar = screen
      .getByRole("dialog", { name: "Projects" })
      .querySelector(".title-bar");

    expect(cvTitleBar).toHaveClass("inactive");
    expect(projectsTitleBar).not.toHaveClass("inactive");
  });
});
