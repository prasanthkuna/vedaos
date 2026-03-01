import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "./theme";

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/journey", label: "Journey" },
  { href: "/weekly", label: "Week" },
  { href: "/remedies", label: "Remedies" },
  { href: "/profile", label: "Profile" },
] as const;

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Pressable key={tab.href} onPress={() => router.replace(tab.href)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.panel,
    padding: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: theme.colors.panelSoft,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  text: {
    color: theme.colors.textMuted,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
  },
  textActive: {
    color: theme.colors.text,
  },
});
