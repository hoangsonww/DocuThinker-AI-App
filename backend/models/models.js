const firebaseAdmin = require("firebase-admin");
const firestore = firebaseAdmin.firestore();

/**
 * User Model - Manages interactions with Firestore for user-related data
 */
const User = {
  /**
   * Create a new user document in Firestore
   * @param {string} uid - Firebase Auth user ID
   * @param {string} email - User email
   * @param {Date} createdAt - Creation date
   */
  async create(uid, email, createdAt) {
    await firestore.collection("users").doc(uid).set({
      email: email,
      documents: [],
      createdAt: createdAt,
    });
  },

  /**
   * Get user document by ID
   * @param {string} uid - Firebase Auth user ID
   * @returns {object} - User document data
   */
  async getById(uid) {
    const userDoc = await firestore.collection("users").doc(uid).get();
    return userDoc.exists ? userDoc.data() : null;
  },

  /**
   * Update user's email in Firestore
   * @param {string} uid - Firebase Auth user ID
   * @param {string} newEmail - New email to update
   */
  async updateEmail(uid, newEmail) {
    await firestore.collection("users").doc(uid).update({ email: newEmail });
  },

  /**
   * Update user's theme preference
   * @param {string} uid - Firebase Auth user ID
   * @param {string} theme - New theme preference ("light" or "dark")
   */
  async updateTheme(uid, theme) {
    await firestore.collection("users").doc(uid).update({ theme });
  },

  /**
   * Update user's social media links
   * @param {string} uid - Firebase Auth user ID
   * @param {object} socialMedia - Object with social media links
   */
  async updateSocialMedia(uid, socialMedia) {
    await firestore.collection("users").doc(uid).update({ socialMedia });
  },

  /**
   * Delete all documents for a specific user
   * @param {string} uid - Firebase Auth user ID
   */
  async deleteAllDocuments(uid) {
    await firestore.collection("users").doc(uid).update({ documents: [] });
  },
};

/**
 * Document Model - Manages user documents within Firestore
 */
const Document = {
  /**
   * Add a new document to the user's document list
   * @param {string} userId - Firebase Auth user ID
   * @param {object} doc - Document data (e.g., id, title, summary, etc.)
   */
  async add(userId, doc) {
    await firestore.collection("users").doc(userId).update({
      documents: firebaseAdmin.firestore.FieldValue.arrayUnion(doc),
    });
  },

  /**
   * Update document title for a specific document
   * @param {string} userId - Firebase Auth user ID
   * @param {string} docId - Document ID
   * @param {string} newTitle - New title for the document
   */
  async updateTitle(userId, docId, newTitle) {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    const documents = userDoc.data().documents.map((doc) =>
      doc.id === docId ? { ...doc, title: newTitle } : doc
    );

    await firestore.collection("users").doc(userId).update({ documents });
  },

  /**
   * Get a specific document by ID for a user
   * @param {string} userId - Firebase Auth user ID
   * @param {string} docId - Document ID
   * @returns {object} - Document data
   */
  async getById(userId, docId) {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    return userDoc
      .data()
      .documents.find((doc) => doc.id === docId) || null;
  },

  /**
   * Delete a specific document from user's document list
   * @param {string} userId - Firebase Auth user ID
   * @param {string} docId - Document ID
   */
  async delete(userId, docId) {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    const updatedDocuments = userDoc
      .data()
      .documents.filter((doc) => doc.id !== docId);

    await firestore.collection("users").doc(userId).update({
      documents: updatedDocuments,
    });
  },
};

module.exports = { User, Document };
