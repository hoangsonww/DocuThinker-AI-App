import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

// Keep WebAuthn/passkey + auth helpers deterministic and offline.
jest.mock("../../utils/passkeys", () => ({
  isPasskeySupported: () => true,
  authenticateWithPasskey: jest.fn(),
}));
jest.mock("../../utils/auth", () => ({
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
  isAuthenticated: () => false,
}));

import Login from "../../pages/Login";

const renderAt = (theme) =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login theme={theme} />
    </MemoryRouter>,
  );

describe("Login snapshot", () => {
  it("matches the rendered markup (light)", () => {
    expect(renderAt("light").asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    expect(renderAt("dark").asFragment()).toMatchSnapshot();
  });
});
