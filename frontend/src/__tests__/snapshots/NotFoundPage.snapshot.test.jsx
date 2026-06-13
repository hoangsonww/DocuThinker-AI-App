import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => jest.fn() };
});

import NotFoundPage from "../../pages/NotFoundPage";

describe("NotFoundPage snapshot", () => {
  it("matches the rendered markup (light)", () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <NotFoundPage theme="light" />
      </MemoryRouter>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <NotFoundPage theme="dark" />
      </MemoryRouter>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
