/**
 * Types explicites du domaine StandPower.
 * Stockage canonique :
 * - Poids : kilogrammes (kg)
 * - Longueurs / Mensurations : centimètres (cm)
 * - Durées : secondes (s) ou minutes (min) selon le champ explicite
 * - Dates civiles : YYYY-MM-DD (sans conversion UTC destructive)
 * - Instants horodatés : ISO-8601 (UTC)
 */

export type EntityId = string;
export type IsoTimestamp = string; // ex: 2026-10-24T15:00:00.000Z
export type CivilDate = string; // ex: 2026-10-24 (jour civil local)
export type LocalTimeHHMM = string; // ex: 18:30

export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';
export type ThemeMode = 'dark' | 'light' | 'system';

export type MetabolicParameter = 'male_equation' | 'female_equation' | 'unspecified';

export type PrimaryGoal =
  | 'general_fitness'
  | 'strength'
  | 'hypertrophy'
  | 'fat_loss'
  | 'conditioning'
  | 'combat_complement';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SessionDurationOption = 20 | 30 | 45 | 60 | 75 | 90;

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type EquipmentItem =
  | 'none'
  | 'bands'
  | 'dumbbells'
  | 'kettlebell'
  | 'bench'
  | 'barbell_plates'
  | 'rack'
  | 'machines'
  | 'full_gym'
  | 'heavy_bag'
  | 'mat'
  | 'drill_partner';

export type CombatDiscipline = 'none' | 'bjj' | 'boxing' | 'mma' | 'multiple';

export type PerceivedIntensity = 'low' | 'moderate' | 'high';

export type DailyActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

export type MedicalRestrictionStatus = 'yes' | 'no' | 'prefer_not_to_say';

export type AvoidedAreaOrMovement =
  | 'overhead_press'
  | 'deep_knee_flexion'
  | 'spinal_axial_load'
  | 'heavy_hip_hinge'
  | 'high_impact_jumps'
  | 'wrist_extension'
  | 'neck_bridge';

export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'unspecified';
export type FoodExclusion = 'lactose' | 'gluten' | 'nuts' | 'eggs' | 'soy' | 'fish_shellfish';
export type NutritionGuidanceStyle = 'simple_advice' | 'numeric_targets';

export interface SpecialSafetyFlags {
  pregnancyOrBreastfeeding: boolean;
  eatingDisorderHistory: boolean;
  medicalFollowUpRequired: boolean;
}

// 1. UserProfile
export interface UserProfile {
  id: EntityId;
  displayName: string;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  metabolicParameter: MetabolicParameter;
  experienceLevel: ExperienceLevel;
  primaryGoal: PrimaryGoal;
  availableEquipment: EquipmentItem[];
  availableDays: DayOfWeek[];
  desiredSessionsPerWeek: number;
  sessionDurationMinutes: SessionDurationOption;
  combatDiscipline: CombatDiscipline;
  combatSessionsPerWeek: number;
  combatDays: DayOfWeek[];
  combatIntensity: PerceivedIntensity;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 2. UserPreferences
export interface UserPreferences {
  id: EntityId;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  theme: ThemeMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenAwakeDuringTimers: boolean;
  quietHoursStart: LocalTimeHHMM;
  quietHoursEnd: LocalTimeHHMM;
  nutritionGuidanceStyle: NutritionGuidanceStyle;
  onboardingCompleted: boolean;
  demoModeActive: boolean;
  updatedAt: IsoTimestamp;
}

// 3. QuestionnaireAnswers
export interface QuestionnaireAnswers {
  id: EntityId;
  version: number;
  displayName?: string;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  preferredWeightUnit: WeightUnit;
  metabolicParameter: MetabolicParameter;
  primaryGoal: PrimaryGoal;
  experienceLevel: ExperienceLevel;
  recentWeeklyFrequency: number;
  availableDays: DayOfWeek[];
  desiredSessionsPerWeek: number;
  sessionDurationMinutes: SessionDurationOption;
  preferredReminderTime: LocalTimeHHMM;
  availableEquipment: EquipmentItem[];
  combatDiscipline: CombatDiscipline;
  combatSessionsPerWeek: number;
  combatDays: DayOfWeek[];
  combatIntensity: PerceivedIntensity;
  averageSleepHours?: number;
  perceivedFatigue: 'low' | 'moderate' | 'high';
  avoidedMovements: AvoidedAreaOrMovement[];
  medicalRestriction: MedicalRestrictionStatus;
  specialSafetyFlags: SpecialSafetyFlags;
  dailyActivityLevel: DailyActivityLevel;
  dietaryPreference: DietaryPreference;
  foodExclusions: FoodExclusion[];
  nutritionGuidanceStyle: NutritionGuidanceStyle;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 4. RecommendationResult
export interface WeeklyScheduleSlot {
  day: DayOfWeek;
  activityType: 'strength' | 'combat' | 'rest' | 'active_recovery';
  title: string;
  durationMinutes?: number;
  templateSessionId?: string;
  notes?: string;
}

export interface RecommendedExercisePrescription {
  exerciseId: EntityId;
  exerciseName: string;
  sets: number;
  repRangeMin?: number;
  repRangeMax?: number;
  durationSeconds?: number;
  restSeconds: number;
  targetRir: string;
  alternatives: string[];
  progressionRule: string;
  notes?: string;
}

export interface RecommendationResult {
  id: EntityId;
  questionnaireId: EntityId;
  ruleEngineVersion: string;
  recommendedProgramTemplateId: EntityId;
  recommendedProgramName: string;
  weeklySchedule: WeeklyScheduleSlot[];
  estimatedSessionDurationMinutes: number;
  sessionPrescriptions: {
    sessionKey: string;
    title: string;
    warmupNotes: string;
    exercises: RecommendedExercisePrescription[];
  }[];
  explanations: string[];
  warnings: string[];
  firstSessionGuidance: string[];
  nutritionSummary: {
    eligibleForDeficitOrSurplus: boolean;
    safetyReason?: string;
    bmrEstimateKcal: { min: number; max: number; exact?: number };
    tdeeEstimateKcal: { min: number; max: number; exact?: number };
    targetKcal: { min: number; max: number; exact?: number; mode: 'maintenance' | 'moderate_deficit' | 'moderate_surplus' | 'educational_only' };
    proteinRangeGramsPerDay: { min: number; max: number } | null;
  };
  createdAt: IsoTimestamp;
}

// 5. Exercise & 6. ExerciseAlternative
export type ExerciseMeasurementType =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'weighted_bodyweight'
  | 'assisted_reps'
  | 'duration'
  | 'distance';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'full_body';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'lunge_single_leg'
  | 'carry_conditioning'
  | 'core_stability'
  | 'isolation';

export interface ExerciseAlternative {
  id: EntityId;
  exerciseId: EntityId;
  alternativeExerciseId: EntityId;
  requiredEquipment: EquipmentItem[];
  reason: string;
}

export interface Exercise {
  id: EntityId;
  nameFr: string;
  aliases: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentItem[];
  movementPattern: MovementPattern;
  measurementType: ExerciseMeasurementType;
  isUnilateral: boolean;
  unilateralConvention?: string;
  avoidTags: AvoidedAreaOrMovement[];
  setupInstructions: string[];
  executionSteps: string[];
  commonMistakes: string[];
  breathingCues: string;
  generalPrecautions: string;
  alternativeIds: EntityId[];
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 7. ProgramTemplate & 8. ProgramInstance
export interface ProgramSessionExerciseTemplate {
  exerciseId: EntityId;
  sets: number;
  repMin?: number;
  repMax?: number;
  durationSeconds?: number;
  restSeconds: number;
  targetRpeOrRir: string;
  progressionIncrementKg: number;
  isCoreLift: boolean;
  notes?: string;
}

export interface ProgramSessionTemplate {
  id: EntityId;
  title: string;
  dayOrder: number;
  estimatedDurationMinutes: number;
  warmup: string[];
  exercises: ProgramSessionExerciseTemplate[];
}

export interface PeriodizationPhase {
  weeks: string;
  title: string;
  volumeMultiplier: number;
  intensityTarget: string;
  description: string;
}

export interface ProgramTemplate {
  id: EntityId;
  slug: string;
  nameFr: string;
  targetAudience: string;
  objective: PrimaryGoal;
  experienceLevels: ExperienceLevel[];
  requiredEquipment: EquipmentItem[];
  daysPerWeek: number;
  durationWeeks: number;
  estimatedSessionMinutes: number;
  summary: string;
  warmupProtocol: string[];
  sessions: ProgramSessionTemplate[];
  periodization?: PeriodizationPhase[];
  progressionStrategy: string;
  deloadConditions: string;
  limitationsExplanation: string;
  isBuiltIn: boolean;
  isArchived: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ProgramInstance {
  id: EntityId;
  templateId: EntityId;
  customName: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  currentWeek: number;
  assignedDays: DayOfWeek[];
  sessions: ProgramSessionTemplate[];
  startedAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 9. ScheduledSession
export interface ScheduledSession {
  id: EntityId;
  programInstanceId?: EntityId;
  sessionTemplateId?: EntityId;
  title: string;
  sessionType: 'strength' | 'combat' | 'drill_circuit';
  scheduledDate: CivilDate;
  originalDate?: CivilDate;
  status: 'planned' | 'completed' | 'postponed' | 'skipped';
  linkedWorkoutSessionId?: EntityId;
  linkedCombatSessionId?: EntityId;
  notes?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 10. WorkoutSession, 11. WorkoutExercise, 12. WorkoutSet
export type SetType = 'warmup' | 'working';

export interface WorkoutSet {
  id: EntityId;
  workoutExerciseId: EntityId;
  setOrder: number;
  setType: SetType;
  plannedWeightKg?: number;
  plannedReps?: number;
  weightKg?: number; // Charge externe ou lest ou assistance
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  rpe?: number;
  rir?: number;
  isCompleted: boolean;
  completedAt?: IsoTimestamp;
  notes?: string;
}

export interface WorkoutExercise {
  id: EntityId;
  workoutSessionId: EntityId;
  exerciseId: EntityId;
  exerciseNameSnapshot: string;
  measurementTypeSnapshot: ExerciseMeasurementType;
  isUnilateralSnapshot: boolean;
  unilateralConventionSnapshot?: string;
  orderIndex: number;
  restSeconds: number;
  targetRepMin?: number;
  targetRepMax?: number;
  targetRir?: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: EntityId;
  programInstanceId?: EntityId;
  programNameSnapshot?: string;
  sessionTemplateId?: EntityId;
  title: string;
  civilDate: CivilDate;
  status: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  startedAt: IsoTimestamp;
  pausedAt?: IsoTimestamp;
  accumulatedPauseSeconds: number;
  completedAt?: IsoTimestamp;
  durationSeconds: number;
  activeRestTimer?: {
    startedAtMs: number;
    durationSeconds: number;
    exerciseId: EntityId;
  } | null;
  perceivedFeeling?: 'great' | 'good' | 'normal' | 'tough' | 'exhausted';
  recoveryAdjustmentApplied?: 'none' | 'reduced_volume' | 'lighter_session';
  notes: string;
  exercises: WorkoutExercise[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 13. CombatSession, 14. CombatRound, 15. TechniqueEvent
export type CombatSessionCategory =
  | 'drills'
  | 'sparring_rolling'
  | 'competition'
  | 'heavy_bag'
  | 'conditioning';

export type BjjAttire = 'gi' | 'no_gi' | 'not_applicable';

export interface TechniqueEvent {
  id: EntityId;
  combatSessionId: EntityId;
  category: 'position' | 'sweep_pass' | 'submission_attempted' | 'submission_received' | 'striking_combo';
  techniqueName: string;
  attempts: number;
  successes: number;
  notes?: string;
}

export interface StrikingRoundCount {
  jabs: number;
  crosses: number;
  hooks: number;
  uppercuts: number;
  kicks: number;
  attemptedTotal?: number;
  landedTotal?: number;
}

export interface CombatRound {
  id: EntityId;
  combatSessionId: EntityId;
  roundNumber: number;
  durationSeconds: number;
  restSeconds: number;
  partnerAlias?: string;
  intensity: PerceivedIntensity;
  strikingCounts?: StrikingRoundCount;
  notes?: string;
}

export interface CombatSession {
  id: EntityId;
  discipline: 'bjj' | 'boxing' | 'mma' | 'conditioning';
  category: CombatSessionCategory;
  civilDate: CivilDate;
  bjjAttire: BjjAttire;
  context: 'training' | 'competition';
  roundsCount: number;
  roundDurationSeconds: number;
  restDurationSeconds: number;
  totalDurationMinutes: number;
  perceivedIntensity: PerceivedIntensity;
  partnerAlias?: string;
  positionsWorked: string[];
  techniqueEvents: TechniqueEvent[];
  submissionsAttempted: number;
  submissionsSucceeded: number;
  submissionsReceived?: number;
  competitionOutcome?: string;
  rounds: CombatRound[];
  notes: string;
  pointsToReview: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 16. Drill & 17. DrillCircuit
export type DrillCategory =
  | 'mobility'
  | 'ground_movement'
  | 'coordination'
  | 'hips'
  | 'stability'
  | 'conditioning'
  | 'solo'
  | 'cooperative_partner';

export interface Drill {
  id: EntityId;
  nameFr: string;
  category: DrillCategory;
  objective: string;
  level: ExperienceLevel;
  equipment: EquipmentItem[];
  modality: 'solo' | 'cooperative_partner';
  recommendedDurationOrReps: string;
  defaultDurationSeconds: number;
  steps: string[];
  commonMistakes: string[];
  precautions: string;
  simplerVariant: string;
}

export interface DrillCircuitItem {
  drillId: EntityId;
  drillNameSnapshot: string;
  workSeconds: number;
  restSeconds: number;
}

export interface DrillCircuit {
  id: EntityId;
  name: string;
  rounds: number;
  items: DrillCircuitItem[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 18. BodyMeasurement & 19. WeightEntry
export interface WeightEntry {
  id: EntityId;
  civilDate: CivilDate;
  weightKg: number;
  notes?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface BodyMeasurement {
  id: EntityId;
  civilDate: CivilDate;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// 20. NutritionTarget
export interface NutritionTarget {
  id: EntityId;
  mode: 'maintenance' | 'moderate_deficit' | 'moderate_surplus' | 'educational_only';
  activityLevel: DailyActivityLevel;
  bmrKcalMin: number;
  bmrKcalMax: number;
  tdeeKcalMin: number;
  tdeeKcalMax: number;
  targetKcalMin: number;
  targetKcalMax: number;
  proteinMinG: number;
  proteinMaxG: number;
  confirmedByUser: boolean;
  updatedAt: IsoTimestamp;
}

// 21. Reminder
export interface Reminder {
  id: EntityId;
  type: 'workout' | 'measurement';
  title: string;
  daysOfWeek: DayOfWeek[];
  localTime: LocalTimeHHMM;
  enabled: boolean;
  timezone: string;
  updatedAt: IsoTimestamp;
}

// 22. AppMetadata & Check-in Récupération
export interface RecoveryCheckIn {
  id: EntityId;
  civilDate: CivilDate;
  energy: 1 | 2 | 3 | 4 | 5;
  fatigue: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  unusualPainOrIllness: boolean;
  painAreaNote?: string;
  suggestedAdjustment: 'keep_session' | 'reduce_volume' | 'lighter_session' | 'postpone' | 'suspend_and_consult';
  createdAt: IsoTimestamp;
}

export interface AppMetadata {
  key: string;
  value: string;
  updatedAt: IsoTimestamp;
}

export interface StandPowerDatabaseSnapshot {
  schemaVersion: number;
  exportedAt: IsoTimestamp;
  appVersion: string;
  userProfile: UserProfile | null;
  userPreferences: UserPreferences;
  questionnaireAnswers: QuestionnaireAnswers | null;
  recommendationResult: RecommendationResult | null;
  customExercises: Exercise[];
  favoriteExerciseIds: EntityId[];
  programTemplates: ProgramTemplate[];
  programInstances: ProgramInstance[];
  scheduledSessions: ScheduledSession[];
  workoutSessions: WorkoutSession[];
  combatSessions: CombatSession[];
  drillCircuits: DrillCircuit[];
  weightEntries: WeightEntry[];
  bodyMeasurements: BodyMeasurement[];
  nutritionTarget: NutritionTarget | null;
  reminders: Reminder[];
  recoveryCheckIns: RecoveryCheckIn[];
}
