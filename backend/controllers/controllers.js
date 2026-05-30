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
  indexDocumentForSearch,
  performSemanticSearch,
  workspaceQuestionAnswering,
  getWorkspaceIndexStatus,
  reindexUserWorkspace,
  uploadDocumentWithIndexing,
} = require("../services/services");
const { sendErrorResponse, sendSuccessResponse } = require("../views/views");
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require("uuid");
const firebaseAdmin = require("firebase-admin");

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
    // Expecting JSON payload with title and text properties
    const { userId, title, text } = req.body;
    if (!text || !title) {
      return sendErrorResponse(
        res,
        400,
        "Missing title or text in request body",
      );
    }

    // Generate summary based on the provided text
    const result = await generateSummary(text);

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

      // Update Firestore with the new document data
      await userRef.update({
        documents: firebaseAdmin.firestore.FieldValue.arrayUnion({
          id: docId,
          title: title,
          originalText: result.originalText,
          summary: result.summary,
        }),
      });
    }

    // Send success response with the summary and the original text
    sendSuccessResponse(res, 200, "Document summarized", {
      summary: result.summary,
      originalText: result.originalText,
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to summarize document", error.message);
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const documents = userData.documents || [];
    sendSuccessResponse(res, 200, "Documents retrieved", documents);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve documents", error.message);
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const document = userData.documents.find((doc) => doc.id === docId);

    if (!document) {
      return sendErrorResponse(res, 404, "Document not found");
    }

    sendSuccessResponse(res, 200, "Document retrieved", document);
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve document", error.message);
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const document = userData.documents.find((doc) => doc.id === docId);

    if (!document) {
      return sendErrorResponse(res, 404, "Document not found");
    }

    const { title, originalText, summary } = document;
    sendSuccessResponse(res, 200, "Document details retrieved", {
      title,
      originalText,
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const documents = userData.documents || [];

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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const updatedDocuments = userData.documents.filter(
      (doc) => doc.id !== docId,
    );

    await firestore.collection("users").doc(userId).update({
      documents: updatedDocuments,
    });

    sendSuccessResponse(res, 200, "Document deleted successfully");
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete document", error.message);
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
    await firestore.collection("users").doc(userId).update({
      documents: [],
    });

    sendSuccessResponse(res, 200, "All documents deleted successfully");
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete documents", error.message);
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const documentCount = userData.documents.length;

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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const userData = userDoc.data();
    const documentIndex = userData.documents.findIndex(
      (doc) => doc.id === docId,
    );

    if (documentIndex === -1) {
      return sendErrorResponse(res, 404, "Document not found");
    }

    // Update the title of the specific document
    userData.documents[documentIndex].title = newTitle;

    // Save the updated user document back to Firestore
    await firestore.collection("users").doc(userId).update({
      documents: userData.documents,
    });

    sendSuccessResponse(res, 200, "Document title updated successfully");
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to update document title",
      error.message,
    );
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

    // Merge with the new data
    const updatedData = {
      github: github !== undefined ? github : currentData.github,
      linkedin: linkedin !== undefined ? linkedin : currentData.linkedin,
      facebook: facebook !== undefined ? facebook : currentData.facebook,
      instagram: instagram !== undefined ? instagram : currentData.instagram,
      twitter: twitter !== undefined ? twitter : currentData.twitter,
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

/**
 * @swagger
 * /v1/search/semantic:
 *   post:
 *     summary: Perform semantic search across user's documents
 *     description: Search documents using vector embeddings with optional filters
 *     tags:
 *       - Workspace Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - query
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               query:
 *                 type: string
 *                 description: Search query
 *               topK:
 *                 type: integer
 *                 default: 10
 *                 description: Number of results to return
 *               filters:
 *                 type: object
 *                 properties:
 *                   mimeTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   dateFrom:
 *                     type: string
 *                     format: date-time
 *                   dateTo:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       docId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       snippet:
 *                         type: string
 *                       score:
 *                         type: number
 *                       location:
 *                         type: string
 *                       mimeType:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       updatedAt:
 *                         type: string
 */
exports.semanticSearch = async (req, res) => {
  try {
    const { userId, query, topK = 10, filters = {} } = req.body;

    // Validate inputs
    if (!userId || !query) {
      return sendErrorResponse(res, 400, "userId and query are required");
    }

    if (typeof query !== "string" || query.trim() === "") {
      return sendErrorResponse(res, 400, "Query must be a non-empty string");
    }

    // Perform semantic search
    const results = await performSemanticSearch(userId, query, topK, filters);

    sendSuccessResponse(res, 200, "Semantic search completed successfully", {
      results,
      query,
      totalResults: results.length
    });

  } catch (error) {
    console.error("Error in semantic search:", error);
    sendErrorResponse(res, 500, "Failed to perform semantic search", error.message);
  }
};

/**
 * @swagger
 * /v1/qa/workspace:
 *   post:
 *     summary: Answer questions using workspace documents (RAG)
 *     description: Use retrieval-augmented generation to answer questions based on user's document collection
 *     tags:
 *       - Workspace Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - question
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               question:
 *                 type: string
 *                 description: Question to answer
 *               topK:
 *                 type: integer
 *                 default: 5
 *                 description: Number of context documents to use
 *               filters:
 *                 type: object
 *                 description: Optional filters for document selection
 *               stream:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to stream the response
 *     responses:
 *       200:
 *         description: Q&A response with citations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 citations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       docId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       snippet:
 *                         type: string
 *                       location:
 *                         type: string
 *                       score:
 *                         type: number
 *                 contextFound:
 *                   type: boolean
 *                 question:
 *                   type: string
 */
exports.workspaceQA = async (req, res) => {
  try {
    const { userId, question, topK = 5, filters = {}, stream = false } = req.body;

    // Validate inputs
    if (!userId || !question) {
      return sendErrorResponse(res, 400, "userId and question are required");
    }

    if (typeof question !== "string" || question.trim() === "") {
      return sendErrorResponse(res, 400, "Question must be a non-empty string");
    }

    // For streaming responses, we'll implement later
    if (stream) {
      return sendErrorResponse(res, 501, "Streaming responses not yet implemented");
    }

    // Perform Q&A
    const result = await workspaceQuestionAnswering(userId, question, topK, filters);

    sendSuccessResponse(res, 200, "Question answered successfully", result);

  } catch (error) {
    console.error("Error in workspace Q&A:", error);
    sendErrorResponse(res, 500, "Failed to answer question", error.message);
  }
};

/**
 * @swagger
 * /v1/index/status:
 *   get:
 *     summary: Get indexing status for user's workspace
 *     description: Retrieve information about the user's document index
 *     tags:
 *       - Workspace Search
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Index status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 totalDocuments:
 *                   type: integer
 *                 totalChunks:
 *                   type: integer
 *                 lastUpdated:
 *                   type: string
 *                 vectorStoreSize:
 *                   type: integer
 */
exports.getIndexStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return sendErrorResponse(res, 400, "userId is required");
    }

    const status = await getWorkspaceIndexStatus(userId);
    
    sendSuccessResponse(res, 200, "Index status retrieved successfully", status);

  } catch (error) {
    console.error("Error getting index status:", error);
    sendErrorResponse(res, 500, "Failed to get index status", error.message);
  }
};

/**
 * @swagger
 * /v1/index/reindex:
 *   post:
 *     summary: Reindex user's workspace
 *     description: Rebuild the search index for a user's documents
 *     tags:
 *       - Workspace Search
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
 *                 description: User ID
 *               docIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional specific document IDs to reindex
 *     responses:
 *       200:
 *         description: Reindexing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 documentsCount:
 *                   type: integer
 */
exports.reindexWorkspace = async (req, res) => {
  try {
    const { userId, docIds } = req.body;

    if (!userId) {
      return sendErrorResponse(res, 400, "userId is required");
    }

    // For now, we'll reindex all documents for the user
    // In a full implementation, this would handle specific docIds
    const result = await reindexUserWorkspace(userId);
    
    sendSuccessResponse(res, 200, "Reindexing initiated", result);

  } catch (error) {
    console.error("Error reindexing workspace:", error);
    sendErrorResponse(res, 500, "Failed to reindex workspace", error.message);
  }
};

/**
 * Enhanced document upload with automatic indexing
 * Updates the existing upload endpoint to include semantic search indexing
 */
exports.uploadDocumentEnhanced = async (req, res) => {
  try {
    const { title, text, userId } = req.body;

    if (!text || !title) {
      return sendErrorResponse(res, 400, "Text and title are required");
    }

    if (!userId) {
      return sendErrorResponse(res, 400, "User ID is required for indexing");
    }

    // Use enhanced upload service that includes indexing
    const result = await uploadDocumentWithIndexing(userId, title, text);

    sendSuccessResponse(res, 200, "Document uploaded and indexed successfully", result);

  } catch (error) {
    console.error("Error in enhanced document upload:", error);
    sendErrorResponse(res, 500, "Failed to upload and index document", error.message);
  }
};
