import { Pressable, StyleSheet, Text, View } from "react-native";

import { Exercise } from "@/src/models/types";
import { formatDuration } from "@/src/utils/time";

type ExerciseRowProps = {
  exercise: Exercise;
  onPress?: () => void;
};

export function ExerciseRow({ exercise, onPress }: ExerciseRowProps) {
  const content = (
    <>
      <View style={styles.textWrap}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.meta}>
          {exercise.sets} sets - {formatDuration(exercise.restSeconds)} rest
        </Text>
      </View>
      {onPress ? <Text style={styles.edit}>Edit</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "#191D24",
    borderColor: "#2C3440",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 78,
    padding: 16,
  },
  pressed: {
    opacity: 0.72,
  },
  textWrap: {
    flex: 1,
    paddingRight: 14,
  },
  name: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "800",
  },
  meta: {
    color: "#A8B3C1",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 7,
  },
  edit: {
    color: "#E8FF5A",
    fontSize: 16,
    fontWeight: "800",
  },
});
