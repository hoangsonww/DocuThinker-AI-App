import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

import ForgotPassword from "../../pages/ForgotPassword";

const renderAt = (theme) =>
  render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPassword theme={theme} />
    </MemoryRouter>,
  );

describe("ForgotPassword snapshot", () => {
  it("matches the rendered markup (light)", () => {
    expect(renderAt("light").asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    expect(renderAt("dark").asFragment()).toMatchSnapshot();
  });
});
