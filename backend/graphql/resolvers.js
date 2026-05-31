const firebaseAdmin = require("firebase-admin");
const {
  firestore,
  createUser,
  loginUser,
  generateSummary,
  analyzeSentiment,
  generateKeyIdeas,
  generateDiscussionPoints,
  generateBulletSummary,
  generateSummaryInLanguage,
  generateActionableRecommendations,
  rewriteContent,
  refineSummary,
  chatWithAI,
  storeDocumentContent,
  getDocumentContent,
  getDocumentFileUrl,
  deleteStorageObjects,
} = require("../services/services");

// --- helpers -----------------------------------------------------------------

const toMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
};

const toIso = (ts) => {
  const ms = toMillis(ts);
  if (ms) return new Date(ms).toISOString();
  return typeof ts === "string" ? ts : null;
};

const titleToString = (t) =>
  Array.isArray(t) ? t.join(" ") : typeof t === "string" ? t : "";

// Read a user's documents (subcollection merged with any legacy inline array).
const readUserDocuments = async (userRef, userData) => {
  const legacy = Array.isArray(userData && userData.documents)
    ? userData.documents
    : [];
  const snap = await userRef.collection("documents").get();
  const sub = snap.docs.map((d) => d.data());
  sub.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  const subIds = new Set(sub.map((d) => d.id));
  const legacyOnly = legacy.filter((d) => d && d.id && !subIds.has(d.id));
  return [...legacyOnly, ...sub];
};

const findUserDocument = async (userRef, userData, docId) => {
  const subDoc = await userRef.collection("documents").doc(docId).get();
  if (subDoc.exists) return subDoc.data();
  const legacy = Array.isArray(userData && userData.documents)
    ? userData.documents
    : [];
  return legacy.find((d) => d && d.id === docId) || null;
};

const getUserRefOrThrow = async (userId) => {
  const userRef = firestore.collection("users").doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error("User not found");
  return { userRef, userData: userDoc.data() };
};

// --- resolvers ---------------------------------------------------------------

const resolvers = {
  // Field resolvers: fetch the heavy fields from storage only when requested.
  Document: {
    title: (doc) => titleToString(doc.title),
    createdAt: (doc) => toIso(doc.createdAt),
    fileUrl: (doc) => (doc.filePath ? getDocumentFileUrl(doc.filePath) : ""),
    originalText: async (doc) => {
      if (doc.originalText) return doc.originalText;
      if (doc.contentPath) {
        const c = await getDocumentContent(doc.contentPath);
        return (c && c.originalText) || "";
      }
      return "";
    },
    originalHtml: async (doc) => {
      if (doc.originalHtml) return doc.originalHtml;
      if (doc.contentPath) {
        const c = await getDocumentContent(doc.contentPath);
        return (c && c.originalHtml) || "";
      }
      return "";
    },
  },

  User: {
    createdAt: (user) => toIso(user.createdAt),
    documentCount: async (user) => {
      const userRef = firestore.collection("users").doc(user.id);
      const docs = await readUserDocuments(userRef, user);
      return docs.length;
    },
    daysSinceJoined: (user) => {
      const ms = toMillis(user.createdAt) || Date.parse(user.createdAt || "");
      if (!ms) return null;
      return Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
    },
    joinedDate: (user) => toIso(user.createdAt),
    socialMedia: (user) => user.socialMedia || null,
    documents: async (user) => {
      const userRef = firestore.collection("users").doc(user.id);
      return readUserDocuments(userRef, user);
    },
  },

  Query: {
    async getUser(_, { id }) {
      const { userData } = await getUserRefOrThrow(id);
      return { id, ...userData };
    },

    async getUserEmail(_, { userId }) {
      const { userData } = await getUserRefOrThrow(userId);
      return userData.email || null;
    },

    async getDocument(_, { userId, docId }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const document = await findUserDocument(userRef, userData, docId);
      if (!document) throw new Error("Document not found");
      return document;
    },

    async listDocuments(_, { userId }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      return readUserDocuments(userRef, userData);
    },

    async searchDocuments(_, { userId, searchTerm }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const documents = await readUserDocuments(userRef, userData);
      const q = (searchTerm || "").toLowerCase();
      return documents
        .filter((d) => titleToString(d.title).toLowerCase().includes(q))
        .map((d) => ({
          docId: d.id,
          title: titleToString(d.title),
          snippet:
            typeof d.originalText === "string"
              ? d.originalText.substring(0, 150) + "..."
              : "",
        }));
    },

    async documentCount(_, { userId }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const documents = await readUserDocuments(userRef, userData);
      return documents.length;
    },

    async daysSinceJoined(_, { userId }) {
      const { userData } = await getUserRefOrThrow(userId);
      const ms =
        toMillis(userData.createdAt) || Date.parse(userData.createdAt || "");
      if (!ms) return null;
      return Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
    },

    async userJoinedDate(_, { userId }) {
      const { userData } = await getUserRefOrThrow(userId);
      return toIso(userData.createdAt);
    },

    async getSocialMedia(_, { userId }) {
      const { userData } = await getUserRefOrThrow(userId);
      return userData.socialMedia || null;
    },

    async analyzeSentiment(_, { documentText }) {
      const r = await analyzeSentiment(documentText);
      return { score: r.sentimentScore, description: r.description };
    },
  },

  Mutation: {
    async register(_, { email, password }) {
      const userRecord = await createUser(email, password);
      await firestore.collection("users").doc(userRecord.uid).set({
        email,
        documents: [],
        createdAt: new Date(),
      });
      return { userId: userRecord.uid, customToken: null };
    },

    async login(_, { email }) {
      const customToken = await loginUser(email);
      const user = await firebaseAdmin.auth().getUserByEmail(email);
      return { userId: user.uid, customToken };
    },

    async summarizeDocument(
      _,
      { userId, title, text, html, filePath, fileType },
    ) {
      const result = await generateSummary(text, title);

      if (userId) {
        const userRef = firestore.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User not found");

        const docId = firestore.collection("users").doc().id;
        let contentPath = "";
        try {
          contentPath = await storeDocumentContent(userId, docId, {
            originalText: result.originalText,
            originalHtml: typeof html === "string" ? html : "",
          });
        } catch (e) {
          contentPath = "";
        }

        const record = {
          id: docId,
          title,
          summary: result.summary,
          filePath: typeof filePath === "string" ? filePath : "",
          fileType: typeof fileType === "string" ? fileType : "",
          contentPath,
        };
        if (!contentPath) {
          record.originalText = result.originalText;
          record.originalHtml = typeof html === "string" ? html : "";
        }

        await userRef
          .collection("documents")
          .doc(docId)
          .set({
            ...record,
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          });
      }

      const fileUrl = filePath ? await getDocumentFileUrl(filePath) : "";
      return {
        summary: result.summary,
        originalText: result.originalText,
        originalHtml: typeof html === "string" ? html : "",
        fileType: typeof fileType === "string" ? fileType : "",
        fileUrl,
      };
    },

    async deleteDocument(_, { userId, docId }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const doc = await findUserDocument(userRef, userData, docId);
      if (doc) await deleteStorageObjects([doc.filePath, doc.contentPath]);

      const subRef = userRef.collection("documents").doc(docId);
      const subDoc = await subRef.get();
      if (subDoc.exists) await subRef.delete();

      const legacy = Array.isArray(userData.documents)
        ? userData.documents
        : [];
      if (legacy.some((d) => d && d.id === docId)) {
        await userRef.update({
          documents: legacy.filter((d) => d && d.id !== docId),
        });
      }
      return true;
    },

    async deleteAllDocuments(_, { userId }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const all = await readUserDocuments(userRef, userData);
      const paths = [];
      all.forEach((d) => {
        if (d.filePath) paths.push(d.filePath);
        if (d.contentPath) paths.push(d.contentPath);
      });
      await deleteStorageObjects(paths);

      const subSnap = await userRef.collection("documents").get();
      let batch = firestore.batch();
      let count = 0;
      for (const d of subSnap.docs) {
        batch.delete(d.ref);
        count++;
        if (count % 450 === 0) {
          await batch.commit();
          batch = firestore.batch();
        }
      }
      if (count % 450 !== 0) await batch.commit();
      await userRef.update({ documents: [] });
      return true;
    },

    async updateDocumentTitle(_, { userId, docId, title }) {
      const { userRef, userData } = await getUserRefOrThrow(userId);
      const subRef = userRef.collection("documents").doc(docId);
      const subDoc = await subRef.get();
      if (subDoc.exists) {
        await subRef.update({ title });
        return { ...subDoc.data(), title };
      }
      const documents = Array.isArray(userData.documents)
        ? userData.documents
        : [];
      const idx = documents.findIndex((d) => d && d.id === docId);
      if (idx === -1) throw new Error("Document not found");
      documents[idx].title = title;
      await userRef.update({ documents });
      return documents[idx];
    },

    async updateEmail(_, { userId, newEmail }) {
      await firebaseAdmin.auth().updateUser(userId, { email: newEmail });
      await firestore
        .collection("users")
        .doc(userId)
        .update({ email: newEmail });
      return true;
    },

    async updateTheme(_, { userId, theme }) {
      await firestore.collection("users").doc(userId).update({ theme });
      return true;
    },

    async updateSocialMedia(
      _,
      { userId, github, linkedin, facebook, instagram, twitter },
    ) {
      const userRef = firestore.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) throw new Error("User not found");
      const current = userDoc.data().socialMedia || {};
      const pick = (incoming, fallback) =>
        incoming !== undefined && incoming !== null
          ? incoming
          : fallback !== undefined && fallback !== null
            ? fallback
            : "";
      const socialMedia = {
        github: pick(github, current.github),
        linkedin: pick(linkedin, current.linkedin),
        facebook: pick(facebook, current.facebook),
        instagram: pick(instagram, current.instagram),
        twitter: pick(twitter, current.twitter),
      };
      await userRef.update({ socialMedia });
      return socialMedia;
    },

    generateKeyIdeas: (_, { documentText }) => generateKeyIdeas(documentText),
    generateDiscussionPoints: (_, { documentText }) =>
      generateDiscussionPoints(documentText),
    generateBulletSummary: (_, { documentText }) =>
      generateBulletSummary(documentText),
    summaryInLanguage: (_, { documentText, language }) =>
      generateSummaryInLanguage(documentText, language),
    actionableRecommendations: (_, { documentText }) =>
      generateActionableRecommendations(documentText),
    rewriteContent: (_, { documentText, style }) =>
      rewriteContent(documentText, style),
    refineSummary: (_, { summary, refinementInstructions }) =>
      refineSummary(summary, refinementInstructions),
    chat: (_, { sessionId, message, originalText }) =>
      chatWithAI(sessionId, message, originalText),
  },
};

module.exports = resolvers;
