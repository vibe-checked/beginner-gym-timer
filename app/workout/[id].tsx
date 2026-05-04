import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExerciseRow } from "@/src/components/ExerciseRow";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Exercise, Workout } from "@/src/models/types";
import { requestNotificationPermissions } from "@/src/notifications/notificationManager";
import { getWorkouts, setActiveSession, updateWorkout } from "@/src/storage/workoutStore";
import { createId } from "@/src/utils/ids";
import { totalSets } from "@/src/utils/time";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;
  const [workout, setWorkout] = useState<Workout | undefined>();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | undefined>();
  const [setsInput, setSetsInput] = useState("");
  const [restInput, setRestInput] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [notice, setNotice] = useState("");

  const selectedExercise = useMemo(() => {
    if (workout === undefined || selectedExerciseIndex === undefined) {
      return undefined;
    }

    return workout.exercises[selectedExerciseIndex];
  }, [selectedExerciseIndex, workout]);

  const loadWorkout = useCallback(async () => {
    const workouts = await getWorkouts();
    setWorkout(workouts.find((candidate) => candidate.id === workoutId));
  }, [workoutId]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkout();
    }, [loadWorkout]),
  );

  function openExerciseEditor(exercise: Exercise, index: number) {
    setSelectedExerciseIndex(index);
    setSetsInput(String(exercise.sets));
    setRestInput(String(exercise.restSeconds));
    setValidationMessage("");
  }

  async function saveExerciseEdits() {
    if (!workout || selectedExerciseIndex === undefined) {
      return;
    }

    const nextSets = Number(setsInput);
    const nextRestSeconds = Number(restInput);

    if (!Number.isInteger(nextSets) || nextSets < 1 || nextSets > 10) {
      setValidationMessage("Sets must be a whole number from 1 to 10.");
      return;
    }

    if (!Number.isInteger(nextRestSeconds) || nextRestSeconds < 15 || nextRestSeconds > 600) {
      setValidationMessage("Rest must be a whole number from 15 to 600 seconds.");
      return;
    }

    const nextWorkout: Workout = {
      ...workout,
      updatedAt: new Date().toISOString(),
      exercises: workout.exercises.map((exercise, index) =>
        index === selectedExerciseIndex
          ? {
              ...exercise,
              sets: nextSets,
              restSeconds: nextRestSeconds,
            }
          : exercise,
      ),
    };

    await updateWorkout(nextWorkout);
    setWorkout(nextWorkout);
    setSelectedExerciseIndex(undefined);
  }

  async function startWorkout() {
    if (!workout) {
      return;
    }

    const nowIso = new Date().toISOString();
    await setActiveSession({
      id: createId("session"),
      workoutId: workout.id,
      workoutSnapshot: JSON.parse(JSON.stringify(workout)) as Workout,
      phase: "performingSet",
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      startedAt: nowIso,
      updatedAt: nowIso,
    });

    const notificationsGranted = await requestNotificationPermissions().catch(() => false);
    if (!notificationsGranted) {
      setNotice("Notifications are off. Rest alerts will not appear when the app is locked.");
    }

    router.replace("/session");
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Workout not found</Text>
          <PrimaryButton title="Back to Home" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.meta}>
            {workout.exercises.length} exercises - {totalSets(workout.exercises)} sets
          </Text>
        </View>

        <View style={styles.exerciseList}>
          {workout.exercises.map((exercise, index) => (
            <ExerciseRow
              exercise={exercise}
              key={exercise.id}
              onPress={() => openExerciseEditor(exercise, index)}
            />
          ))}
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.footer}>
          <PrimaryButton title="Start Workout" onPress={startWorkout} />
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedExerciseIndex(undefined)}
        transparent
        visible={Boolean(selectedExercise)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
            <Text style={styles.inputLabel}>Sets</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setSetsInput}
              style={styles.input}
              value={setsInput}
            />
            <Text style={styles.inputLabel}>Rest seconds</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setRestInput}
              style={styles.input}
              value={restInput}
            />
            {validationMessage ? (
              <Text style={styles.validation}>{validationMessage}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <PrimaryButton title="Save" onPress={saveExerciseEdits} />
              <PrimaryButton
                title="Cancel"
                onPress={() => setSelectedExerciseIndex(undefined)}
                variant="ghost"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#101318",
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 42,
  },
  meta: {
    color: "#A8B3C1",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  exerciseList: {
    gap: 12,
  },
  notice: {
    color: "#FEC84B",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 18,
  },
  footer: {
    marginTop: 24,
  },
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: "#151A21",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 10,
    padding: 20,
    paddingBottom: 34,
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },
  inputLabel: {
    color: "#A8B3C1",
    fontSize: 15,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    color: "#111318",
    fontSize: 22,
    fontWeight: "800",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  validation: {
    color: "#FDA29B",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  modalActions: {
    gap: 10,
    marginTop: 12,
  },
});
