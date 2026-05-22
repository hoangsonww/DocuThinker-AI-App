import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";

import { Screen, ScreenHeader } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { AppText, Button, Card, TextField } from "@/components/ui";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";

// Mirrors the social-media section of frontend/src/pages/Profile.js.
// Backend: GET /social-media/:userId, POST /update-social-media.

type Handles = {
  github: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  twitter: string;
};

const EMPTY: Handles = {
  github: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  twitter: "",
};

const PROVIDERS: {
  key: keyof Handles;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prefix: string;
}[] = [
  {
    key: "github",
    label: "GitHub",
    icon: "logo-github",
    prefix: "https://github.com/",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "logo-linkedin",
    prefix: "https://linkedin.com/in/",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    icon: "logo-twitter",
    prefix: "https://x.com/",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "logo-instagram",
    prefix: "https://instagram.com/",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "logo-facebook",
    prefix: "https://facebook.com/",
  },
];

export default function ConnectionsScreen() {
  const theme = useTheme();
  const [handles, setHandles] = useState<Handles>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const result = await api.getSocialMedia(userId);
      setHandles({
        github: result.socialMedia.github ?? "",
        linkedin: result.socialMedia.linkedin ?? "",
        facebook: result.socialMedia.facebook ?? "",
        instagram: result.socialMedia.instagram ?? "",
        twitter: result.socialMedia.twitter ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError("");
    setInfo("");
    const userId = getUserId();
    if (!userId) return;
    setBusy(true);
    try {
      await api.updateSocialMedia(userId, handles);
      setInfo("Profile connections updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save connections.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen header={<ScreenHeader title="Connections" showBack />}>
      <Card>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Profile links</AppText>
          <AppText variant="muted">
            Add your usernames so DocuThinker can show them on your profile -
            the same handles appear on the web app.
          </AppText>
        </View>
      </Card>

      {info ? (
        <Banner color={theme.brand} icon="checkmark-circle">
          {info}
        </Banner>
      ) : null}
      {error ? (
        <Banner color={theme.danger} icon="alert-circle">
          {error}
        </Banner>
      ) : null}

      {PROVIDERS.map((p) => {
        const value = handles[p.key];
        return (
          <Card key={p.key}>
            <View style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Ionicons name={p.icon} size={22} color={theme.text} />
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "700",
                    color: theme.text,
                  }}
                >
                  {p.label}
                </Text>
              </View>
              {loading ? (
                <Skeleton height={52} rounded="md" />
              ) : (
                <TextField
                  value={value}
                  onChangeText={(v) => setHandles({ ...handles, [p.key]: v })}
                  placeholder="username"
                  editable={!busy}
                  autoCapitalize="none"
                />
              )}
              {!loading && value ? (
                <Text
                  style={{ color: theme.textMuted, fontSize: fontSize.xs }}
                  onPress={() => Linking.openURL(`${p.prefix}${value}`)}
                >
                  {p.prefix}
                  <Text style={{ color: theme.brand, fontWeight: "700" }}>
                    {value}
                  </Text>
                </Text>
              ) : null}
            </View>
          </Card>
        );
      })}

      <Button
        label="Save connections"
        icon="save-outline"
        loading={busy}
        onPress={handleSave}
      />
    </Screen>
  );
}

function Banner({
  children,
  color,
  icon,
}: {
  children: string;
  color: string;
  icon: "checkmark-circle" | "alert-circle";
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: color,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text
        style={{
          flex: 1,
          color: theme.text,
          fontSize: fontSize.sm,
          fontWeight: "600",
        }}
      >
        {children}
      </Text>
    </View>
  );
}
