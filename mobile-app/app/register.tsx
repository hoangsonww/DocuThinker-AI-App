import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { AppText, Button, Logo, TextField } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";

export default function RegisterScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!email.trim() || !password) {
      setError("Please fill in every field to continue.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.register(email.trim(), password);
      router.replace("/login");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to register. Please try again.",
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
          marginTop: spacing.xl,
          marginBottom: spacing.xs,
        }}
      >
        <Logo size={44} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">Create your account</AppText>
        <AppText variant="muted">
          Start turning long documents into clear insights.
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
        autoCapitalize="none"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        icon="lock-closed-outline"
        secureTextEntry
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter your password"
        icon="lock-closed-outline"
        secureTextEntry
      />

      <Button
        label="Create Account"
        loading={loading}
        onPress={handleRegister}
      />

      <AppText
        variant="caption"
        color={theme.textMuted}
        style={{ textAlign: "center" }}
      >
        By continuing you agree to our Terms of Service and Privacy Policy.
      </AppText>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 5,
          marginTop: spacing.xs,
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm }}>
          Already have an account?
        </Text>
        <Pressable hitSlop={6} onPress={() => router.replace("/login")}>
          <Text
            style={{
              color: theme.brand,
              fontWeight: "800",
              fontSize: fontSize.sm,
            }}
          >
            Sign in
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
