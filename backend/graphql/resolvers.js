const { firestore } = require("../services/services");

/**
 * Resolvers for the GraphQL schema
 * @type {{Query: {getUser(*, {id: *}): Promise<{[p: string]: FirebaseFirestore.DocumentFieldValue, id: *}>, getDocument(*, {userId: *, docId: *}): Promise<*>, listDocuments(*, {userId: *}): Promise<*>}, Mutation: {createUser(*, {email: *, password: *}): Promise<{id: string, email: *, createdAt: string, documents: []}>, deleteDocument(*, {userId: *, docId: *}): Promise<boolean>, updateDocumentTitle(*, {userId: *, docId: *, title: *}): Promise<*>}}} Resolvers for the GraphQL schema
 */
const resolvers = {
  Query: {
    /**
     * Get user by ID
     * @param _ - Parent object
     * @param id - User ID
     * @returns {Promise<{[p: string]: FirebaseFirestore.DocumentFieldValue, id: *}>} User object
     */
    async getUser(_, { id }) {
      const userDoc = await firestore.collection("users").doc(id).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      return { id, ...userDoc.data() };
    },

    /**
     * Get document by user ID and document ID
     * @param _ - Parent object
     * @param userId - User ID
     * @param docId - Document ID
     * @returns {Promise<*>} Document object
     */
    async getDocument(_, { userId, docId }) {
      const userDoc = await firestore.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const document = userDoc.data().documents.find((doc) => doc.id === docId);

      if (!document) {
        throw new Error("Document not found");
      }

      return document;
    },

    /**
     * List documents for a user
     *
     * @param _ - Parent object
     * @param userId - User ID
     * @returns {Promise<any|*[]>} List of documents
     */
    async listDocuments(_, { userId }) {
      const userDoc = await firestore.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      return userDoc.data().documents || [];
    },
  },

  Mutation: {
    /**
     * Create a new user
     * @param _ - Parent object
     * @param email - User email
     * @param password - User password
     * @returns {Promise<{id: string, email: *, createdAt: string, documents: *[]}>} Created user object
     */
    async createUser(_, { email, password }) {
      // Implement user creation logic
      const newUser = await firestore.collection("users").add({
        email,
        createdAt: new Date().toISOString(),
        documents: [],
      });

      return {
        id: newUser.id,
        email,
        createdAt: new Date().toISOString(),
        documents: [],
      };
    },

    /**
     * Delete a document
     * @param _ - Parent object
     * @param userId - User ID
     * @param docId - Document ID
     * @returns {Promise<boolean>} True if document is deleted successfully
     */
    async deleteDocument(_, { userId, docId }) {
      const userDoc = await firestore.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const updatedDocs = userData.documents.filter((doc) => doc.id !== docId);

      await firestore
        .collection("users")
        .doc(userId)
        .update({ documents: updatedDocs });

      return true;
    },

    /**
     * Update document title
     * @param _ - Parent object
     * @param userId - User ID
     * @param docId - Document ID
     * @param title - New document title
     * @returns {Promise<*>} Updated document object
     */
    async updateDocumentTitle(_, { userId, docId, title }) {
      const userDoc = await firestore.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const docIndex = userData.documents.findIndex((doc) => doc.id === docId);

      if (docIndex === -1) {
        throw new Error("Document not found");
      }

      userData.documents[docIndex].title = title;

      await firestore
        .collection("users")
        .doc(userId)
        .update({ documents: userData.documents });

      return userData.documents[docIndex];
    },
  },
};

module.exports = resolvers;
