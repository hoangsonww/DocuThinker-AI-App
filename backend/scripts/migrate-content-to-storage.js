/**
 * Migration: shrink bloated user documents.
 *
 * Older documents stored the full `originalText` + `originalHtml` INLINE in the
 * user's `documents` array. That overflows Firestore's 1 MB per-document limit,
 * so any new upload (even a tiny one) fails. This moves each doc's text/HTML to
 * a Supabase content object and replaces the inline blobs with a tiny
 * `contentPath`, dropping the user document well under the limit.
 *
 * Safe: content is offloaded to storage BEFORE the inline fields are dropped,
 * so no data is lost. Re-runnable.
 *
 * Run from the backend dir with its env loaded:
 *   node scripts/migrate-content-to-storage.js
 */
require("dotenv").config();
const { firestore, storeDocumentContent } = require("../services/services");

const len = (s) => (typeof s === "string" ? s.length : 0);

(async () => {
  const snap = await firestore.collection("users").get();
  let usersUpdated = 0;
  let docsMigrated = 0;
  let failures = 0;

  for (const userDoc of snap.docs) {
    const uid = userDoc.id;
    const data = userDoc.data();
    const documents = Array.isArray(data.documents) ? data.documents : [];
    if (documents.length === 0) continue;

    let changed = false;
    const newDocs = [];

    for (const d of documents) {
      if (!d || typeof d !== "object") {
        newDocs.push(d);
        continue;
      }

      const clean = {
        id: d.id,
        title: d.title || "",
        summary: d.summary || "",
        filePath: d.filePath || "",
        fileType: d.fileType || "",
      };

      const hasInline = len(d.originalText) > 0 || len(d.originalHtml) > 0;

      if (d.contentPath) {
        clean.contentPath = d.contentPath;
        if (hasInline) changed = true; // dropping stray inline shrinks the doc
      } else if (hasInline) {
        try {
          clean.contentPath = await storeDocumentContent(uid, d.id, {
            originalText: d.originalText || "",
            originalHtml: d.originalHtml || "",
          });
          changed = true;
          docsMigrated++;
        } catch (e) {
          console.error(`offload failed user=${uid} doc=${d.id}: ${e.message}`);
          failures++;
          newDocs.push(d); // keep original so nothing is lost
          continue;
        }
      }

      newDocs.push(clean);
    }

    if (!changed) continue;

    try {
      await firestore
        .collection("users")
        .doc(uid)
        .update({ documents: newDocs });
      usersUpdated++;
      console.log(`Updated user ${uid} (${newDocs.length} docs)`);
    } catch (e) {
      console.error(`user update failed ${uid}: ${e.message}`);
      failures++;
    }
  }

  console.log(
    `Migration done. users updated: ${usersUpdated}, docs migrated: ${docsMigrated}, failures: ${failures}`,
  );
  process.exit(failures > 0 ? 2 : 0);
})().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
