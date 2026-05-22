import { router } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components/Screen";
import { AppText, Button, IconCircle } from "@/components/ui";
import { spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xxl,
          gap: spacing.lg,
        }}
      >
        <IconCircle name="compass-outline" size={92} />
        <AppText variant="display">404</AppText>
        <AppText variant="muted" style={{ textAlign: "center" }}>
          We couldn&apos;t find that page. It may have been moved or removed.
        </AppText>
        <View style={{ alignSelf: "stretch", marginTop: spacing.sm }}>
          <Button
            label="Back to Home"
            icon="home-outline"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </Screen>
  );
}
