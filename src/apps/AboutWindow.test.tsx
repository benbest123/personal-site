import { render, screen } from "@testing-library/react";
import AboutWindow from "./AboutWindow";
import { profile } from "../content/profile";

describe("AboutWindow", () => {
  it("renders the profile name, headline and summary", () => {
    render(<AboutWindow />);
    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByText(profile.headline)).toBeInTheDocument();
    expect(screen.getByText(profile.summary)).toBeInTheDocument();
  });
});
