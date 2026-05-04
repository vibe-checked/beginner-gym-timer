import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import "react-native-reanimated";

import { OpeningSplash } from "@/src/components/OpeningSplash";
import {
  processLastNotificationResponseOnStartup,
  registerNotificationCategories,
  setupNotificationListeners,
} from "@/src/notifications/notificationManager";
import { reconcileSessionOnAppOpen } from "@/src/session/sessionEngine";
import { loadAppState, saveAppState } from "@/src/storage/workoutStore";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [booted, setBooted] = useState(false);
  const [openingSplashDone, setOpeningSplashDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    const splashTimer = setTimeout(() => {
      if (mounted) {
        setOpeningSplashDone(true);
      }
    }, 1250);

    async function bootApp() {
      try {
        setupNotificationListeners();
        await registerNotificationCategories();
        await processLastNotificationResponseOnStartup();

        const state = await loadAppState();
        if (state.activeSession) {
          const reconciledSession = reconcileSessionOnAppOpen(state.activeSession, new Date());
          if (reconciledSession !== state.activeSession) {
            await saveAppState({
              ...state,
              activeSession: reconciledSession,
            });
          }
        }
      } catch (error) {
        console.warn("App startup reconciliation failed.", error);
      } finally {
        if (mounted) {
          setBooted(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    void bootApp();

    return () => {
      mounted = false;
      clearTimeout(splashTimer);
    };
  }, []);

  if (!booted) {
    return null;
  }

  if (!openingSplashDone) {
    return <OpeningSplash />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#101318" },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#101318" },
          headerTintColor: "#F8FAFC",
          headerTitleStyle: {
            fontWeight: "800",
          },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[id]"
          options={{
            headerBackTitle: "Workouts",
            headerBackVisible: false,
            headerLeft: () => (
              <Pressable
                accessibilityLabel="Back to workouts"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }

                  router.replace("/");
                }}
                style={({ pressed }) => [styles.headerBackButton, pressed && styles.pressed]}>
                <Ionicons color="#F8FAFC" name="chevron-back" size={24} />
                <Text style={styles.headerBackText}>Workouts</Text>
              </Pressable>
            ),
            title: "Workout",
          }}
        />
        <Stack.Screen name="session" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerBackButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    minHeight: 44,
    paddingRight: 12,
  },
  headerBackText: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.65,
  },
});
