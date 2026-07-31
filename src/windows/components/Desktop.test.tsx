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
    const desktop = screen.getByRole("main");
    for (const id of DESKTOP_ORDER) {
      expect(within(desktop).getByRole("button", { name: REGISTRY[id].title })).toBeInTheDocument();
    }
  });

  it("labels the CV icon and its window 'My CV'", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "My CV" }));
    expect(screen.getByRole("dialog", { name: "My CV" })).toBeInTheDocument();
  });

  it("opens a window when its icon is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("dialog", { name: "Projects" })).toBeInTheDocument();
  });

  it("adds a taskbar button per open window", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).queryAllByRole("button")).toHaveLength(0);
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(within(taskbar).getAllByRole("button")).toHaveLength(1);
  });

  it("minimises and restores from the taskbar", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
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
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Scoped to `main` (the desktop), not `screen` directly: a taskbar button and a
    // desktop icon can share an accessible name, and this query would otherwise only be
    // unambiguous by the coincidence that closing (unlike minimising) removes the taskbar
    // button too.
    expect(within(desktop).getByRole("button", { name: "Projects" })).toHaveFocus();
  });

  it("returns focus to the taskbar button after minimising a window from its title bar", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    const dialog = screen.getByRole("dialog", { name: "Projects" });
    await user.click(within(dialog).getByRole("button", { name: "Minimize" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    expect(within(taskbar).getByRole("button", { name: /projects/i })).toHaveFocus();
  });

  it("keeps focus inside the newly opened window when opening it discards another window on mobile", async () => {
    window.innerWidth = 500;
    window.innerHeight = 700;
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");

    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    await user.click(within(desktop).getByRole("button", { name: "Contact" }));

    // Only the new window should exist — `singleWindow: true` on mobile discards Projects
    // outright, which is exactly the case that broke focus restoration before this fix
    // round: reconstructing "what changed" from a state diff could not tell "the window
    // closed" apart from "another OPEN discarded it", and sent focus to Projects' icon
    // instead of leaving it in Contact.
    expect(screen.queryAllByRole("dialog")).toHaveLength(1);
    const dialog = screen.getByRole("dialog", { name: "Contact" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("marks only the focused window's taskbar button as pressed", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    await user.click(within(desktop).getByRole("button", { name: "Contact" }));

    const taskbar = screen.getByRole("toolbar", { name: "Open windows" });
    const projectsButton = within(taskbar).getByRole("button", { name: /projects/i });
    const contactButton = within(taskbar).getByRole("button", { name: /contact/i });

    expect(contactButton).toHaveAttribute("aria-pressed", "true");
    expect(projectsButton).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the name and summary block non-interactive so it does not swallow clicks meant for windows beneath it", () => {
    render(<App />);
    // This block is stretched over the whole desktop (`absolute inset-0`) so its text can
    // be centred in it, which puts it on top of both the icon column and any open window.
    // pointer-events-none is the only thing letting clicks through to them.
    expect(screen.getByTestId("desktop-summary")).toHaveClass("pointer-events-none");
  });

  it("leaves the icon column and summary block interactive on desktop even with a window open", async () => {
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByTestId("desktop-icons")).not.toHaveAttribute("inert");
    expect(screen.getByTestId("desktop-summary")).not.toHaveAttribute("inert");
  });

  it("makes the icon column and summary block inert while a window covers them on mobile", async () => {
    window.innerWidth = 500;
    window.innerHeight = 700;
    const user = userEvent.setup();
    render(<App />);
    const desktop = screen.getByRole("main");
    await user.click(within(desktop).getByRole("button", { name: "Projects" }));
    expect(screen.getByTestId("desktop-icons")).toHaveAttribute("inert");
    expect(screen.getByTestId("desktop-summary")).toHaveAttribute("inert");
  });
});
