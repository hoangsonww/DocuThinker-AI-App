import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Button, Card, IconCircle, IconName } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

const OPTIONS: { id: string; icon: IconName; label: string; hint: string }[] = [
  {
    id: "summary",
    icon: "document-text-outline",
    label: "Smart summary",
    hint: "A clear, concise overview",
  },
  {
    id: "ideas",
    icon: "bulb-outline",
    label: "Key ideas",
    hint: "The points that matter most",
  },
  {
    id: "discussion",
    icon: "people-outline",
    label: "Discussion points",
    hint: "Prompts for your next meeting",
  },
];

export default function UploadScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [selected, setSelected] = useState<string[]>([
    "summary",
    "ideas",
    "discussion",
  ]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
                {file.size} · ready to analyze
              </Text>
            </View>
            <Pressable onPress={() => setFile(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={24} color={theme.textMuted} />
            </Pressable>
          </View>
        </Card>
      ) : (
        <Pressable
          onPress={() =>
            setFile({ name: "Q3-Market-Research.pdf", size: "2.4 MB" })
          }
        >
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
              Choose a document
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: theme.textMuted,
                textAlign: "center",
              }}
            >
              Tap to browse — PDF, DOCX or TXT, up to 25 MB
            </Text>
          </View>
        </Pressable>
      )}

      <AppText variant="subtitle">What should we generate?</AppText>

      {OPTIONS.map((option) => {
        const on = selected.includes(option.id);
        return (
          <Card
            key={option.id}
            onPress={() => toggle(option.id)}
            style={{ borderColor: on ? theme.brand : theme.border }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <IconCircle name={option.icon} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "700",
                    color: theme.text,
                  }}
                >
                  {option.label}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                  {option.hint}
                </Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? theme.brand : "transparent",
                  borderWidth: on ? 0 : 2,
                  borderColor: theme.border,
                }}
              >
                {on && (
                  <Ionicons name="checkmark" size={16} color={theme.onBrand} />
                )}
              </View>
            </View>
          </Card>
        );
      })}

      <Button
        label="Analyze Document"
        icon="sparkles"
        disabled={!file || selected.length === 0}
        onPress={() => router.push("/summary")}
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
