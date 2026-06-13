import React from "react";
import { render } from "@testing-library/react";
import axios from "axios";

jest.mock("axios");

jest.mock("../../utils/auth", () => ({
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
  isAuthenticated: () => false,
}));

import Profile from "../../pages/Profile";

beforeAll(() => {
  // The avatar is picked with Math.random; pin it so the snapshot is stable.
  jest.spyOn(global.Math, "random").mockReturnValue(0);
});

afterAll(() => {
  global.Math.random.mockRestore();
});

beforeEach(() => {
  // Profile fetches its data on mount. Leave the request pending so the page
  // renders its deterministic loading state (no network, no act races).
  const pending = new Promise(() => {});
  axios.get.mockReturnValue(pending);
  axios.post.mockReturnValue(pending);
  axios.mockReturnValue(pending);
});

afterEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe("Profile snapshot", () => {
  it("matches the rendered markup (light)", () => {
    const { asFragment } = render(<Profile theme="light" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    const { asFragment } = render(<Profile theme="dark" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
