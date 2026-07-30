import { render, screen } from "@testing-library/react";
import ContactWindow from "./ContactWindow";
import { profile } from "../content/profile";

describe("ContactWindow", () => {
  it("links to email and every profile link", () => {
    render(<ContactWindow />);
    expect(screen.getByRole("link", { name: profile.email })).toHaveAttribute(
      "href",
      `mailto:${profile.email}`
    );
    for (const link of profile.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.url);
    }
  });

  it("does not show a phone number", () => {
    const { container } = render(<ContactWindow />);
    expect(container.textContent).not.toMatch(/\+44|07\d{9}/);
  });
});
