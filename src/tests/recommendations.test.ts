import { describe, expect, it } from 'vitest';
import { generateDeterministicRecommendation } from '../domain/recommendations/ruleEngine';
import type { QuestionnaireAnswers } from '../domain/types';

function createBaseAnswers(overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers {
  return {
    id: 'qa_test',
    version: 1,
    displayName: 'Sam',
    ageYears: 27,
    heightCm: 176,
    weightKg: 75,
    preferredWeightUnit: 'kg',
    metabolicParameter: 'male_equation',
    primaryGoal: 'general_fitness',
    experienceLevel: 'beginner',
    recentWeeklyFrequency: 1,
    availableDays: ['mon', 'wed', 'fri'],
    desiredSessionsPerWeek: 3,
    sessionDurationMinutes: 60,
    preferredReminderTime: '18:30',
    availableEquipment: ['barbell_plates', 'dumbbells', 'bench', 'rack'],
    combatDiscipline: 'none',
    combatSessionsPerWeek: 0,
    combatDays: [],
    combatIntensity: 'moderate',
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
    ...overrides,
  };
}

describe('Moteur de recommandations déterministe (Sans IA)', () => {
  it('recommande Full Body 2 jours pour un débutant avec 2 jours souhaités', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        experienceLevel: 'beginner',
        desiredSessionsPerWeek: 2,
        availableDays: ['tue', 'thu'],
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_beginner_fb_2d');
  });

  it('recommande Full Body 3 jours pour un débutant avec 3 jours, même si objectif prise de masse', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        experienceLevel: 'beginner',
        primaryGoal: 'hypertrophy',
        desiredSessionsPerWeek: 3,
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_beginner_fb_3d');
  });

  it('recommande Maison Sans Matériel lorsqu’aucun matériel de charge n’est disponible', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        availableEquipment: ['none'],
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_home_bodyweight_3d');
  });

  it('recommande le programme Express 20-30 min et conserve l’échauffement lorsque la durée est de 20 min', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        sessionDurationMinutes: 20,
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_express_25m');
    expect(rec.sessionPrescriptions[0].warmupNotes.length).toBeGreaterThan(10);
  });

  it('recommande le complément JJB 2 jours lorsqu’on pratique le JJB 3 fois par semaine', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        experienceLevel: 'intermediate',
        combatDiscipline: 'bjj',
        combatSessionsPerWeek: 3,
        combatDays: ['tue', 'thu', 'sat'],
        desiredSessionsPerWeek: 3,
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_bjj_complement_2d');
    expect(
      rec.explanations.some((e) => e.toLowerCase().includes('jjb'))
    ).toBe(true);
    const strengthDays = rec.weeklySchedule.filter((s) => s.activityType === 'strength');
    expect(strengthDays).toHaveLength(2);
  });

  it('recommande Force 5x5 équilibré pour un intermédiaire visant la force avec barre et rack', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        experienceLevel: 'intermediate',
        primaryGoal: 'strength',
        desiredSessionsPerWeek: 3,
        availableEquipment: ['barbell_plates', 'rack', 'bench'],
      })
    );
    expect(rec.recommendedProgramTemplateId).toBe('prog_strength_5x5_3d');
  });

  it('adapte le volume en cas de fatigue élevée et remplace un mouvement exclu', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        experienceLevel: 'beginner',
        desiredSessionsPerWeek: 3,
        perceivedFatigue: 'high',
        avoidedMovements: ['overhead_press'],
      })
    );
    expect(rec.explanations.some((e) => e.includes('Fatigue ressentie élevée'))).toBe(
      true
    );
    const allPrescribedIds = rec.sessionPrescriptions.flatMap((s) =>
      s.exercises.map((e) => e.exerciseId)
    );
    expect(allPrescribedIds).not.toContain('ex_overhead_press_barbell');
  });

  it('interdit toute prescription de déficit calorique pour un mineur', () => {
    const rec = generateDeterministicRecommendation(
      createBaseAnswers({
        ageYears: 15,
        primaryGoal: 'fat_loss',
      })
    );
    expect(rec.nutritionSummary.eligibleForDeficitOrSurplus).toBe(false);
    expect(rec.nutritionSummary.targetKcal.mode).toBe('educational_only');
    expect(rec.warnings.some((w) => w.includes('Moins de 18 ans'))).toBe(true);
  });

  it('garantit le déterminisme strict : même entrée + même version = même sortie', () => {
    const qa = createBaseAnswers();
    const r1 = generateDeterministicRecommendation(qa, undefined, undefined, '2026-10-24T12:00:00.000Z');
    const r2 = generateDeterministicRecommendation(qa, undefined, undefined, '2026-10-24T12:00:00.000Z');
    expect(r1).toEqual(r2);
  });
});
