/**
 * Quick sanity checks on the Node runtime itself.
 * These will always hold unless the JS engine is broken.
 */
describe("Node runtime basics", () => {
  it("has a valid semantic Node version string", () => {
    // e.g. "18.19.0"
    expect(process.versions.node).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("knows what platform it is on", () => {
    expect(typeof process.platform).toBe("string");
    expect(process.platform.length).toBeGreaterThan(0);
  });

  it("Math.random() is within [0,1)", () => {
    const r = Math.random();
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });
});
