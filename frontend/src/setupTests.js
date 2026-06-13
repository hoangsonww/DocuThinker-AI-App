// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

/*
 * Browser-API polyfills for jsdom.
 *
 * jsdom omits several APIs our components rely on (matchMedia for
 * reduced-motion checks, the Intersection/Resize observers used for scroll
 * reveals, and scroll helpers). Without these, rendering components for
 * snapshot tests throws. The stubs are intentionally inert so renders stay
 * deterministic.
 */
if (typeof window !== "undefined") {
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (typeof window.scrollTo !== "function") {
    window.scrollTo = () => {};
  }

  if (typeof window.HTMLElement !== "undefined") {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

class MockObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof global.IntersectionObserver === "undefined") {
  global.IntersectionObserver = MockObserver;
  if (typeof window !== "undefined") window.IntersectionObserver = MockObserver;
}

if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = MockObserver;
  if (typeof window !== "undefined") window.ResizeObserver = MockObserver;
}

// Several forms use autoFocus, which toggles MUI's focus classes. jsdom honors
// autoFocus inconsistently across environments (it focuses locally but not on
// CI), which would make focus-sensitive snapshots flaky. Neutralize focus so
// the rendered markup is the unfocused state everywhere. (Not a jest mock, so
// clearMocks doesn't reset it between tests.)
if (
  typeof window !== "undefined" &&
  typeof window.HTMLElement !== "undefined"
) {
  window.HTMLElement.prototype.focus = () => {};
}
