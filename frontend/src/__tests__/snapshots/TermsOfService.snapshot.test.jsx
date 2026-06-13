import React from "react";
import { render } from "@testing-library/react";
import TermsOfService from "../../pages/TermsOfService";

describe("TermsOfService snapshot", () => {
  it("matches the rendered markup (light)", () => {
    const { asFragment } = render(<TermsOfService theme="light" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the rendered markup (dark)", () => {
    const { asFragment } = render(<TermsOfService theme="dark" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
