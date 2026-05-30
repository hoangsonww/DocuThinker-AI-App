const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { v4: uuidv4 } = require("uuid");
const firebaseAdmin = require("firebase-admin");
const { Passkey, Challenge, toIso } = require("../models/passkeyModel");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");

// Challenges are valid for 5 minutes — long enough for the user to complete the
// browser prompt, short enough to keep the replay window tiny.
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_PASSKEY_NAME_LENGTH = 60;
const RP_NAME = process.env.WEBAUTHN_RP_NAME || "DocuThinker";

/**
 * Split a comma-separated env value into a trimmed, non-empty list.
 * @param {string} value - Raw env value
 * @returns {string[]} - Parsed list
 */
const parseList = (value) =>
  (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

// base64url <-> bytes helpers (Node's Buffer supports "base64url" on 18+).
const bytesToBase64Url = (bytes) => Buffer.from(bytes).toString("base64url");
const base64UrlToBytes = (value) =>
  new Uint8Array(Buffer.from(value, "base64url"));
const utf8ToBytes = (value) => new Uint8Array(Buffer.from(value, "utf8"));

/**
 * Resolve the Relying Party ID and the expected origin for a request.
 *
 * WebAuthn binds credentials to the origin of the page that created them, which
 * the browser sends as the `Origin` header on the (cross-origin) API call. We
 * therefore derive the RP from that header by default, and let operators pin it
 * explicitly via env for custom domains:
 *   - WEBAUTHN_RP_ID   : fixed RP ID (e.g. "docuthinker.vercel.app")
 *   - WEBAUTHN_ORIGINS : comma-separated allowlist of full origins
 *                        (falls back to FRONTEND_URL)
 *
 * @param {object} req - Express request
 * @returns {{ rpID: string, origin: string, rpName: string }}
 */
const resolveRelyingParty = (req) => {
  const originHeader = (req.headers && req.headers.origin) || "";
  const allowedOrigins = parseList(
    process.env.WEBAUTHN_ORIGINS || process.env.FRONTEND_URL,
  );
  const configuredRpId = process.env.WEBAUTHN_RP_ID || "";

  let origin = "";
  if (
    originHeader &&
    (allowedOrigins.length === 0 || allowedOrigins.includes(originHeader))
  ) {
    origin = originHeader;
  } else if (allowedOrigins.length > 0) {
    origin = allowedOrigins[0];
  } else {
    origin = "http://localhost:3000";
  }

  let rpID = configuredRpId;
  if (!rpID) {
    try {
      rpID = new URL(origin).hostname;
    } catch (error) {
      rpID = "localhost";
    }
  }

  return { rpID, origin, rpName: RP_NAME };
};

/**
 * Whether a stored challenge is older than the allowed TTL.
 * @param {*} createdAt - Firestore Timestamp / Date / string
 * @returns {boolean}
 */
const isExpired = (createdAt) => {
  const ms =
    createdAt && typeof createdAt.toMillis === "function"
      ? createdAt.toMillis()
      : new Date(createdAt).getTime();
  return !ms || Date.now() - ms > CHALLENGE_TTL_MS;
};

/**
 * Build a friendly default passkey name from the request's User-Agent.
 * @param {object} req - Express request
 * @returns {string}
 */
const defaultPasskeyName = (req) => {
  const ua = (req.headers && req.headers["user-agent"]) || "";
  let device = "device";
  if (/iphone|ipad|ipod/i.test(ua)) device = "iOS device";
  else if (/android/i.test(ua)) device = "Android device";
  else if (/mac os x|macintosh/i.test(ua)) device = "Mac";
  else if (/windows/i.test(ua)) device = "Windows PC";
  else if (/cros/i.test(ua)) device = "Chromebook";
  else if (/linux/i.test(ua)) device = "Linux device";

  let browser = "";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/chrome\//i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua)) browser = "Safari";

  return browser ? `${browser} on ${device}` : `Passkey (${device})`;
};

/**
 * Shape a stored passkey for API responses (never leaks the public key).
 * @param {object} passkey - Stored passkey document
 * @returns {object} - Safe, client-facing representation
 */
const serializePasskey = (passkey) => ({
  id: passkey.credentialId,
  name: passkey.name || "Passkey",
  deviceType: passkey.deviceType || "singleDevice",
  backedUp: !!passkey.backedUp,
  transports: passkey.transports || [],
  createdAt: toIso(passkey.createdAt),
  lastUsedAt: toIso(passkey.lastUsedAt),
});

/**
 * @swagger
 * tags:
 *   name: Passkeys
 *   description: Passwordless authentication with WebAuthn passkeys.
 */

/**
 * @swagger
 * /passkey/register/options:
 *   post:
 *     summary: Begin passkey registration
 *     description: >
 *       Generate WebAuthn registration options (a challenge) for the signed-in
 *       user. Already-registered credentials are excluded so the same
 *       authenticator cannot be enrolled twice.
 *     tags: [Passkeys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: Registration options generated
 *       404:
 *         description: User not found
 */
exports.getRegistrationOptions = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return sendErrorResponse(res, 400, "userId is required");

    let userRecord;
    try {
      userRecord = await firebaseAdmin.auth().getUser(userId);
    } catch (error) {
      return sendErrorResponse(res, 404, "User not found", error.message);
    }

    const { rpID, rpName, origin } = resolveRelyingParty(req);
    const existing = await Passkey.listByUser(userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: utf8ToBytes(userId),
      userName: userRecord.email || userId,
      userDisplayName:
        userRecord.displayName || userRecord.email || "DocuThinker User",
      attestationType: "none",
      excludeCredentials: existing.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports || undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    const flowId = uuidv4();
    await Challenge.save(flowId, {
      challenge: options.challenge,
      type: "registration",
      userId,
      rpID,
      origin,
    });

    sendSuccessResponse(res, 200, "Registration options generated", {
      flowId,
      options,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to create registration options",
      error.message,
    );
  }
};

/**
 * @swagger
 * /passkey/register/verify:
 *   post:
 *     summary: Complete passkey registration
 *     description: Verify the authenticator's attestation and store the credential.
 *     tags: [Passkeys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               flowId:
 *                 type: string
 *               name:
 *                 type: string
 *               response:
 *                 type: object
 *                 description: The RegistrationResponseJSON from the browser.
 *     responses:
 *       201:
 *         description: Passkey registered successfully
 *       400:
 *         description: Verification failed or session expired
 *       409:
 *         description: Passkey already registered
 */
exports.verifyRegistration = async (req, res) => {
  try {
    const { userId, flowId, response, name } = req.body || {};
    if (!userId || !flowId || !response) {
      return sendErrorResponse(
        res,
        400,
        "userId, flowId, and response are required",
      );
    }

    const challenge = await Challenge.get(flowId);
    if (
      !challenge ||
      challenge.type !== "registration" ||
      challenge.userId !== userId
    ) {
      return sendErrorResponse(
        res,
        400,
        "Invalid or expired registration session",
      );
    }
    if (isExpired(challenge.createdAt)) {
      await Challenge.remove(flowId);
      return sendErrorResponse(res, 400, "Registration session expired");
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: challenge.origin,
        expectedRPID: challenge.rpID,
        requireUserVerification: false,
      });
    } catch (error) {
      await Challenge.remove(flowId);
      return sendErrorResponse(
        res,
        400,
        "Passkey registration verification failed",
        error.message,
      );
    }

    await Challenge.remove(flowId);

    if (!verification.verified || !verification.registrationInfo) {
      return sendErrorResponse(res, 400, "Passkey could not be verified");
    }

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;

    const alreadyRegistered = await Passkey.getById(credential.id);
    if (alreadyRegistered) {
      return sendErrorResponse(res, 409, "This passkey is already registered");
    }

    const passkey = {
      credentialId: credential.id,
      userId,
      publicKey: bytesToBase64Url(credential.publicKey),
      counter: credential.counter || 0,
      transports:
        credential.transports || (response.response || {}).transports || [],
      deviceType: credentialDeviceType || "singleDevice",
      backedUp: !!credentialBackedUp,
      aaguid: aaguid || null,
      name:
        (name && String(name).trim().slice(0, MAX_PASSKEY_NAME_LENGTH)) ||
        defaultPasskeyName(req),
      createdAt: new Date(),
      lastUsedAt: null,
    };
    await Passkey.create(passkey);

    sendSuccessResponse(res, 201, "Passkey registered successfully", {
      passkey: serializePasskey(passkey),
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to register passkey", error.message);
  }
};

/**
 * @swagger
 * /passkey/authenticate/options:
 *   post:
 *     summary: Begin passkey authentication
 *     description: >
 *       Generate WebAuthn authentication options. If an email is supplied the
 *       options are scoped to that account's credentials; otherwise a
 *       discoverable-credential (usernameless) flow is used.
 *     tags: [Passkeys]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication options generated
 */
exports.getAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body || {};
    const { rpID, origin } = resolveRelyingParty(req);

    let allowCredentials = [];
    if (email) {
      try {
        const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
        const passkeys = await Passkey.listByUser(userRecord.uid);
        allowCredentials = passkeys.map((passkey) => ({
          id: passkey.credentialId,
          transports: passkey.transports || undefined,
        }));
      } catch (error) {
        // Never reveal whether an email is registered: fall back to a
        // discoverable-credential flow instead of erroring out.
        allowCredentials = [];
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    const flowId = uuidv4();
    await Challenge.save(flowId, {
      challenge: options.challenge,
      type: "authentication",
      rpID,
      origin,
    });

    sendSuccessResponse(res, 200, "Authentication options generated", {
      flowId,
      options,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to create authentication options",
      error.message,
    );
  }
};

/**
 * @swagger
 * /passkey/authenticate/verify:
 *   post:
 *     summary: Complete passkey authentication
 *     description: >
 *       Verify the authenticator assertion and, on success, return a Firebase
 *       custom token and user ID — the same contract as the password `/login`
 *       endpoint.
 *     tags: [Passkeys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flowId:
 *                 type: string
 *               response:
 *                 type: object
 *                 description: The AuthenticationResponseJSON from the browser.
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Passkey not recognized or verification failed
 */
exports.verifyAuthentication = async (req, res) => {
  try {
    const { flowId, response } = req.body || {};
    if (!flowId || !response) {
      return sendErrorResponse(res, 400, "flowId and response are required");
    }

    const challenge = await Challenge.get(flowId);
    if (!challenge || challenge.type !== "authentication") {
      return sendErrorResponse(
        res,
        400,
        "Invalid or expired authentication session",
      );
    }
    if (isExpired(challenge.createdAt)) {
      await Challenge.remove(flowId);
      return sendErrorResponse(res, 400, "Authentication session expired");
    }

    const passkey = await Passkey.getById(response.id);
    if (!passkey) {
      await Challenge.remove(flowId);
      return sendErrorResponse(res, 401, "Passkey not recognized");
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: challenge.origin,
        expectedRPID: challenge.rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: base64UrlToBytes(passkey.publicKey),
          counter: passkey.counter || 0,
          transports: passkey.transports || undefined,
        },
        requireUserVerification: false,
      });
    } catch (error) {
      await Challenge.remove(flowId);
      return sendErrorResponse(
        res,
        401,
        "Passkey authentication failed",
        error.message,
      );
    }

    await Challenge.remove(flowId);

    if (!verification.verified) {
      return sendErrorResponse(res, 401, "Passkey authentication failed");
    }

    await Passkey.updateCounter(
      passkey.credentialId,
      verification.authenticationInfo.newCounter,
    );

    // Mirror the /login response so the client's setAuth(token, userId) flow is
    // identical for password and passkey sign-in.
    const customToken = await firebaseAdmin
      .auth()
      .createCustomToken(passkey.userId);
    let email = null;
    try {
      const userRecord = await firebaseAdmin.auth().getUser(passkey.userId);
      email = userRecord.email || null;
    } catch (error) {
      email = null;
    }

    sendSuccessResponse(res, 200, "Authentication successful", {
      customToken,
      userId: passkey.userId,
      email,
    });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Failed to authenticate with passkey",
      error.message,
    );
  }
};

/**
 * @swagger
 * /passkeys/{userId}:
 *   get:
 *     summary: List a user's passkeys
 *     tags: [Passkeys]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Passkeys retrieved
 */
exports.listPasskeys = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return sendErrorResponse(res, 400, "userId is required");

    const passkeys = await Passkey.listByUser(userId);
    const serialized = passkeys
      .map(serializePasskey)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    sendSuccessResponse(res, 200, "Passkeys retrieved", {
      passkeys: serialized,
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve passkeys", error.message);
  }
};

/**
 * @swagger
 * /passkeys/{userId}/{credentialId}:
 *   patch:
 *     summary: Rename a passkey
 *     tags: [Passkeys]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Passkey renamed
 *       404:
 *         description: Passkey not found
 */
exports.renamePasskey = async (req, res) => {
  try {
    const { userId, credentialId } = req.params;
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return sendErrorResponse(res, 400, "name is required");
    }

    const passkey = await Passkey.getById(credentialId);
    if (!passkey || passkey.userId !== userId) {
      return sendErrorResponse(res, 404, "Passkey not found");
    }

    const trimmed = String(name).trim().slice(0, MAX_PASSKEY_NAME_LENGTH);
    await Passkey.rename(credentialId, trimmed);

    sendSuccessResponse(res, 200, "Passkey renamed", {
      passkey: serializePasskey({ ...passkey, name: trimmed }),
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to rename passkey", error.message);
  }
};

/**
 * @swagger
 * /passkeys/{userId}/{credentialId}:
 *   delete:
 *     summary: Delete a passkey
 *     tags: [Passkeys]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Passkey deleted
 *       404:
 *         description: Passkey not found
 */
exports.deletePasskey = async (req, res) => {
  try {
    const { userId, credentialId } = req.params;
    const passkey = await Passkey.getById(credentialId);
    if (!passkey || passkey.userId !== userId) {
      return sendErrorResponse(res, 404, "Passkey not found");
    }

    await Passkey.remove(credentialId);
    sendSuccessResponse(res, 200, "Passkey deleted", { id: credentialId });
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete passkey", error.message);
  }
};
