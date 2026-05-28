const firebaseAdmin = require("firebase-admin");
// Requiring the services module guarantees Firebase Admin has been initialized
// (its initializeApp call runs on first load) and hands us the shared Firestore
// instance so passkeys live alongside the rest of the user data.
const { firestore } = require("../services/services");

const PASSKEYS_COLLECTION = "passkeys";
const CHALLENGES_COLLECTION = "webauthnChallenges";

/**
 * Normalize a Firestore Timestamp / Date / ISO string to epoch milliseconds.
 * @param {*} value - Timestamp, Date, string, or nullish
 * @returns {number} - Epoch milliseconds (0 when not parseable)
 */
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Convert a stored timestamp to an ISO string for API responses.
 * @param {*} value - Timestamp, Date, string, or nullish
 * @returns {string|null} - ISO 8601 string, or null
 */
const toIso = (value) => {
  const ms = toMillis(value);
  return ms ? new Date(ms).toISOString() : null;
};

/**
 * Passkey Model - Stores WebAuthn credentials in Firestore.
 *
 * Each document represents a single passkey and is keyed by the credential ID
 * (a base64url string, which is a valid Firestore document ID). A user may own
 * any number of passkeys; they are linked back to the account via `userId`.
 */
const Passkey = {
  /**
   * Persist a new passkey credential.
   * @param {object} passkey - Fully-formed passkey document
   */
  async create(passkey) {
    await firestore
      .collection(PASSKEYS_COLLECTION)
      .doc(passkey.credentialId)
      .set(passkey);
  },

  /**
   * Look up a single passkey by its credential ID.
   * @param {string} credentialId - base64url credential ID
   * @returns {Promise<object|null>} - Passkey document or null
   */
  async getById(credentialId) {
    const doc = await firestore
      .collection(PASSKEYS_COLLECTION)
      .doc(credentialId)
      .get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * List every passkey belonging to a user.
   * @param {string} userId - Firebase Auth user ID
   * @returns {Promise<object[]>} - Array of passkey documents
   */
  async listByUser(userId) {
    const snapshot = await firestore
      .collection(PASSKEYS_COLLECTION)
      .where("userId", "==", userId)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Update the signature counter and last-used timestamp after a login.
   * @param {string} credentialId - base64url credential ID
   * @param {number} counter - New signature counter from the authenticator
   */
  async updateCounter(credentialId, counter) {
    await firestore
      .collection(PASSKEYS_COLLECTION)
      .doc(credentialId)
      .update({ counter, lastUsedAt: new Date() });
  },

  /**
   * Rename a passkey.
   * @param {string} credentialId - base64url credential ID
   * @param {string} name - New display name
   */
  async rename(credentialId, name) {
    await firestore
      .collection(PASSKEYS_COLLECTION)
      .doc(credentialId)
      .update({ name });
  },

  /**
   * Delete a passkey.
   * @param {string} credentialId - base64url credential ID
   */
  async remove(credentialId) {
    await firestore.collection(PASSKEYS_COLLECTION).doc(credentialId).delete();
  },
};

/**
 * Challenge Model - Short-lived WebAuthn challenges.
 *
 * Challenges are stored server-side (rather than in a cookie/session) so the
 * flow works across the stateless, serverless backend. Each challenge is keyed
 * by a random flow ID handed to the client, and is deleted as soon as it is
 * consumed. Stale entries are rejected by the controller's TTL check.
 */
const Challenge = {
  /**
   * Save a challenge for an in-flight registration or authentication.
   * @param {string} flowId - Random per-flow identifier
   * @param {object} data - { challenge, type, userId?, rpID, origin }
   */
  async save(flowId, data) {
    await firestore
      .collection(CHALLENGES_COLLECTION)
      .doc(flowId)
      .set({ ...data, createdAt: new Date() });
  },

  /**
   * Retrieve a challenge by flow ID.
   * @param {string} flowId - Random per-flow identifier
   * @returns {Promise<object|null>} - Challenge document or null
   */
  async get(flowId) {
    const doc = await firestore
      .collection(CHALLENGES_COLLECTION)
      .doc(flowId)
      .get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * Delete a challenge once it has been consumed (best-effort).
   * @param {string} flowId - Random per-flow identifier
   */
  async remove(flowId) {
    await firestore
      .collection(CHALLENGES_COLLECTION)
      .doc(flowId)
      .delete()
      .catch(() => {});
  },
};

module.exports = { Passkey, Challenge, toMillis, toIso };
