import { z } from 'zod';

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10 Mo max pour l'import JSON
export const CURRENT_SCHEMA_VERSION = 1;

export const CivilDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date civile invalide (attendu YYYY-MM-DD)');

export const LocalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure locale invalide (attendu HH:mm)');

export const WeightEntryValidationSchema = z.object({
  civilDate: CivilDateSchema,
  weightKg: z
    .number()
    .finite()
    .min(25, 'Le poids doit être compris entre 25 kg et 300 kg.')
    .max(300, 'Le poids doit être compris entre 25 kg et 300 kg.'),
  notes: z.string().max(500).optional(),
});

export const BodyMeasurementValidationSchema = z.object({
  civilDate: CivilDateSchema,
  waistCm: z.number().finite().min(35).max(220).optional(),
  hipsCm: z.number().finite().min(40).max(230).optional(),
  chestCm: z.number().finite().min(45).max(220).optional(),
  armCm: z.number().finite().min(15).max(80).optional(),
  thighCm: z.number().finite().min(25).max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const BackupSnapshotValidationSchema = z.object({
  schemaVersion: z.number().int().min(1).max(CURRENT_SCHEMA_VERSION),
  exportedAt: z.string().min(10),
  appVersion: z.string().min(1),
  userProfile: z
    .object({
      id: z.string().min(1),
      displayName: z.string(),
      ageYears: z.number().int().min(12).max(110),
      heightCm: z.number().min(100).max(250),
      weightKg: z.number().min(25).max(300),
      metabolicParameter: z.enum(['male_equation', 'female_equation', 'unspecified']),
      experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
      primaryGoal: z.enum([
        'general_fitness',
        'strength',
        'hypertrophy',
        'fat_loss',
        'conditioning',
        'combat_complement',
      ]),
      availableEquipment: z.array(z.string()),
      availableDays: z.array(z.string()),
      desiredSessionsPerWeek: z.number().int().min(1).max(7),
      sessionDurationMinutes: z.union([
        z.literal(20),
        z.literal(30),
        z.literal(45),
        z.literal(60),
        z.literal(75),
        z.literal(90),
      ]),
      combatDiscipline: z.enum(['none', 'bjj', 'boxing', 'mma', 'multiple']),
      combatSessionsPerWeek: z.number().int().min(0).max(14),
      combatDays: z.array(z.string()),
      combatIntensity: z.enum(['low', 'moderate', 'high']),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  userPreferences: z.object({
    id: z.string().min(1),
    weightUnit: z.enum(['kg', 'lb']),
    lengthUnit: z.enum(['cm', 'in']),
    theme: z.enum(['dark', 'light', 'system']),
    soundEnabled: z.boolean(),
    vibrationEnabled: z.boolean(),
    keepScreenAwakeDuringTimers: z.boolean(),
    quietHoursStart: LocalTimeSchema,
    quietHoursEnd: LocalTimeSchema,
    nutritionGuidanceStyle: z.enum(['simple_advice', 'numeric_targets']),
    onboardingCompleted: z.boolean(),
    demoModeActive: z.boolean(),
    updatedAt: z.string(),
  }),
  questionnaireAnswers: z.any().nullable(),
  recommendationResult: z.any().nullable(),
  customExercises: z.array(
    z.object({
      id: z.string().min(1),
      nameFr: z.string().min(1),
      aliases: z.array(z.string()),
      primaryMuscles: z.array(z.string()),
      secondaryMuscles: z.array(z.string()),
      equipment: z.array(z.string()),
      movementPattern: z.string(),
      measurementType: z.enum([
        'weight_reps',
        'bodyweight_reps',
        'weighted_bodyweight',
        'assisted_reps',
        'duration',
        'distance',
      ]),
      isUnilateral: z.boolean(),
      avoidTags: z.array(z.string()),
      setupInstructions: z.array(z.string()),
      executionSteps: z.array(z.string()),
      commonMistakes: z.array(z.string()),
      breathingCues: z.string(),
      generalPrecautions: z.string(),
      alternativeIds: z.array(z.string()),
      isFavorite: z.boolean(),
      isCustom: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  favoriteExerciseIds: z.array(z.string()),
  programTemplates: z.array(z.any()),
  programInstances: z.array(z.any()),
  scheduledSessions: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      sessionType: z.enum(['strength', 'combat', 'drill_circuit']),
      scheduledDate: CivilDateSchema,
      status: z.enum(['planned', 'completed', 'postponed', 'skipped']),
      createdAt: z.string(),
      updatedAt: z.string(),
    }).passthrough()
  ),
  workoutSessions: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      civilDate: CivilDateSchema,
      status: z.enum(['in_progress', 'paused', 'completed', 'abandoned']),
      startedAt: z.string(),
      accumulatedPauseSeconds: z.number().min(0),
      durationSeconds: z.number().min(0),
      notes: z.string(),
      exercises: z.array(
        z.object({
          id: z.string().min(1),
          workoutSessionId: z.string().min(1),
          exerciseId: z.string().min(1),
          exerciseNameSnapshot: z.string().min(1),
          measurementTypeSnapshot: z.enum([
            'weight_reps',
            'bodyweight_reps',
            'weighted_bodyweight',
            'assisted_reps',
            'duration',
            'distance',
          ]),
          isUnilateralSnapshot: z.boolean(),
          orderIndex: z.number().int().min(0),
          restSeconds: z.number().min(0),
          sets: z.array(
            z.object({
              id: z.string().min(1),
              workoutExerciseId: z.string().min(1),
              setOrder: z.number().int().min(1),
              setType: z.enum(['warmup', 'working']),
              weightKg: z.number().finite().min(0).max(1000).optional(),
              reps: z.number().int().min(0).max(1000).optional(),
              durationSeconds: z.number().min(0).max(36000).optional(),
              distanceMeters: z.number().min(0).max(100000).optional(),
              isCompleted: z.boolean(),
            }).passthrough()
          ),
        }).passthrough()
      ),
      createdAt: z.string(),
      updatedAt: z.string(),
    }).passthrough()
  ),
  combatSessions: z.array(
    z.object({
      id: z.string().min(1),
      discipline: z.enum(['bjj', 'boxing', 'mma', 'conditioning']),
      category: z.enum([
        'drills',
        'sparring_rolling',
        'competition',
        'heavy_bag',
        'conditioning',
      ]),
      civilDate: CivilDateSchema,
      bjjAttire: z.enum(['gi', 'no_gi', 'not_applicable']),
      context: z.enum(['training', 'competition']),
      roundsCount: z.number().int().min(0).max(100),
      roundDurationSeconds: z.number().min(0),
      restDurationSeconds: z.number().min(0),
      totalDurationMinutes: z.number().min(0).max(600),
      perceivedIntensity: z.enum(['low', 'moderate', 'high']),
      positionsWorked: z.array(z.string()),
      techniqueEvents: z.array(z.any()),
      submissionsAttempted: z.number().int().min(0),
      submissionsSucceeded: z.number().int().min(0),
      rounds: z.array(z.any()),
      notes: z.string(),
      pointsToReview: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }).passthrough()
  ),
  drillCircuits: z.array(z.any()),
  weightEntries: z.array(
    z.object({
      id: z.string().min(1),
      civilDate: CivilDateSchema,
      weightKg: z.number().finite().min(25).max(300),
      notes: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  bodyMeasurements: z.array(
    z.object({
      id: z.string().min(1),
      civilDate: CivilDateSchema,
      waistCm: z.number().finite().min(35).max(220).optional(),
      hipsCm: z.number().finite().min(40).max(230).optional(),
      chestCm: z.number().finite().min(45).max(220).optional(),
      armCm: z.number().finite().min(15).max(80).optional(),
      thighCm: z.number().finite().min(25).max(120).optional(),
      notes: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  nutritionTarget: z.any().nullable(),
  reminders: z.array(z.any()),
  recoveryCheckIns: z.array(z.any()),
});
