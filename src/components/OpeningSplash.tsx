import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function OpeningSplash() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          accessibilityIgnoresInvertColors
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
        />
        <View style={styles.textWrap}>
          <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.title}>
            Beginner Gym Timer
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            Just pick one and follow along...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#101318",
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  icon: {
    borderRadius: 28,
    height: 124,
    marginBottom: 28,
    width: 124,
  },
  textWrap: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    color: "#E8FF5A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 22,
    textAlign: "center",
  },
});
