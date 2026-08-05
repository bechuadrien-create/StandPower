/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CustomExercise {
  name: string;
  sets: number;
  reps: number;
  targetLoadKg: number;
  properForm?: string[];
  safetyTips?: string[];
  targetMuscles?: string[];
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: CustomExercise[];
}

export interface SetLog {
  exerciseIndex: number;
  setIndex: number;
  loadKg: number;
  reps: number;
  completed: boolean;
}

export interface UserProfile {
  weightKg: number;
}

export interface ExerciseGuide {
  id: string;
  name: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  properForm: string[];
  safetyTips: string[];
  defaultReps: number;
  defaultSets: number;
  defaultLoadKg: number;
}

export type AppScreen = 'DASHBOARD' | 'CREATE_WORKOUT' | 'WORKOUT_FLOW' | 'TIMER_MODAL' | 'SUMMARY';
