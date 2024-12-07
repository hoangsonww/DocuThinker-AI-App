const firebaseAdmin = require("firebase-admin");
const firestore = firebaseAdmin.firestore();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: >
 *         The `User` schema represents user-related data stored in Firestore. Each user
 *         has a unique Firebase UID and associated metadata such as email, created date,
 *         theme preferences, social media links, and a list of documents.
 *       properties:
 *         uid:
 *           type: string
 *           description: The unique Firebase user ID.
 *           example: "12345abcde"
 *         email:
 *           type: string
 *           description: The user's email address.
 *           example: "user@example.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the user was created.
 *           example: "2023-01-01T12:00:00Z"
 *         documents:
 *           type: array
 *           description: List of documents associated with the user.
 *           items:
 *             $ref: '#/components/schemas/Document'
 *         theme:
 *           type: string
 *           description: The user's theme preference (light or dark).
 *           example: "dark"
 *         socialMedia:
 *           type: object
 *           description: Social media links for the user.
 *           properties:
 *             github:
 *               type: string
 *               example: "https://github.com/example"
 *             linkedin:
 *               type: string
 *               example: "https://linkedin.com/in/example"
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users in Firestore.
 */

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
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       description: >
 *         The `Document` schema represents a user-created document within the system.
 *         Each document is associated with a specific user and includes metadata such
 *         as title, ID, and other attributes defined by the user.
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the document.
 *           example: "doc123"
 *         title:
 *           type: string
 *           description: The title of the document.
 *           example: "My First Document"
 *         summary:
 *           type: string
 *           description: A brief summary of the document.
 *           example: "This is a summary of my first document."
 */

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: API for managing user documents in Firestore.
 */

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
    await firestore
      .collection("users")
      .doc(userId)
      .update({
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

    const documents = userDoc
      .data()
      .documents.map((doc) =>
        doc.id === docId ? { ...doc, title: newTitle } : doc,
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

    return userDoc.data().documents.find((doc) => doc.id === docId) || null;
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

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: >
 *       API for managing users in Firestore. This includes operations for user registration,
 *       authentication, and profile management, such as updating email, password, and social
 *       media links.
 *   - name: Documents
 *     description: >
 *       API for managing user documents in Firestore. Includes operations for uploading,
 *       retrieving, searching, and deleting documents. These endpoints support managing
 *       document metadata and refining document details.
 *   - name: Audio
 *     description: >
 *       API for processing audio files. Allows users to upload audio files for transcription
 *       or other types of audio-related processing and analysis.
 *   - name: AI/Machine Learning
 *     description: >
 *       API for leveraging AI and machine learning models to extract insights from documents.
 *       Provides functionality for generating key ideas, discussion points, and contextual AI
 *       conversations based on uploaded documents.
 *   - name: Document Analysis
 *     description: >
 *       API for performing advanced analysis on documents. Includes sentiment analysis,
 *       bullet-point summaries, multi-language summaries, content rewriting, and generating
 *       actionable recommendations.
 *   - name: Document Refinement
 *     description: >
 *       API for enhancing and refining document content. These endpoints are designed to
 *       help users polish and improve their document text for better readability and impact.
 */

module.exports = { User, Document };
