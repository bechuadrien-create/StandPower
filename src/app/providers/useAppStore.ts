import { create } from 'zustand';
import type {
  BodyMeasurement,
  CivilDate,
  CombatSession,
  Drill,
  DrillCircuit,
  EntityId,
  Exercise,
  NutritionTarget,
  ProgramInstance,
  ProgramSessionTemplate,
  ProgramTemplate,
  QuestionnaireAnswers,
  RecommendationResult,
  RecoveryCheckIn,
  Reminder,
  ScheduledSession,
  SetType,
  StandPowerDatabaseSnapshot,
  UserPreferences,
  UserProfile,
  WeightEntry,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../../domain/types';
import {
  createEmptyDatabaseSnapshot,
  storageEngine,
} from '../../data/database/storageEngine';
import { BUILTIN_EXERCISES } from '../../data/seeds/exercisesSeed';
import { BUILTIN_DRILLS } from '../../data/seeds/drillsSeed';
import { BUILTIN_PROGRAMS } from '../../data/seeds/programsSeed';
import { generateDeterministicRecommendation } from '../../domain/recommendations/ruleEngine';
import { addDaysToCivilDate, getLocalCivilDate } from '../../domain/calculations/units';
import { validateBackupJson } from '../../data/backup/backupService';
import { syncLocalReminders } from '../../platform/notifications/notificationService';

function generateId(prefix: string): EntityId {
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${Date.now()}_${rand}`;
}

export interface AppStoreState {
  isHydrated: boolean;
  hydrationError: string | null;
  lastSavedAt: string | null;
  snapshot: StandPowerDatabaseSnapshot;
  undoWorkoutSnapshot: WorkoutSession | null;
  undoLabel: string | null;

  // Sélecteurs dérivés pratiques
  getAllExercises: () => Exercise[];
  getAllDrills: () => Drill[];
  getActiveWorkout: () => WorkoutSession | null;

  // Hydratation
  hydrate: () => Promise<void>;

  // Préférences & Profil
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  updateUserProfile: (patch: Partial<UserProfile>) => Promise<void>;

  // Questionnaire & Recommandations (Sans IA)
  computeRecommendationPreview: (answers: QuestionnaireAnswers) => RecommendationResult;
  saveQuestionnaireAndApplyProgram: (
    answers: QuestionnaireAnswers,
    chosenProgramTemplateId?: EntityId
  ) => Promise<RecommendationResult>;

  // Exercices (Favoris & Personnalisés)
  toggleFavoriteExercise: (exerciseId: EntityId) => Promise<void>;
  saveCustomExercise: (
    draft: Omit<Exercise, 'id' | 'isCustom' | 'isFavorite' | 'createdAt' | 'updatedAt'> & {
      id?: EntityId;
    }
  ) => Promise<Exercise>;

  // Programmes & Planning
  activateProgramTemplate: (
    templateId: EntityId,
    assignedDays?: UserProfile['availableDays']
  ) => Promise<ProgramInstance>;
  duplicateProgramTemplate: (templateId: EntityId, newName: string) => Promise<ProgramTemplate>;
  archiveProgramTemplate: (templateId: EntityId) => Promise<void>;
  replaceExerciseInActiveProgram: (
    sessionTemplateId: EntityId,
    oldExerciseId: EntityId,
    newExerciseId: EntityId
  ) => Promise<void>;
  postponeScheduledSession: (scheduledId: EntityId, daysToShift?: number) => Promise<void>;
  scheduleCustomSession: (session: Omit<ScheduledSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  // Séance de musculation (Temps réel, Sauvegarde continue, Reprise, Historique)
  startFreeWorkout: (title?: string, initialExerciseIds?: EntityId[]) => Promise<WorkoutSession>;
  startWorkoutFromProgramSession: (
    sessionTemplate: ProgramSessionTemplate,
    programInstance?: ProgramInstance,
    adjustment?: 'none' | 'reduced_volume' | 'lighter_session'
  ) => Promise<WorkoutSession>;
  addExerciseToActiveWorkout: (exerciseId: EntityId) => Promise<void>;
  removeExerciseFromActiveWorkout: (workoutExerciseId: EntityId) => Promise<void>;
  moveExerciseInActiveWorkout: (workoutExerciseId: EntityId, direction: 'up' | 'down') => Promise<void>;
  addSetToWorkoutExercise: (workoutExerciseId: EntityId, setType?: SetType) => Promise<void>;
  duplicateSetInWorkoutExercise: (workoutExerciseId: EntityId, setId: EntityId) => Promise<void>;
  updateWorkoutSet: (
    workoutExerciseId: EntityId,
    setId: EntityId,
    patch: Partial<WorkoutSet>
  ) => Promise<void>;
  toggleCompleteWorkoutSet: (
    workoutExerciseId: EntityId,
    setId: EntityId
  ) => Promise<{ restDurationSeconds: number; exerciseId: EntityId } | null>;
  deleteSetFromWorkoutExercise: (workoutExerciseId: EntityId, setId: EntityId) => Promise<void>;
  undoLastWorkoutChange: () => Promise<void>;
  startWorkoutRestTimer: (durationSeconds: number, exerciseId: EntityId) => Promise<void>;
  clearWorkoutRestTimer: () => Promise<void>;
  pauseActiveWorkout: () => Promise<void>;
  resumeActiveWorkout: () => Promise<void>;
  updateActiveWorkoutNotes: (notes: string) => Promise<void>;
  finishActiveWorkout: (params: {
    perceivedFeeling?: WorkoutSession['perceivedFeeling'];
    notes?: string;
    durationSecondsOverride?: number;
  }) => Promise<WorkoutSession | null>;
  abandonActiveWorkout: () => Promise<void>;
  updateHistoricalWorkoutSession: (updatedSession: WorkoutSession) => Promise<void>;
  deleteWorkoutSession: (sessionId: EntityId) => Promise<void>;

  // Sports de combat & Circuits de drills
  saveCombatSession: (
    sessionDraft: Omit<CombatSession, 'id' | 'createdAt' | 'updatedAt'> & { id?: EntityId }
  ) => Promise<CombatSession>;
  deleteCombatSession: (sessionId: EntityId) => Promise<void>;
  saveDrillCircuit: (
    circuitDraft: Omit<DrillCircuit, 'id' | 'createdAt' | 'updatedAt'> & { id?: EntityId }
  ) => Promise<DrillCircuit>;
  deleteDrillCircuit: (circuitId: EntityId) => Promise<void>;

  // Suivi physique (Poids & Mensurations)
  saveWeightEntry: (entry: {
    id?: EntityId;
    civilDate: CivilDate;
    weightKg: number;
    notes?: string;
  }) => Promise<WeightEntry>;
  deleteWeightEntry: (id: EntityId) => Promise<void>;
  saveBodyMeasurement: (
    measurement: Omit<BodyMeasurement, 'id' | 'createdAt' | 'updatedAt'> & { id?: EntityId }
  ) => Promise<BodyMeasurement>;
  deleteBodyMeasurement: (id: EntityId) => Promise<void>;

  // Nutrition, Récupération & Rappels
  saveNutritionTarget: (target: Omit<NutritionTarget, 'id' | 'updatedAt'>) => Promise<void>;
  saveRecoveryCheckIn: (
    checkIn: Omit<RecoveryCheckIn, 'id' | 'createdAt'>
  ) => Promise<RecoveryCheckIn>;
  saveReminder: (
    reminder: Omit<Reminder, 'id' | 'updatedAt'> & { id?: EntityId }
  ) => Promise<Reminder>;
  deleteReminder: (id: EntityId) => Promise<void>;

  // Sauvegarde, Import, Mode Démo & Réinitialisation
  importDatabaseFromJson: (rawJson: string) => Promise<{ ok: boolean; error?: string }>;
  activateDemoDataset: () => Promise<void>;
  resetAllLocalData: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => {
  const persistNextSnapshot = async (next: StandPowerDatabaseSnapshot) => {
    await storageEngine.saveSnapshotAtomically(next);
    set({
      snapshot: next,
      lastSavedAt: new Date().toISOString(),
    });
  };

  return {
    isHydrated: false,
    hydrationError: null,
    lastSavedAt: null,
    snapshot: createEmptyDatabaseSnapshot(),
    undoWorkoutSnapshot: null,
    undoLabel: null,

    getAllExercises: () => {
      const { customExercises, favoriteExerciseIds } = get().snapshot;
      const favSet = new Set(favoriteExerciseIds);
      const merged = [...BUILTIN_EXERCISES, ...customExercises].map((ex) => ({
        ...ex,
        isFavorite: favSet.has(ex.id),
      }));
      return merged;
    },

    getAllDrills: () => {
      return BUILTIN_DRILLS;
    },

    getActiveWorkout: () => {
      const sessions = get().snapshot.workoutSessions;
      return (
        sessions.find((s) => s.status === 'in_progress' || s.status === 'paused') ?? null
      );
    },

    hydrate: async () => {
      try {
        const loaded = await storageEngine.initialize();
        set({
          snapshot: loaded,
          isHydrated: true,
          hydrationError: null,
        });
      } catch (err) {
        set({
          isHydrated: true,
          hydrationError:
            err instanceof Error ? err.message : 'Erreur lors du chargement des données locales.',
        });
      }
    },

    updatePreferences: async (patch) => {
      const current = get().snapshot;
      const nextPrefs: UserPreferences = {
        ...current.userPreferences,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await persistNextSnapshot({
        ...current,
        userPreferences: nextPrefs,
      });
    },

    updateUserProfile: async (patch) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const baseProfile: UserProfile = current.userProfile ?? {
        id: 'profile_main',
        displayName: '',
        ageYears: 28,
        heightCm: 175,
        weightKg: 75,
        metabolicParameter: 'unspecified',
        experienceLevel: 'beginner',
        primaryGoal: 'general_fitness',
        availableEquipment: ['dumbbells', 'bench'],
        availableDays: ['mon', 'wed', 'fri'],
        desiredSessionsPerWeek: 3,
        sessionDurationMinutes: 45,
        combatDiscipline: 'none',
        combatSessionsPerWeek: 0,
        combatDays: [],
        combatIntensity: 'moderate',
        createdAt: now,
        updatedAt: now,
      };

      const updatedProfile: UserProfile = {
        ...baseProfile,
        ...patch,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        userProfile: updatedProfile,
      });
    },

    computeRecommendationPreview: (answers) => {
      const templates = get().snapshot.programTemplates;
      const exercises = get().getAllExercises();
      return generateDeterministicRecommendation(
        answers,
        templates,
        exercises,
        new Date().toISOString()
      );
    },

    saveQuestionnaireAndApplyProgram: async (answers, chosenProgramTemplateId) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const exercises = get().getAllExercises();
      const templates = current.programTemplates.length > 0 ? current.programTemplates : BUILTIN_PROGRAMS;

      const recommendation = generateDeterministicRecommendation(
        answers,
        templates,
        exercises,
        now
      );

      const finalTemplateId =
        chosenProgramTemplateId ?? recommendation.recommendedProgramTemplateId;
      const selectedTemplate =
        templates.find((t) => t.id === finalTemplateId) ?? templates[0];

      const nextProfile: UserProfile = {
        id: current.userProfile?.id ?? 'profile_main',
        displayName: answers.displayName?.trim() ?? '',
        ageYears: answers.ageYears,
        heightCm: answers.heightCm,
        weightKg: answers.weightKg,
        metabolicParameter: answers.metabolicParameter,
        experienceLevel: answers.experienceLevel,
        primaryGoal: answers.primaryGoal,
        availableEquipment: answers.availableEquipment,
        availableDays: answers.availableDays,
        desiredSessionsPerWeek: answers.desiredSessionsPerWeek,
        sessionDurationMinutes: answers.sessionDurationMinutes,
        combatDiscipline: answers.combatDiscipline,
        combatSessionsPerWeek: answers.combatSessionsPerWeek,
        combatDays: answers.combatDays,
        combatIntensity: answers.combatIntensity,
        createdAt: current.userProfile?.createdAt ?? now,
        updatedAt: now,
      };

      // Archiver l'éventuel programme actif précédent sans détruire l'historique
      const archivedInstances = current.programInstances.map((inst) =>
        inst.status === 'active'
          ? { ...inst, status: 'archived' as const, updatedAt: now }
          : inst
      );

      // Si c'est le modèle recommandé, utiliser les exercices adaptés au matériel/exclusions
      const adaptedSessionsForInstance: ProgramSessionTemplate[] =
        finalTemplateId === recommendation.recommendedProgramTemplateId
          ? recommendation.sessionPrescriptions.map((sp, idx) => ({
              id: sp.sessionKey,
              title: sp.title,
              dayOrder: idx + 1,
              estimatedDurationMinutes: recommendation.estimatedSessionDurationMinutes,
              warmup: [sp.warmupNotes],
              exercises: sp.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                repMin: ex.repRangeMin,
                repMax: ex.repRangeMax,
                durationSeconds: ex.durationSeconds,
                restSeconds: ex.restSeconds,
                targetRpeOrRir: ex.targetRir,
                progressionIncrementKg: 2.0,
                isCoreLift: true,
                notes: ex.notes,
              })),
            }))
          : selectedTemplate.sessions.map((s) => ({ ...s, exercises: [...s.exercises] }));

      const newInstance: ProgramInstance = {
        id: generateId('prog_inst'),
        templateId: selectedTemplate.id,
        customName: selectedTemplate.nameFr,
        status: 'active',
        currentWeek: 1,
        assignedDays: answers.availableDays,
        sessions: adaptedSessionsForInstance,
        startedAt: now,
        updatedAt: now,
      };

      // Planifier les prochaines séances sur les 7 prochains jours civils sans supprimer les séances passées
      const todayCivil = getLocalCivilDate();
      const preservedSchedules = current.scheduledSessions.filter(
        (s) => s.status === 'completed' || s.scheduledDate < todayCivil
      );

      const newScheduled: ScheduledSession[] = [];
      for (let offset = 0; offset < 7; offset++) {
        const dateStr = addDaysToCivilDate(todayCivil, offset);
        const [y, m, d] = dateStr.split('-').map(Number);
        const jsDay = new Date(y, m - 1, d, 12, 0, 0).getDay();
        const dayMap: Record<number, UserProfile['availableDays'][number]> = {
          1: 'mon',
          2: 'tue',
          3: 'wed',
          4: 'thu',
          5: 'fri',
          6: 'sat',
          0: 'sun',
        };
        const slot = recommendation.weeklySchedule.find(
          (w) => w.day === dayMap[jsDay]
        );
        if (slot && slot.activityType === 'strength') {
          const matchingSession =
            newInstance.sessions.find((s) => s.id === slot.templateSessionId) ??
            newInstance.sessions[0];
          newScheduled.push({
            id: generateId('sched'),
            programInstanceId: newInstance.id,
            sessionTemplateId: matchingSession?.id,
            title: matchingSession?.title ?? slot.title,
            sessionType: 'strength',
            scheduledDate: dateStr,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
          });
        } else if (slot && slot.activityType === 'combat') {
          newScheduled.push({
            id: generateId('sched'),
            title: slot.title,
            sessionType: 'combat',
            scheduledDate: dateStr,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Enregistrer également le poids initial s'il n'y a aucune pesée existante
      const nextWeights = [...current.weightEntries];
      if (nextWeights.length === 0 && answers.weightKg > 0) {
        nextWeights.push({
          id: generateId('weight'),
          civilDate: todayCivil,
          weightKg: answers.weightKg,
          notes: 'Poids initial renseigné au questionnaire',
          createdAt: now,
          updatedAt: now,
        });
      }

      const nextNutritionTarget: NutritionTarget = {
        id: 'nutri_target_main',
        mode: recommendation.nutritionSummary.targetKcal.mode,
        activityLevel: answers.dailyActivityLevel,
        bmrKcalMin: recommendation.nutritionSummary.bmrEstimateKcal.min,
        bmrKcalMax: recommendation.nutritionSummary.bmrEstimateKcal.max,
        tdeeKcalMin: recommendation.nutritionSummary.tdeeEstimateKcal.min,
        tdeeKcalMax: recommendation.nutritionSummary.tdeeEstimateKcal.max,
        targetKcalMin: recommendation.nutritionSummary.targetKcal.min,
        targetKcalMax: recommendation.nutritionSummary.targetKcal.max,
        proteinMinG: recommendation.nutritionSummary.proteinRangeGramsPerDay?.min ?? 0,
        proteinMaxG: recommendation.nutritionSummary.proteinRangeGramsPerDay?.max ?? 0,
        confirmedByUser: true,
        updatedAt: now,
      };

      const nextPrefs: UserPreferences = {
        ...current.userPreferences,
        weightUnit: answers.preferredWeightUnit,
        nutritionGuidanceStyle: answers.nutritionGuidanceStyle,
        onboardingCompleted: true,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        userProfile: nextProfile,
        userPreferences: nextPrefs,
        questionnaireAnswers: { ...answers, updatedAt: now },
        recommendationResult: recommendation,
        programInstances: [...archivedInstances, newInstance],
        scheduledSessions: [...preservedSchedules, ...newScheduled],
        weightEntries: nextWeights,
        nutritionTarget: nextNutritionTarget,
      });

      return recommendation;
    },

    toggleFavoriteExercise: async (exerciseId) => {
      const current = get().snapshot;
      const exists = current.favoriteExerciseIds.includes(exerciseId);
      const nextFavs = exists
        ? current.favoriteExerciseIds.filter((id) => id !== exerciseId)
        : [...current.favoriteExerciseIds, exerciseId];

      await persistNextSnapshot({
        ...current,
        favoriteExerciseIds: nextFavs,
      });
    },

    saveCustomExercise: async (draft) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = draft.id
        ? current.customExercises.findIndex((e) => e.id === draft.id)
        : -1;

      const exercise: Exercise = {
        ...draft,
        id: draft.id ?? generateId('ex_custom'),
        isCustom: true,
        isFavorite:
          existingIdx >= 0 ? current.customExercises[existingIdx].isFavorite : false,
        createdAt:
          existingIdx >= 0 ? current.customExercises[existingIdx].createdAt : now,
        updatedAt: now,
      };

      const nextCustom =
        existingIdx >= 0
          ? current.customExercises.map((e, i) => (i === existingIdx ? exercise : e))
          : [...current.customExercises, exercise];

      await persistNextSnapshot({
        ...current,
        customExercises: nextCustom,
      });

      return exercise;
    },

    activateProgramTemplate: async (templateId, assignedDays) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const tpl =
        current.programTemplates.find((t) => t.id === templateId) ?? BUILTIN_PROGRAMS[0];

      const days =
        assignedDays ??
        current.userProfile?.availableDays ??
        (['mon', 'wed', 'fri'] as UserProfile['availableDays']);

      const updatedInstances = current.programInstances.map((inst) =>
        inst.status === 'active'
          ? { ...inst, status: 'archived' as const, updatedAt: now }
          : inst
      );

      const newInstance: ProgramInstance = {
        id: generateId('prog_inst'),
        templateId: tpl.id,
        customName: tpl.nameFr,
        status: 'active',
        currentWeek: 1,
        assignedDays: days,
        sessions: tpl.sessions.map((s) => ({
          ...s,
          exercises: s.exercises.map((e) => ({ ...e })),
        })),
        startedAt: now,
        updatedAt: now,
      };

      const todayCivil = getLocalCivilDate();
      const preservedSchedules = current.scheduledSessions.filter(
        (s) => s.status === 'completed' || s.scheduledDate < todayCivil
      );

      const newScheduled: ScheduledSession[] = newInstance.sessions.map((sess, idx) => ({
        id: generateId('sched'),
        programInstanceId: newInstance.id,
        sessionTemplateId: sess.id,
        title: sess.title,
        sessionType: 'strength',
        scheduledDate: addDaysToCivilDate(todayCivil, idx * 2),
        status: 'planned',
        createdAt: now,
        updatedAt: now,
      }));

      await persistNextSnapshot({
        ...current,
        programInstances: [...updatedInstances, newInstance],
        scheduledSessions: [...preservedSchedules, ...newScheduled],
      });

      return newInstance;
    },

    duplicateProgramTemplate: async (templateId, newName) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const source =
        current.programTemplates.find((t) => t.id === templateId) ?? BUILTIN_PROGRAMS[0];

      const duplicated: ProgramTemplate = {
        ...source,
        id: generateId('prog_custom'),
        slug: `${source.slug}-copie-${Date.now()}`,
        nameFr: newName.trim() || `${source.nameFr} (Copie)`,
        isBuiltIn: false,
        isArchived: false,
        sessions: source.sessions.map((s) => ({
          ...s,
          id: generateId('sess_tpl'),
          exercises: s.exercises.map((e) => ({ ...e })),
        })),
        createdAt: now,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        programTemplates: [...current.programTemplates, duplicated],
      });

      return duplicated;
    },

    archiveProgramTemplate: async (templateId) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const nextTemplates = current.programTemplates.map((t) =>
        t.id === templateId ? { ...t, isArchived: true, updatedAt: now } : t
      );
      await persistNextSnapshot({
        ...current,
        programTemplates: nextTemplates,
      });
    },

    replaceExerciseInActiveProgram: async (
      sessionTemplateId,
      oldExerciseId,
      newExerciseId
    ) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const nextInstances = current.programInstances.map((inst) => {
        if (inst.status !== 'active') return inst;
        return {
          ...inst,
          updatedAt: now,
          sessions: inst.sessions.map((sess) => {
            if (sess.id !== sessionTemplateId) return sess;
            return {
              ...sess,
              exercises: sess.exercises.map((ex) =>
                ex.exerciseId === oldExerciseId
                  ? { ...ex, exerciseId: newExerciseId }
                  : ex
              ),
            };
          }),
        };
      });

      await persistNextSnapshot({
        ...current,
        programInstances: nextInstances,
      });
    },

    postponeScheduledSession: async (scheduledId, daysToShift = 1) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const nextScheduled = current.scheduledSessions.map((s) => {
        if (s.id !== scheduledId) return s;
        return {
          ...s,
          originalDate: s.originalDate ?? s.scheduledDate,
          scheduledDate: addDaysToCivilDate(s.scheduledDate, daysToShift),
          status: 'postponed' as const,
          updatedAt: now,
        };
      });
      await persistNextSnapshot({
        ...current,
        scheduledSessions: nextScheduled,
      });
    },

    scheduleCustomSession: async (sessionDraft) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const created: ScheduledSession = {
        ...sessionDraft,
        id: generateId('sched'),
        createdAt: now,
        updatedAt: now,
      };
      await persistNextSnapshot({
        ...current,
        scheduledSessions: [...current.scheduledSessions, created],
      });
    },

    startFreeWorkout: async (title, initialExerciseIds = []) => {
      const current = get().snapshot;
      const existingActive = get().getActiveWorkout();
      if (existingActive) return existingActive;

      const now = new Date().toISOString();
      const todayCivil = getLocalCivilDate();
      const allExercises = get().getAllExercises();
      const sessionId = generateId('ws');

      const workoutExercises: WorkoutExercise[] = initialExerciseIds
        .map((exId, idx): WorkoutExercise | null => {
          const ex = allExercises.find((e) => e.id === exId);
          if (!ex) return null;
          const weId = generateId('we');
          return {
            id: weId,
            workoutSessionId: sessionId,
            exerciseId: ex.id,
            exerciseNameSnapshot: ex.nameFr,
            measurementTypeSnapshot: ex.measurementType,
            isUnilateralSnapshot: ex.isUnilateral,
            unilateralConventionSnapshot: ex.unilateralConvention,
            orderIndex: idx,
            restSeconds: 90,
            sets: [
              {
                id: generateId('set'),
                workoutExerciseId: weId,
                setOrder: 1,
                setType: 'working' as const,
                isCompleted: false,
              },
            ],
          };
        })
        .filter((x): x is WorkoutExercise => x !== null);

      const newSession: WorkoutSession = {
        id: sessionId,
        title: title?.trim() || 'Séance libre de musculation',
        civilDate: todayCivil,
        status: 'in_progress',
        startedAt: now,
        accumulatedPauseSeconds: 0,
        durationSeconds: 0,
        activeRestTimer: null,
        notes: '',
        exercises: workoutExercises,
        createdAt: now,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: [newSession, ...current.workoutSessions],
      });

      return newSession;
    },

    startWorkoutFromProgramSession: async (
      sessionTemplate,
      programInstance,
      adjustment = 'none'
    ) => {
      const current = get().snapshot;
      const existingActive = get().getActiveWorkout();
      if (existingActive) return existingActive;

      const now = new Date().toISOString();
      const todayCivil = getLocalCivilDate();
      const allExercises = get().getAllExercises();
      const sessionId = generateId('ws');

      // Rechercher les dernières performances par exercice pour pré-informer l'utilisateur
      // (sans jamais inventer de charge à partir du poids corporel !)
      const completedSessions = current.workoutSessions.filter(
        (s) => s.status === 'completed'
      );

      const workoutExercises: WorkoutExercise[] = sessionTemplate.exercises.map(
        (tplEx, idx) => {
          const catalogEx =
            allExercises.find((e) => e.id === tplEx.exerciseId) ?? allExercises[0];
          const weId = generateId('we');

          const previousExerciseEntry = completedSessions
            .flatMap((s) => s.exercises)
            .find((e) => e.exerciseId === catalogEx.id);

          const prevWorkingSets =
            previousExerciseEntry?.sets.filter(
              (s) => s.isCompleted && s.setType === 'working'
            ) ?? [];

          const adjustedSetsCount =
            adjustment === 'reduced_volume' || adjustment === 'lighter_session'
              ? Math.max(2, tplEx.sets - 1)
              : tplEx.sets;

          const sets: WorkoutSet[] = Array.from({ length: adjustedSetsCount }).map(
            (_, setIdx) => {
              const prevSet = prevWorkingSets[setIdx] ?? prevWorkingSets[0];
              return {
                id: generateId('set'),
                workoutExerciseId: weId,
                setOrder: setIdx + 1,
                setType: 'working',
                plannedWeightKg: prevSet?.weightKg,
                plannedReps: tplEx.repMax ?? tplEx.repMin,
                weightKg: prevSet?.weightKg,
                reps: tplEx.repMin,
                durationSeconds: tplEx.durationSeconds,
                isCompleted: false,
              };
            }
          );

          return {
            id: weId,
            workoutSessionId: sessionId,
            exerciseId: catalogEx.id,
            exerciseNameSnapshot: catalogEx.nameFr,
            measurementTypeSnapshot: catalogEx.measurementType,
            isUnilateralSnapshot: catalogEx.isUnilateral,
            unilateralConventionSnapshot: catalogEx.unilateralConvention,
            orderIndex: idx,
            restSeconds: tplEx.restSeconds,
            targetRepMin: tplEx.repMin,
            targetRepMax: tplEx.repMax,
            targetRir:
              adjustment === 'lighter_session'
                ? '3–4 RIR (Séance allégée)'
                : tplEx.targetRpeOrRir,
            notes: tplEx.notes,
            sets,
          };
        }
      );

      const newSession: WorkoutSession = {
        id: sessionId,
        programInstanceId: programInstance?.id,
        programNameSnapshot: programInstance?.customName,
        sessionTemplateId: sessionTemplate.id,
        title: sessionTemplate.title,
        civilDate: todayCivil,
        status: 'in_progress',
        startedAt: now,
        accumulatedPauseSeconds: 0,
        durationSeconds: 0,
        activeRestTimer: null,
        recoveryAdjustmentApplied: adjustment,
        notes: '',
        exercises: workoutExercises,
        createdAt: now,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: [newSession, ...current.workoutSessions],
      });

      return newSession;
    },

    addExerciseToActiveWorkout: async (exerciseId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const ex = get()
        .getAllExercises()
        .find((e) => e.id === exerciseId);
      if (!ex) return;

      const weId = generateId('we');
      const newWe: WorkoutExercise = {
        id: weId,
        workoutSessionId: active.id,
        exerciseId: ex.id,
        exerciseNameSnapshot: ex.nameFr,
        measurementTypeSnapshot: ex.measurementType,
        isUnilateralSnapshot: ex.isUnilateral,
        unilateralConventionSnapshot: ex.unilateralConvention,
        orderIndex: active.exercises.length,
        restSeconds: 90,
        targetRepMin: 8,
        targetRepMax: 12,
        targetRir: '2 RIR',
        sets: [
          {
            id: generateId('set'),
            workoutExerciseId: weId,
            setOrder: 1,
            setType: 'working',
            durationSeconds: ex.measurementType === 'duration' ? 40 : undefined,
            isCompleted: false,
          },
        ],
      };

      const updated: WorkoutSession = {
        ...active,
        exercises: [...active.exercises, newWe],
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    removeExerciseFromActiveWorkout: async (workoutExerciseId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const removedEx = active.exercises.find((e) => e.id === workoutExerciseId);
      set({
        undoWorkoutSnapshot: active,
        undoLabel: removedEx
          ? `Exercice « ${removedEx.exerciseNameSnapshot} » retiré`
          : 'Exercice retiré',
      });

      const updated: WorkoutSession = {
        ...active,
        exercises: active.exercises
          .filter((e) => e.id !== workoutExerciseId)
          .map((e, i) => ({ ...e, orderIndex: i })),
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    moveExerciseInActiveWorkout: async (workoutExerciseId, direction) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const idx = active.exercises.findIndex((e) => e.id === workoutExerciseId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= active.exercises.length) return;

      const copy = [...active.exercises];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);

      const updated: WorkoutSession = {
        ...active,
        exercises: copy.map((e, i) => ({ ...e, orderIndex: i })),
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    addSetToWorkoutExercise: async (workoutExerciseId, setType = 'working') => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        updatedAt: new Date().toISOString(),
        exercises: active.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: generateId('set'),
            workoutExerciseId: ex.id,
            setOrder: ex.sets.length + 1,
            setType,
            weightKg: lastSet?.weightKg,
            reps: lastSet?.reps ?? ex.targetRepMin,
            durationSeconds: lastSet?.durationSeconds,
            isCompleted: false,
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet],
          };
        }),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    duplicateSetInWorkoutExercise: async (workoutExerciseId, setId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        updatedAt: new Date().toISOString(),
        exercises: active.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const sourceSet = ex.sets.find((s) => s.id === setId);
          if (!sourceSet) return ex;
          const dup: WorkoutSet = {
            ...sourceSet,
            id: generateId('set'),
            setOrder: ex.sets.length + 1,
            isCompleted: false,
            completedAt: undefined,
          };
          return {
            ...ex,
            sets: [...ex.sets, dup],
          };
        }),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    updateWorkoutSet: async (workoutExerciseId, setId, patch) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        updatedAt: new Date().toISOString(),
        exercises: active.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          };
        }),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    toggleCompleteWorkoutSet: async (workoutExerciseId, setId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return null;

      let triggeredRest: { restDurationSeconds: number; exerciseId: EntityId } | null =
        null;
      const now = new Date().toISOString();

      const updated: WorkoutSession = {
        ...active,
        updatedAt: now,
        exercises: active.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              const nextComplete = !s.isCompleted;
              if (nextComplete) {
                triggeredRest = {
                  restDurationSeconds: ex.restSeconds || 90,
                  exerciseId: ex.exerciseId,
                };
              }
              return {
                ...s,
                isCompleted: nextComplete,
                completedAt: nextComplete ? now : undefined,
              };
            }),
          };
        }),
      };

      if (triggeredRest) {
        updated.activeRestTimer = {
          startedAtMs: Date.now(),
          durationSeconds: (
            triggeredRest as { restDurationSeconds: number; exerciseId: EntityId }
          ).restDurationSeconds,
          exerciseId: (
            triggeredRest as { restDurationSeconds: number; exerciseId: EntityId }
          ).exerciseId,
        };
      }

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });

      return triggeredRest;
    },

    deleteSetFromWorkoutExercise: async (workoutExerciseId, setId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      set({
        undoWorkoutSnapshot: active,
        undoLabel: 'Série supprimée',
      });

      const updated: WorkoutSession = {
        ...active,
        updatedAt: new Date().toISOString(),
        exercises: active.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const remaining = ex.sets
            .filter((s) => s.id !== setId)
            .map((s, idx) => ({ ...s, setOrder: idx + 1 }));
          return {
            ...ex,
            sets: remaining,
          };
        }),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    undoLastWorkoutChange: async () => {
      const { undoWorkoutSnapshot, snapshot } = get();
      if (!undoWorkoutSnapshot) return;

      set({ undoWorkoutSnapshot: null, undoLabel: null });
      await persistNextSnapshot({
        ...snapshot,
        workoutSessions: snapshot.workoutSessions.map((s) =>
          s.id === undoWorkoutSnapshot.id ? undoWorkoutSnapshot : s
        ),
      });
    },

    startWorkoutRestTimer: async (durationSeconds, exerciseId) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        activeRestTimer: {
          startedAtMs: Date.now(),
          durationSeconds,
          exerciseId,
        },
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    clearWorkoutRestTimer: async () => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        activeRestTimer: null,
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    pauseActiveWorkout: async () => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active || active.status !== 'in_progress') return;

      const now = new Date().toISOString();
      const updated: WorkoutSession = {
        ...active,
        status: 'paused',
        pausedAt: now,
        updatedAt: now,
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    resumeActiveWorkout: async () => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active || active.status !== 'paused') return;

      const nowMs = Date.now();
      const pausedAtMs = active.pausedAt ? new Date(active.pausedAt).getTime() : nowMs;
      const deltaSec = Math.max(0, Math.round((nowMs - pausedAtMs) / 1000));

      const updated: WorkoutSession = {
        ...active,
        status: 'in_progress',
        pausedAt: undefined,
        accumulatedPauseSeconds: active.accumulatedPauseSeconds + deltaSec,
        updatedAt: new Date(nowMs).toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    updateActiveWorkoutNotes: async (notes) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      const updated: WorkoutSession = {
        ...active,
        notes,
        updatedAt: new Date().toISOString(),
      };

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? updated : s
        ),
      });
    },

    finishActiveWorkout: async ({ perceivedFeeling, notes, durationSecondsOverride }) => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return null;

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const startedMs = new Date(active.startedAt).getTime();
      const rawDurationSec = Math.max(
        60,
        Math.round((nowMs - startedMs) / 1000) - active.accumulatedPauseSeconds
      );

      const completedSession: WorkoutSession = {
        ...active,
        status: 'completed',
        completedAt: nowIso,
        pausedAt: undefined,
        activeRestTimer: null,
        durationSeconds: durationSecondsOverride ?? rawDurationSec,
        perceivedFeeling: perceivedFeeling ?? active.perceivedFeeling ?? 'good',
        notes: notes !== undefined ? notes : active.notes,
        updatedAt: nowIso,
      };

      const todayCivil = getLocalCivilDate();
      const nextScheduled = current.scheduledSessions.map((sched) => {
        if (
          sched.status === 'planned' &&
          sched.sessionType === 'strength' &&
          (sched.sessionTemplateId === active.sessionTemplateId ||
            sched.scheduledDate === todayCivil)
        ) {
          return {
            ...sched,
            status: 'completed' as const,
            linkedWorkoutSessionId: completedSession.id,
            updatedAt: nowIso,
          };
        }
        return sched;
      });

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === active.id ? completedSession : s
        ),
        scheduledSessions: nextScheduled,
      });

      return completedSession;
    },

    abandonActiveWorkout: async () => {
      const current = get().snapshot;
      const active = get().getActiveWorkout();
      if (!active) return;

      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.filter((s) => s.id !== active.id),
      });
    },

    updateHistoricalWorkoutSession: async (updatedSession) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const normalized: WorkoutSession = {
        ...updatedSession,
        updatedAt: now,
      };
      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.map((s) =>
          s.id === normalized.id ? normalized : s
        ),
      });
    },

    deleteWorkoutSession: async (sessionId) => {
      const current = get().snapshot;
      await persistNextSnapshot({
        ...current,
        workoutSessions: current.workoutSessions.filter((s) => s.id !== sessionId),
      });
    },

    saveCombatSession: async (sessionDraft) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = sessionDraft.id
        ? current.combatSessions.findIndex((c) => c.id === sessionDraft.id)
        : -1;

      const combatSession: CombatSession = {
        ...sessionDraft,
        id: sessionDraft.id ?? generateId('combat'),
        createdAt:
          existingIdx >= 0 ? current.combatSessions[existingIdx].createdAt : now,
        updatedAt: now,
      };

      const nextCombat =
        existingIdx >= 0
          ? current.combatSessions.map((c, i) =>
              i === existingIdx ? combatSession : c
            )
          : [combatSession, ...current.combatSessions];

      await persistNextSnapshot({
        ...current,
        combatSessions: nextCombat,
      });

      return combatSession;
    },

    deleteCombatSession: async (sessionId) => {
      const current = get().snapshot;
      await persistNextSnapshot({
        ...current,
        combatSessions: current.combatSessions.filter((c) => c.id !== sessionId),
      });
    },

    saveDrillCircuit: async (circuitDraft) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = circuitDraft.id
        ? current.drillCircuits.findIndex((c) => c.id === circuitDraft.id)
        : -1;

      const circuit: DrillCircuit = {
        ...circuitDraft,
        id: circuitDraft.id ?? generateId('circuit'),
        createdAt:
          existingIdx >= 0 ? current.drillCircuits[existingIdx].createdAt : now,
        updatedAt: now,
      };

      const nextCircuits =
        existingIdx >= 0
          ? current.drillCircuits.map((c, i) => (i === existingIdx ? circuit : c))
          : [circuit, ...current.drillCircuits];

      await persistNextSnapshot({
        ...current,
        drillCircuits: nextCircuits,
      });

      return circuit;
    },

    deleteDrillCircuit: async (circuitId) => {
      const current = get().snapshot;
      await persistNextSnapshot({
        ...current,
        drillCircuits: current.drillCircuits.filter((c) => c.id !== circuitId),
      });
    },

    saveWeightEntry: async (entry) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = entry.id
        ? current.weightEntries.findIndex((w) => w.id === entry.id)
        : -1;

      const saved: WeightEntry = {
        id: entry.id ?? generateId('weight'),
        civilDate: entry.civilDate,
        weightKg: entry.weightKg,
        notes: entry.notes,
        createdAt:
          existingIdx >= 0 ? current.weightEntries[existingIdx].createdAt : now,
        updatedAt: now,
      };

      const nextWeights =
        existingIdx >= 0
          ? current.weightEntries.map((w, i) => (i === existingIdx ? saved : w))
          : [...current.weightEntries, saved].sort((a, b) =>
              b.civilDate.localeCompare(a.civilDate)
            );

      const nextProfile = current.userProfile
        ? { ...current.userProfile, weightKg: entry.weightKg, updatedAt: now }
        : null;

      await persistNextSnapshot({
        ...current,
        weightEntries: nextWeights,
        userProfile: nextProfile,
      });

      return saved;
    },

    deleteWeightEntry: async (id) => {
      const current = get().snapshot;
      await persistNextSnapshot({
        ...current,
        weightEntries: current.weightEntries.filter((w) => w.id !== id),
      });
    },

    saveBodyMeasurement: async (measurement) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = measurement.id
        ? current.bodyMeasurements.findIndex((m) => m.id === measurement.id)
        : -1;

      const saved: BodyMeasurement = {
        ...measurement,
        id: measurement.id ?? generateId('meas'),
        createdAt:
          existingIdx >= 0 ? current.bodyMeasurements[existingIdx].createdAt : now,
        updatedAt: now,
      };

      const nextMeas =
        existingIdx >= 0
          ? current.bodyMeasurements.map((m, i) => (i === existingIdx ? saved : m))
          : [...current.bodyMeasurements, saved].sort((a, b) =>
              b.civilDate.localeCompare(a.civilDate)
            );

      await persistNextSnapshot({
        ...current,
        bodyMeasurements: nextMeas,
      });

      return saved;
    },

    deleteBodyMeasurement: async (id) => {
      const current = get().snapshot;
      await persistNextSnapshot({
        ...current,
        bodyMeasurements: current.bodyMeasurements.filter((m) => m.id !== id),
      });
    },

    saveNutritionTarget: async (target) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      await persistNextSnapshot({
        ...current,
        nutritionTarget: {
          ...target,
          id: 'nutri_target_main',
          updatedAt: now,
        },
      });
    },

    saveRecoveryCheckIn: async (checkIn) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const created: RecoveryCheckIn = {
        ...checkIn,
        id: generateId('checkin'),
        createdAt: now,
      };
      const filtered = current.recoveryCheckIns.filter(
        (c) => c.civilDate !== checkIn.civilDate
      );
      await persistNextSnapshot({
        ...current,
        recoveryCheckIns: [created, ...filtered],
      });
      return created;
    },

    saveReminder: async (reminderDraft) => {
      const current = get().snapshot;
      const now = new Date().toISOString();
      const existingIdx = reminderDraft.id
        ? current.reminders.findIndex((r) => r.id === reminderDraft.id)
        : -1;

      const saved: Reminder = {
        ...reminderDraft,
        id: reminderDraft.id ?? generateId('rem'),
        updatedAt: now,
      };

      const nextReminders =
        existingIdx >= 0
          ? current.reminders.map((r, i) => (i === existingIdx ? saved : r))
          : [...current.reminders, saved];

      await persistNextSnapshot({
        ...current,
        reminders: nextReminders,
      });

      await syncLocalReminders(
        nextReminders,
        current.userPreferences.quietHoursStart,
        current.userPreferences.quietHoursEnd
      );

      return saved;
    },

    deleteReminder: async (id) => {
      const current = get().snapshot;
      const nextReminders = current.reminders.filter((r) => r.id !== id);
      await persistNextSnapshot({
        ...current,
        reminders: nextReminders,
      });
      await syncLocalReminders(
        nextReminders,
        current.userPreferences.quietHoursStart,
        current.userPreferences.quietHoursEnd
      );
    },

    importDatabaseFromJson: async (rawJson) => {
      const validation = validateBackupJson(rawJson);
      if (!validation.valid || !validation.snapshot) {
        return {
          ok: false,
          error: validation.errorMessage ?? 'Sauvegarde invalide.',
        };
      }

      const migrated = storageEngine.migrateSnapshotIfNeeded(validation.snapshot);
      await persistNextSnapshot(migrated);
      return { ok: true };
    },

    activateDemoDataset: async () => {
      const now = new Date().toISOString();
      const today = getLocalCivilDate();
      const dMinus2 = addDaysToCivilDate(today, -2);
      const dMinus5 = addDaysToCivilDate(today, -5);
      const dMinus9 = addDaysToCivilDate(today, -9);

      const demoSnapshot = createEmptyDatabaseSnapshot();
      demoSnapshot.userPreferences.onboardingCompleted = true;
      demoSnapshot.userPreferences.demoModeActive = true;
      demoSnapshot.userProfile = {
        id: 'profile_demo',
        displayName: 'Alex (Mode Démo)',
        ageYears: 29,
        heightCm: 178,
        weightKg: 77.4,
        metabolicParameter: 'male_equation',
        experienceLevel: 'intermediate',
        primaryGoal: 'combat_complement',
        availableEquipment: ['barbell_plates', 'dumbbells', 'bench', 'rack', 'mat'],
        availableDays: ['mon', 'wed', 'fri', 'sat'],
        desiredSessionsPerWeek: 2,
        sessionDurationMinutes: 45,
        combatDiscipline: 'bjj',
        combatSessionsPerWeek: 3,
        combatDays: ['tue', 'thu', 'sat'],
        combatIntensity: 'moderate',
        createdAt: now,
        updatedAt: now,
      };

      demoSnapshot.weightEntries = [
        { id: 'w_1', civilDate: dMinus9, weightKg: 78.0, notes: 'Pesée matin', createdAt: now, updatedAt: now },
        { id: 'w_2', civilDate: dMinus5, weightKg: 77.6, notes: 'Après repos', createdAt: now, updatedAt: now },
        { id: 'w_3', civilDate: dMinus2, weightKg: 77.5, createdAt: now, updatedAt: now },
        { id: 'w_4', civilDate: today, weightKg: 77.4, notes: 'Stable', createdAt: now, updatedAt: now },
      ];

      demoSnapshot.bodyMeasurements = [
        { id: 'm_1', civilDate: dMinus9, waistCm: 81.5, chestCm: 102, armCm: 36.5, thighCm: 57, createdAt: now, updatedAt: now },
        { id: 'm_2', civilDate: today, waistCm: 81.0, chestCm: 102.5, armCm: 36.8, thighCm: 57.5, createdAt: now, updatedAt: now },
      ];

      demoSnapshot.workoutSessions = [
        {
          id: 'ws_demo_1',
          title: 'JJB Force A — Squat, Tirage & Pontage',
          civilDate: dMinus5,
          status: 'completed',
          startedAt: now,
          completedAt: now,
          accumulatedPauseSeconds: 0,
          durationSeconds: 2640,
          perceivedFeeling: 'good',
          notes: 'Bonne tonicité, 2 RIR respectés.',
          exercises: [
            {
              id: 'we_d1',
              workoutSessionId: 'ws_demo_1',
              exerciseId: 'ex_back_squat',
              exerciseNameSnapshot: 'Squat barre (Back Squat)',
              measurementTypeSnapshot: 'weight_reps',
              isUnilateralSnapshot: false,
              orderIndex: 0,
              restSeconds: 150,
              sets: [
                { id: 's_d1', workoutExerciseId: 'we_d1', setOrder: 1, setType: 'warmup', weightKg: 60, reps: 5, isCompleted: true },
                { id: 's_d2', workoutExerciseId: 'we_d1', setOrder: 2, setType: 'working', weightKg: 90, reps: 6, rir: 2, isCompleted: true },
                { id: 's_d3', workoutExerciseId: 'we_d1', setOrder: 3, setType: 'working', weightKg: 90, reps: 6, rir: 2, isCompleted: true },
              ],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'ws_demo_2',
          title: 'JJB Force A — Squat, Tirage & Pontage',
          civilDate: dMinus2,
          status: 'completed',
          startedAt: now,
          completedAt: now,
          accumulatedPauseSeconds: 0,
          durationSeconds: 2700,
          perceivedFeeling: 'great',
          notes: 'Progression validée sur le Squat.',
          exercises: [
            {
              id: 'we_d2',
              workoutSessionId: 'ws_demo_2',
              exerciseId: 'ex_back_squat',
              exerciseNameSnapshot: 'Squat barre (Back Squat)',
              measurementTypeSnapshot: 'weight_reps',
              isUnilateralSnapshot: false,
              orderIndex: 0,
              restSeconds: 150,
              sets: [
                { id: 's_d4', workoutExerciseId: 'we_d2', setOrder: 1, setType: 'working', weightKg: 92.5, reps: 6, rir: 2, isCompleted: true },
                { id: 's_d5', workoutExerciseId: 'we_d2', setOrder: 2, setType: 'working', weightKg: 92.5, reps: 6, rir: 2, isCompleted: true },
                { id: 's_d6', workoutExerciseId: 'we_d2', setOrder: 3, setType: 'working', weightKg: 92.5, reps: 6, rir: 2, isCompleted: true },
              ],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];

      demoSnapshot.combatSessions = [
        {
          id: 'cs_demo_1',
          discipline: 'bjj',
          category: 'sparring_rolling',
          civilDate: dMinus2,
          bjjAttire: 'gi',
          context: 'training',
          roundsCount: 5,
          roundDurationSeconds: 300,
          restDurationSeconds: 60,
          totalDurationMinutes: 75,
          perceivedIntensity: 'moderate',
          partnerAlias: 'Karim',
          positionsWorked: ['Garde papillon', 'Demi-garde', 'Contrôle latéral'],
          techniqueEvents: [
            { id: 'te_1', combatSessionId: 'cs_demo_1', category: 'sweep_pass', techniqueName: 'Renversement papillon (Hook sweep)', attempts: 4, successes: 3 },
            { id: 'te_2', combatSessionId: 'cs_demo_1', category: 'submission_attempted', techniqueName: 'Kimura depuis Nord-Sud', attempts: 2, successes: 1 },
          ],
          submissionsAttempted: 2,
          submissionsSucceeded: 1,
          submissionsReceived: 0,
          rounds: [],
          notes: 'Bon contrôle de la distance en garde assise.',
          pointsToReview: 'Mieux bloquer le coude extérieur sur la finition Kimura.',
          createdAt: now,
          updatedAt: now,
        },
      ];

      await persistNextSnapshot(demoSnapshot);
    },

    resetAllLocalData: async () => {
      const fresh = await storageEngine.clearAllData();
      set({
        snapshot: fresh,
        undoWorkoutSnapshot: null,
        undoLabel: null,
        lastSavedAt: new Date().toISOString(),
      });
    },
  };
});
