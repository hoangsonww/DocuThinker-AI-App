import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { AppText, Button, Card, TextField } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api, DocumentSummary } from "@/lib/api";
import { getUserId } from "@/lib/auth";

const PAGE_SIZE = 5;

export default function DocumentsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  // Reset to page 1 whenever the search filter changes.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function confirmDelete(doc: DocumentSummary) {
    Alert.alert(
      "Delete this document?",
      `"${doc.title}" will be removed from both web and mobile. You can't undo this.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(doc),
        },
      ],
    );
  }

  async function handleDelete(doc: DocumentSummary) {
    const userId = getUserId();
    if (!userId) return;
    setBusyId(doc.id);
    try {
      await api.deleteDocument(userId, doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      Alert.alert(
        "Delete failed",
        e instanceof Error ? e.message : "Try again in a moment.",
      );
    } finally {
      setBusyId(null);
    }
  }

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
      ) : loading ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <View style={{ gap: spacing.sm }}>
                <Skeleton height={18} width="65%" />
                <Skeleton height={12} width="100%" />
                <Skeleton height={12} width="80%" />
              </View>
            </Card>
          ))}
        </>
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
        <>
          {pageItems.map((doc) => (
            <Card
              key={doc.id}
              onPress={() =>
                router.push({
                  pathname: "/summary",
                  params: { docId: doc.id, title: doc.title },
                })
              }
            >
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1, gap: spacing.sm }}>
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
                <Pressable
                  onPress={() => confirmDelete(doc)}
                  hitSlop={8}
                  disabled={busyId === doc.id}
                  style={{
                    paddingHorizontal: 4,
                    opacity: busyId === doc.id ? 0.4 : 1,
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>
            </Card>
          ))}

          {totalPages > 1 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
                paddingTop: spacing.sm,
              }}
            >
              <PagerButton
                icon="chevron-back"
                disabled={safePage <= 1}
                onPress={() => setPage(safePage - 1)}
              />
              <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: "700" }}>
                Page {safePage} of {totalPages}
                <Text style={{ color: theme.textMuted, fontWeight: "500" }}>
                  {"  ·  "}
                  {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </Text>
              </Text>
              <PagerButton
                icon="chevron-forward"
                disabled={safePage >= totalPages}
                onPress={() => setPage(safePage + 1)}
              />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function PagerButton({
  icon,
  onPress,
  disabled,
}: {
  icon: "chevron-back" | "chevron-forward";
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.text} />
    </Pressable>
  );
}
