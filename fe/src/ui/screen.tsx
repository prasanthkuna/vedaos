import type { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "./theme";

export const Screen = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <SafeAreaView style={styles.page}>
    <View style={styles.glowA} />
    <View style={styles.glowB} />
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  glowA: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: "#2D1E18",
    opacity: 0.55,
  },
  glowB: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 200,
    backgroundColor: "#172233",
    opacity: 0.38,
  },
  scroll: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: "#19151B",
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.font.display,
    fontSize: theme.type.hero,
    lineHeight: 40,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontFamily: theme.font.body,
    lineHeight: 20,
  },
});
