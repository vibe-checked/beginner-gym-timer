import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { WorkoutCard } from "@/src/components/WorkoutCard";
import { ActiveSession, Workout } from "@/src/models/types";
import {
  cancelRestNotificationsForSession,
  dismissRestNotificationsForSession,
} from "@/src/notifications/notificationManager";
import { reconcileSessionOnAppOpen, resumeSession } from "@/src/session/sessionEngine";
import { loadAppState, saveAppState, setActiveSession as saveActiveSession } from "@/src/storage/workoutStore";

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | undefined>();
  const [loading, setLoading] = useState(true);

  const loadHomeState = useCallback(async () => {
    setLoading(true);
    const state = await loadAppState();
    let nextActiveSession = state.activeSession;

    if (nextActiveSession) {
      const reconciledSession = reconcileSessionOnAppOpen(nextActiveSession, new Date());
      if (reconciledSession !== nextActiveSession) {
        await saveAppState({
          ...state,
          activeSession: reconciledSession,
        });

        await cancelRestNotificationsForSession(nextActiveSession.id);
        await dismissRestNotificationsForSession(nextActiveSession.id);
      }
      nextActiveSession = reconciledSession;
    }

    setWorkouts(state.workouts);
    setActiveSession(nextActiveSession);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeState();
    }, [loadHomeState]),
  );

  const showResume = activeSession && activeSession.phase !== "complete";

  const handleResume = useCallback(async () => {
    if (!activeSession) {
      return;
    }

    const resumedSession = resumeSession(activeSession, new Date());
    await saveActiveSession(resumedSession);
    setActiveSession(resumedSession);
    router.push("/session");
  }, [activeSession, router]);

  const handleRemoveActiveSession = useCallback(async () => {
    if (!activeSession) {
      return;
    }

    await cancelRestNotificationsForSession(activeSession.id);
    await dismissRestNotificationsForSession(activeSession.id);
    await saveActiveSession(undefined);
    setActiveSession(undefined);
  }, [activeSession]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={workouts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker} numberOfLines={1}>
              Designed for quick gym sessions
            </Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.title}>
              Beginner Gym Timer
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Just pick one and follow along...
            </Text>
            {showResume ? (
              <View style={styles.resumePanel}>
                <View style={styles.resumeHeader}>
                  <View style={styles.resumeTextWrap}>
                    <Text style={styles.resumeTitle}>
                      {activeSession.isSuspended ? "Workout paused" : "Active workout in progress"}
                    </Text>
                    <Text style={styles.resumeSubtitle}>{activeSession.workoutSnapshot.name}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Remove paused workout"
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={handleRemoveActiveSession}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                    <Ionicons color="#A8B3C1" name="close" size={24} />
                  </Pressable>
                </View>
                <PrimaryButton title="Resume" onPress={handleResume} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator color="#E8FF5A" size="large" /> : null
        }
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() =>
              router.push({
                pathname: "/workout/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#101318",
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    gap: 16,
    marginBottom: 22,
  },
  kicker: {
    color: "#E8FF5A",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40,
  },
  subtitle: {
    color: "#A8B3C1",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  resumePanel: {
    backgroundColor: "#222832",
    borderColor: "#3A4352",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  resumeHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  resumeTextWrap: {
    flex: 1,
    gap: 5,
  },
  resumeTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  resumeSubtitle: {
    color: "#A8B3C1",
    fontSize: 15,
    fontWeight: "600",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  pressed: {
    opacity: 0.65,
  },
  separator: {
    height: 12,
  },
});
