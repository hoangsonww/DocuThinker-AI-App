import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

jest.mock("axios");

// react-markdown and its remark/rehype plugins are ESM with deep ESM dep
// trees; stub them (and the markdown sanitizer) so Home renders without
// pulling in the whole pipeline.
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="markdown-mock">{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }));
jest.mock("remark-math", () => ({ __esModule: true, default: () => {} }));
jest.mock("rehype-katex", () => ({ __esModule: true, default: () => {} }));
jest.mock("dompurify", () => ({
  __esModule: true,
  default: { sanitize: (html) => html },
}));

// Audio recorder + heavy modal/toast components: stub to keep the render
// offline and deterministic.
jest.mock("mic-recorder-to-mp3", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockReturnValue({ getMp3: jest.fn() }),
  })),
}));
jest.mock("../../components/UploadModal", () => () => (
  <div data-testid="upload-modal-mock" />
));
jest.mock("../../components/ChatModal", () => () => (
  <div data-testid="chat-modal-mock" />
));
jest.mock("../../components/useErrorToast", () => ({
  useErrorToast: () => ({
    showErrorToast: jest.fn(),
    ErrorToastComponent: () => null,
  }),
}));

import Home from "../../pages/Home";

// Home uses Date.now() for count-up animations; freeze it so the snapshot is
// stable regardless of when the test runs.
const RealDate = Date;
const FIXED_ISO = "2024-06-15T12:00:00.000Z";

beforeAll(() => {
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [FIXED_ISO]));
    }
    static now() {
      return new RealDate(FIXED_ISO).getTime();
    }
  };
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  // No document loaded; keep any mount request pending so the page renders its
  // deterministic initial (upload) state.
  const pending = new Promise(() => {});
  axios.get.mockReturnValue(pending);
  axios.post.mockReturnValue(pending);
  axios.mockReturnValue(pending);
});

afterEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe("Home snapshot", () => {
  it("matches the rendered markup", () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={["/home"]}>
        <Home theme="light" />
      </MemoryRouter>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
