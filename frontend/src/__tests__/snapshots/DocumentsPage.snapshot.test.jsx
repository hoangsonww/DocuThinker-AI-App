import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

import DocumentsPage from "../../pages/DocumentsPage";

// Signed out (no userId in storage): the mount effect short-circuits to the
// empty/CTA state without hitting the network, which is deterministic.
const renderAt = (theme) =>
  render(
    <MemoryRouter initialEntries={["/documents"]}>
      <DocumentsPage theme={theme} />
    </MemoryRouter>,
  );

describe("DocumentsPage snapshot", () => {
  afterEach(() => window.localStorage.clear());

  it("matches the rendered markup (light)", () => {
    expect(renderAt("light").asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    expect(renderAt("dark").asFragment()).toMatchSnapshot();
  });
});
