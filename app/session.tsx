import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { RestCountdown } from "@/src/components/RestCountdown";
import { ActiveSession } from "@/src/models/types";
import {
  cancelRestNotificationsForSession,
  dismissRestNotificationsForSession,
  requestNotificationPermissions,
  scheduleRestDoneNotification,
} from "@/src/notifications/notificationManager";
import {
  addRestTime,
  completeCurrentSet,
  finishRest,
  reconcileSessionOnAppOpen,
  skipRest,
  suspendSession,
} from "@/src/session/sessionEngine";
import { getActiveSession, setActiveSession } from "@/src/storage/workoutStore";

export default function SessionScreen() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | undefined>();
  const [loading, setLoading] = useState(true);
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);

  const ensureNotifications = useCallback(async () => {
    const granted = await requestNotificationPermissions().catch(() => false);
    setNotificationsDisabled(!granted);
    return granted;
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const savedSession = await getActiveSession();

    if (!savedSession) {
      setSession(undefined);
      setLoading(false);
      return;
    }

    if (savedSession.isSuspended) {
      setSession(savedSession);
      setLoading(false);
      router.replace("/");
      return;
    }

    const reconciledSession = reconcileSessionOnAppOpen(savedSession, new Date());
    await setActiveSession(reconciledSession);
    setSession(reconciledSession);

    if (savedSession.phase === "resting" && reconciledSession.phase === "performingSet") {
      await cancelRestNotificationsForSession(savedSession.id);
      await dismissRestNotificationsForSession(savedSession.id);
    } else if (
      !reconciledSession.isSuspended &&
      reconciledSession.phase === "resting" &&
      (await ensureNotifications())
    ) {
      await scheduleRestDoneNotification(reconciledSession);
    }

    setLoading(false);
  }, [ensureNotifications, router]);

  useFocusEffect(
    useCallback(() => {
      void loadSession();
    }, [loadSession]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void loadSession();
      }
    });

    return () => subscription.remove();
  }, [loadSession]);

  const currentExercise =
    session?.workoutSnapshot.exercises[session.currentExerciseIndex] ?? undefined;
  const nextExercise =
    session?.nextExerciseIndex !== undefined
      ? session.workoutSnapshot.exercises[session.nextExerciseIndex]
      : undefined;

  const persistSession = useCallback(async (nextSession: ActiveSession | undefined) => {
    await setActiveSession(nextSession);
    setSession(nextSession);
  }, []);

  const handleFinishSet = useCallback(async () => {
    if (!session || session.phase !== "performingSet") {
      return;
    }

    const nextSession = completeCurrentSet(session, new Date());
    await persistSession(nextSession);

    if (nextSession.phase === "resting") {
      if (await ensureNotifications()) {
        await scheduleRestDoneNotification(nextSession);
      }
    } else if (nextSession.phase === "complete") {
      await cancelRestNotificationsForSession(nextSession.id);
      await dismissRestNotificationsForSession(nextSession.id);
    }
  }, [ensureNotifications, persistSession, session]);

  const handleAddRestTime = useCallback(async () => {
    if (!session || session.phase !== "resting") {
      return;
    }

    const nextSession = addRestTime(session, 30, new Date());
    await persistSession(nextSession);

    if (await ensureNotifications()) {
      await scheduleRestDoneNotification(nextSession);
    }
  }, [ensureNotifications, persistSession, session]);

  const handleSkipRest = useCallback(async () => {
    if (!session || session.phase !== "resting") {
      return;
    }

    const nextSession = skipRest(session, new Date());
    await cancelRestNotificationsForSession(session.id);
    await dismissRestNotificationsForSession(session.id);
    await persistSession(nextSession);
  }, [persistSession, session]);

  const handleRestComplete = useCallback(async () => {
    if (!session || session.phase !== "resting") {
      return;
    }

    const nextSession = finishRest(session, new Date());
    await cancelRestNotificationsForSession(session.id);
    await dismissRestNotificationsForSession(session.id);
    await persistSession(nextSession);
  }, [persistSession, session]);

  const handleBackHome = useCallback(async () => {
    if (session) {
      await cancelRestNotificationsForSession(session.id);
      await dismissRestNotificationsForSession(session.id);
    }

    await setActiveSession(undefined);
    router.replace("/");
  }, [router, session]);

  const handleLeaveSession = useCallback(async () => {
    if (session) {
      const suspendedSession = suspendSession(session, new Date());
      await cancelRestNotificationsForSession(session.id);
      await dismissRestNotificationsForSession(session.id);
      await persistSession(suspendedSession);
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [persistSession, router, session]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.muted}>Loading workout</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !currentExercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>No active workout</Text>
          <PrimaryButton title="Back to Home" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  if (session.phase === "complete") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.kicker}>Workout complete</Text>
          <Text style={styles.title}>{session.workoutSnapshot.name} complete</Text>
          <PrimaryButton title="Back to Home" onPress={handleBackHome} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Back to home"
          accessibilityRole="button"
          onPress={handleLeaveSession}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color="#F8FAFC" name="chevron-back" size={24} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
        <Text style={styles.kicker}>{session.workoutSnapshot.name}</Text>

        {notificationsDisabled ? (
          <Text style={styles.notice}>
            Notifications are off. Rest alerts will not appear when the app is locked.
          </Text>
        ) : null}

        {session.phase === "performingSet" ? (
          <View style={styles.sessionPanel}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.setLabel}>
              Set {session.currentSetNumber} of {currentExercise.sets}
            </Text>
            <PrimaryButton title="Finish Set" onPress={handleFinishSet} />
          </View>
        ) : null}

        {session.phase === "resting" && session.restEndsAt && nextExercise ? (
          <View style={styles.sessionPanel}>
            <Text style={styles.restLabel}>Rest</Text>
            <RestCountdown onComplete={handleRestComplete} restEndsAt={session.restEndsAt} />
            <View style={styles.nextPanel}>
              <Text style={styles.nextLabel}>Next</Text>
              <Text style={styles.nextExercise}>{nextExercise.name}</Text>
              <Text style={styles.nextSet}>
                Set {session.nextSetNumber} of {nextExercise.sets}
              </Text>
            </View>
            <View style={styles.restActions}>
              <PrimaryButton title="+30 sec" onPress={handleAddRestTime} variant="secondary" />
              <PrimaryButton title="Skip Rest" onPress={handleSkipRest} variant="ghost" />
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  centerContent: {
    flex: 1,
    gap: 24,
    justifyContent: "center",
    padding: 20,
  },
  kicker: {
    color: "#E8FF5A",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 18,
    textTransform: "uppercase",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40,
  },
  muted: {
    color: "#A8B3C1",
    fontSize: 18,
    fontWeight: "700",
  },
  notice: {
    color: "#FEC84B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    minHeight: 44,
    marginBottom: 26,
    paddingRight: 12,
  },
  backText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.65,
  },
  sessionPanel: {
    gap: 22,
    justifyContent: "center",
    minHeight: 520,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 50,
  },
  setLabel: {
    color: "#A8B3C1",
    fontSize: 24,
    fontWeight: "800",
  },
  restLabel: {
    color: "#A8B3C1",
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextPanel: {
    backgroundColor: "#191D24",
    borderColor: "#2C3440",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  nextLabel: {
    color: "#A8B3C1",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextExercise: {
    color: "#F8FAFC",
    fontSize: 26,
    fontWeight: "900",
  },
  nextSet: {
    color: "#A8B3C1",
    fontSize: 18,
    fontWeight: "800",
  },
  restActions: {
    gap: 12,
  },
});
