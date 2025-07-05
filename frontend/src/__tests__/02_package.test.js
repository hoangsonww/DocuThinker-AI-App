/**
 * Verifies that the root package.json defines a test script.
 */
const fs = require("fs");
const path = require("path");

const pkgPath = path.resolve(__dirname, "..", "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

describe("package.json scripts", () => {
  test('defines a "test" script', () => {
    expect(pkg).toHaveProperty("scripts");
    expect(pkg.scripts).toHaveProperty("test");
    expect(typeof pkg.scripts.test).toBe("string");
  });
});
