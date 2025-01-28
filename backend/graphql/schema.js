const { makeExecutableSchema } = require("@graphql-tools/schema");

/**
 * GraphQL schema definition
 * @type {string} GraphQL schema definition
 */
const typeDefs = `
  type User {
    id: ID!
    email: String!
    createdAt: String
    documents: [Document!]
  }

  type Document {
    id: ID!
    title: [String!]!
    summary: String!
    originalText: String!
  }

  type Query {
    getUser(id: ID!): User
    getDocument(userId: ID!, docId: ID!): Document
    listDocuments(userId: ID!): [Document!]
  }

  type Mutation {
    createUser(email: String!, password: String!): User
    deleteDocument(userId: ID!, docId: ID!): Boolean
    updateDocumentTitle(userId: ID!, docId: ID!, title: String!): Document
  }
`;

/**
 * Resolvers for the GraphQL schema
 * @type {{Query: {getUser(*, {id: *}): Promise<*&{id: *}>, getDocument(*, {userId: *, docId: *}): Promise<*>, listDocuments(*, {userId: *}): Promise<*>}, Mutation: {createUser(*, {email: *, password: *}): Promise<{id: *, email: *, createdAt: string, documents: []}>, deleteDocument(*, {userId: *, docId: *}): Promise<boolean>, updateDocumentTitle(*, {userId: *, docId: *, title: *}): Promise<*>}}} Resolvers for the GraphQL schema
 */
const resolvers = {
  Query: {
    /**
     * Get user by ID
     * @param _ - Parent object
     * @param id - User ID
     * @returns {Promise<*&{id: *}>} User object
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
     * @param _ The parent object
     * @param userId The user ID
     * @param docId The document ID
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
     * @param _ The parent object
     * @param userId The user ID
     * @returns {Promise<*[]>} List of documents
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
     * @param _ The parent object
     * @param email The user email
     * @param password The user password
     * @returns {Promise<{id, email: *, createdAt: string, documents: *[]}>} Created user object
     */
    async createUser(_, { email, password }) {
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
     * @param _ The parent object
     * @param userId The user ID
     * @param docId The document ID
     * @returns {Promise<boolean>} True if the document was deleted
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
     * Update the title of a document
     * @param _ The parent object
     * @param userId The user ID
     * @param docId The document ID
     * @param title The new title for the document
     * @returns {Promise<*>} The updated document
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

/**
 * GraphQL schema
 * @type {GraphQLSchema} GraphQL schema
 */
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = schema;
