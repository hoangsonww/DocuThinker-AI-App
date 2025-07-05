module.exports = {
  // Look for tests in __tests__ folders and files ending in .test.js or .spec.js
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  // Use the Node environment (so you can mock modules like firebase-admin)
  testEnvironment: "node",
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Collect coverage information (optional)
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  // If you use Babel or need module aliasing, configure here
  // transform: { '^.+\\.js$': 'babel-jest' },
};
