import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "./theme";

export const Card = ({ children }: { children: ReactNode }) => <View style={styles.card}>{children}</View>;

export const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, y]);
  return <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>{children}</Animated.View>;
};

export const SectionTitle = ({ children }: { children: ReactNode }) => <Text style={styles.sectionTitle}>{children}</Text>;

export const Meta = ({ children }: { children: ReactNode }) => <Text style={styles.meta}>{children}</Text>;

export const Row = ({ children }: { children: ReactNode }) => <View style={styles.row}>{children}</View>;

export const Notice = ({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "danger";
}) => <Text style={[styles.notice, tone === "success" && styles.noticeSuccess, tone === "danger" && styles.noticeDanger]}>{children}</Text>;

export const Badge = ({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "accent" | "success" | "danger";
}) => (
  <View
    style={[
      styles.badge,
      tone === "accent" && styles.badgeAccent,
      tone === "success" && styles.badgeSuccess,
      tone === "danger" && styles.badgeDanger,
    ]}
  >
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

export const Button = ({
  label,
  onPress,
  compact,
  disabled,
  tone = "primary",
  testID,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
  testID?: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityLabel={testID}
    disabled={disabled}
    onPress={onPress}
    style={[styles.button, compact && styles.buttonCompact, tone === "secondary" && styles.buttonSecondary, tone === "danger" && styles.buttonDanger, disabled && styles.buttonDisabled]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

export const Input = (props: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  half?: boolean;
  testID?: string;
}) => (
  <TextInput
    testID={props.testID}
    accessibilityLabel={props.testID}
    value={props.value}
    onChangeText={props.onChangeText}
    placeholder={props.placeholder}
    placeholderTextColor={theme.colors.textSoft}
    autoCapitalize={props.autoCapitalize}
    style={[styles.input, props.half && styles.inputHalf]}
  />
);

export const Toggle = ({
  label,
  value,
  onToggle,
  testID,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  testID?: string;
}) => (
  <Pressable testID={testID} accessibilityLabel={testID} onPress={onToggle} style={[styles.toggle, value && styles.toggleOn]}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Text style={styles.toggleValue}>{value ? "ON" : "OFF"}</Text>
  </Pressable>
);

export const ClaimCard = ({
  year,
  text,
  meta,
  children,
}: {
  year: number;
  text: string;
  meta?: string;
  children?: ReactNode;
}) => (
  <Card>
    <View style={styles.claimHeader}>
      <Text style={styles.claimYear}>{year}</Text>
      <Text style={styles.watermark}>VEDA</Text>
    </View>
    <Text style={styles.claimText}>{text}</Text>
    {meta ? <Meta>{meta}</Meta> : null}
    {children}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.panel,
    gap: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: theme.type.title,
    fontFamily: theme.font.display,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
    lineHeight: 18,
  },
  button: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "#2E2720",
  },
  buttonCompact: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  buttonSecondary: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panelSoft,
  },
  buttonDanger: {
    borderColor: theme.colors.danger,
    backgroundColor: "#402824",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#f7dfbc",
    fontSize: theme.type.meta,
    letterSpacing: 0.2,
    fontFamily: theme.font.body,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  notice: {
    color: theme.colors.accentAlt,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
    lineHeight: 18,
  },
  noticeSuccess: {
    color: theme.colors.success,
  },
  noticeDanger: {
    color: theme.colors.danger,
  },
  badge: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.panelSoft,
  },
  badgeAccent: {
    borderColor: theme.colors.accent,
    backgroundColor: "#3D3125",
  },
  badgeSuccess: {
    borderColor: theme.colors.success,
    backgroundColor: "#21372D",
  },
  badgeDanger: {
    borderColor: theme.colors.danger,
    backgroundColor: "#3A2623",
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: theme.type.micro,
    letterSpacing: 0.4,
    fontFamily: theme.font.body,
  },
  claimHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claimYear: {
    color: theme.colors.accent,
    fontSize: theme.type.title,
    fontFamily: theme.font.display,
  },
  watermark: {
    color: theme.colors.textSoft,
    fontSize: theme.type.micro,
    letterSpacing: 1.4,
    fontFamily: theme.font.body,
  },
  claimText: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: theme.font.display,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelSoft,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.type.body,
    flex: 1,
    fontFamily: theme.font.body,
  },
  inputHalf: {
    minWidth: 120,
  },
  toggle: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleOn: {
    borderColor: theme.colors.accentAlt,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: theme.type.body,
    fontFamily: theme.font.body,
  },
  toggleValue: {
    color: theme.colors.accent,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
  },
});
