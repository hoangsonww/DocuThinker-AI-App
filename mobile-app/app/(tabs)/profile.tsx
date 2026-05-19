import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import {
  AppText,
  Avatar,
  Button,
  Card,
  IconCircle,
  IconName,
  Pill,
} from "@/components/ui";
import { sampleUser } from "@/constants/sampleData";
import { fontSize, spacing, useTheme } from "@/constants/theme";

const SETTINGS: { icon: IconName; label: string; hint: string }[] = [
  {
    icon: "person-outline",
    label: "Account details",
    hint: "Name, email and password",
  },
  {
    icon: "color-palette-outline",
    label: "Appearance",
    hint: "Theme and text size",
  },
  {
    icon: "notifications-outline",
    label: "Notifications",
    hint: "Email and push alerts",
  },
  {
    icon: "shield-checkmark-outline",
    label: "Privacy & security",
    hint: "Data, sessions and permissions",
  },
  {
    icon: "help-circle-outline",
    label: "Help & support",
    hint: "FAQ, guides and contact",
  },
];

function StatBox({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, alignItems: "center", gap: 2 }}>
      <Text
        style={{ fontSize: fontSize.xl, fontWeight: "800", color: theme.brand }}
      >
        {value}
      </Text>
      <Text
        style={{ fontSize: fontSize.xs, fontWeight: "600", color: theme.textMuted }}
      >
        {label}
      </Text>
    </Card>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <Screen header={<ScreenHeader title="Profile" />}>
      <Card>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Avatar initials={sampleUser.initials} size={76} />
          <Text
            style={{
              fontSize: fontSize.xl,
              fontWeight: "800",
              color: theme.text,
            }}
          >
            {sampleUser.name}
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: theme.textMuted }}>
            {sampleUser.email}
          </Text>
          <Pill label={`${sampleUser.plan} member`} tone="brand" />
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatBox
          value={String(sampleUser.documentsAnalyzed)}
          label="Documents"
        />
        <StatBox value={sampleUser.wordsProcessed} label="Words" />
        <StatBox
          value={String(sampleUser.joinedDaysAgo)}
          label="Days active"
        />
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {SETTINGS.map((item, index) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              padding: spacing.md,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.border,
              backgroundColor: pressed ? theme.surfaceAlt : "transparent",
            })}
          >
            <IconCircle name={item.icon} size={40} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: theme.text,
                }}
              >
                {item.label}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                {item.hint}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textMuted}
            />
          </Pressable>
        ))}
      </Card>

      <Button
        label="Sign out"
        variant="outline"
        icon="log-out-outline"
        onPress={() => router.push("/login")}
      />

      <AppText
        variant="caption"
        color={theme.textMuted}
        style={{ textAlign: "center" }}
      >
        DocuThinker for Mobile · v1.0.0
      </AppText>
    </Screen>
  );
}
