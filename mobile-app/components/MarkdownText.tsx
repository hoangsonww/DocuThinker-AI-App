import { Linking } from "react-native";
import MarkdownDisplay from "react-native-markdown-display";

import { fontSize, useTheme } from "@/constants/theme";

// Mirrors how frontend/src/components/ChatModal.js + Home.js render LLM
// output: backend responses contain Markdown (lists, **bold**, _italic_,
// fenced code, links). Rendering the raw string flashed asterisks at the
// user; this component is the mobile equivalent of ReactMarkdown.

export type MarkdownTone = "user" | "assistant" | "body";

export function MarkdownText({
  text,
  tone = "body",
}: {
  text: string;
  tone?: MarkdownTone;
}) {
  const theme = useTheme();
  const base = tone === "user" ? theme.onBrand : theme.text;
  const linkColor = tone === "user" ? theme.onBrand : theme.brand;
  const codeBg = tone === "user" ? "rgba(255,255,255,0.18)" : theme.surfaceAlt;

  return (
    <MarkdownDisplay
      onLinkPress={(url) => {
        Linking.openURL(url).catch(() => undefined);
        return false;
      }}
      style={{
        body: { color: base, fontSize: fontSize.md, lineHeight: 22 },
        paragraph: {
          color: base,
          fontSize: fontSize.md,
          lineHeight: 22,
          marginTop: 0,
          marginBottom: 8,
        },
        heading1: {
          color: base,
          fontSize: 22,
          marginBottom: 6,
          fontWeight: "800",
        },
        heading2: {
          color: base,
          fontSize: 19,
          marginBottom: 6,
          fontWeight: "800",
        },
        heading3: {
          color: base,
          fontSize: 17,
          marginBottom: 6,
          fontWeight: "700",
        },
        strong: { color: base, fontWeight: "700" },
        em: { color: base, fontStyle: "italic" },
        link: { color: linkColor, textDecorationLine: "underline" },
        bullet_list: { marginTop: 2, marginBottom: 4 },
        ordered_list: { marginTop: 2, marginBottom: 4 },
        list_item: { color: base, marginVertical: 2 },
        bullet_list_icon: { color: base, fontWeight: "700" },
        ordered_list_icon: { color: base, fontWeight: "700" },
        code_inline: {
          backgroundColor: codeBg,
          color: base,
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 4,
          fontFamily: "Courier",
          fontSize: 14,
        },
        code_block: {
          backgroundColor: codeBg,
          color: base,
          padding: 10,
          borderRadius: 8,
          fontFamily: "Courier",
          fontSize: 13,
        },
        fence: {
          backgroundColor: codeBg,
          color: base,
          padding: 10,
          borderRadius: 8,
          fontFamily: "Courier",
          fontSize: 13,
        },
        blockquote: {
          backgroundColor: codeBg,
          borderLeftColor: theme.brand,
          borderLeftWidth: 3,
          paddingLeft: 10,
          paddingVertical: 6,
          marginVertical: 4,
        },
        hr: { backgroundColor: theme.border, height: 1, marginVertical: 8 },
        table: { borderColor: theme.border, borderWidth: 1, borderRadius: 6 },
        th: { padding: 6, fontWeight: "700", color: base },
        td: { padding: 6, color: base },
      }}
    >
      {text}
    </MarkdownDisplay>
  );
}
