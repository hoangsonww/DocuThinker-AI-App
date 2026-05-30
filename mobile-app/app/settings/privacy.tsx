import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { AppText, Button, Card } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api, BASE_URL } from "@/lib/api";
import { clearAuth, getToken, getUserId } from "@/lib/auth";

// Real privacy & security tools backed by:
//   GET    /document-count/:userId         (counts to confirm before destroy)
//   GET    /user-joined-date/:userId       (session context)
//   DELETE /documents/:userId              (purge all documents)
// Mirrors the destructive "Delete all documents" flow on web's DocumentsPage.

function shortenToken(token: string | null): string {
  if (!token) return "-";
  if (token.length < 32) return token;
  return `${token.slice(0, 8)}…${token.slice(-8)}`;
}

function decodeJwtExpiry(token: string | null): string {
  if (!token) return "-";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "-";
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(globalThis.atob(b64 + pad));
    if (typeof json.exp === "number") {
      return new Date(json.exp * 1000).toLocaleString();
    }
  } catch {
    // Token isn't a standard JWT - fine.
  }
  return "-";
}

export default function PrivacySettingsScreen() {
  const theme = useTheme();
  const userId = getUserId();
  const [docCount, setDocCount] = useState<number | null>(null);
  const [joinedDate, setJoinedDate] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    try {
      const [count, joined] = await Promise.all([
        api.getDocumentCount(userId).catch(() => ({ documentCount: 0 })),
        api.getUserJoinedDate(userId).catch(() => ({ joinedDate: "" })),
      ]);
      setDocCount(count.documentCount ?? 0);
      setJoinedDate(
        joined.joinedDate
          ? new Date(joined.joinedDate).toLocaleDateString()
          : "",
      );
    } catch (e) {
      console.warn("privacy load failed", e);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function confirmDeleteAll() {
    if (!userId || !docCount) return;
    Alert.alert(
      `Delete ${docCount} document${docCount === 1 ? "" : "s"}?`,
      "This permanently removes every document and summary from your DocuThinker account, on web and mobile. You can't undo this.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            setError("");
            setInfo("");
            setBusy(true);
            try {
              await api.deleteAllDocuments(userId);
              setInfo(
                `Deleted ${docCount} document${docCount === 1 ? "" : "s"}.`,
              );
              setDocCount(0);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Delete failed. Please try again.",
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function confirmSignOut() {
    Alert.alert("Sign out of this device?", undefined, [
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

  const token = getToken();

  return (
    <Screen header={<ScreenHeader title="Privacy & security" showBack />}>
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
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Current session</AppText>
          <KeyRow label="User ID" value={userId ?? "-"} />
          <KeyRow label="Backend" value={BASE_URL} />
          <KeyRow label="Token preview" value={shortenToken(token)} />
          <KeyRow label="Token expires" value={decodeJwtExpiry(token)} />
          {loaded ? (
            <KeyRow label="Joined" value={joinedDate || "-"} />
          ) : (
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  width: 120,
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color: theme.textMuted,
                }}
              >
                Joined
              </Text>
              <View style={{ flex: 1 }}>
                <Skeleton height={fontSize.sm} width="40%" />
              </View>
            </View>
          )}
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Data we store</AppText>
          <AppText variant="muted">
            Your documents are stored encrypted at rest in Firebase. Summaries
            and chat threads live on the same account. Deleting documents here
            also removes them from the web app - there's one shared store.
          </AppText>
          {loaded ? (
            <Text
              style={{
                fontSize: fontSize.md,
                color: theme.text,
                fontWeight: "700",
              }}
            >
              {docCount ?? 0} document{docCount === 1 ? "" : "s"} on file
            </Text>
          ) : (
            <Skeleton height={fontSize.md} width="40%" />
          )}
        </View>
      </Card>

      <Button
        label="Delete all my documents"
        icon="trash-outline"
        variant="outline"
        loading={busy}
        disabled={!loaded || !docCount}
        onPress={confirmDeleteAll}
      />

      <Button
        label="Sign out of this device"
        icon="log-out-outline"
        variant="outline"
        onPress={confirmSignOut}
      />

      <AppText
        variant="caption"
        color={theme.textMuted}
        style={{ textAlign: "center" }}
      >
        We don't yet support full account deletion in-app. To permanently remove
        your DocuThinker account, email support@docuthinker.app.
      </AppText>
    </Screen>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.md,
        alignItems: "flex-start",
      }}
    >
      <Text
        style={{
          width: 120,
          fontSize: fontSize.sm,
          fontWeight: "700",
          color: theme.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{ flex: 1, fontSize: fontSize.sm, color: theme.text }}
      >
        {value}
      </Text>
    </View>
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
