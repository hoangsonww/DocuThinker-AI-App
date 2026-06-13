/**
 * Snapshot coverage for the presentational surface of the app.
 *
 * These lock in the rendered DOM for the static pages, the auth pages, the
 * chrome (Navbar/Footer/Spinner), and the redesigned 3D LandingPage. Heavy
 * runtime-only widgets (upload/chat modals that pull in axios + firebase +
 * file APIs) are intentionally excluded — they have no deterministic initial
 * render to snapshot.
 *
 * To intentionally update a snapshot after a UI change: `npx jest -u`.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithRouter } from "../test-utils";

// The hero's WebGL scene can't run in jsdom; swap in a deterministic stub so
// LandingPage snapshots are stable and don't depend on three.js / a GPU.
jest.mock("../components/three/HeroExperience", () => ({
  __esModule: true,
  default: () => <div data-testid="hero-experience-mock" />,
}));

// WebAuthn/passkey helpers touch browser-only APIs missing in jsdom; stub them
// so the auth pages render their default (no-passkey) state.
jest.mock("../utils/passkeys", () => ({
  __esModule: true,
  isPasskeySupported: () => false,
  isPlatformAuthenticatorAvailable: async () => false,
  authenticateWithPasskey: jest.fn(),
  registerPasskey: jest.fn(),
}));

import Spinner from "../components/Spinner";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import NotFoundPage from "../pages/NotFoundPage";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsOfService";
import HowToUse from "../pages/HowToUse";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import LandingPage from "../pages/LandingPage";

describe("Component snapshots", () => {
  it("Spinner renders consistently", () => {
    const { container } = render(<Spinner />);
    expect(container).toMatchSnapshot();
  });

  it("Footer renders consistently", () => {
    const { container } = renderWithRouter(<Footer />);
    expect(container).toMatchSnapshot();
  });

  it("Navbar renders consistently", () => {
    const { container } = renderWithRouter(
      <Navbar theme="light" onThemeToggle={() => {}} />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe("Static page snapshots", () => {
  it("NotFoundPage renders consistently", () => {
    const { container } = renderWithRouter(<NotFoundPage theme="light" />);
    expect(container).toMatchSnapshot();
  });

  it("PrivacyPolicy renders consistently", () => {
    const { container } = renderWithRouter(<PrivacyPolicy theme="light" />);
    expect(container).toMatchSnapshot();
  });

  it("TermsOfService renders consistently", () => {
    const { container } = renderWithRouter(<TermsOfService theme="light" />);
    expect(container).toMatchSnapshot();
  });

  it("HowToUse renders consistently", () => {
    const { container } = renderWithRouter(<HowToUse theme="light" />);
    expect(container).toMatchSnapshot();
  });
});

describe("Auth page snapshots", () => {
  it("Login renders consistently", () => {
    const { container } = renderWithRouter(<Login theme="light" />);
    expect(container).toMatchSnapshot();
  });

  it("Register renders consistently", () => {
    const { container } = renderWithRouter(<Register theme="light" />);
    expect(container).toMatchSnapshot();
  });

  it("ForgotPassword renders consistently", () => {
    const { container } = renderWithRouter(<ForgotPassword theme="light" />);
    expect(container).toMatchSnapshot();
  });
});

describe("LandingPage snapshot", () => {
  it("renders the full landing page (3D background stubbed)", async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    // Wait for the lazily-imported (mocked) 3D background to resolve so the
    // snapshot captures the settled tree rather than the Suspense fallback.
    await screen.findByTestId("hero-experience-mock");
    expect(container).toMatchSnapshot();
  });
});
