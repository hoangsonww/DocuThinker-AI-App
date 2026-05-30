module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "core/**/*.js",
    "prompts/**/*.js",
    "schemas/**/*.js",
    "mcp/**/*.js",
    "context/**/*.js",
    "!node_modules/**",
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
