import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { profile } from "../../content/profile";
import { DESKTOP_ORDER, REGISTRY } from "../registry";

describe("Desktop", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("shows the name and summary without any interaction", () => {
    render(<App />);
    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByText(profile.summary)).toBeInTheDocument();
  });

  it("renders one icon per registered window", () => {
    render(<App />);
    for (const id of DESKTOP_ORDER) {
      expect(screen.getByRole("button", { name: REGISTRY[id].title })).toBeInTheDocument();
    }
  });

  it("opens a window when its icon is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("dialog", { name: "Projects" })).toBeInTheDocument();
  });

  it("adds a taskbar button per open window", async () => {
    const user = userEvent.setup();
    render(<App />);
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).queryAllByRole("button")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    expect(within(taskbar).getAllByRole("button")).toHaveLength(1);
  });

  it("minimises and restores from the taskbar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    const taskbarButton = within(taskbar).getByRole("button", { name: /projects/i });

    await user.click(taskbarButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(taskbarButton);
    expect(screen.getByRole("dialog", { name: "Projects" })).toBeInTheDocument();
  });

  it("returns focus to the desktop icon after closing a window", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Projects" })).toHaveFocus();
  });

  it("returns focus to the taskbar button after minimising a window from its title bar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Minimize" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).getByRole("button", { name: /projects/i })).toHaveFocus();
  });
});
