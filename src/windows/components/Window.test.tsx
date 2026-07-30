import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WindowsProvider } from "../WindowsProvider";
import { useWindows } from "../useWindows";
import WindowLayer from "./WindowLayer";

function Harness() {
  const { open } = useWindows();
  return (
    <>
      <button onClick={() => open("cv")}>open cv</button>
      <button onClick={() => open("projects")}>open projects</button>
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
    expect(screen.getByRole("dialog", { name: "Benjamin_Best_CV" })).toBeInTheDocument();
  });

  it("closes when the close control is clicked", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides a minimised window but keeps it open", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByRole("button", { name: "Minimize" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the window when it opens", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes the focused window on Escape", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stacks the most recently opened window on top", async () => {
    const user = userEvent.setup();
    renderDesktop();
    await user.click(screen.getByText("open cv"));
    await user.click(screen.getByText("open projects"));
    const dialogs = screen.getAllByRole("dialog");
    const zIndexes = dialogs.map(d => Number(getComputedStyle(d).zIndex));
    expect(zIndexes[1]).toBeGreaterThan(zIndexes[0]);
  });
});
