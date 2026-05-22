import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { hydrateAuth, isAuthenticated, onAuthChange } from "@/lib/auth";
import { hydratePrefs, getPrefs, onPrefsChange, ThemeChoice } from "@/lib/prefs";
import { useFontScale } from "@/constants/theme";
import { useColorScheme as useSystemColorScheme } from "@/hooks/useColorScheme";

function resolveScheme(
  choice: ThemeChoice,
  system: "light" | "dark" | null | undefined,
): "light" | "dark" {
  if (choice === "dark") return "dark";
  if (choice === "light") return "light";
  return system === "dark" ? "dark" : "light";
}

export default function RootLayout() {
  const system = useSystemColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(
    () => getPrefs().theme,
  );

  // Keep the live font-scale subscription alive at the root.
  useFontScale();

  useEffect(() => {
    Promise.all([hydrateAuth(), hydratePrefs()]).then(() => {
      setAuthed(isAuthenticated());
      setThemeChoice(getPrefs().theme);
      setReady(true);
    });
    const offAuth = onAuthChange(() => setAuthed(isAuthenticated()));
    const offPrefs = onPrefsChange((p) => setThemeChoice(p.theme));
    return () => {
      offAuth();
      offPrefs();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const first = segments[0];
    const onAuthRoute =
      first === "login" || first === "register" || first === "forgot";
    if (!authed && !onAuthRoute) {
      router.replace("/login");
    } else if (authed && onAuthRoute) {
      router.replace("/");
    }
  }, [ready, authed, segments, router]);

  const scheme = resolveScheme(themeChoice, system as "light" | "dark" | null);

  if (!ready) {
    return (
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1 }} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="summary" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="upload" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings/account" />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/connections" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="settings/help" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
