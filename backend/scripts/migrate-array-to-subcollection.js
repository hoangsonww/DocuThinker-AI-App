/**
 * Permanent fix migration: move each user's inline `documents` array into a
 * per-document subcollection at users/{uid}/documents/{docId}. This removes the
 * 1 MB-per-user ceiling for good (each document is its own Firestore doc).
 *
 * DATA SAFE: documents are COPIED into the subcollection first; the inline array
 * is only cleared once every document for that user copied successfully. If any
 * copy fails, the array is left intact (and reads still merge both sources), so
 * nothing is ever lost. Re-runnable (skips docs already in the subcollection).
 *
 * Run from the backend dir with its env loaded:
 *   node scripts/migrate-array-to-subcollection.js
 */
require("dotenv").config();
const admin = require("firebase-admin");
const { firestore } = require("../services/services"); // initializes admin

(async () => {
  const base = Date.now();
  const snap = await firestore.collection("users").get();
  let users = 0;
  let docsCopied = 0;
  let arraysCleared = 0;
  let failures = 0;

  for (const userDoc of snap.docs) {
    const uid = userDoc.id;
    const arr = Array.isArray(userDoc.data().documents)
      ? userDoc.data().documents
      : [];
    if (arr.length === 0) continue;

    const n = arr.length;
    let allOk = true;

    for (let i = 0; i < n; i++) {
      const d = arr[i];
      if (!d || !d.id) {
        // Malformed entry — don't risk clearing the array over it.
        console.warn(`user ${uid}: skipping malformed array entry at ${i}`);
        allOk = false;
        continue;
      }
      try {
        const subRef = firestore
          .collection("users")
          .doc(uid)
          .collection("documents")
          .doc(d.id);
        const existing = await subRef.get();
        if (existing.exists) continue; // already migrated

        // Preserve chronological order: earlier array entries get earlier times.
        const createdAt = admin.firestore.Timestamp.fromMillis(
          base - (n - 1 - i) * 1000,
        );
        await subRef.set({ ...d, createdAt });
        docsCopied++;
      } catch (e) {
        console.error(`copy failed user=${uid} doc=${d.id}: ${e.message}`);
        failures++;
        allOk = false;
      }
    }

    users++;
    if (allOk) {
      try {
        await firestore.collection("users").doc(uid).update({ documents: [] });
        arraysCleared++;
        console.log(`user ${uid}: migrated ${n} docs, array cleared`);
      } catch (e) {
        console.error(`clear failed user=${uid}: ${e.message}`);
        failures++;
      }
    } else {
      console.warn(
        `user ${uid}: kept inline array (some docs not copied) — safe, reads still merge`,
      );
    }
  }

  console.log(
    `Migration done. users=${users} docsCopied=${docsCopied} arraysCleared=${arraysCleared} failures=${failures}`,
  );
  process.exit(failures > 0 ? 2 : 0);
})().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
