const {
  firestore,
  createUser,
  loginUser,
  generateSummary,
  generateKeyIdeas,
  generateDiscussionPoints,
  chatWithAI,
  verifyUserEmail,
  verifyUserAndUpdatePassword,
  analyzeSentiment,
  generateActionableRecommendations,
  generateBulletSummary,
  generateSummaryInLanguage,
  rewriteContent,
  processAudio,
  refineSummary,
  storeDocumentFile,
  getDocumentFileUrl,
  createDocumentUploadUrl,
  storeDocumentContent,
  getDocumentContent,
  deleteStorageObjects,
} = require("../services/services");
const { sendErrorResponse, sendSuccessResponse } = require("../views/views");
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require("uuid");
const firebaseAdmin = require("firebase-admin");

// --- Document storage model ---------------------------------------------------
// Each uploaded document is its own Firestore doc at users/{uid}/documents/{docId}
// (heavy text/HTML/files live in Supabase). One small doc per upload means there
// is no per-user 1 MB array ceiling — the permanent fix for the bloat issue.
//
// Reads merge the subcollection with any legacy inline `documents` array that
// hasn't been migrated yet, so nothing is ever lost mid-migration.

const toMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
};

// Returns the user's documents oldest-first (matches the historical append
// order the frontend relies on). Subcollection wins on id collisions.
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

// Find a single document by id (subcollection first, then legacy array).
const findUserDocument = async (userRef, userData, docId) => {
  const subDoc = await userRef.collection("documents").doc(docId).get();
  if (subDoc.exists) return subDoc.data();
  const legacy = Array.isArray(userData && userData.documents)
    ? userData.documents
    : [];
  return legacy.find((d) => d && d.id === docId) || null;
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user in Firebase Authentication and Firestore.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User registration failed
 */
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await createUser(email, password);
    const creationDate = new Date();

    console.log(`User created in Firebase Auth: ${userRecord.uid}`);

    // Create a user document in Firestore with email, empty documents list, and the creation date
    await firestore.collection("users").doc(userRecord.uid).set({
      email: email,
      documents: [],
      createdAt: creationDate,
    });

    console.log("Firestore user document created successfully");
    sendSuccessResponse(res, 201, "User registered successfully", {
      userId: userRecord.uid,
    });
  } catch (error) {
    console.error("Error during Firestore document creation:", error.message);
    sendErrorResponse(res, 400, "User registration failed", error.message);
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user and generate a custom token for the user.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Custom token generated
 *       401:
 *         description: Invalid credentials
 */
exports.loginUser = async (req, res) => {
  const { email } = req.body;
  try {
    const customToken = await loginUser(email);
    const user = await firebaseAdmin.auth().getUserByEmail(email); // Fetch user details

    sendSuccessResponse(res, 200, "Custom token generated", {
      customToken,
      userId: user.uid, // Send back userId
    });
  } catch (error) {
    sendErrorResponse(res, 401, "Invalid credentials", error.message);
  }
};

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Generate a summary for a document
 *     description: Accepts the text content of a document and generates a summary.
 *     tags:
 *       - Documents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document summarized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                 originalText:
 *                   type: string
 *       400:
 *         description: Missing text or title
 *       500:
 *         description: Failed to generate summary
 */
exports.uploadDocument = async (req, res) => {
  try {
    // Expecting JSON payload with title and text properties. `html` is an
    // optional display-only rendering (preserves headings/lists/tables) used
    // by the viewer; the AI/summary still works off the plaintext `text`.
    const { userId, title, text, html, filePath, fileType } = req.body;
    console.log(
      `[/upload] start: title="${title}" userId=${userId ? "yes" : "no"} ` +
        `fileType=${fileType || "-"} filePath=${filePath ? "yes" : "no"} ` +
        `textLen=${text ? text.length : 0} htmlLen=${html ? html.length : 0}`,
    );
    if (!text || !title) {
      return sendErrorResponse(
        res,
        400,
        "Missing title or text in request body",
      );
    }

    // Generate summary based on the provided text (title passed as AI context)
    const result = await generateSummary(text, title);
    console.log(
      `[/upload] summary generated (${
        result.summary ? result.summary.length : 0
      } chars)`,
    );

    // If a userId is provided, update the Firestore user document
    if (userId) {
      const actualUserId = Array.isArray(userId) ? userId[0] : userId;
      const userRef = firestore.collection("users").doc(actualUserId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return sendErrorResponse(res, 404, "User not found");
      }

      // Generate a unique ID for the document
      const docId = firestore.collection("users").doc().id;

      // Offload the large text/HTML to storage so the Firestore document stays
      // small (Firestore caps each document at 1 MB; storing full text + HTML
      // inline overflowed it for large files). Only a tiny path is kept inline.
      let contentPath = "";
      try {
        contentPath = await storeDocumentContent(actualUserId, docId, {
          originalText: result.originalText,
          originalHtml: typeof html === "string" ? html : "",
        });
        console.log(`[/upload] content stored at ${contentPath}`);
      } catch (e) {
        console.error(
          `[/upload] storeDocumentContent FAILED for docId=${docId}:`,
          e && e.message,
          e && e.stack,
        );
        contentPath = "";
      }

      const docRecord = {
        id: docId,
        title: title,
        filePath: typeof filePath === "string" ? filePath : "",
        fileType: typeof fileType === "string" ? fileType : "",
        contentPath,
        summary: result.summary,
      };
      // Fallback: if content offload failed, keep the text inline ONLY when it's
      // small enough — never large enough to blow Firestore's 1 MB doc limit.
      if (!contentPath) {
        const inlineText = result.originalText || "";
        const inlineHtml = typeof html === "string" ? html : "";
        const inlineBytes = inlineText.length + inlineHtml.length;
        if (inlineBytes < 400000) {
          docRecord.originalText = inlineText;
          docRecord.originalHtml = inlineHtml;
          console.warn(
            `[/upload] content offload failed; inlining ${inlineBytes} bytes for docId=${docId}.`,
          );
        } else {
          console.warn(
            `[/upload] content offload failed and inline too large (${inlineBytes} bytes) for docId=${docId}; saving lean record (viewer falls back to the stored file).`,
          );
        }
      }

      // Write to the per-user documents subcollection (one Firestore doc each →
      // no 1 MB array ceiling). createdAt preserves chronological order.
      await userRef
        .collection("documents")
        .doc(docId)
        .set({
          ...docRecord,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`[/upload] document written to subcollection docId=${docId}`);
    }

    // Signed URL so the client can render the original file right away.
    const fileUrl = filePath ? await getDocumentFileUrl(filePath) : "";

    // Send success response with the summary and the original text
    sendSuccessResponse(res, 200, "Document summarized", {
      summary: result.summary,
      originalText: result.originalText,
      originalHtml: typeof html === "string" ? html : "",
      fileType: typeof fileType === "string" ? fileType : "",
      fileUrl,
    });
  } catch (error) {
    // Pass the Error object so views logs name/message/code/stack/responseData.
    sendErrorResponse(res, 500, "Failed to summarize document", error);
  }
};

/**
 * @swagger
 * /process-audio:
 *   post:
 *     summary: Upload an audio file for processing
 *     description: Upload an audio file to be summarized or transcribed by the AI. Optionally, provide additional text context for the model to consider.
 *     tags:
 *     - Audio
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               File:
 *                 type: string
 *                 format: binary
 *                 description: The audio file to be uploaded (WAV or MP3 format).
 *               context:
 *                 type: string
 *                 description: Additional text-based context to assist the AI in generating a more accurate response (optional).
 *     responses:
 *       200:
 *         description: Audio processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: The generated summary or response from the AI.
 *       400:
 *         description: No audio file uploaded
 *       500:
 *         description: Failed to process audio
 */
exports.processAudioFile = async (req, res) => {
  const form = new IncomingForm();
  await form.parse(req, async (err, fields, files) => {
    if (err) {
      return sendErrorResponse(res, 500, "Error parsing the file", err);
    } else if (!files.File) {
      return sendErrorResponse(res, 400, "No audio file uploaded");
    }

    // Extract optional context text from the fields
    const context = fields.context || "";

    try {
      // Process the uploaded audio file using the processAudio function
      const result = await processAudio(files.File[0], context);
      // Pass context to the processAudio function

      // Send success response with the summary
      sendSuccessResponse(res, 200, "Audio processed successfully", {
        summary: result.summary,
      });
    } catch (error) {
      sendErrorResponse(res, 500, "Failed to process audio", error.message);
    }
  });
};

/**
 * @swagger
 * /document-file:
 *   post:
 *     summary: Store an original uploaded document file
 *     description: Uploads the raw PDF/DOCX to private object storage and returns
 *       its storage path so the viewer can render the real document later.
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: File stored
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Failed to store file
 */
/**
 * @swagger
 * /document-upload-url:
 *   post:
 *     summary: Mint a signed upload URL for direct-to-storage file uploads
 *     description: Returns a one-time signed upload token so the browser can
 *       upload the original file straight to the private bucket, bypassing the
 *       serverless body-size limit. service_role stays server-side.
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: Signed upload URL created
 *       500:
 *         description: Failed to create upload URL
 */
exports.getDocumentUploadUrl = async (req, res) => {
  const { userId, fileName } = req.body;
  try {
    const result = await createDocumentUploadUrl(userId, fileName);
    // { path, token, signedUrl }
    sendSuccessResponse(res, 200, "Upload URL created", result);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to create upload URL", error.message);
  }
};

exports.uploadDocumentFile = async (req, res) => {
  const form = new IncomingForm();
  await form.parse(req, async (err, fields, files) => {
    if (err) {
      return sendErrorResponse(res, 500, "Error parsing the file", err);
    }
    const fileField = files.file || files.File;
    if (!fileField) {
      return sendErrorResponse(res, 400, "No file uploaded");
    }
    const userId = Array.isArray(fields.userId)
      ? fields.userId[0]
      : fields.userId;
    try {
      const result = await storeDocumentFile(userId, fileField[0]);
      // { filePath, fileType }
      sendSuccessResponse(res, 200, "File stored", result);
    } catch (error) {
      sendErrorResponse(res, 500, "Failed to store file", error.message);
    }
  });
};

/**
 * @swagger
 * /generate-key-ideas:
 *   post:
 *     summary: Generate key ideas from document text
 *     description: Extract key ideas from the given document text.
 *     tags:
 *     - AI/Machine Learning
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Key ideas generated
 *       500:
 *         description: Failed to generate key ideas
 */
exports.generateKeyIdeas = async (req, res) => {
  const { documentText } = req.body;
  try {
    const keyIdeas = await generateKeyIdeas(documentText);
    sendSuccessResponse(res, 200, "Key ideas generated", { keyIdeas });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to generate key ideas", error.message);
  }
};

/**
 * @swagger
 * /generate-discussion-points:
 *   post:
 *     summary: Generate discussion points from document text
 *     description: Extract discussion points from the given document text.
 *     tags:
 *     - AI/Machine Learning
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Discussion points generated
 *       500:
 *         description: Failed to generate discussion points
 */
exports.generateDiscussionPoints = async (req, res) => {
  const { documentText } = req.body;
  try {
    const discussionPoints = await generateDiscussionPoints(documentText);
    sendSuccessResponse(res, 200, "Discussion points generated", {
      discussionPoints,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to generate discussion points",
      error.message,
    );
  }
};

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Chat with AI using original document context
 *     description: Engage in conversation with the AI using the original document text as context.
 *     tags:
 *     - AI/Machine Learning
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               originalText:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *       400:
 *         description: Both message and originalText are required
 *       500:
 *         description: Failed to get response from the AI
 */
exports.chatWithAI = async (req, res) => {
  let { message, originalText, sessionId } = req.body;

  // If no sessionId is provided, generate a new one
  if (!sessionId) {
    sessionId = uuidv4();
  }

  if (!message || !originalText) {
    return res
      .status(400)
      .json({ error: "Both message and originalText are required" });
  }

  try {
    const response = await chatWithAI(sessionId, message, originalText);
    res.status(200).json({ response, sessionId });
    console.log("Human message:", message);
    console.log("AI response:", response);
  } catch (error) {
    console.error("Failed to get AI response:", error);
    res.status(500).json({
      error: "Failed to get response from the AI",
      details: error.message,
    });
  }
};

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Reset a user's password
 *     description: Updates the password of a user in Firebase Authentication.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Email and new password are required
 *       500:
 *         description: Failed to update password
 */
exports.forgotPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email and new password are required." });
  }

  try {
    const result = await verifyUserAndUpdatePassword(email, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update password", details: error.message });
  }
};

/**
 * @swagger
 * /verify-email:
 *   post:
 *     summary: Verify if a user's email exists
 *     description: Checks if the given email exists in the Firestore database.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email verified
 *       404:
 *         description: User not found
 */
exports.verifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendErrorResponse(res, 400, "Email is required");
  }

  try {
    const userRecord = await verifyUserEmail(email); // Call model to verify email
    sendSuccessResponse(res, 200, "Email verified", { uid: userRecord.uid });
  } catch (error) {
    sendErrorResponse(res, 404, "User not found", error.message);
  }
};

/**
 * @swagger
 * /documents/{userId}:
 *   get:
 *     summary: Retrieve all documents of a user
 *     description: Fetches a list of all documents associated with the given userId.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve documents
 */
exports.getAllDocuments = async (req, res) => {
  const { userId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const documents = await readUserDocuments(userRef, userDoc.data());
    sendSuccessResponse(res, 200, "Documents retrieved", documents);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve documents", error);
  }
};

/**
 * @swagger
 * /documents/{userId}/{docId}:
 *   get:
 *     summary: Retrieve a specific document by ID
 *     description: Fetches a document associated with the given userId and docId.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document or user not found
 *       500:
 *         description: Failed to retrieve document
 */
exports.getDocumentById = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const document = await findUserDocument(userRef, userDoc.data(), docId);
    if (!document) {
      return sendErrorResponse(res, 404, "Document not found");
    }

    sendSuccessResponse(res, 200, "Document retrieved", document);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve document", error);
  }
};

/**
 * @swagger
 * /document-details/{userId}/{docId}:
 *   get:
 *     summary: Retrieve document details
 *     description: Fetches the details (title, original text, summary) of a document by userId and docId.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID
 *     responses:
 *       200:
 *         description: Document details retrieved successfully
 *       404:
 *         description: Document or user not found
 *       500:
 *         description: Failed to retrieve document details
 */
exports.getDocumentDetails = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const document = await findUserDocument(userRef, userDoc.data(), docId);
    if (!document) {
      return sendErrorResponse(res, 404, "Document not found");
    }

    const {
      title,
      originalText,
      originalHtml,
      filePath,
      fileType,
      summary,
      contentPath,
    } = document;

    // New docs keep the text/HTML in storage; old docs have it inline.
    let text = originalText || "";
    let html = originalHtml || "";
    if (contentPath) {
      const content = await getDocumentContent(contentPath);
      if (content) {
        text = content.originalText || text;
        html = content.originalHtml || html;
      }
    }

    const fileUrl = filePath ? await getDocumentFileUrl(filePath) : "";
    sendSuccessResponse(res, 200, "Document details retrieved", {
      title,
      originalText: text,
      originalHtml: html,
      fileType: fileType || "",
      fileUrl,
      summary,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to retrieve document details",
      error.message,
    );
  }
};

/**
 * @swagger
 * /search-documents/{userId}:
 *   get:
 *     summary: Search documents by title or content
 *     description: Searches for documents associated with a specific userId that match the provided search term within the title or content.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user whose documents are to be searched.
 *       - in: query
 *         name: searchTerm
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term to find matching documents in title or content.
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   docId:
 *                     type: string
 *                     description: The document ID
 *                   title:
 *                     type: string
 *                     description: The document title
 *                   snippet:
 *                     type: string
 *                     description: A snippet of the matching content
 *       404:
 *         description: User or documents not found
 *       500:
 *         description: Failed to search documents
 */
exports.searchDocuments = async (req, res) => {
  const { userId } = req.params;
  const { searchTerm } = req.query;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const documents = await readUserDocuments(userRef, userDoc.data());

    // Filter documents that match the search term in the title or content
    const matchingDocuments = documents.filter((doc) => {
      // Safely extract title if it's an array
      const title = Array.isArray(doc.title) ? doc.title.join(" ") : doc.title;
      // Check if title and originalText are strings before processing them
      const titleMatch =
        typeof title === "string" &&
        title.toLowerCase().includes(searchTerm.toLowerCase());

      return titleMatch;
    });

    if (matchingDocuments.length === 0) {
      return sendErrorResponse(res, 404, "No matching documents found");
    }

    // Format the response with relevant document details
    const response = matchingDocuments.map((doc) => ({
      docId: doc.id,
      title: Array.isArray(doc.title) ? doc.title.join(" ") : doc.title,
      snippet:
        typeof doc.originalText === "string"
          ? doc.originalText.substring(0, 150) + "..."
          : "",
    }));

    sendSuccessResponse(res, 200, "Documents retrieved successfully", response);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to search documents", error.message);
  }
};

/**
 * @swagger
 * /delete-document/{userId}/{docId}:
 *   delete:
 *     summary: Delete a specific document
 *     description: Deletes a document by userId and docId.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document or user not found
 *       500:
 *         description: Failed to delete document
 */
exports.deleteDocument = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    // Find the doc (sub or legacy) so we can clean up its storage objects.
    const doc = await findUserDocument(userRef, userData, docId);
    if (doc) {
      await deleteStorageObjects([doc.filePath, doc.contentPath]);
    }

    // Remove from the subcollection.
    const subRef = userRef.collection("documents").doc(docId);
    const subDoc = await subRef.get();
    if (subDoc.exists) await subRef.delete();

    // Remove from the legacy array if it's still there.
    const legacy = Array.isArray(userData.documents) ? userData.documents : [];
    if (legacy.some((d) => d && d.id === docId)) {
      await userRef.update({
        documents: legacy.filter((d) => d && d.id !== docId),
      });
    }

    sendSuccessResponse(res, 200, "Document deleted successfully");
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete document", error);
  }
};

/**
 * @swagger
 * /delete-all-documents/{userId}:
 *   delete:
 *     summary: Delete all documents
 *     description: Deletes all documents associated with the given userId.
 *     tags:
 *     - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: All documents deleted successfully
 *       500:
 *         description: Failed to delete documents
 */
exports.deleteAllDocuments = async (req, res) => {
  const { userId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Clean up all storage objects (best-effort).
      const all = await readUserDocuments(userRef, userDoc.data());
      const paths = [];
      all.forEach((d) => {
        if (d.filePath) paths.push(d.filePath);
        if (d.contentPath) paths.push(d.contentPath);
      });
      await deleteStorageObjects(paths);

      // Delete every subcollection doc in batches (Firestore caps at 500/batch).
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

      // Clear the legacy array too.
      await userRef.update({ documents: [] });
    }

    sendSuccessResponse(res, 200, "All documents deleted successfully");
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete documents", error);
  }
};

/**
 * @swagger
 * /update-email:
 *   post:
 *     summary: Update user email
 *     description: Updates the email of a user in both Firebase Authentication and Firestore.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newEmail
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The userId of the user
 *               newEmail:
 *                 type: string
 *                 description: The new email address
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Failed to update email
 */
exports.updateUserEmail = async (req, res) => {
  const { userId, newEmail } = req.body;

  try {
    // Update the user's email in Firebase Authentication
    const userRecord = await firebaseAdmin
      .auth()
      .updateUser(userId, { email: newEmail });

    // Also update the email in the user's Firestore document
    await firestore.collection("users").doc(userId).update({ email: newEmail });

    sendSuccessResponse(res, 200, "Email updated successfully", {
      email: userRecord.email,
    });
  } catch (error) {
    sendErrorResponse(res, 400, "Failed to update email", error.message);
  }
};

/**
 * @swagger
 * /update-password:
 *   post:
 *     summary: Update user password
 *     description: Updates the password of a user in Firebase Authentication.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The userId of the user
 *               newPassword:
 *                 type: string
 *                 description: The new password
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Failed to update password
 */
exports.updateUserPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    // Update the user's password in Firebase Authentication
    await firebaseAdmin.auth().updateUser(userId, { password: newPassword });

    sendSuccessResponse(res, 200, "Password updated successfully");
  } catch (error) {
    sendErrorResponse(res, 400, "Failed to update password", error.message);
  }
};

/**
 * @swagger
 * /days-since-joined/{userId}:
 *   get:
 *     summary: Get days since user joined
 *     description: Retrieves the number of days since a user joined the service.
 *     tags:
 *     - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: Days since user joined retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve days since joined
 */
exports.getDaysSinceJoined = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const createdAt = userData.createdAt.toDate();
    const today = new Date();

    // Calculate the difference in days between today and the creation date
    const diffInTime = today.getTime() - createdAt.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

    sendSuccessResponse(res, 200, "Days since user joined retrieved", {
      days: diffInDays,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to retrieve days since joined",
      error.message,
    );
  }
};

/**
 * @swagger
 *
 * /document-count/{userId}:
 *   get:
 *     summary: Get document count
 *     description: Retrieves the number of documents associated with the given userId.
 *     tags:
 *     - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: Document count retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve document count
 */
exports.getDocumentCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const documents = await readUserDocuments(userRef, userDoc.data());
    const documentCount = documents.length;

    sendSuccessResponse(res, 200, "Document count retrieved", {
      documentCount,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to retrieve document count",
      error.message,
    );
  }
};

/**
 * @swagger
 * /user-email/{userId}:
 *   get:
 *     summary: Get user email
 *     description: Retrieves the email of a user by userId.
 *     tags:
 *     - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: User email retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve user email
 */
exports.getUserEmail = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    sendSuccessResponse(res, 200, "User email retrieved", {
      email: userData.email,
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve user email", error.message);
  }
};

/**
 * @swagger
 * /update-document-title:
 *   post:
 *     summary: Update the title of a document
 *     description: Updates the title of a document associated with a given user and document ID in Firestore.
 *     tags:
 *     - Documents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - docId
 *               - newTitle
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The userId of the user
 *               docId:
 *                 type: string
 *                 description: The ID of the document
 *               newTitle:
 *                 type: string
 *                 description: The new title for the document
 *     responses:
 *       200:
 *         description: Document title updated successfully
 *       404:
 *         description: User or document not found
 *       500:
 *         description: Failed to update document title
 */
exports.updateDocumentTitle = async (req, res) => {
  const { userId, docId, newTitle } = req.body;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const subRef = userRef.collection("documents").doc(docId);
    const subDoc = await subRef.get();

    if (subDoc.exists) {
      await subRef.update({ title: newTitle });
    } else {
      // Legacy: still in the inline array.
      const userData = userDoc.data();
      const documents = Array.isArray(userData.documents)
        ? userData.documents
        : [];
      const idx = documents.findIndex((doc) => doc && doc.id === docId);
      if (idx === -1) {
        return sendErrorResponse(res, 404, "Document not found");
      }
      documents[idx].title = newTitle;
      await userRef.update({ documents });
    }

    sendSuccessResponse(res, 200, "Document title updated successfully");
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to update document title", error);
  }
};

/**
 * @swagger
 * /user-joined-date/{userId}:
 *   get:
 *     summary: Get user joined date
 *     description: Retrieves the date when the user joined (createdAt field) from Firestore.
 *     tags:
 *     - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The userId of the user
 *     responses:
 *       200:
 *         description: User joined date retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 joinedDate:
 *                   type: string
 *                   format: date-time
 *                   description: The date the user joined
 *                 message:
 *                   type: string
 *                   description: Response message
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve user joined date
 */
exports.getUserJoinedDate = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user document from Firestore
    const userDoc = await firestore.collection("users").doc(userId).get();

    // Check if the user exists
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Get the user data and retrieve the createdAt field
    const userData = userDoc.data();
    const createdAt = userData.createdAt;

    // If createdAt field exists, send it in the response
    if (createdAt) {
      sendSuccessResponse(res, 200, "User joined date retrieved", {
        joinedDate: createdAt.toDate(),
      });
    } else {
      sendErrorResponse(res, 404, "User joined date not available");
    }
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to retrieve user joined date",
      error.message,
    );
  }
};

/**
 * @swagger
 * /update-theme:
 *   put:
 *     summary: Update user preferred theme
 *     description: Updates the preferred theme (light/dark) for a user in their Firestore document.
 *     tags:
 *     - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - theme
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The userId of the user
 *               theme:
 *                 type: string
 *                 description: The new preferred theme (either "light" or "dark")
 *     responses:
 *       200:
 *         description: Theme updated successfully
 *       400:
 *         description: Failed to update theme
 *       404:
 *         description: User not found
 */
exports.updateTheme = async (req, res) => {
  const { userId, theme } = req.body;

  if (!userId || !theme) {
    return sendErrorResponse(res, 400, "UserId and theme are required.");
  }

  // Validate theme input
  if (theme !== "light" && theme !== "dark") {
    return sendErrorResponse(
      res,
      400,
      'Invalid theme. Theme must be either "light" or "dark".',
    );
  }

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found.");
    }

    // Update the theme preference in Firestore
    await firestore.collection("users").doc(userId).update({ theme });

    sendSuccessResponse(res, 200, "Theme updated successfully.", { theme });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to update theme.", error.message);
  }
};

/**
 * @swagger
 * /social-media/{userId}:
 *   get:
 *     summary: Get social media links for a user
 *     description: Fetch social media links (GitHub, LinkedIn, Facebook, Instagram) for a specific user by their userId.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID of the user whose social media links you want to retrieve.
 *     responses:
 *       200:
 *         description: Social media links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 socialMedia:
 *                   type: object
 *                   properties:
 *                     github:
 *                       type: string
 *                     linkedin:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     instagram:
 *                       type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve social media links
 */
exports.getSocialMedia = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const socialMedia = userData.socialMedia || {
      github: "",
      linkedin: "",
      facebook: "",
      instagram: "",
    };

    sendSuccessResponse(res, 200, "Social media links retrieved successfully", {
      socialMedia,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to retrieve social media links",
      error.message,
    );
  }
};

/**
 * @swagger
 * /update-social-media:
 *   post:
 *     summary: Update social media links for a user
 *     description: Update the social media links (GitHub, LinkedIn, Facebook, Instagram) for a specific user by their userId.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user ID of the user to update social media links for.
 *               github:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               facebook:
 *                 type: string
 *               instagram:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social media links updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update social media links
 */
exports.updateSocialMedia = async (req, res) => {
  const { userId, github, linkedin, facebook, instagram, twitter } = req.body;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Get the current socialMedia data
    const currentData = userDoc.data().socialMedia || {};

    // Pick the incoming value, fall back to existing, then to "" so we never
    // hand Firestore an `undefined` (it rejects undefined field values).
    const pick = (incoming, current) =>
      incoming !== undefined ? incoming : current !== undefined ? current : "";

    // Merge with the new data
    const updatedData = {
      github: pick(github, currentData.github),
      linkedin: pick(linkedin, currentData.linkedin),
      facebook: pick(facebook, currentData.facebook),
      instagram: pick(instagram, currentData.instagram),
      twitter: pick(twitter, currentData.twitter),
    };

    // Update the social media links in Firestore
    await userRef.update({ socialMedia: updatedData });

    sendSuccessResponse(res, 200, "Social media links updated successfully");
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to update social media links",
      error.message,
    );
  }
};

/**
 * @swagger
 * /sentiment-analysis:
 *   post:
 *     summary: Analyze sentiment of the document text
 *     description: Perform sentiment analysis on the provided document text and return a sentiment score and description.
 *     tags:
 *       - Document Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentText
 *             properties:
 *               documentText:
 *                 type: string
 *                 description: The text content of the document to analyze sentiment for.
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentimentScore:
 *                   type: number
 *                   description: Sentiment score ranging from -1 (very negative) to +1 (very positive).
 *                 description:
 *                   type: string
 *                   description: Brief description of the sentiment.
 *       400:
 *         description: Invalid document text
 *       500:
 *         description: Failed to perform sentiment analysis
 */
exports.sentimentAnalysis = async (req, res) => {
  try {
    const { documentText } = req.body;

    if (
      !documentText ||
      typeof documentText !== "string" ||
      documentText.trim() === ""
    ) {
      return res.status(400).send({ error: "Invalid document text" });
    }

    const sentimentResult = await analyzeSentiment(documentText);

    res.status(200).send({
      sentimentScore: sentimentResult.sentimentScore,
      description: sentimentResult.description,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

/**
 * @swagger
 * /bullet-summary:
 *   post:
 *     summary: Generate a summary in bullet points
 *     description: Generate a summary of the provided document text in bullet points for concise representation.
 *     tags:
 *       - Document Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentText
 *             properties:
 *               documentText:
 *                 type: string
 *                 description: The text content of the document to generate a bullet point summary for.
 *     responses:
 *       200:
 *         description: Bullet point summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: The generated bullet point summary.
 *       400:
 *         description: Invalid document text
 *       500:
 *         description: Failed to generate bullet point summary
 */
exports.bulletSummary = async (req, res) => {
  try {
    const { documentText } = req.body;

    if (
      !documentText ||
      typeof documentText !== "string" ||
      documentText.trim() === ""
    ) {
      return res.status(400).send({ error: "Invalid document text" });
    }

    const bulletSummary = await generateBulletSummary(documentText);

    res.status(200).send({ summary: bulletSummary });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

/**
 * @swagger
 * /summary-in-language:
 *   post:
 *     summary: Generate a summary in a selected language
 *     description: Generate a summary of the provided document text in the selected language.
 *     tags:
 *       - Document Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentText
 *               - language
 *             properties:
 *               documentText:
 *                 type: string
 *                 description: The text content of the document to summarize.
 *               language:
 *                 type: string
 *                 description: The language in which the summary should be generated.
 *     responses:
 *       200:
 *         description: Summary generated successfully in the selected language
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: The generated summary in the selected language.
 *       400:
 *         description: Invalid document text or language
 *       500:
 *         description: Failed to generate summary in the selected language
 */
exports.summaryInLanguage = async (req, res) => {
  try {
    const { documentText, language } = req.body;

    if (
      !documentText ||
      typeof documentText !== "string" ||
      documentText.trim() === "" ||
      !language ||
      typeof language !== "string" ||
      language.trim() === ""
    ) {
      return res
        .status(400)
        .send({ error: "Invalid document text or language" });
    }

    const translatedSummary = await generateSummaryInLanguage(
      documentText,
      language,
    );

    res.status(200).send({ summary: translatedSummary });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

/**
 * @swagger
 * /content-rewriting:
 *   post:
 *     summary: Rewrite or rephrase document content
 *     description: Rewrite or rephrase the provided document content based on the selected style.
 *     tags:
 *       - Document Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentText
 *               - style
 *             properties:
 *               documentText:
 *                 type: string
 *                 description: The text content of the document to rewrite or rephrase.
 *               style:
 *                 type: string
 *                 description: The style or tone in which to rewrite the content (e.g., formal, casual).
 *     responses:
 *       200:
 *         description: Content rewritten successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rewrittenContent:
 *                   type: string
 *                   description: The rewritten or rephrased document content.
 *       400:
 *         description: Invalid document text or style
 *       500:
 *         description: Failed to rewrite content
 */
exports.contentRewriting = async (req, res) => {
  try {
    const { documentText, style } = req.body;

    if (
      !documentText ||
      typeof documentText !== "string" ||
      documentText.trim() === "" ||
      !style ||
      typeof style !== "string" ||
      style.trim() === ""
    ) {
      return res.status(400).send({ error: "Invalid document text or style" });
    }

    const rewrittenContent = await rewriteContent(documentText, style);

    res.status(200).send({ rewrittenContent });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

/**
 * @swagger
 * /actionable-recommendations:
 *   post:
 *     summary: Generate actionable recommendations based on document content
 *     description: Generate actionable recommendations or next steps based on the provided document text, focusing on identifying follow-up actions or critical takeaways.
 *     tags:
 *       - Document Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentText
 *             properties:
 *               documentText:
 *                 type: string
 *                 description: The text content of the document to generate actionable recommendations for.
 *     responses:
 *       200:
 *         description: Actionable recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: string
 *                   description: The generated actionable recommendations or next steps.
 *       400:
 *         description: Invalid document text
 *       500:
 *         description: Failed to generate actionable recommendations
 */
exports.actionableRecommendations = async (req, res) => {
  try {
    const { documentText } = req.body;

    if (
      !documentText ||
      typeof documentText !== "string" ||
      documentText.trim() === ""
    ) {
      return res.status(400).send({ error: "Invalid document text" });
    }

    const recommendations =
      await generateActionableRecommendations(documentText);

    res.status(200).send({ recommendations });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

/**
 * @swagger
 * /refine-summary:
 *   post:
 *     summary: Refine a summary based on user instructions
 *     description: Takes an initial summary and refinement instructions from the user, and returns a refined summary based on those instructions.
 *     tags:
 *       - Document Refinement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - summary
 *               - refinementInstructions
 *             properties:
 *               summary:
 *                 type: string
 *                 description: The initial summary that needs refinement.
 *               refinementInstructions:
 *                 type: string
 *                 description: Instructions on how to refine the summary (e.g., "Make it more concise and formal").
 *     responses:
 *       200:
 *         description: Summary refined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refinedSummary:
 *                   type: string
 *                   description: The refined summary based on the user's instructions.
 *       400:
 *         description: Invalid summary or refinement instructions
 *       500:
 *         description: Failed to refine the summary
 */
exports.refineSummary = async (req, res) => {
  try {
    const { summary, refinementInstructions } = req.body;

    // Validate inputs
    if (
      !summary ||
      typeof summary !== "string" ||
      summary.trim() === "" ||
      !refinementInstructions ||
      typeof refinementInstructions !== "string" ||
      refinementInstructions.trim() === ""
    ) {
      return res
        .status(400)
        .send({ error: "Invalid summary or refinement instructions" });
    }

    // Call the helper function to refine the summary
    const refinedSummary = await refineSummary(summary, refinementInstructions);

    res.status(200).send({ refinedSummary });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
