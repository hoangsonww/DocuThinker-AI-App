import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

jest.mock("../../utils/passkeys", () => ({
  isPasskeySupported: () => true,
  registerPasskey: jest.fn(),
}));

// The post-signup passkey modal pulls in WebAuthn; stub it.
jest.mock("../../components/PasskeyPromptModal", () => () => (
  <div data-testid="passkey-prompt-modal-mock" />
));

import Register from "../../pages/Register";

const renderAt = (theme) =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Register theme={theme} />
    </MemoryRouter>,
  );

describe("Register snapshot", () => {
  it("matches the rendered markup (light)", () => {
    expect(renderAt("light").asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    expect(renderAt("dark").asFragment()).toMatchSnapshot();
  });
});
