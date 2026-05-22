// Local appearance prefs persisted through AsyncStorage.
//
// Backend has /update-theme but only accepts "light" | "dark" — so we hold
// `system` locally and only push explicit choices to the backend. Text scale
// is mobile-only (no backend column).

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "docuthinker:prefs:v1";

export type ThemeChoice = "system" | "light" | "dark";
export type TextScale = "small" | "default" | "large" | "xlarge";

export type Prefs = {
  theme: ThemeChoice;
  textScale: TextScale;
};

const DEFAULTS: Prefs = {
  theme: "system",
  textScale: "default",
};

type Listener = (p: Prefs) => void;
const listeners = new Set<Listener>();

let cache: Prefs = DEFAULTS;
let hydrated = false;

export async function hydratePrefs(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cache = { ...DEFAULTS, ...parsed };
    }
  } catch {
    // Bad JSON or storage error — fall back to defaults.
  }
  hydrated = true;
  emit();
}

export function getPrefs(): Prefs {
  return cache;
}

export async function setPrefs(patch: Partial<Prefs>): Promise<void> {
  const before = cache;
  cache = { ...cache, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  // Run any registered "apply-before-emit" hooks (e.g. text scale must mutate
  // the shared fontSize object before listeners re-render — otherwise
  // subscribers read stale values).
  if (before.textScale !== cache.textScale) {
    applyHooks.forEach((fn) => fn(cache));
  }
  emit();
}

type ApplyHook = (p: Prefs) => void;
const applyHooks = new Set<ApplyHook>();

export function registerApplyHook(fn: ApplyHook): () => void {
  applyHooks.add(fn);
  // Run once immediately so callers see the current state.
  fn(cache);
  return () => applyHooks.delete(fn);
}

export function onPrefsChange(handler: Listener): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

function emit() {
  listeners.forEach((fn) => fn(cache));
}

export const TEXT_SCALE: Record<TextScale, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
  xlarge: 1.3,
};
