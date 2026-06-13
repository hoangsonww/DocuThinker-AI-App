import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

// The page lists passkeys on mount. Keep it offline and deterministic: the
// list request stays pending so the page renders its stable loading state.
jest.mock("../../utils/passkeys", () => ({
  isPasskeySupported: () => true,
  listPasskeys: () => new Promise(() => {}),
  registerPasskey: jest.fn(),
  renamePasskey: jest.fn(),
  deletePasskey: jest.fn(),
}));

import Passkeys from "../../pages/Passkeys";

const renderAt = (theme) =>
  render(
    <MemoryRouter initialEntries={["/passkeys"]}>
      <Passkeys theme={theme} />
    </MemoryRouter>,
  );

describe("Passkeys snapshot", () => {
  it("matches the rendered markup (light)", () => {
    expect(renderAt("light").asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    expect(renderAt("dark").asFragment()).toMatchSnapshot();
  });
});
