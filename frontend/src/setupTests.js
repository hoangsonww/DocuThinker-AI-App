// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// --- jsdom polyfills ---
// jsdom doesn't implement these browser APIs that MUI, animations, and a few
// components reach for. Stub them so component renders don't crash in tests.
if (!window.matchMedia) {
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

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
global.ResizeObserver = global.ResizeObserver || MockObserver;
global.IntersectionObserver = global.IntersectionObserver || MockObserver;

if (!window.scrollTo) {
  window.scrollTo = () => {};
}

// Several forms use autoFocus, which toggles MUI's focus classes. jsdom honors
// autoFocus inconsistently across environments (it focuses locally but not on
// CI), which would make focus-sensitive snapshots flaky. Neutralize focus so
// the rendered markup is the unfocused state everywhere. (Not a jest mock, so
// clearMocks doesn't reset it between tests.)
HTMLElement.prototype.focus = () => {};
