import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSeedWorkouts } from "@/src/models/seedWorkouts";
import { ActiveSession, AppStateData, Exercise, Workout } from "@/src/models/types";

const STORAGE_KEY = "BEGINNER_GYM_TIMER_STATE_V1";
const MAX_HANDLED_NOTIFICATION_ACTION_IDS = 200;

function createInitialState(): AppStateData {
  return {
    workouts: getSeedWorkouts(),
    activeSession: undefined,
    handledNotificationActionIds: [],
  };
}

export async function loadAppState(): Promise<AppStateData> {
  try {
    const rawState = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      const initialState = createInitialState();
      await saveAppState(initialState);
      return initialState;
    }

    const parsedState = JSON.parse(rawState) as Partial<AppStateData>;
    const workouts = Array.isArray(parsedState.workouts) && parsedState.workouts.every(isValidWorkout)
      ? parsedState.workouts
      : getSeedWorkouts();
    const activeSession =
      parsedState.activeSession && isValidActiveSession(parsedState.activeSession)
        ? parsedState.activeSession
        : undefined;
    const handledNotificationActionIds = Array.isArray(parsedState.handledNotificationActionIds)
      ? parsedState.handledNotificationActionIds.filter((id): id is string => typeof id === "string")
      : [];

    const normalizedState: AppStateData = {
      workouts,
      activeSession,
      handledNotificationActionIds,
    };

    if (parsedState.activeSession && !activeSession) {
      await saveAppState(normalizedState);
    }

    return normalizedState;
  } catch (error) {
    console.warn("Failed to load app state. Falling back to seed workouts.", error);
    return createInitialState();
  }
}

export async function saveAppState(state: AppStateData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getWorkouts(): Promise<Workout[]> {
  const state = await loadAppState();
  return state.workouts;
}

export async function updateWorkout(workout: Workout): Promise<void> {
  if (!isValidWorkout(workout)) {
    throw new Error("Invalid workout");
  }

  const state = await loadAppState();
  const nextWorkouts = state.workouts.map((existingWorkout) =>
    existingWorkout.id === workout.id ? workout : existingWorkout,
  );

  await saveAppState({
    ...state,
    workouts: nextWorkouts,
  });
}

export async function getActiveSession(): Promise<ActiveSession | undefined> {
  const state = await loadAppState();
  return state.activeSession;
}

export async function setActiveSession(session?: ActiveSession): Promise<void> {
  const state = await loadAppState();

  await saveAppState({
    ...state,
    activeSession: session && isValidActiveSession(session) ? session : undefined,
  });
}

export async function addHandledNotificationActionId(id: string): Promise<void> {
  const state = await loadAppState();

  if (state.handledNotificationActionIds.includes(id)) {
    return;
  }

  await saveAppState({
    ...state,
    handledNotificationActionIds: [...state.handledNotificationActionIds, id].slice(
      -MAX_HANDLED_NOTIFICATION_ACTION_IDS,
    ),
  });
}

export async function hasHandledNotificationActionId(id: string): Promise<boolean> {
  const state = await loadAppState();
  return state.handledNotificationActionIds.includes(id);
}

function isValidWorkout(workout: unknown): workout is Workout {
  const candidate = workout as Workout;

  return (
    typeof candidate?.id === "string" &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    Array.isArray(candidate.exercises) &&
    candidate.exercises.length > 0 &&
    candidate.exercises.every(isValidExercise)
  );
}

function isValidExercise(exercise: unknown): exercise is Exercise {
  const candidate = exercise as Exercise;

  return (
    typeof candidate?.id === "string" &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    Number.isInteger(candidate.sets) &&
    candidate.sets >= 1 &&
    candidate.sets <= 10 &&
    Number.isInteger(candidate.restSeconds) &&
    candidate.restSeconds >= 15 &&
    candidate.restSeconds <= 600
  );
}

function isValidActiveSession(session: unknown): session is ActiveSession {
  const candidate = session as ActiveSession;

  if (
    !candidate ||
    typeof candidate.id !== "string" ||
    typeof candidate.workoutId !== "string" ||
    !isValidWorkout(candidate.workoutSnapshot) ||
    !["performingSet", "resting", "complete"].includes(candidate.phase) ||
    typeof candidate.startedAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return false;
  }

  const currentExercise = candidate.workoutSnapshot.exercises[candidate.currentExerciseIndex];
  if (!currentExercise) {
    return false;
  }

  if (
    !Number.isInteger(candidate.currentSetNumber) ||
    candidate.currentSetNumber < 1 ||
    candidate.currentSetNumber > currentExercise.sets
  ) {
    return false;
  }

  if (candidate.phase !== "resting") {
    return hasValidSuspensionFields(candidate);
  }

  const nextExerciseIndex = candidate.nextExerciseIndex;
  const nextSetNumber = candidate.nextSetNumber;

  if (
    typeof candidate.restEndsAt !== "string" ||
    typeof nextExerciseIndex !== "number" ||
    typeof nextSetNumber !== "number" ||
    !Number.isInteger(nextExerciseIndex) ||
    !Number.isInteger(nextSetNumber)
  ) {
    return false;
  }

  const nextExercise = candidate.workoutSnapshot.exercises[nextExerciseIndex];
  return Boolean(
    nextExercise &&
      nextSetNumber >= 1 &&
      nextSetNumber <= nextExercise.sets &&
      hasValidSuspensionFields(candidate),
  );
}

function hasValidSuspensionFields(session: ActiveSession): boolean {
  if (session.isSuspended === undefined || session.isSuspended === false) {
    return true;
  }

  return Boolean(
    session.isSuspended === true &&
      typeof session.suspendedAt === "string" &&
      (session.suspendedRestRemainingSeconds === undefined ||
        (Number.isInteger(session.suspendedRestRemainingSeconds) &&
          session.suspendedRestRemainingSeconds >= 0)),
  );
}
