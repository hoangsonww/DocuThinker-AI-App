/**
 * Makes sure core deps remain declared.
 * This will only fail if someone deletes React itself
 * (which would break the app anyway).
 */
const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "..", "package.json"), "utf8"),
);

describe("package.json dependencies sanity", () => {
  it("includes react & react-dom", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps).toHaveProperty("react");
    expect(deps).toHaveProperty("react-dom");
  });
});
