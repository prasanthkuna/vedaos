import { Text, View, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VEDA OS</Text>
      <Text style={styles.subtitle}>Frontend scaffold is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f1a",
    paddingHorizontal: 24,
  },
  title: {
    color: "#f4f5f7",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#d2d6de",
    marginTop: 10,
    fontSize: 16,
  },
});
