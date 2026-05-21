// Client-side auth state for the mobile app.
//
// Mirrors frontend/src/utils/auth.js: persists credentials and broadcasts
// changes through a simple emitter so screens can react instead of polling.

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedToken: string | null = null;
let cachedUserId: string | null = null;
let hydrated = false;

export async function hydrateAuth(): Promise<void> {
  if (hydrated) return;
  const [token, userId] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_ID_KEY),
  ]);
  cachedToken = token;
  cachedUserId = userId;
  hydrated = true;
  emit();
}

export function isAuthenticated(): boolean {
  return !!cachedUserId;
}

export function getToken(): string | null {
  return cachedToken;
}

export function getUserId(): string | null {
  return cachedUserId;
}

export async function setAuth(token: string, userId: string): Promise<void> {
  cachedToken = token;
  cachedUserId = userId;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_ID_KEY, userId],
  ]);
  emit();
}

export async function clearAuth(): Promise<void> {
  cachedToken = null;
  cachedUserId = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]);
  emit();
}

export function onAuthChange(handler: Listener): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

function emit() {
  listeners.forEach((fn) => fn());
}
