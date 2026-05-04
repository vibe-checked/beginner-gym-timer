export type ID = string;

export type Workout = {
  id: ID;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
};

export type Exercise = {
  id: ID;
  name: string;
  sets: number;
  restSeconds: number;
};

export type SessionPhase = "performingSet" | "resting" | "complete";

export type ActiveSession = {
  id: ID;
  workoutId: ID;
  workoutSnapshot: Workout;
  phase: SessionPhase;
  currentExerciseIndex: number;
  currentSetNumber: number;
  restEndsAt?: string;
  nextExerciseIndex?: number;
  nextSetNumber?: number;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedRestRemainingSeconds?: number;
  startedAt: string;
  updatedAt: string;
};

export type AppStateData = {
  workouts: Workout[];
  activeSession?: ActiveSession;
  handledNotificationActionIds: string[];
};

export type FinishSetNotificationData = {
  type: "REST_DONE";
  sessionId: string;
  targetExerciseIndex: number;
  targetSetNumber: number;
  notificationId: string;
};
