/**
 * GraphQL schema definition (SDL).
 *
 * Mirrors the REST API: document CRUD (now backed by the per-user
 * `documents` subcollection), AI generation (summaries, key ideas, discussion
 * points, sentiment, rewrite, translate, recommendations, chat), auth, and
 * profile/account management. Heavy text/HTML/files live in Supabase; the
 * `originalText`, `originalHtml`, and `fileUrl` fields are resolved on demand.
 *
 * Exported as a plain SDL string; `index.js` builds the executable schema with
 * the resolvers from `./resolvers`.
 */
const typeDefs = `
  type SocialMedia {
    github: String
    linkedin: String
    facebook: String
    instagram: String
    twitter: String
  }

  type Sentiment {
    score: Float!
    description: String!
  }

  type AuthResult {
    userId: ID!
    customToken: String
  }

  type Document {
    id: ID!
    title: String
    summary: String
    fileType: String
    filePath: String
    contentPath: String
    createdAt: String
    "Signed URL to view/download the original file (resolved on demand)."
    fileUrl: String
    "Extracted plain text, fetched from storage on demand."
    originalText: String
    "Display HTML, fetched from storage on demand."
    originalHtml: String
  }

  type DocumentSummary {
    summary: String!
    originalText: String!
    originalHtml: String
    fileType: String
    fileUrl: String
  }

  type SearchResult {
    docId: ID!
    title: String
    snippet: String
  }

  type User {
    id: ID!
    email: String
    createdAt: String
    theme: String
    documentCount: Int
    daysSinceJoined: Int
    joinedDate: String
    socialMedia: SocialMedia
    documents: [Document!]
  }

  type Query {
    getUser(id: ID!): User
    getUserEmail(userId: ID!): String
    getDocument(userId: ID!, docId: ID!): Document
    listDocuments(userId: ID!): [Document!]
    searchDocuments(userId: ID!, searchTerm: String!): [SearchResult!]
    documentCount(userId: ID!): Int
    daysSinceJoined(userId: ID!): Int
    userJoinedDate(userId: ID!): String
    getSocialMedia(userId: ID!): SocialMedia
    "Run sentiment analysis on arbitrary text."
    analyzeSentiment(documentText: String!): Sentiment
  }

  type Mutation {
    register(email: String!, password: String!): AuthResult
    login(email: String!, password: String!): AuthResult

    "Summarize a document and (when userId is given) save it to the user's library."
    summarizeDocument(
      userId: ID
      title: String!
      text: String!
      html: String
      filePath: String
      fileType: String
    ): DocumentSummary

    deleteDocument(userId: ID!, docId: ID!): Boolean
    deleteAllDocuments(userId: ID!): Boolean
    updateDocumentTitle(userId: ID!, docId: ID!, title: String!): Document

    updateEmail(userId: ID!, newEmail: String!): Boolean
    updateTheme(userId: ID!, theme: String!): Boolean
    updateSocialMedia(
      userId: ID!
      github: String
      linkedin: String
      facebook: String
      instagram: String
      twitter: String
    ): SocialMedia

    "AI generation helpers (operate on the provided text, nothing is stored)."
    generateKeyIdeas(documentText: String!): String
    generateDiscussionPoints(documentText: String!): String
    generateBulletSummary(documentText: String!): String
    summaryInLanguage(documentText: String!, language: String!): String
    actionableRecommendations(documentText: String!): String
    rewriteContent(documentText: String!, style: String!): String
    refineSummary(summary: String!, refinementInstructions: String!): String
    chat(sessionId: String, message: String!, originalText: String!): String
  }
`;

module.exports = typeDefs;
