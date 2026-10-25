import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../app/providers/useAppStore';
import { serializeDatabaseToJson } from '../data/backup/backupService';

describe('Persistance, Reprise de séance et Sauvegarde/Import atomique', () => {
  beforeEach(async () => {
    await useAppStore.getState().resetAllLocalData();
  });

  it('crée une séance, enregistre des séries et permet la reprise après réhydratation', async () => {
    const store = useAppStore.getState();
    const session = await store.startFreeWorkout('Séance Force Test', ['ex_back_squat']);
    expect(session.status).toBe('in_progress');
    expect(session.exercises).toHaveLength(1);

    const weId = session.exercises[0].id;
    const setId = session.exercises[0].sets[0].id;

    await useAppStore.getState().updateWorkoutSet(weId, setId, {
      weightKg: 85,
      reps: 6,
      rir: 2,
    });
    await useAppStore.getState().toggleCompleteWorkoutSet(weId, setId);

    // Simuler une réhydratation depuis IndexedDB
    await useAppStore.getState().hydrate();
    const resumed = useAppStore.getState().getActiveWorkout();
    expect(resumed).not.toBeNull();
    expect(resumed?.title).toBe('Séance Force Test');
    expect(resumed?.exercises[0].sets[0].weightKg).toBe(85);
    expect(resumed?.exercises[0].sets[0].isCompleted).toBe(true);
  });

  it('préserve l’historique des séances lorsque le questionnaire est modifié', async () => {
    await useAppStore.getState().startFreeWorkout('Séance Passée', ['ex_pushups']);
    await useAppStore.getState().finishActiveWorkout({ perceivedFeeling: 'good' });

    expect(useAppStore.getState().snapshot.workoutSessions).toHaveLength(1);

    // Modification du questionnaire et application d'un nouveau programme
    await useAppStore.getState().saveQuestionnaireAndApplyProgram({
      id: 'qa_new',
      version: 1,
      ageYears: 30,
      heightCm: 180,
      weightKg: 78,
      preferredWeightUnit: 'kg',
      metabolicParameter: 'male_equation',
      primaryGoal: 'strength',
      experienceLevel: 'intermediate',
      recentWeeklyFrequency: 3,
      availableDays: ['mon', 'wed', 'fri'],
      desiredSessionsPerWeek: 3,
      sessionDurationMinutes: 60,
      preferredReminderTime: '18:00',
      availableEquipment: ['barbell_plates', 'rack', 'bench'],
      combatDiscipline: 'none',
      combatSessionsPerWeek: 0,
      combatDays: [],
      combatIntensity: 'low',
      perceivedFatigue: 'low',
      avoidedMovements: [],
      medicalRestriction: 'no',
      specialSafetyFlags: {
        pregnancyOrBreastfeeding: false,
        eatingDisorderHistory: false,
        medicalFollowUpRequired: false,
      },
      dailyActivityLevel: 'moderately_active',
      dietaryPreference: 'omnivore',
      foodExclusions: [],
      nutritionGuidanceStyle: 'numeric_targets',
      createdAt: '2026-10-24T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z',
    });

    const sessionsAfter = useAppStore.getState().snapshot.workoutSessions;
    expect(sessionsAfter).toHaveLength(1);
    expect(sessionsAfter[0].title).toBe('Séance Passée');
  });

  it('rejette un import JSON invalide sans altérer les données existantes et valide l’aller-retour export/import', async () => {
    await useAppStore.getState().saveWeightEntry({
      civilDate: '2026-10-24',
      weightKg: 76.4,
      notes: 'Pesée test',
    });

    const validJson = serializeDatabaseToJson(useAppStore.getState().snapshot);

    // Tentative d'import invalide (schéma incompatible ou corrompu)
    const badRes = await useAppStore
      .getState()
      .importDatabaseFromJson('{"schemaVersion": 999, "broken": true}');
    expect(badRes.ok).toBe(false);
    // La pesée existante est toujours intacte
    expect(useAppStore.getState().snapshot.weightEntries).toHaveLength(1);
    expect(useAppStore.getState().snapshot.weightEntries[0].weightKg).toBe(76.4);

    // Réinitialiser puis réimporter le JSON valide
    await useAppStore.getState().resetAllLocalData();
    expect(useAppStore.getState().snapshot.weightEntries).toHaveLength(0);

    const goodRes = await useAppStore.getState().importDatabaseFromJson(validJson);
    expect(goodRes.ok).toBe(true);
    expect(useAppStore.getState().snapshot.weightEntries).toHaveLength(1);
    expect(useAppStore.getState().snapshot.weightEntries[0].weightKg).toBe(76.4);
  });
});
