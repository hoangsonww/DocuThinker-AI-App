// Client-side passkey (WebAuthn) helpers.
//
// Thin wrapper around @simplewebauthn/browser plus the backend's passkey
// endpoints. The browser library and the backend's @simplewebauthn/server are a
// matched pair: the server emits the options JSON consumed here, and the
// response JSON produced here is verified verbatim by the server.

import axios from "axios";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { API_BASE_URL } from "./api";

// Whether this browser can use WebAuthn at all.
export const isPasskeySupported = () => browserSupportsWebAuthn();

// Whether a built-in authenticator (Touch ID, Windows Hello, etc.) is present.
export const isPlatformAuthenticatorAvailable = async () => {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch (e) {
    return false;
  }
};

// Turn a WebAuthn/axios failure into a message that's safe to show a user.
const friendlyError = (err, fallback) => {
  if (err && err.name === "NotAllowedError") {
    return "The passkey request was cancelled or timed out. Please try again.";
  }
  if (err && err.name === "InvalidStateError") {
    return "A passkey for this account already exists on this device.";
  }
  const apiError = err && err.response && err.response.data;
  if (apiError && (apiError.details || apiError.error)) {
    return apiError.details || apiError.error;
  }
  return (err && err.message) || fallback;
};

// Create and register a new passkey for the given (already signed-up) user.
export const registerPasskey = async (userId, name) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/passkey/register/options`,
      { userId },
    );
    const attestation = await startRegistration({ optionsJSON: data.options });
    const { data: verified } = await axios.post(
      `${API_BASE_URL}/passkey/register/verify`,
      { userId, flowId: data.flowId, name, response: attestation },
    );
    return verified.passkey;
  } catch (err) {
    throw new Error(friendlyError(err, "Could not create a passkey."));
  }
};

// Authenticate with a passkey. Omitting `email` uses a discoverable
// (usernameless) flow. Returns { customToken, userId, email }.
export const authenticateWithPasskey = async (email) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/passkey/authenticate/options`,
      email ? { email } : {},
    );
    const assertion = await startAuthentication({ optionsJSON: data.options });
    const { data: verified } = await axios.post(
      `${API_BASE_URL}/passkey/authenticate/verify`,
      { flowId: data.flowId, response: assertion },
    );
    return verified;
  } catch (err) {
    throw new Error(friendlyError(err, "Passkey sign-in failed."));
  }
};

// Fetch every passkey owned by the user.
export const listPasskeys = async (userId) => {
  const { data } = await axios.get(`${API_BASE_URL}/passkeys/${userId}`);
  return data.passkeys || [];
};

// Rename a passkey.
export const renamePasskey = async (userId, credentialId, name) => {
  const { data } = await axios.patch(
    `${API_BASE_URL}/passkeys/${userId}/${encodeURIComponent(credentialId)}`,
    { name },
  );
  return data.passkey;
};

// Delete a passkey.
export const deletePasskey = async (userId, credentialId) => {
  await axios.delete(
    `${API_BASE_URL}/passkeys/${userId}/${encodeURIComponent(credentialId)}`,
  );
};
