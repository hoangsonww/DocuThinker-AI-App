const { firestore, createUser, loginUser, generateSummary, generateKeyIdeas, generateDiscussionPoints, chatWithAI, verifyUserEmail, verifyUserAndUpdatePassword } = require('./models');
const { sendErrorResponse, sendSuccessResponse } = require('./views');
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('firebase-admin');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
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
    await firestore.collection('users').doc(userRecord.uid).set({
      email: email,
      documents: [],
      createdAt: creationDate  // Store the creation date
    });

    console.log('Firestore user document created successfully');
    sendSuccessResponse(res, 201, 'User registered successfully', { userId: userRecord.uid });
  } catch (error) {
    console.error('Error during Firestore document creation:', error.message);
    sendErrorResponse(res, 400, 'User registration failed', error.message);
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
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

    sendSuccessResponse(res, 200, 'Custom token generated', {
      customToken,
      userId: user.uid // Send back userId
    });
  } catch (error) {
    sendErrorResponse(res, 401, 'Invalid credentials', error.message);
  }
};

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a document for summarization
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
      sendErrorResponse(res, 500, 'Error parsing the file', err);
    } else if (!files.File) {
      sendErrorResponse(res, 400, 'No file uploaded');
    } else {
      try {
        const { userId, title } = fields;
        const result = await generateSummary(files.File[0]); // Assumes you have a generateSummary function

        // Check if a userId was provided, i.e., logged-in user
        if (userId) {
          const actualUserId = Array.isArray(userId) ? userId[0] : userId;
          const userRef = firestore.collection('users').doc(actualUserId);

          const userDoc = await userRef.get();
          if (!userDoc.exists) {
            return sendErrorResponse(res, 404, 'User not found');
          }

          // Generate a unique ID for the document
          const docId = firestore.collection('users').doc().id;

          // Update the Firestore document to add the new document data
          await userRef.update({
            documents: firebaseAdmin.firestore.FieldValue.arrayUnion({
              id: docId,
              title: title,
              originalText: result.originalText,
              summary: result.summary
            })
          });
        }

        // Send success response with summary and originalText
        sendSuccessResponse(res, 200, 'Document summarized', {
          summary: result.summary,
          originalText: result.originalText
        });
      } catch (error) {
        sendErrorResponse(res, 500, 'Failed to summarize document', error.message);
      }
    }
  });
};

/**
 * @swagger
 * /generate-key-ideas:
 *   post:
 *     summary: Generate key ideas from document text
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
    sendSuccessResponse(res, 200, 'Key ideas generated', { keyIdeas });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate key ideas', error.message);
  }
};

/**
 * @swagger
 * /generate-discussion-points:
 *   post:
 *     summary: Generate discussion points from document text
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
    sendSuccessResponse(res, 200, 'Discussion points generated', { discussionPoints });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate discussion points', error.message);
  }
};

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Chat with AI using original document context
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
    return res.status(400).json({ error: 'Both message and originalText are required' });
  }

  try {
    const response = await chatWithAI(sessionId, message, originalText);
    res.status(200).json({ response, sessionId });
    console.log('Human message:', message);
    console.log('AI response:', response);
  } catch (error) {
    console.error('Failed to get AI response:', error);
    res.status(500).json({ error: 'Failed to get response from the AI', details: error.message });
  }
};

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Reset a user's password
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
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  try {
    const result = await verifyUserAndUpdatePassword(email, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
};

/**
 * @swagger
 * /verify-email:
 *   post:
 *     summary: Verify if a user's email exists
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
    return sendErrorResponse(res, 400, 'Email is required');
  }

  try {
    const userRecord = await verifyUserEmail(email); // Call model to verify email
    sendSuccessResponse(res, 200, 'Email verified', { uid: userRecord.uid });
  } catch (error) {
    sendErrorResponse(res, 404, 'User not found', error.message);
  }
};

exports.getAllDocuments = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const documents = userData.documents || [];
    sendSuccessResponse(res, 200, 'Documents retrieved', documents);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve documents', error.message);
  }
};

// Retrieve a specific document by ID
exports.getDocumentById = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const document = userData.documents.find((doc) => doc.id === docId);

    if (!document) {
      return sendErrorResponse(res, 404, 'Document not found');
    }

    sendSuccessResponse(res, 200, 'Document retrieved', document);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve document', error.message);
  }
};

// Retrieve document details (title, original text, and summary)
exports.getDocumentDetails = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const document = userData.documents.find((doc) => doc.id === docId);

    if (!document) {
      return sendErrorResponse(res, 404, 'Document not found');
    }

    const { title, originalText, summary } = document;
    sendSuccessResponse(res, 200, 'Document details retrieved', { title, originalText, summary });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve document details', error.message);
  }
};

exports.deleteDocument = async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const updatedDocuments = userData.documents.filter(doc => doc.id !== docId);

    await firestore.collection('users').doc(userId).update({
      documents: updatedDocuments
    });

    sendSuccessResponse(res, 200, 'Document deleted successfully');
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to delete document', error.message);
  }
};

exports.deleteAllDocuments = async (req, res) => {
  const { userId } = req.params;

  try {
    await firestore.collection('users').doc(userId).update({
      documents: []
    });

    sendSuccessResponse(res, 200, 'All documents deleted successfully');
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to delete documents', error.message);
  }
};

exports.updateUserEmail = async (req, res) => {
  const { userId, newEmail } = req.body;

  try {
    // Update the user's email in Firebase Authentication
    const userRecord = await firebaseAdmin.auth().updateUser(userId, { email: newEmail });

    // Also update the email in the user's Firestore document
    await firestore.collection('users').doc(userId).update({ email: newEmail });

    sendSuccessResponse(res, 200, 'Email updated successfully', { email: userRecord.email });
  } catch (error) {
    sendErrorResponse(res, 400, 'Failed to update email', error.message);
  }
};

// Update user password
exports.updateUserPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    // Update the user's password in Firebase Authentication
    await firebaseAdmin.auth().updateUser(userId, { password: newPassword });

    sendSuccessResponse(res, 200, 'Password updated successfully');
  } catch (error) {
    sendErrorResponse(res, 400, 'Failed to update password', error.message);
  }
};

exports.getDaysSinceJoined = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const createdAt = userData.createdAt.toDate();  // Firestore stores dates as Timestamp objects
    const today = new Date();

    // Calculate the difference in days between today and the creation date
    const diffInTime = today.getTime() - createdAt.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

    sendSuccessResponse(res, 200, 'Days since user joined retrieved', { days: diffInDays });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve days since joined', error.message);
  }
};

exports.getDocumentCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    const documentCount = userData.documents.length;

    sendSuccessResponse(res, 200, 'Document count retrieved', { documentCount });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve document count', error.message);
  }
};

exports.getUserEmail = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const userData = userDoc.data();
    sendSuccessResponse(res, 200, 'User email retrieved', { email: userData.email });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to retrieve user email', error.message);
  }
};
