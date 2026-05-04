import { ActiveSession, Exercise, FinishSetNotificationData } from "@/src/models/types";
import { addSeconds, secondsUntil } from "@/src/utils/time";

export function getCurrentExercise(session: ActiveSession): Exercise {
  return session.workoutSnapshot.exercises[session.currentExerciseIndex];
}

export function getNextTargetAfterCompletedSet(
  session: ActiveSession,
): { exerciseIndex: number; setNumber: number } | null {
  const completedExercise = getCurrentExercise(session);

  if (session.currentSetNumber < completedExercise.sets) {
    return {
      exerciseIndex: session.currentExerciseIndex,
      setNumber: session.currentSetNumber + 1,
    };
  }

  if (session.currentExerciseIndex + 1 < session.workoutSnapshot.exercises.length) {
    return {
      exerciseIndex: session.currentExerciseIndex + 1,
      setNumber: 1,
    };
  }

  return null;
}

export function isRestExpired(session: ActiveSession, now: Date): boolean {
  return Boolean(session.restEndsAt && new Date(session.restEndsAt).getTime() <= now.getTime());
}

export function completeCurrentSet(session: ActiveSession, now: Date): ActiveSession {
  const completedExercise = getCurrentExercise(session);
  const nextTarget = getNextTargetAfterCompletedSet(session);
  const nowIso = now.toISOString();

  if (!nextTarget) {
    return {
      ...session,
      phase: "complete",
      restEndsAt: undefined,
      nextExerciseIndex: undefined,
      nextSetNumber: undefined,
      isSuspended: false,
      suspendedAt: undefined,
      suspendedRestRemainingSeconds: undefined,
      updatedAt: nowIso,
    };
  }

  return {
    ...session,
    phase: "resting",
    restEndsAt: addSeconds(now, completedExercise.restSeconds).toISOString(),
    nextExerciseIndex: nextTarget.exerciseIndex,
    nextSetNumber: nextTarget.setNumber,
    isSuspended: false,
    suspendedAt: undefined,
    suspendedRestRemainingSeconds: undefined,
    updatedAt: nowIso,
  };
}

export function finishRest(session: ActiveSession, now: Date): ActiveSession {
  if (
    session.phase !== "resting" ||
    session.nextExerciseIndex === undefined ||
    session.nextSetNumber === undefined
  ) {
    return session;
  }

  return {
    ...session,
    phase: "performingSet",
    currentExerciseIndex: session.nextExerciseIndex,
    currentSetNumber: session.nextSetNumber,
    restEndsAt: undefined,
    nextExerciseIndex: undefined,
    nextSetNumber: undefined,
    isSuspended: false,
    suspendedAt: undefined,
    suspendedRestRemainingSeconds: undefined,
    updatedAt: now.toISOString(),
  };
}

export function addRestTime(session: ActiveSession, secondsToAdd: number, now: Date): ActiveSession {
  if (session.isSuspended || session.phase !== "resting" || !session.restEndsAt) {
    return session;
  }

  const existingRestEnd = new Date(session.restEndsAt);
  const baseDate = existingRestEnd.getTime() < now.getTime() ? now : existingRestEnd;

  return {
    ...session,
    restEndsAt: addSeconds(baseDate, secondsToAdd).toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function skipRest(session: ActiveSession, now: Date): ActiveSession {
  return finishRest(session, now);
}

export function reconcileSessionOnAppOpen(session: ActiveSession, now: Date): ActiveSession {
  if (session.isSuspended) {
    return session;
  }

  if (session.phase === "resting" && isRestExpired(session, now)) {
    return finishRest(session, now);
  }

  return session;
}

export function suspendSession(session: ActiveSession, now: Date): ActiveSession {
  if (session.phase === "complete") {
    return session;
  }

  const nowIso = now.toISOString();

  if (session.phase === "resting" && session.restEndsAt) {
    return {
      ...session,
      isSuspended: true,
      suspendedAt: nowIso,
      suspendedRestRemainingSeconds: secondsUntil(session.restEndsAt, now),
      updatedAt: nowIso,
    };
  }

  return {
    ...session,
    isSuspended: true,
    suspendedAt: nowIso,
    suspendedRestRemainingSeconds: undefined,
    updatedAt: nowIso,
  };
}

export function resumeSession(session: ActiveSession, now: Date): ActiveSession {
  if (!session.isSuspended) {
    return reconcileSessionOnAppOpen(session, now);
  }

  const nowIso = now.toISOString();

  if (session.phase === "resting") {
    const remainingSeconds = session.suspendedRestRemainingSeconds ?? 0;

    if (remainingSeconds <= 0) {
      return finishRest(
        {
          ...session,
          isSuspended: false,
          suspendedAt: undefined,
          suspendedRestRemainingSeconds: undefined,
        },
        now,
      );
    }

    return {
      ...session,
      restEndsAt: addSeconds(now, remainingSeconds).toISOString(),
      isSuspended: false,
      suspendedAt: undefined,
      suspendedRestRemainingSeconds: undefined,
      updatedAt: nowIso,
    };
  }

  return {
    ...session,
    isSuspended: false,
    suspendedAt: undefined,
    suspendedRestRemainingSeconds: undefined,
    updatedAt: nowIso,
  };
}

export function handleFinishSetFromNotification(
  session: ActiveSession | undefined,
  notificationData: Pick<FinishSetNotificationData, "targetExerciseIndex" | "targetSetNumber">,
  now: Date,
): ActiveSession | undefined {
  if (!session || session.isSuspended || session.phase === "complete") {
    return session;
  }

  if (session.phase === "resting") {
    if (!isRestExpired(session, now)) {
      return session;
    }

    const readySession = finishRest(session, now);
    if (targetMatchesSession(readySession, notificationData)) {
      return completeCurrentSet(readySession, now);
    }

    return session;
  }

  if (targetMatchesSession(session, notificationData)) {
    return completeCurrentSet(session, now);
  }

  return session;
}

function targetMatchesSession(
  session: ActiveSession,
  notificationData: Pick<FinishSetNotificationData, "targetExerciseIndex" | "targetSetNumber">,
): boolean {
  return (
    session.currentExerciseIndex === notificationData.targetExerciseIndex &&
    session.currentSetNumber === notificationData.targetSetNumber
  );
}
