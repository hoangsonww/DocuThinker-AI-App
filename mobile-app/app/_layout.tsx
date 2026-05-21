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
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const scheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    hydrateAuth().then(() => {
      setAuthed(isAuthenticated());
      setReady(true);
    });
    return onAuthChange(() => setAuthed(isAuthenticated()));
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
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
