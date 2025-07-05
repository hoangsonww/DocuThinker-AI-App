/**
 * Verifies that the main component/page files
 *  • are not empty
 *  • contain an `export default` (so they really export a component / module)
 *
 * Pure filesystem reads – no JSX evaluation, no Babel needed.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");

const targets = [
  "src/components/ChatModal.js",
  "src/components/DropboxFileSelectorModal.js",
  "src/components/UploadModal.js",
  "src/pages/Home.js",
  "src/pages/DocumentsPage.js",
  "src/pages/Profile.js",
];

describe("source-file content sanity", () => {
  it.each(targets)("%s is non-empty and exports default", (rel) => {
    const full = path.join(root, rel);
    const code = fs.readFileSync(full, "utf8");

    // file is not blank
    expect(code.trim().length).toBeGreaterThan(0);

    // must contain "export default" somewhere
    expect(/export\s+default/.test(code)).toBe(true);
  });
});
