import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Button, Card } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Why is the mobile app text-only for uploads?",
    a: "PDF and DOCX are parsed in-browser on the web client using pdfjs-dist and mammoth. Bundling those into the React Native runtime requires expo prebuild, which would break Expo Go. Plain text uploads go through the same /upload endpoint as the web app.",
  },
  {
    q: "Will my web documents show up on mobile?",
    a: "Yes — DocuThinker mobile signs in against the same Firebase Auth pool the web client uses. Every document, summary, and chat history is shared.",
  },
  {
    q: "How do I change my email or password?",
    a: "Open Profile → Account details. The mobile app uses the same /update-email and /update-password endpoints as the web app. After updating you'll be signed out so you can re-authenticate with the new credentials.",
  },
  {
    q: "Where is my data stored?",
    a: "Documents and summaries live in Firestore. Auth lives in Firebase Auth. The backend is hosted on Vercel. Privacy & security shows the exact backend URL and your current session details.",
  },
  {
    q: "Why doesn't pull-to-refresh do anything?",
    a: "Pull-to-refresh on Home, Library, and Profile fetches live counts from the backend. If nothing visibly changes, the cached values were already current.",
  },
];

export default function HelpSettingsScreen() {
  const theme = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const runtime = Constants.expoConfig?.sdkVersion ?? "51";

  return (
    <Screen header={<ScreenHeader title="Help & support" showBack />}>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Frequently asked</AppText>
          <AppText variant="muted">
            Tap a question to see the answer.
          </AppText>
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {FAQS.map((item, index) => {
          const isOpen = open === index;
          return (
            <Pressable
              key={item.q}
              onPress={() => setOpen(isOpen ? null : index)}
              style={({ pressed }) => ({
                borderRadius: radius.md,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: pressed || isOpen ? theme.brand : theme.border,
                padding: spacing.md,
                gap: spacing.sm,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: fontSize.md,
                    fontWeight: "700",
                    color: theme.text,
                  }}
                >
                  {item.q}
                </Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.textMuted}
                />
              </View>
              {isOpen ? (
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: theme.textMuted,
                    lineHeight: 21,
                  }}
                >
                  {item.a}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Contact us</AppText>
          <AppText variant="muted">
            We read every message. Expect a response within two business days.
          </AppText>
          <Button
            label="Email support"
            icon="mail-outline"
            onPress={() =>
              Linking.openURL(
                "mailto:support@docuthinker.app?subject=DocuThinker mobile feedback",
              )
            }
          />
          <Button
            label="Open the web app"
            icon="globe-outline"
            variant="outline"
            onPress={() => Linking.openURL("https://docuthinker.vercel.app")}
          />
          <Button
            label="View on GitHub"
            icon="logo-github"
            variant="outline"
            onPress={() =>
              Linking.openURL(
                "https://github.com/hoangsonww/DocuThinker-AI-App",
              )
            }
          />
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">App info</AppText>
          <KeyRow label="App version" value={version} />
          <KeyRow label="Expo SDK" value={String(runtime)} />
          <KeyRow label="Platform" value="iOS · Android (Expo Go)" />
        </View>
      </Card>
    </Screen>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.md }}>
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
      <Text style={{ flex: 1, fontSize: fontSize.sm, color: theme.text }}>
        {value}
      </Text>
    </View>
  );
}
