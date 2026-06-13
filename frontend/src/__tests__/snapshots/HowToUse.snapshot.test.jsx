import React from "react";
import { render } from "@testing-library/react";
import HowToUse from "../../pages/HowToUse";

describe("HowToUse snapshot", () => {
  it("matches the rendered markup (light)", () => {
    const { asFragment } = render(<HowToUse theme="light" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    const { asFragment } = render(<HowToUse theme="dark" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
