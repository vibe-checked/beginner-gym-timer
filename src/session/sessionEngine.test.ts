import { getSeedWorkouts } from "@/src/models/seedWorkouts";
import { ActiveSession } from "@/src/models/types";

import {
  addRestTime,
  completeCurrentSet,
  finishRest,
  handleFinishSetFromNotification,
  reconcileSessionOnAppOpen,
  resumeSession,
  skipRest,
  suspendSession,
} from "./sessionEngine";

const now = new Date("2026-05-03T12:00:00.000Z");
const workout = getSeedWorkouts()[0];

function makeSession(overrides: Partial<ActiveSession> = {}): ActiveSession {
  return {
    id: "session-test",
    workoutId: workout.id,
    workoutSnapshot: workout,
    phase: "performingSet",
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("sessionEngine", () => {
  test("completing a middle set starts rest and points to the next set", () => {
    const nextSession = completeCurrentSet(makeSession(), now);

    expect(nextSession.phase).toBe("resting");
    expect(nextSession.currentExerciseIndex).toBe(0);
    expect(nextSession.currentSetNumber).toBe(1);
    expect(nextSession.nextExerciseIndex).toBe(0);
    expect(nextSession.nextSetNumber).toBe(2);
    expect(nextSession.restEndsAt).toBe("2026-05-03T12:02:00.000Z");
  });

  test("completing the last set of an exercise points to the next exercise set one", () => {
    const nextSession = completeCurrentSet(makeSession({ currentSetNumber: 4 }), now);

    expect(nextSession.phase).toBe("resting");
    expect(nextSession.currentExerciseIndex).toBe(0);
    expect(nextSession.currentSetNumber).toBe(4);
    expect(nextSession.nextExerciseIndex).toBe(1);
    expect(nextSession.nextSetNumber).toBe(1);
    expect(nextSession.restEndsAt).toBe("2026-05-03T12:02:00.000Z");
  });

  test("completing the final set completes the workout", () => {
    const nextSession = completeCurrentSet(
      makeSession({
        currentExerciseIndex: 3,
        currentSetNumber: 3,
      }),
      now,
    );

    expect(nextSession.phase).toBe("complete");
    expect(nextSession.restEndsAt).toBeUndefined();
    expect(nextSession.nextExerciseIndex).toBeUndefined();
    expect(nextSession.nextSetNumber).toBeUndefined();
  });

  test("finishRest moves from resting to performingSet", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T12:02:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = finishRest(restingSession, now);

    expect(nextSession.phase).toBe("performingSet");
    expect(nextSession.currentExerciseIndex).toBe(0);
    expect(nextSession.currentSetNumber).toBe(2);
    expect(nextSession.restEndsAt).toBeUndefined();
  });

  test("addRestTime adds 30 seconds", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T12:02:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = addRestTime(restingSession, 30, now);

    expect(nextSession.restEndsAt).toBe("2026-05-03T12:02:30.000Z");
  });

  test("skipRest moves to the next set", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T12:02:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = skipRest(restingSession, now);

    expect(nextSession.phase).toBe("performingSet");
    expect(nextSession.currentSetNumber).toBe(2);
  });

  test("reconcileSessionOnAppOpen moves expired rest to performingSet", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T11:59:59.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = reconcileSessionOnAppOpen(restingSession, now);

    expect(nextSession.phase).toBe("performingSet");
    expect(nextSession.currentSetNumber).toBe(2);
  });

  test("handleFinishSetFromNotification completes the target after expired rest", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T11:59:59.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = handleFinishSetFromNotification(
      restingSession,
      {
        targetExerciseIndex: 0,
        targetSetNumber: 2,
      },
      now,
    );

    expect(nextSession?.phase).toBe("resting");
    expect(nextSession?.currentExerciseIndex).toBe(0);
    expect(nextSession?.currentSetNumber).toBe(2);
    expect(nextSession?.nextExerciseIndex).toBe(0);
    expect(nextSession?.nextSetNumber).toBe(3);
    expect(nextSession?.restEndsAt).toBe("2026-05-03T12:02:00.000Z");
  });

  test("handleFinishSetFromNotification ignores the wrong target", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T11:59:59.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = handleFinishSetFromNotification(
      restingSession,
      {
        targetExerciseIndex: 1,
        targetSetNumber: 1,
      },
      now,
    );

    expect(nextSession).toEqual(restingSession);
  });

  test("handleFinishSetFromNotification ignores actions before rest is done", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T12:01:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const nextSession = handleFinishSetFromNotification(
      restingSession,
      {
        targetExerciseIndex: 0,
        targetSetNumber: 2,
      },
      now,
    );

    expect(nextSession).toEqual(restingSession);
  });

  test("suspendSession freezes remaining rest time", () => {
    const restingSession = makeSession({
      phase: "resting",
      restEndsAt: "2026-05-03T12:02:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const suspendedSession = suspendSession(restingSession, now);

    expect(suspendedSession.isSuspended).toBe(true);
    expect(suspendedSession.suspendedRestRemainingSeconds).toBe(120);
    expect(suspendedSession.restEndsAt).toBe("2026-05-03T12:02:00.000Z");
  });

  test("resumeSession restarts rest from frozen remaining time", () => {
    const suspendedSession = makeSession({
      phase: "resting",
      isSuspended: true,
      suspendedAt: now.toISOString(),
      suspendedRestRemainingSeconds: 90,
      restEndsAt: "2026-05-03T12:02:00.000Z",
      nextExerciseIndex: 0,
      nextSetNumber: 2,
    });

    const resumedAt = new Date("2026-05-03T12:10:00.000Z");
    const resumedSession = resumeSession(suspendedSession, resumedAt);

    expect(resumedSession.isSuspended).toBe(false);
    expect(resumedSession.suspendedAt).toBeUndefined();
    expect(resumedSession.suspendedRestRemainingSeconds).toBeUndefined();
    expect(resumedSession.restEndsAt).toBe("2026-05-03T12:11:30.000Z");
  });
});
