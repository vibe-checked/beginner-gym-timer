import { Workout } from "./types";

const seedTimestamp = "2026-01-01T00:00:00.000Z";

export const seedWorkouts: Workout[] = [
  {
    id: "beginner-chest",
    name: "Beginner Chest",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    exercises: [
      { id: "bench-press", name: "Bench Press", sets: 4, restSeconds: 120 },
      { id: "incline-db-press", name: "Incline Dumbbell Press", sets: 3, restSeconds: 90 },
      { id: "cable-fly", name: "Cable Fly", sets: 3, restSeconds: 60 },
      { id: "pushups", name: "Pushups", sets: 3, restSeconds: 60 },
    ],
  },
  {
    id: "beginner-back",
    name: "Beginner Back",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    exercises: [
      { id: "lat-pulldown", name: "Lat Pulldown", sets: 4, restSeconds: 120 },
      { id: "seated-cable-row", name: "Seated Cable Row", sets: 3, restSeconds: 90 },
      { id: "dumbbell-row", name: "Dumbbell Row", sets: 3, restSeconds: 90 },
      { id: "face-pull", name: "Face Pull", sets: 3, restSeconds: 60 },
    ],
  },
  {
    id: "beginner-legs",
    name: "Beginner Legs",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    exercises: [
      { id: "squat", name: "Squat", sets: 4, restSeconds: 150 },
      { id: "leg-press", name: "Leg Press", sets: 3, restSeconds: 120 },
      { id: "romanian-deadlift", name: "Romanian Deadlift", sets: 3, restSeconds: 120 },
      { id: "calf-raise", name: "Calf Raise", sets: 3, restSeconds: 60 },
    ],
  },
  {
    id: "push-day",
    name: "Push Day",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    exercises: [
      { id: "push-bench-press", name: "Bench Press", sets: 4, restSeconds: 120 },
      { id: "shoulder-press", name: "Shoulder Press", sets: 3, restSeconds: 120 },
      { id: "push-incline-db-press", name: "Incline Dumbbell Press", sets: 3, restSeconds: 90 },
      { id: "triceps-pushdown", name: "Triceps Pushdown", sets: 3, restSeconds: 60 },
    ],
  },
  {
    id: "pull-day",
    name: "Pull Day",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    exercises: [
      { id: "pullup-or-lat-pulldown", name: "Pull-up or Lat Pulldown", sets: 4, restSeconds: 120 },
      { id: "barbell-row", name: "Barbell Row", sets: 3, restSeconds: 120 },
      { id: "pull-seated-cable-row", name: "Seated Cable Row", sets: 3, restSeconds: 90 },
      { id: "dumbbell-curl", name: "Dumbbell Curl", sets: 3, restSeconds: 60 },
    ],
  },
];

export function getSeedWorkouts(): Workout[] {
  return JSON.parse(JSON.stringify(seedWorkouts)) as Workout[];
}
