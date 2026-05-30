import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { MarkdownText } from "@/components/MarkdownText";
import { Screen, ScreenHeader } from "@/components/Screen";
import { Button, Card, IconCircle, Pill } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

const TABS = ["Summary", "Original"] as const;
type Tab = (typeof TABS)[number];

type ParamShape = {
  docId?: string;
  title?: string;
  summary?: string;
  originalText?: string;
};

export default function SummaryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams() as ParamShape;
  const [tab, setTab] = useState<Tab>("Summary");

  const [title, setTitle] = useState<string>(params.title || "Document");
  const [summary, setSummary] = useState<string>(params.summary || "");
  const [originalText, setOriginalText] = useState<string>(
    params.originalText || "",
  );
  const [loading, setLoading] = useState<boolean>(
    !params.summary && !!params.docId,
  );
  const [error, setError] = useState<string | null>(null);

  const [keyIdeas, setKeyIdeas] = useState<string>("");
  const [discussion, setDiscussion] = useState<string>("");
  const [busyIdeas, setBusyIdeas] = useState(false);
  const [busyDiscussion, setBusyDiscussion] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [discussionError, setDiscussionError] = useState<string | null>(null);

  useEffect(() => {
    if (params.summary || !params.docId) return;
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    api
      .getDocumentDetails(userId, params.docId)
      .then((doc) => {
        setTitle(doc.title || params.title || "Document");
        setSummary(doc.summary || "");
        setOriginalText(doc.originalText || "");
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load document."),
      )
      .finally(() => setLoading(false));
  }, [params.docId, params.summary, params.title]);

  const wordCount = originalText
    ? originalText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const readingTime = wordCount
    ? `${Math.max(1, Math.round(wordCount / 200))} min read`
    : null;

  async function handleGenerateKeyIdeas() {
    if (!originalText) return;
    setIdeasError(null);
    setBusyIdeas(true);
    try {
      const result = await api.generateKeyIdeas(originalText);
      setKeyIdeas(result.keyIdeas || "");
    } catch (e) {
      setIdeasError(
        e instanceof Error ? e.message : "Couldn't generate key ideas.",
      );
    } finally {
      setBusyIdeas(false);
    }
  }

  async function handleGenerateDiscussion() {
    if (!originalText) return;
    setDiscussionError(null);
    setBusyDiscussion(true);
    try {
      const result = await api.generateDiscussionPoints(originalText);
      setDiscussion(result.discussionPoints || "");
    } catch (e) {
      setDiscussionError(
        e instanceof Error ? e.message : "Couldn't generate discussion points.",
      );
    } finally {
      setBusyDiscussion(false);
    }
  }

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
                {title}
              </Text>
              {readingTime ? (
                <Text style={{ fontSize: fontSize.xs, color: theme.textMuted }}>
                  {readingTime}
                </Text>
              ) : null}
            </View>
          </View>
          <Button
            label="Chat about this document"
            icon="chatbubbles-outline"
            variant="secondary"
            disabled={!originalText}
            onPress={() =>
              router.push({
                pathname: "/chat",
                params: { title, originalText },
              })
            }
          />
          <Button
            label={
              busyIdeas
                ? "Generating…"
                : keyIdeas
                  ? "Refresh key ideas"
                  : "Generate key ideas"
            }
            icon="bulb-outline"
            variant="outline"
            disabled={!originalText || busyIdeas}
            loading={busyIdeas}
            onPress={handleGenerateKeyIdeas}
          />
          <Button
            label={
              busyDiscussion
                ? "Generating…"
                : discussion
                  ? "Refresh discussion points"
                  : "Generate discussion points"
            }
            icon="people-outline"
            variant="outline"
            disabled={!originalText || busyDiscussion}
            loading={busyDiscussion}
            onPress={handleGenerateDiscussion}
          />
        </View>
      </Card>

      {keyIdeas || ideasError ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Pill label="KEY IDEAS" tone="brand" />
            {ideasError ? (
              <Text style={{ color: theme.danger, fontSize: fontSize.sm }}>
                {ideasError}
              </Text>
            ) : (
              <MarkdownText text={keyIdeas} tone="body" />
            )}
          </View>
        </Card>
      ) : null}

      {discussion || discussionError ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Pill label="DISCUSSION POINTS" tone="neutral" />
            {discussionError ? (
              <Text style={{ color: theme.danger, fontSize: fontSize.sm }}>
                {discussionError}
              </Text>
            ) : (
              <MarkdownText text={discussion} tone="body" />
            )}
          </View>
        </Card>
      ) : null}

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

      {loading ? (
        <Card>
          <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
            <ActivityIndicator color={theme.brand} />
          </View>
        </Card>
      ) : error ? (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Ionicons name="alert-circle" size={20} color={theme.danger} />
            <Text style={{ color: theme.danger, fontSize: fontSize.sm }}>
              {error}
            </Text>
          </View>
        </Card>
      ) : tab === "Summary" ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Pill label="AI SUMMARY" tone="brand" />
            {summary ? (
              <MarkdownText text={summary} tone="body" />
            ) : (
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: theme.textMuted,
                  lineHeight: 24,
                }}
              >
                No summary available for this document yet.
              </Text>
            )}
          </View>
        </Card>
      ) : (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Pill label="ORIGINAL TEXT" tone="neutral" />
            <Text
              style={{
                fontSize: fontSize.sm,
                color: theme.text,
                lineHeight: 22,
              }}
            >
              {originalText || "Original text not stored for this document."}
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}
