/**
 * One-time migration for existing documents.
 *
 * Pre-existing docs were stored as space-joined plaintext only (no originalHtml,
 * no stored file). This backfills `originalHtml` (paragraph-ized from the stored
 * text) and ensures `filePath` / `fileType` fields exist, so the new viewer
 * renders old docs as readable paragraphs instead of a raw blob.
 *
 * NOTE: the original PDF/DOCX file is NOT recoverable here (only text was ever
 * stored), so old docs render as clean text/HTML, not the native document.
 * New uploads going forward store the real file and render it natively.
 *
 * Run from the backend dir with its env loaded:
 *   node scripts/backfill-original-html.js
 */
require("dotenv").config();
const { firestore } = require("../services/services");

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const textToHtml = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

(async () => {
  const snap = await firestore.collection("users").get();
  let usersUpdated = 0;
  let docsUpdated = 0;
  let usersFailed = 0;

  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    const documents = Array.isArray(data.documents) ? data.documents : [];
    if (documents.length === 0) continue;

    let changed = false;
    const updated = documents.map((d) => {
      if (!d || typeof d !== "object") return d;
      const needsHtml = typeof d.originalText === "string" && !d.originalHtml;
      if (needsHtml) {
        changed = true;
        docsUpdated++;
      }
      return {
        ...d,
        originalHtml:
          d.originalHtml || (needsHtml ? textToHtml(d.originalText) : ""),
        filePath: d.filePath || "",
        fileType: d.fileType || "",
      };
    });

    if (!changed) continue;

    try {
      await firestore
        .collection("users")
        .doc(userDoc.id)
        .update({ documents: updated });
      usersUpdated++;
    } catch (e) {
      // Most likely the 1MB Firestore document limit once HTML is added.
      usersFailed++;
      console.error(`Failed to update user ${userDoc.id}: ${e.message}`);
    }
  }

  console.log(
    `Backfill done. Users updated: ${usersUpdated}, documents updated: ${docsUpdated}, users failed: ${usersFailed}`,
  );
  process.exit(usersFailed > 0 ? 2 : 0);
})().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
