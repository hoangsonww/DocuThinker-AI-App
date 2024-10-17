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
} = require("./models");
const { sendErrorResponse, sendSuccessResponse } = require("./views");
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
 *     summary: Upload a document for summarization
 *     description: Upload a document file to be summarized by the AI.
 *     tags:
 *     - Documents
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
 *     responses:
 *       200:
 *         description: Document summarized
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Failed to summarize document
 */
exports.uploadDocument = async (req, res) => {
  const form = new IncomingForm();
  await form.parse(req, async (err, fields, files) => {
    if (err) {
      sendErrorResponse(res, 500, "Error parsing the file", err);
    } else if (!files.File) {
      sendErrorResponse(res, 400, "No file uploaded");
    } else {
      try {
        const { userId, title } = fields;
        const result = await generateSummary(files.File[0]); // Assumes you have a generateSummary function

        // Check if a userId was provided, i.e., logged-in user
        if (userId) {
          const actualUserId = Array.isArray(userId) ? userId[0] : userId;
          const userRef = firestore.collection("users").doc(actualUserId);

          const userDoc = await userRef.get();
          if (!userDoc.exists) {
            return sendErrorResponse(res, 404, "User not found");
          }

          // Generate a unique ID for the document
          const docId = firestore.collection("users").doc().id;

          // Update the Firestore document to add the new document data
          await userRef.update({
            documents: firebaseAdmin.firestore.FieldValue.arrayUnion({
              id: docId,
              title: title,
              originalText: result.originalText,
              summary: result.summary,
            }),
          });
        }

        // Send success response with summary and originalText
        sendSuccessResponse(res, 200, "Document summarized", {
          summary: result.summary,
          originalText: result.originalText,
        });
      } catch (error) {
        sendErrorResponse(
          res,
          500,
          "Failed to summarize document",
          error.message,
        );
      }
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
  const { userId, github, linkedin, facebook, instagram } = req.body;

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Update social media links in Firestore
    await userRef.update({
      socialMedia: {
        github: github || "",
        linkedin: linkedin || "",
        facebook: facebook || "",
        instagram: instagram || "",
      },
    });

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
