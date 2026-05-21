import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Button, Card, IconCircle } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

const SAMPLE_TITLE = "DocuThinker Sample — Spring 2026 Update";
const SAMPLE_TEXT = `DocuThinker Sample Document

Quarterly Product Update — Spring 2026

Overview
This quarter we shipped three large initiatives: the mobile app rebuild, end-to-end JWT enhancements, and a unified document-chat experience that finally feels native on both web and iOS/Android.

The mobile rebuild is the headline. The app now signs in against the same Firebase Auth pool the web client uses, persists the session via AsyncStorage, and re-renders reactively when the user signs out from any tab or device. Customers who created accounts on the web can sign in on mobile without re-registering.

Key wins
- Mobile parity for the core loop: login, library, summary, chat.
- 32-bit setTimeout clamp on the JWT expiry timer fixes a long-standing bug where sessions over 24.8 days flipped the navbar immediately.
- Frontend dropped a per-second localStorage poll in favor of an event-driven auth model; CPU usage on idle tabs dropped measurably.
- Pull-to-refresh on Home, Library, and Profile pulls live counts from the backend instead of mock data.

Known limitation
The mobile app currently uploads plain-text documents only. PDF and DOCX still go through the web app, which parses them client-side with pdfjs and mammoth before posting the extracted text. Adding native PDF parsing to mobile would require expo prebuild, which we are deliberately deferring to keep the Expo Go workflow simple.

Looking ahead
Next quarter focuses on native push notifications, offline document caching, and surfacing analytics dashboards on mobile. Expect a beta on TestFlight by mid-Q3.`;

type PickedFile = {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
};

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/markdown", "text/*", "application/json"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType,
      });
    } catch (e) {
      Alert.alert(
        "Couldn't open file",
        e instanceof Error ? e.message : "Please try a different file.",
      );
    }
  }

  async function handleAnalyze() {
    if (!file) return;
    setBusy(true);
    try {
      const text = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (!text.trim()) {
        throw new Error("That file looks empty.");
      }
      await postAndNavigate(file.name, text);
    } catch (e) {
      Alert.alert(
        "Upload failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleTrySample() {
    setBusy(true);
    try {
      await postAndNavigate(SAMPLE_TITLE, SAMPLE_TEXT);
    } catch (e) {
      Alert.alert(
        "Sample upload failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function postAndNavigate(title: string, text: string) {
    const userId = getUserId();
    const result = await api.upload(userId, title, text);
    router.replace({
      pathname: "/summary",
      params: {
        title,
        summary: result.summary,
        originalText: result.originalText,
      },
    });
  }

  return (
    <Screen header={<ScreenHeader title="New analysis" showBack />}>
      {file ? (
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <IconCircle name="document-outline" size={48} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: theme.text,
                }}
              >
                {file.name}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                {formatSize(file.size)} · ready to analyze
              </Text>
            </View>
            <Pressable onPress={() => setFile(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={24} color={theme.textMuted} />
            </Pressable>
          </View>
        </Card>
      ) : (
        <Pressable onPress={pickFile}>
          <View
            style={{
              borderWidth: 2,
              borderColor: theme.border,
              borderStyle: "dashed",
              borderRadius: radius.lg,
              paddingVertical: spacing.xxxl,
              paddingHorizontal: spacing.xl,
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor: theme.surface,
            }}
          >
            <IconCircle name="cloud-upload-outline" size={66} />
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: "800",
                color: theme.text,
                marginTop: spacing.xs,
              }}
            >
              Choose a text document
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: theme.textMuted,
                textAlign: "center",
              }}
            >
              Tap to browse — .txt, .md, or other plain-text files
            </Text>
          </View>
        </Pressable>
      )}

      <AppText variant="caption" color={theme.textMuted}>
        PDF and DOCX parsing happen on the web app. On mobile, pick a plain-text
        document for now and we'll add native parsing soon.
      </AppText>

      <Button
        label={busy ? "Analyzing…" : "Analyze Document"}
        icon="sparkles"
        disabled={!file || busy}
        loading={busy && !!file}
        onPress={handleAnalyze}
      />

      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <Text
          style={{
            color: theme.textMuted,
            fontSize: fontSize.xs,
            fontWeight: "700",
          }}
        >
          OR
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>

      <Button
        label="Try a Sample Document"
        icon="document-text-outline"
        variant="outline"
        disabled={busy}
        loading={busy && !file}
        onPress={handleTrySample}
      />

      <AppText
        variant="caption"
        color={theme.textMuted}
        style={{ textAlign: "center" }}
      >
        Documents are processed securely and never shared.
      </AppText>
    </Screen>
  );
}
