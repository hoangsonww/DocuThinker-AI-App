import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Card, IconName, Pill, TextField } from "@/components/ui";
import { sampleDocuments } from "@/constants/sampleData";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

const FILTERS = ["All", "Business", "Research", "Finance", "HR", "Engineering"];

function Meta({ icon, text }: { icon: IconName; text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Ionicons name={icon} size={14} color={theme.textMuted} />
      <Text
        style={{ fontSize: fontSize.xs, color: theme.textMuted, fontWeight: "600" }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const docs = useMemo(
    () =>
      sampleDocuments.filter((doc) => {
        const okFilter = filter === "All" || doc.category === filter;
        const okQuery = doc.title
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return okFilter && okQuery;
      }),
    [query, filter],
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title="Library"
          subtitle={`${sampleDocuments.length} documents analyzed`}
        />
      }
    >
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search your documents"
        icon="search-outline"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
      >
        {FILTERS.map((item) => {
          const active = item === filter;
          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
                backgroundColor: active ? theme.brand : theme.surface,
                borderWidth: 1,
                borderColor: active ? theme.brand : theme.border,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color: active ? theme.onBrand : theme.textMuted,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {docs.length === 0 ? (
        <Card>
          <View
            style={{
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: spacing.xl,
            }}
          >
            <Ionicons
              name="file-tray-outline"
              size={40}
              color={theme.textMuted}
            />
            <AppText variant="muted">No documents match your search.</AppText>
          </View>
        </Card>
      ) : (
        docs.map((doc) => (
          <Card key={doc.id} onPress={() => router.push("/summary")}>
            <View style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Pill label={doc.category} tone="brand" />
                <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                  {doc.date}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: "800",
                  color: theme.text,
                }}
              >
                {doc.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: fontSize.sm,
                  color: theme.textMuted,
                  lineHeight: 20,
                }}
              >
                {doc.summary}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.lg,
                  marginTop: 2,
                }}
              >
                <Meta icon="document-outline" text={`${doc.pages} pages`} />
                <Meta
                  icon="text-outline"
                  text={`${(doc.words / 1000).toFixed(1)}k words`}
                />
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
