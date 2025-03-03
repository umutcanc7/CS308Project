import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login page", () => {
  render(<App />);
  const heading = screen.getByText(/Hoş Geldiniz/i);
  expect(heading).toBeInTheDocument();
});