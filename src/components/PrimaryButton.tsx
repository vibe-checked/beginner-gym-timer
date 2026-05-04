import { Pressable, StyleSheet, Text } from "react-native";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.text, variant === "ghost" && styles.lightText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  primary: {
    backgroundColor: "#E8FF5A",
  },
  secondary: {
    backgroundColor: "#F2F4F7",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "#394150",
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.76,
  },
  text: {
    color: "#111318",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  lightText: {
    color: "#F8FAFC",
  },
});
