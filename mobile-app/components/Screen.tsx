import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ComponentProps, ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontSize, radius, spacing, useTheme } from "@/constants/theme";

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  right,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.surfaceAlt,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        {title && (
          <Text
            style={{
              fontSize: fontSize.xl,
              fontWeight: "800",
              color: theme.text,
              letterSpacing: -0.5,
            }}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  header,
  scrollProps,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  scrollProps?: Partial<ComponentProps<typeof ScrollView>>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: header ? spacing.xs : spacing.xl,
            paddingBottom: insets.bottom + 96,
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}
