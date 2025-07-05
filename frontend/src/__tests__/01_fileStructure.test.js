/**
 * Verifies that the most-important source files really exist.
 * Adjust the list anytime you rename or move files.
 */
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", ".."); // <project root>

/* ── update this list to mirror your actual structure ──────────────── */
const files = [
  // ── components
  "src/components/ChatModal.js",
  "src/components/DropboxFileSelectorModal.js",
  "src/components/UploadModal.js",
  "src/components/Footer.js",
  "src/components/GoogleAnalytics.js",
  "src/components/GoogleDriveFileSelectorModal.js",
  "src/components/Navbar.js",
  "src/components/Spinner.js",
  "src/components/useErrorToast.js",

  // ── pages
  "src/pages/DocumentsPage.js",
  "src/pages/Home.js",
  "src/pages/Profile.js",
  "src/pages/Login.js",
  "src/pages/Register.js",
  "src/pages/LandingPage.js",
  "src/pages/PrivacyPolicy.js",
  "src/pages/TermsOfService.js",
  "src/pages/NotFoundPage.js",
  "src/pages/ForgotPassword.js",
  "src/pages/HowToUse.js",

  // ── entry points / globals
  "src/App.js",
  "src/index.js",
];
/* ──────────────────────────────────────────────────────────────────── */

describe("Project file-structure sanity check", () => {
  it.each(files)("should have %s", (rel) => {
    const full = path.join(rootDir, rel);
    expect(fs.existsSync(full)).toBe(true);
  });
});
