import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { AppText, Button, Logo, TextField } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { customToken, userId } = await api.login(email.trim(), password);
      await setAuth(customToken, userId);
      router.replace("/");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View
        style={{
          alignItems: "center",
          marginTop: spacing.xxl,
          marginBottom: spacing.xs,
        }}
      >
        <Logo size={44} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">Welcome back</AppText>
        <AppText variant="muted">
          Sign in to keep analyzing your documents.
        </AppText>
      </View>

      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.danger,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Ionicons name="alert-circle" size={18} color={theme.danger} />
          <Text
            style={{
              flex: 1,
              color: theme.danger,
              fontSize: fontSize.sm,
              fontWeight: "600",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        icon="mail-outline"
        keyboardType="email-address"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        icon="lock-closed-outline"
        secureTextEntry
      />

      <Pressable
        hitSlop={6}
        style={{ alignSelf: "flex-end" }}
        onPress={() => router.push("/forgot")}
      >
        <Text
          style={{
            color: theme.brand,
            fontWeight: "700",
            fontSize: fontSize.sm,
          }}
        >
          Forgot password?
        </Text>
      </Pressable>

      <Button label="Sign In" loading={loading} onPress={handleLogin} />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 5,
          marginTop: spacing.sm,
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm }}>
          New to DocuThinker?
        </Text>
        <Pressable hitSlop={6} onPress={() => router.push("/register")}>
          <Text
            style={{
              color: theme.brand,
              fontWeight: "800",
              fontSize: fontSize.sm,
            }}
          >
            Create an account
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
