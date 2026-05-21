import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { AppText, Avatar, Card, IconCircle, Logo } from "@/components/ui";
import { homeFeatures } from "@/constants/sampleData";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api, DocumentSummary } from "@/lib/api";
import { getUserId } from "@/lib/auth";

type Stats = {
  email: string;
  initials: string;
  documentCount: number;
  daysSinceJoined: number;
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

function HomeHeader({ initials }: { initials: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <Logo size={32} />
      <Pressable onPress={() => router.push("/profile")} hitSlop={8}>
        <Avatar initials={initials} size={40} />
      </Pressable>
    </View>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2 }}>
      <Text
        style={{ fontSize: fontSize.xl, fontWeight: "800", color: theme.text }}
      >
        {value}
      </Text>
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

export default function HomeScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const [email, count, days, list] = await Promise.all([
        api.getUserEmail(userId).catch(() => ({ email: "" })),
        api.getDocumentCount(userId).catch(() => ({ documentCount: 0 })),
        api.getDaysSinceJoined(userId).catch(() => ({ days: 0 })),
        api.getDocuments(userId).catch(() => [] as DocumentSummary[]),
      ]);
      setStats({
        email: email.email || "",
        initials: initialsOf(email.email || "?"),
        documentCount: count.documentCount ?? 0,
        daysSinceJoined: days.days ?? 0,
      });
      setDocs(Array.isArray(list) ? list : []);
    } catch (e) {
      // Network/transient error — keep prior state, surface nothing aggressive.
      console.warn("home load failed", e);
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

  const initials = stats?.initials ?? "?";
  const docCount = stats?.documentCount ?? 0;
  const daysActive = stats?.daysSinceJoined ?? 0;

  return (
    <Screen
      header={<HomeHeader initials={initials} />}
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ),
      }}
    >
      <View
        style={{
          backgroundColor: theme.brand,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            backgroundColor: "rgba(255,255,255,0.22)",
            paddingHorizontal: spacing.md,
            paddingVertical: 5,
            borderRadius: radius.pill,
          }}
        >
          <Ionicons name="sparkles" size={13} color={theme.onBrand} />
          <Text
            style={{
              color: theme.onBrand,
              fontSize: fontSize.xs,
              fontWeight: "800",
            }}
          >
            AI POWERED
          </Text>
        </View>
        <Text
          style={{
            color: theme.onBrand,
            fontSize: fontSize.xxl,
            fontWeight: "800",
            letterSpacing: -0.6,
            lineHeight: 33,
          }}
        >
          Understand any document in seconds
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: fontSize.md,
            lineHeight: 21,
          }}
        >
          Upload a file and get an instant summary, key ideas, and discussion
          points.
        </Text>
        <Pressable
          onPress={() => router.push("/upload")}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            backgroundColor: theme.onBrand,
            height: 50,
            borderRadius: radius.md,
            marginTop: spacing.xs,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Ionicons name="cloud-upload-outline" size={19} color={theme.brand} />
          <Text
            style={{
              color: theme.brandDark,
              fontSize: fontSize.md,
              fontWeight: "800",
            }}
          >
            Analyze a Document
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatChip value={String(docCount)} label="Documents" />
        <StatChip value={String(daysActive)} label="Days active" />
        <StatChip value="∞" label="Insights" />
      </View>

      <View style={{ gap: spacing.md }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: "800",
            color: theme.text,
          }}
        >
          What you can do
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: spacing.md,
          }}
        >
          {homeFeatures.map((feature) => (
            <View key={feature.title} style={{ width: "48%" }}>
              <Card style={{ flex: 1, gap: spacing.sm }}>
                <IconCircle name={feature.icon} />
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "800",
                    color: theme.text,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: theme.textMuted,
                    lineHeight: 19,
                  }}
                >
                  {feature.text}
                </Text>
              </Card>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "800",
              color: theme.text,
            }}
          >
            Recent documents
          </Text>
          <Pressable onPress={() => router.push("/documents")} hitSlop={8}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "700",
                color: theme.brand,
              }}
            >
              See all
            </Text>
          </Pressable>
        </View>
        {docs.length === 0 ? (
          <Card>
            <View
              style={{
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: spacing.lg,
              }}
            >
              <Ionicons
                name="file-tray-outline"
                size={36}
                color={theme.textMuted}
              />
              <AppText variant="muted">
                No documents yet. Upload one to get started.
              </AppText>
            </View>
          </Card>
        ) : (
          docs.slice(0, 3).map((doc) => (
            <Card
              key={doc.id}
              onPress={() =>
                router.push({
                  pathname: "/summary",
                  params: { docId: doc.id, title: doc.title },
                })
              }
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <IconCircle name="document-text-outline" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: fontSize.md,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    {doc.title}
                  </Text>
                  {doc.summary ? (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: fontSize.xs, color: theme.textMuted }}
                    >
                      {doc.summary}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.textMuted}
                />
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
