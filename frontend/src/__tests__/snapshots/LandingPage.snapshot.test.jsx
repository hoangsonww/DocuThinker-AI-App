import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// The hero is a lazy-loaded react-three-fiber scene that probes WebGL (absent
// in jsdom) and is nondeterministic. Stub it so the snapshot is stable.
jest.mock("../../components/three/HeroExperience", () => () => (
  <div data-testid="hero-experience-mock" />
));

import LandingPage from "../../pages/LandingPage";

describe("LandingPage snapshot", () => {
  it("matches the rendered markup", async () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    // Wait for the lazy hero stub to resolve so the Suspense boundary has
    // settled before snapshotting.
    await screen.findAllByTestId("hero-experience-mock");

    expect(asFragment()).toMatchSnapshot();
  });
});
