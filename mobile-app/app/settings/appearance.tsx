import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { AppText, Card, ChoiceGroup } from "@/components/ui";
import { fontSize, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import {
  getPrefs,
  onPrefsChange,
  setPrefs,
  ThemeChoice,
  TextScale,
} from "@/lib/prefs";

const THEMES: { value: ThemeChoice; label: string; hint?: string }[] = [
  { value: "system", label: "System", hint: "Match the device setting" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SCALES: { value: TextScale; label: string; hint?: string }[] = [
  { value: "small", label: "Compact", hint: "Fit more on screen" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large", hint: "Bigger headings and body text" },
  { value: "xlarge", label: "Extra large", hint: "Maximum readability" },
];

export default function AppearanceSettingsScreen() {
  const theme = useTheme();
  const [prefs, setPrefsState] = useState(() => getPrefs());

  useEffect(() => onPrefsChange((p) => setPrefsState(p)), []);

  async function applyTheme(choice: ThemeChoice) {
    await setPrefs({ theme: choice });
    // Persist the actual resolved light/dark to the backend so the web app
    // picks it up when this user signs in there. `system` stays local-only.
    const userId = getUserId();
    if (!userId || choice === "system") return;
    api.updateTheme(userId, choice).catch(() => undefined);
  }

  return (
    <Screen header={<ScreenHeader title="Appearance" showBack />}>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Theme</AppText>
          <AppText variant="muted">
            Choose how DocuThinker looks on this device.
          </AppText>
        </View>
      </Card>
      <ChoiceGroup
        options={THEMES}
        value={prefs.theme}
        onChange={(v) => setPrefs({ theme: v })}
      />

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">Text size</AppText>
          <AppText variant="muted">
            Live preview - every screen scales with the choice you pick.
          </AppText>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "700",
              color: theme.text,
              marginTop: spacing.sm,
            }}
          >
            The quick brown fox jumps over the lazy dog.
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: theme.textMuted }}>
            Body text scales together with headings.
          </Text>
        </View>
      </Card>
      <ChoiceGroup
        options={SCALES}
        value={prefs.textScale}
        onChange={(v) => setPrefs({ textScale: v })}
      />
    </Screen>
  );
}
