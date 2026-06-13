module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testEnvironment: "jsdom",
  transform: {
    // Babel presets are declared inline (not in a project babel.config.js) so
    // they only apply when Jest runs and never interfere with the craco build,
    // which owns its own Babel pipeline.
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    ],
    "^.+\\.mjs$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },
  // Tell Jest to transform certain ESM packages in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(react-markdown|remark-gfm|remark-math|rehype-katex|devlop)/)",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot|mp3|wav)$":
      "<rootDir>/src/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  clearMocks: true,
};
