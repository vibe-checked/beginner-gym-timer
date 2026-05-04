import { Exercise } from "@/src/models/types";

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function formatDuration(totalSeconds: number): string {
  const clampedSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function secondsUntil(dateIso: string, now = new Date()): number {
  return Math.max(0, Math.ceil((new Date(dateIso).getTime() - now.getTime()) / 1000));
}

export function estimateWorkoutMinutes(exercises: Exercise[]): number {
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const workSeconds = totalSets * 30;
  const restSeconds = exercises.reduce((sum, exercise, exerciseIndex) => {
    const isLastExercise = exerciseIndex === exercises.length - 1;
    const restsAfterExercise = isLastExercise ? Math.max(0, exercise.sets - 1) : exercise.sets;
    return sum + restsAfterExercise * exercise.restSeconds;
  }, 0);

  return Math.max(1, Math.round((workSeconds + restSeconds) / 60));
}

export function totalSets(exercises: Exercise[]): number {
  return exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}
