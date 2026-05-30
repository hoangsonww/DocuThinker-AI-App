import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import {
  getPrefs,
  onPrefsChange,
  registerApplyHook,
  TEXT_SCALE,
} from "@/lib/prefs";

// DocuThinker brand palette - an orange accent shared with the web app.
export const brand = {
  orange: "#F57C00",
  orangeBright: "#FF9800",
  orangeDark: "#E65100",
};

type ThemeMode = "light" | "dark";

export const lightTheme = {
  mode: "light" as ThemeMode,
  background: "#F3F4F6",
  surface: "#FFFFFF",
  surfaceAlt: "#EDEFF2",
  border: "#E4E7EC",
  text: "#15181D",
  textMuted: "#697079",
  brand: brand.orange,
  brandDark: brand.orangeDark,
  brandSoft: "#FFF1E0",
  onBrand: "#FFFFFF",
  success: "#2E9E5B",
  danger: "#E5484D",
  info: "#3B82F6",
  shadow: "#0B1220",
};

export const darkTheme = {
  mode: "dark" as ThemeMode,
  background: "#0F1115",
  surface: "#181B20",
  surfaceAlt: "#23272F",
  border: "#2C313A",
  text: "#F2F4F7",
  textMuted: "#9AA1AC",
  brand: brand.orangeBright,
  brandDark: brand.orange,
  brandSoft: "#2A2118",
  onBrand: "#1A1206",
  success: "#3DD68C",
  danger: "#FF6369",
  info: "#5B9BFF",
  shadow: "#000000",
};

export type Theme = typeof lightTheme;

export function useTheme(): Theme {
  const system = useSystemColorScheme();
  // Subscribe to the whole prefs blob, not just theme: any change (theme OR
  // text scale) must re-render the screen so `fontSize` mutations made by
  // `applyScale` take effect immediately. Without this, screens that imported
  // `fontSize.md` at render time keep showing the old size until they
  // unmount/remount or rerender for another reason.
  const [prefs, setPrefsState] = useState(() => getPrefs());
  useEffect(() => onPrefsChange((p) => setPrefsState(p)), []);
  const resolved =
    prefs.theme === "dark"
      ? "dark"
      : prefs.theme === "light"
        ? "light"
        : system;
  return resolved === "dark" ? darkTheme : lightTheme;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export type FontSize = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  display: number;
};

const BASE_FONT_SIZE: FontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 33,
};

// `fontSize` is consumed all over the app as a static object. Scaling it
// dynamically would force every screen to read from a hook; instead we mutate
// the same object in-place when the user changes the text-scale pref. The
// emitter then asks React to re-render via the listener in `useFontScale`.
export const fontSize: FontSize = { ...BASE_FONT_SIZE };

function applyScale(scale: number) {
  (Object.keys(BASE_FONT_SIZE) as (keyof FontSize)[]).forEach((key) => {
    fontSize[key] = Math.round(BASE_FONT_SIZE[key] * scale);
  });
}

export function useFontScale(): number {
  const [scale, setScale] = useState(() => TEXT_SCALE[getPrefs().textScale]);
  useEffect(() => {
    return onPrefsChange((p) => setScale(TEXT_SCALE[p.textScale]));
  }, []);
  return scale;
}

// Always mutate `fontSize` before any listener runs - `setPrefs` invokes hooks
// synchronously ahead of the emit, so subscribers (every screen via useTheme)
// re-render against fresh values instead of the previous scale.
registerApplyHook((p) => applyScale(TEXT_SCALE[p.textScale]));

// A soft elevation usable cross-platform (iOS shadow + Android elevation).
export function elevation(theme: Theme, level: 1 | 2 | 3 = 1) {
  return {
    shadowColor: theme.shadow,
    shadowOpacity: theme.mode === "dark" ? 0.4 : 0.08 + level * 0.03,
    shadowRadius: level * 6,
    shadowOffset: { width: 0, height: level * 2 },
    elevation: level * 3,
  };
}
