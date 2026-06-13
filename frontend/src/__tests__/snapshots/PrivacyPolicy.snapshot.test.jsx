import React from "react";
import { render } from "@testing-library/react";
import PrivacyPolicy from "../../pages/PrivacyPolicy";

describe("PrivacyPolicy snapshot", () => {
  it("matches the rendered markup (light)", () => {
    const { asFragment } = render(<PrivacyPolicy theme="light" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    const { asFragment } = render(<PrivacyPolicy theme="dark" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
