import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MarkdownText } from "@/components/MarkdownText";
import { ScreenHeader } from "@/components/Screen";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function Bubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === "user";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          maxWidth: "86%",
          padding: spacing.md,
          borderRadius: radius.lg,
          borderBottomRightRadius: isUser ? 6 : radius.lg,
          borderBottomLeftRadius: isUser ? radius.lg : 6,
          backgroundColor: isUser ? theme.brand : theme.surface,
          borderWidth: isUser ? 0 : 1,
          borderColor: theme.border,
        }}
      >
        {isUser ? (
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: 22,
              color: theme.onBrand,
            }}
          >
            {message.text}
          </Text>
        ) : (
          <MarkdownText text={message.text} tone="assistant" />
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    title?: string;
    originalText?: string;
  }>();
  const originalText = params.originalText || "";
  const title = params.title || "Document";

  const sessionId = useMemo(
    () => `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: originalText
        ? `Hi! I've read "${title}". Ask me anything about it.`
        : "Open a document from your library to start a chat about it.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    if (!originalText) {
      Alert.alert(
        "No document loaded",
        "Open a document first so I have something to chat about.",
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setSending(true);

    try {
      const result = await api.chat(text, originalText, sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.response || "(No response)",
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text:
            e instanceof Error
              ? `Sorry — ${e.message}`
              : "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <ScreenHeader title="Document chat" subtitle={title} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
          {sending ? (
            <View
              style={{ flexDirection: "row", justifyContent: "flex-start" }}
            >
              <View
                style={{
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <ActivityIndicator size="small" color={theme.brand} />
              </View>
            </View>
          ) : null}
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.surface,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about this document…"
            placeholderTextColor={theme.textMuted}
            onSubmitEditing={send}
            editable={!sending}
            style={{
              flex: 1,
              height: 46,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.pill,
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
              fontSize: fontSize.md,
            }}
          />
          <Pressable
            onPress={send}
            disabled={sending}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
              opacity: sending ? 0.6 : 1,
            }}
          >
            <Ionicons name="arrow-up" size={22} color={theme.onBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
