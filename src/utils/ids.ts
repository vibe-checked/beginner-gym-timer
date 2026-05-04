export function createId(prefix: string): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${randomValue}`;
}

export function restNotificationIdentifier(
  sessionId: string,
  targetExerciseIndex: number,
  targetSetNumber: number,
): string {
  return `rest_done_${sessionId}_${targetExerciseIndex}_${targetSetNumber}`;
}
