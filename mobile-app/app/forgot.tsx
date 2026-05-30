import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Button, TextField } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";

// Mirrors frontend/src/pages/ForgotPassword.js - two-step flow:
// 1. POST /verify-email confirms the account exists.
// 2. POST /forgot-password updates the password for that account.

export default function ForgotScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleVerify() {
    if (!email.trim()) {
      setError("Enter the email on your account to continue.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await api.verifyEmail(email.trim());
      setVerified(true);
      setInfo("Email verified. Set a new password to finish.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't verify that email. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await api.forgotPassword(email.trim(), newPassword);
      setInfo("Password updated. You can sign in with the new password now.");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't update your password. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen header={<ScreenHeader title="Reset password" showBack />}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">Forgot your password?</AppText>
        <AppText variant="muted">
          {verified
            ? "Choose a new password for your DocuThinker account."
            : "Confirm your email and we'll let you reset the password."}
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

      {info ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.brand,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Ionicons name="checkmark-circle" size={18} color={theme.brand} />
          <Text
            style={{
              flex: 1,
              color: theme.text,
              fontSize: fontSize.sm,
              fontWeight: "600",
            }}
          >
            {info}
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
        editable={!verified}
      />

      {verified ? (
        <>
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            icon="lock-closed-outline"
            secureTextEntry
          />
          <TextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter the new password"
            icon="lock-closed-outline"
            secureTextEntry
          />
          <Button
            label="Update password"
            loading={loading}
            onPress={handleReset}
          />
        </>
      ) : (
        <Button label="Verify email" loading={loading} onPress={handleVerify} />
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 5,
          marginTop: spacing.sm,
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: fontSize.sm }}>
          Remembered it?
        </Text>
        <Pressable hitSlop={6} onPress={() => router.replace("/login")}>
          <Text
            style={{
              color: theme.brand,
              fontWeight: "800",
              fontSize: fontSize.sm,
            }}
          >
            Back to sign in
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
