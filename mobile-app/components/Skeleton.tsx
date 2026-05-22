import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

import { radius, useTheme } from "@/constants/theme";

// Animated placeholder block. Pulses opacity to read as "loading…" without
// requiring a separate spinner. Composed by screens to mirror real layout
// dimensions so the page doesn't jump when data lands.

export function Skeleton({
  width,
  height,
  style,
  rounded = "sm",
}: {
  width?: number | `${number}%`;
  height: number;
  style?: ViewStyle;
  rounded?: keyof typeof radius;
}) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius[rounded],
          backgroundColor: theme.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Stacked text lines - useful where a multi-line text block is loading.
export function SkeletonLines({
  lines = 3,
  lineHeight = 12,
  gap = 8,
  lastWidth = "70%",
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastWidth?: `${number}%`;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastWidth : "100%"}
        />
      ))}
    </View>
  );
}
