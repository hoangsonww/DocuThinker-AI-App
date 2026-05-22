// Client-side auth helpers.
//
// Login state is tracked in localStorage, and changes are broadcast as
// events so consumers can react instead of polling.

const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const AUTH_EVENT = "auth-change";

// Whether a user is currently signed in.
export const isAuthenticated = () => !!localStorage.getItem(USER_ID_KEY);

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
