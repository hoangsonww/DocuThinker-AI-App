import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import {
  AppText,
  Avatar,
  Button,
  Card,
  IconCircle,
  IconName,
  Pill,
} from "@/components/ui";
import { fontSize, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { clearAuth, getUserId } from "@/lib/auth";

type SettingsRow = {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
};

type ProfileData = {
  email: string;
  initials: string;
  documentCount: number;
  daysSinceJoined: number;
  joinedDate: string;
};

function initialsOf(email: string): string {
  const name = email.split("@")[0] || "?";
  const parts = name
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function StatBox({
  value,
  label,
  loading,
}: {
  value: string;
  label: string;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <Card
      style={{ flex: 1, padding: spacing.md, alignItems: "center", gap: 4 }}
    >
      {loading ? (
        <Skeleton height={fontSize.xl} width="55%" />
      ) : (
        <Text
          style={{
            fontSize: fontSize.xl,
            fontWeight: "800",
            color: theme.brand,
          }}
        >
          {value}
        </Text>
      )}
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: "600",
          color: theme.textMuted,
        }}
      >
        {label}
      </Text>
    </Card>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const [data, setData] = useState<ProfileData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoaded(true);
      return;
    }
    try {
      const [email, count, days, joined] = await Promise.all([
        api.getUserEmail(userId).catch(() => ({ email: "" })),
        api.getDocumentCount(userId).catch(() => ({ documentCount: 0 })),
        api.getDaysSinceJoined(userId).catch(() => ({ days: 0 })),
        api
          .getUserJoinedDate(userId)
          .catch(() => ({ joinedDate: new Date().toISOString() })),
      ]);
      const userEmail = email.email || "";
      setData({
        email: userEmail,
        initials: initialsOf(userEmail || "?"),
        documentCount: count.documentCount ?? 0,
        daysSinceJoined: days.days ?? 0,
        joinedDate: joined.joinedDate
          ? new Date(joined.joinedDate).toLocaleDateString()
          : "",
      });
    } catch (e) {
      console.warn("profile load failed", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleSignOut() {
    await clearAuth();
    router.replace("/login");
  }

  const settings: SettingsRow[] = [
    {
      icon: "person-outline",
      label: "Account details",
      hint: "Email, password and sign out",
      onPress: () => router.push("/settings/account"),
    },
    {
      icon: "color-palette-outline",
      label: "Appearance",
      hint: "Theme and text size",
      onPress: () => router.push("/settings/appearance"),
    },
    {
      icon: "link-outline",
      label: "Connections",
      hint: "GitHub, LinkedIn and other profile links",
      onPress: () => router.push("/settings/connections"),
    },
    {
      icon: "shield-checkmark-outline",
      label: "Privacy & security",
      hint: "Session info and data controls",
      onPress: () => router.push("/settings/privacy"),
    },
    {
      icon: "help-circle-outline",
      label: "Help & support",
      hint: "FAQ, contact and app info",
      onPress: () => router.push("/settings/help"),
    },
  ];

  return (
    <Screen
      header={<ScreenHeader title="Profile" />}
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ),
      }}
    >
      <Card>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Avatar initials={data?.initials ?? "?"} size={76} />
          {loaded ? (
            <>
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "800",
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {data?.email ? data.email.split("@")[0] : "Welcome"}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {data?.email || "Sign in to see your profile."}
              </Text>
            </>
          ) : (
            <View
              style={{ alignItems: "center", gap: spacing.sm, width: "100%" }}
            >
              <Skeleton height={fontSize.xl} width="50%" />
              <Skeleton height={fontSize.sm} width="75%" />
            </View>
          )}
          <Pill label="Pro member" tone="brand" align="center" />
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatBox
          value={String(data?.documentCount ?? 0)}
          label="Documents"
          loading={!loaded}
        />
        <StatBox
          value={String(data?.daysSinceJoined ?? 0)}
          label="Days active"
          loading={!loaded}
        />
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {settings.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
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
        onPress={handleSignOut}
      />

      <AppText
        variant="caption"
        color={theme.textMuted}
        style={{ textAlign: "center" }}
      >
        DocuThinker for Mobile · v1.0.0
        {data?.joinedDate ? ` · Joined ${data.joinedDate}` : ""}
      </AppText>
    </Screen>
  );
}
