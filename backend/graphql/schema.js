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
    async getUser(_, { id }) {
      const userDoc = await firestore.collection("users").doc(id).get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }
      return { id, ...userDoc.data() };
    },
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
    async listDocuments(_, { userId }) {
      const userDoc = await firestore.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }
      return userDoc.data().documents || [];
    },
  },
  Mutation: {
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
