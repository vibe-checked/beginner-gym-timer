import { Pressable, StyleSheet, Text, View } from "react-native";

import { Workout } from "@/src/models/types";
import { estimateWorkoutMinutes, totalSets } from "@/src/utils/time";

type WorkoutCardProps = {
  workout: Workout;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        <Text style={styles.name}>{workout.name}</Text>
        <Text style={styles.meta}>
          {workout.exercises.length} exercises - {totalSets(workout.exercises)} sets - ~
          {estimateWorkoutMinutes(workout.exercises)} min
        </Text>
      </View>
      <Text style={styles.arrow}>{">"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#191D24",
    borderColor: "#2C3440",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    minHeight: 92,
    padding: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    color: "#F8FAFC",
    fontSize: 23,
    fontWeight: "800",
  },
  meta: {
    color: "#A8B3C1",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  arrow: {
    color: "#E8FF5A",
    fontSize: 34,
    lineHeight: 34,
  },
});
