import { render, screen, within } from "@testing-library/react";
import ProjectsWindow from "./ProjectsWindow";
import { projects } from "../content/projects";

const STATUS_LABELS = { live: "Live", published: "Published", local: "Runs locally" };

describe("ProjectsWindow", () => {
  it("renders one article per project", () => {
    render(<ProjectsWindow />);
    expect(screen.getAllByRole("article")).toHaveLength(projects.length);
  });

  it("shows a status chip and a reason for every project", () => {
    render(<ProjectsWindow />);
    for (const project of projects) {
      const card = screen.getByRole("article", { name: project.name });
      expect(within(card).getByText(STATUS_LABELS[project.status])).toBeInTheDocument();
      expect(within(card).getByText(project.why)).toBeInTheDocument();
    }
  });

  it("links to the repo and, where present, the live site", () => {
    render(<ProjectsWindow />);
    for (const project of projects) {
      const card = screen.getByRole("article", { name: project.name });
      if (project.repoUrl) {
        expect(within(card).getByRole("link", { name: /repo/i })).toHaveAttribute(
          "href",
          project.repoUrl
        );
      }
      if (project.liveUrl) {
        expect(within(card).getByRole("link", { name: /visit/i })).toHaveAttribute(
          "href",
          project.liveUrl
        );
      }
    }
  });
});
