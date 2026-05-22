import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import {
  AppText,
  Button,
  Card,
  Pill,
  TextField,
} from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { clearAuth, getUserId } from "@/lib/auth";

// Mirrors frontend/src/pages/Profile.js — uses /update-email + /update-password
// against the same backend the web client hits. Both endpoints work directly
// against Firebase Auth (no email re-verification), so once the request
// succeeds we sign the user out so they can re-authenticate with the new
// credentials.

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [joinedDate, setJoinedDate] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoaded(true);
      return;
    }
    try {
      const [email, joined] = await Promise.all([
        api.getUserEmail(userId).catch(() => ({ email: "" })),
        api.getUserJoinedDate(userId).catch(() => ({ joinedDate: "" })),
      ]);
      setCurrentEmail(email.email || "");
      setJoinedDate(
        joined.joinedDate
          ? new Date(joined.joinedDate).toLocaleDateString()
          : "",
      );
    } catch (e) {
      console.warn("account load failed", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdateEmail() {
    setError("");
    setInfo("");
    const userId = getUserId();
    if (!userId) return;
    if (!newEmail.trim() || newEmail.trim() === currentEmail) {
      setError("Enter a different email to change it.");
      return;
    }
    setEmailBusy(true);
    try {
      await api.updateUserEmail(userId, newEmail.trim());
      setInfo("Email updated. Please sign in again with the new email.");
      setNewEmail("");
      setTimeout(async () => {
        await clearAuth();
        router.replace("/login");
      }, 1200);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update your email.",
      );
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleUpdatePassword() {
    setError("");
    setInfo("");
    const userId = getUserId();
    if (!userId) return;
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await api.updateUserPassword(userId, newPassword);
      setInfo("Password updated. Sign in again with the new password.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(async () => {
        await clearAuth();
        router.replace("/login");
      }, 1200);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update your password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  }

  function confirmSignOut() {
    Alert.alert("Sign out", "You'll need to sign in again to access your documents.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <Screen header={<ScreenHeader title="Account details" showBack />}>
      {info ? (
        <Banner color={theme.brand} icon="checkmark-circle">
          {info}
        </Banner>
      ) : null}
      {error ? (
        <Banner color={theme.danger} icon="alert-circle">
          {error}
        </Banner>
      ) : null}

      <Card>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Current account</AppText>
          {loaded ? (
            <>
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: theme.text,
                  fontWeight: "700",
                }}
              >
                {currentEmail || "Not signed in"}
              </Text>
              {joinedDate ? (
                <Text style={{ fontSize: fontSize.sm, color: theme.textMuted }}>
                  Joined {joinedDate}
                </Text>
              ) : null}
            </>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Skeleton height={fontSize.md} width="75%" />
              <Skeleton height={fontSize.sm} width="45%" />
            </View>
          )}
          <View style={{ alignSelf: "flex-start", marginTop: spacing.xs }}>
            <Pill label="Pro member" tone="brand" />
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <AppText variant="subtitle">Change email</AppText>
          <AppText variant="muted">
            Updates your DocuThinker email everywhere — web and mobile.
          </AppText>
          <TextField
            label="New email"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />
          <Button
            label="Update email"
            icon="mail-outline"
            loading={emailBusy}
            onPress={handleUpdateEmail}
          />
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <AppText variant="subtitle">Change password</AppText>
          <AppText variant="muted">
            At least 6 characters. You'll be signed out so you can re-enter the
            new password.
          </AppText>
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            icon="lock-closed-outline"
          />
          <TextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter the new password"
            secureTextEntry
            icon="lock-closed-outline"
          />
          <Button
            label="Update password"
            icon="key-outline"
            loading={passwordBusy}
            onPress={handleUpdatePassword}
          />
        </View>
      </Card>

      <Button
        label="Sign out"
        variant="outline"
        icon="log-out-outline"
        onPress={confirmSignOut}
      />
    </Screen>
  );
}

function Banner({
  children,
  color,
  icon,
}: {
  children: string;
  color: string;
  icon: "checkmark-circle" | "alert-circle";
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: color,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text
        style={{
          flex: 1,
          color: theme.text,
          fontSize: fontSize.sm,
          fontWeight: "600",
        }}
      >
        {children}
      </Text>
    </View>
  );
}
