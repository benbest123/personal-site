import { render, screen } from "@testing-library/react";
import CvWindow from "./CvWindow";
import { cv } from "../content/cv";

describe("CvWindow", () => {
  it("renders every role with its company, title and bullets", () => {
    render(<CvWindow />);
    for (const role of cv.roles) {
      expect(screen.getByText(role.company)).toBeInTheDocument();
      expect(screen.getByText(role.title)).toBeInTheDocument();
      for (const bullet of role.bullets) {
        expect(screen.getByText(bullet)).toBeInTheDocument();
      }
    }
  });

  it("renders every skill group", () => {
    render(<CvWindow />);
    for (const group of cv.skillGroups) {
      expect(screen.getByText(group.name)).toBeInTheDocument();
    }
  });

  it("offers the CV as a download", () => {
    render(<CvWindow />);
    const link = screen.getByRole("link", { name: /download cv/i });
    expect(link).toHaveAttribute("href", "/Benjamin_Best_CV.pdf");
    expect(link).toHaveAttribute("download");
  });
});
