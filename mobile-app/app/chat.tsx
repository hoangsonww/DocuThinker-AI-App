import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/Screen";
import { ChatMessage, sampleChat } from "@/constants/sampleData";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

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
        <Text
          style={{
            fontSize: fontSize.md,
            lineHeight: 22,
            color: isUser ? theme.onBrand : theme.text,
          }}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(sampleChat);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: "user", text },
    ]);
    setDraft("");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <ScreenHeader
        title="Document chat"
        subtitle="Q3 Market Research Report"
        showBack
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
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
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-up" size={22} color={theme.onBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
