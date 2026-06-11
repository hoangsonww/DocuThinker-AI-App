// Shared helpers for component/snapshot tests.
//
// Lives outside `__tests__/` on purpose: Jest's testMatch only treats files
// under `__tests__/` (or named *.test/*.spec) as suites, so this file is
// importable from tests without itself being run as an (empty) suite.
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Render a component inside a MemoryRouter so router hooks/links work.
 *
 * @param {React.ReactElement} ui     element under test
 * @param {object}             [opts]
 * @param {string}             [opts.route="/"] initial history entry
 * @returns the @testing-library/react render result
 */
export function renderWithRouter(ui, { route = "/" } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  });
}
