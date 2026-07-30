import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the desktop region", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
