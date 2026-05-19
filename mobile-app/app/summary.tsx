import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Button, Card, IconCircle, Pill } from "@/components/ui";
import { sampleAnalysis } from "@/constants/sampleData";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

const TABS = ["Summary", "Key Ideas", "Discussion"] as const;
type Tab = (typeof TABS)[number];

export default function SummaryScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("Summary");

  return (
    <Screen header={<ScreenHeader title="Analysis" showBack />}>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <IconCircle name="document-text" size={48} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: "800",
                  color: theme.text,
                }}
              >
                {sampleAnalysis.title}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                {sampleAnalysis.readingTime}
              </Text>
            </View>
          </View>
          <Button
            label="Chat about this document"
            icon="chatbubbles-outline"
            variant="secondary"
            onPress={() => router.push("/chat")}
          />
        </View>
      </Card>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.md,
          padding: 4,
          gap: 4,
        }}
      >
        {TABS.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                alignItems: "center",
                backgroundColor: active ? theme.surface : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color: active ? theme.brand : theme.textMuted,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "Summary" && (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Pill label="AI SUMMARY" tone="brand" />
            <Text
              style={{
                fontSize: fontSize.md,
                color: theme.text,
                lineHeight: 24,
              }}
            >
              {sampleAnalysis.summary}
            </Text>
          </View>
        </Card>
      )}

      {tab === "Key Ideas" &&
        sampleAnalysis.keyIdeas.map((idea, index) => (
          <Card key={idea.title}>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.brandSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.brandDark,
                    fontWeight: "800",
                    fontSize: fontSize.sm,
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "800",
                    color: theme.text,
                  }}
                >
                  {idea.title}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: theme.textMuted,
                    lineHeight: 20,
                  }}
                >
                  {idea.detail}
                </Text>
              </View>
            </View>
          </Card>
        ))}

      {tab === "Discussion" &&
        sampleAnalysis.discussionPoints.map((point) => (
          <Card key={point}>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                alignItems: "flex-start",
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={theme.brand}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: fontSize.md,
                  color: theme.text,
                  lineHeight: 22,
                }}
              >
                {point}
              </Text>
            </View>
          </Card>
        ))}
    </Screen>
  );
}
