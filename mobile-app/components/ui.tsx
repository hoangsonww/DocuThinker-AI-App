import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { elevation, fontSize, radius, spacing, useTheme } from "@/constants/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/* ---------------------------------------------------------------- Logo -- */

export function Logo({
  size = 34,
  showText = true,
}: {
  size?: number;
  showText?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: theme.brand,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="document-text"
          size={size * 0.56}
          color={theme.onBrand}
        />
      </View>
      {showText && (
        <Text
          style={{
            fontSize: size * 0.55,
            fontWeight: "800",
            color: theme.text,
            letterSpacing: -0.5,
          }}
        >
          Docu<Text style={{ color: theme.brand }}>Thinker</Text>
        </Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------- Button -- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const theme = useTheme();
  const isInactive = disabled || loading;

  const bg: Record<ButtonVariant, string> = {
    primary: theme.brand,
    secondary: theme.surfaceAlt,
    outline: "transparent",
    ghost: "transparent",
  };
  const fg: Record<ButtonVariant, string> = {
    primary: theme.onBrand,
    secondary: theme.text,
    outline: theme.text,
    ghost: theme.brand,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        height: 52,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        alignSelf: full ? "stretch" : "flex-start",
        backgroundColor: bg[variant],
        borderWidth: variant === "outline" ? 1.5 : 0,
        borderColor: theme.border,
        opacity: isInactive ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={19} color={fg[variant]} />}
          <Text
            style={{ color: fg[variant], fontSize: fontSize.md, fontWeight: "700" }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Card -- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.lg,
    ...elevation(theme, 1),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/* ------------------------------------------------------------ TextField -- */

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = "none",
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: IconName;
  secureTextEntry?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: theme.textMuted,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          height: 52,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: focused ? theme.brand : theme.border,
        }}
      >
        {icon && <Ionicons name={icon} size={19} color={theme.textMuted} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: fontSize.md, color: theme.text }}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={19}
              color={theme.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------------- Pill -- */

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "brand" | "success";
}) {
  const theme = useTheme();
  const colors = {
    neutral: { bg: theme.surfaceAlt, fg: theme.textMuted },
    brand: { bg: theme.brandSoft, fg: theme.brandDark },
    success: { bg: theme.brandSoft, fg: theme.success },
  }[tone];

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.pill,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: fontSize.xs, fontWeight: "700", color: colors.fg }}>
        {label}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------- Avatar -- */

export function Avatar({
  initials,
  size = 48,
}: {
  initials: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.brand,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: theme.onBrand,
          fontWeight: "800",
          fontSize: size * 0.38,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------- IconCircle -- */

export function IconCircle({
  name,
  size = 44,
  color,
  background,
}: {
  name: IconName;
  size?: number;
  color?: string;
  background?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: background ?? theme.brandSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={color ?? theme.brand} />
    </View>
  );
}

/* --------------------------------------------------------- SectionTitle -- */

export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontSize: fontSize.lg, fontWeight: "800", color: theme.text }}>
        {title}
      </Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text
            style={{ fontSize: fontSize.sm, fontWeight: "700", color: theme.brand }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* -------------------------------------------------------------- Divider -- */

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.border }} />;
}

/* -------------------------------------------------------------- AppText -- */

export function AppText({
  children,
  variant = "body",
  color,
  style,
}: {
  children: ReactNode;
  variant?: "display" | "title" | "subtitle" | "body" | "muted" | "caption";
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const variants: Record<string, TextStyle> = {
    display: { fontSize: fontSize.display, fontWeight: "800", letterSpacing: -1 },
    title: { fontSize: fontSize.xxl, fontWeight: "800", letterSpacing: -0.6 },
    subtitle: { fontSize: fontSize.lg, fontWeight: "700" },
    body: { fontSize: fontSize.md, fontWeight: "400", lineHeight: 22 },
    muted: { fontSize: fontSize.sm, fontWeight: "500" },
    caption: { fontSize: fontSize.xs, fontWeight: "600" },
  };
  const fallback =
    variant === "muted" || variant === "caption" ? theme.textMuted : theme.text;
  return (
    <Text style={[variants[variant], { color: color ?? fallback }, style]}>
      {children}
    </Text>
  );
}
