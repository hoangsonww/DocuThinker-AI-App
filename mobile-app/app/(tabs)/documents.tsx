import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Card, TextField } from "@/components/ui";
import { fontSize, spacing, useTheme } from "@/constants/theme";
import { api, DocumentSummary } from "@/lib/api";
import { getUserId } from "@/lib/auth";

export default function DocumentsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const list = await api.getDocuments(userId);
      setDocs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) => doc.title?.toLowerCase().includes(q));
  }, [docs, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Library"
          subtitle={
            loading
              ? "Loading…"
              : `${docs.length} document${docs.length === 1 ? "" : "s"} analyzed`
          }
        />
      }
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ),
      }}
    >
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search your documents"
        icon="search-outline"
      />

      {error ? (
        <Card>
          <Text style={{ color: theme.danger, fontSize: fontSize.sm }}>
            {error}
          </Text>
        </Card>
      ) : filtered.length === 0 ? (
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
            <AppText variant="muted">
              {docs.length === 0
                ? "Nothing here yet. Upload a document to get started."
                : "No documents match your search."}
            </AppText>
          </View>
        </Card>
      ) : (
        filtered.map((doc) => (
          <Card
            key={doc.id}
            onPress={() =>
              router.push({
                pathname: "/summary",
                params: { docId: doc.id, title: doc.title },
              })
            }
          >
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: "800",
                  color: theme.text,
                }}
              >
                {doc.title}
              </Text>
              {doc.summary ? (
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
              ) : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
