// Client-side auth helpers.
//
// Login state is derived from the stored JWT's `exp` claim, and changes are
// broadcast as events so consumers can react instead of polling localStorage.

const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const AUTH_EVENT = "auth-change";

// Decodes a JWT payload. The signature is NOT verified — this is for
// client-side display only. Returns null when the token is not a valid JWT.
const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Milliseconds left before the stored token expires; 0 when there is no
// token, it is not a JWT, or it has already expired.
export const msUntilExpiry = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return 0;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
};

// Persists credentials, then notifies same-tab listeners.
export const setAuth = (token, userId) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, userId);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

// Clears credentials, then notifies same-tab listeners.
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

// Subscribes to auth changes from this tab (custom event) and other tabs
// (native `storage` event, which never fires in the tab that made the
// change). Returns an unsubscribe function.
export const onAuthChange = (handler) => {
  const onStorage = (event) => {
    if (
      event.key === TOKEN_KEY ||
      event.key === USER_ID_KEY ||
      event.key === null
    ) {
      handler();
    }
  };
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
};
