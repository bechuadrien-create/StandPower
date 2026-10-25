import { describe, expect, it } from 'vitest';
import {
  calculateExerciseVolume,
  computeExerciseRecords,
  estimateBrzycki1RM,
} from '../domain/calculations/strength';
import {
  calculateMetSessionExpenditure,
  calculateMifflinStJeorBmr,
  calculateTdeeFromBmr,
  computeSafeNutritionTargets,
} from '../domain/calculations/metabolism';
import {
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  parseFrenchDecimal,
} from '../domain/calculations/units';
import { computeTechniqueSuccessRate } from '../domain/calculations/combatStats';
import {
  computeMovingAverageSeries,
  filterSeriesByPeriod,
} from '../domain/calculations/timeSeries';
import type { WorkoutSet } from '../domain/types';

describe('Calculs de force — Brzycki & Volume', () => {
  it('calcule correctement le 1RM estimé par Brzycki dans la plage 2–10 répétitions', () => {
    const res = estimateBrzycki1RM(100, 5, 'weight_reps');
    expect(res.valid).toBe(true);
    // 100 * 36 / (37 - 5) = 3600 / 32 = 112.5
    expect(res.estimated1RMKg).toBe(112.5);
    expect(res.label).toContain('Estimation');
  });

  it('retourne exactement la charge pour 1 répétition', () => {
    const res = estimateBrzycki1RM(120, 1, 'weight_reps');
    expect(res.valid).toBe(true);
    expect(res.isExactSingle).toBe(true);
    expect(res.estimated1RMKg).toBe(120);
  });

  it('rejette les répétitions invalides (0, négatives, décimales ou > 10)', () => {
    expect(estimateBrzycki1RM(80, 0).valid).toBe(false);
    expect(estimateBrzycki1RM(80, -3).valid).toBe(false);
    expect(estimateBrzycki1RM(80, 5.5).valid).toBe(false);
    const over10 = estimateBrzycki1RM(80, 12);
    expect(over10.valid).toBe(false);
    expect(over10.estimated1RMKg).toBeNull();
  });

  it('rejette les charges nulles, négatives ou non finies et les exercices assistés', () => {
    expect(estimateBrzycki1RM(0, 5).valid).toBe(false);
    expect(estimateBrzycki1RM(-60, 5).valid).toBe(false);
    expect(estimateBrzycki1RM(Number.NaN, 5).valid).toBe(false);
    expect(estimateBrzycki1RM(20, 8, 'assisted_reps').valid).toBe(false);
  });

  it('agrège le volume en excluant les séries d’échauffement et l’assistance', () => {
    const sets: WorkoutSet[] = [
      {
        id: 's1',
        workoutExerciseId: 'we1',
        setOrder: 1,
        setType: 'warmup',
        weightKg: 60,
        reps: 8,
        isCompleted: true,
      },
      {
        id: 's2',
        workoutExerciseId: 'we1',
        setOrder: 2,
        setType: 'working',
        weightKg: 80,
        reps: 8,
        isCompleted: true,
      },
      {
        id: 's3',
        workoutExerciseId: 'we1',
        setOrder: 3,
        setType: 'working',
        weightKg: 80,
        reps: 8,
        isCompleted: true,
      },
      {
        id: 's4',
        workoutExerciseId: 'we1',
        setOrder: 4,
        setType: 'working',
        weightKg: 80,
        reps: 8,
        isCompleted: false, // non validée
      },
    ];

    const vol = calculateExerciseVolume(sets, 'weight_reps');
    expect(vol.comparable).toBe(true);
    expect(vol.workingSetsCount).toBe(2);
    expect(vol.volumeKgReps).toBe(1280);
    expect(vol.unit).toBe('kg·rép');

    // Assistance de 20 kg ne doit jamais être comptée comme 20 kg soulevés
    const assistedVol = calculateExerciseVolume(sets, 'assisted_reps');
    expect(assistedVol.comparable).toBe(false);
    expect(assistedVol.volumeKgReps).toBe(0);
  });

  it('calcule correctement les records d’un exercice', () => {
    const records = computeExerciseRecords(
      [
        {
          id: 'ws1',
          title: 'Test',
          civilDate: '2026-10-20',
          status: 'completed',
          startedAt: '2026-10-20T10:00:00.000Z',
          accumulatedPauseSeconds: 0,
          durationSeconds: 1800,
          notes: '',
          createdAt: '2026-10-20T10:00:00.000Z',
          updatedAt: '2026-10-20T10:30:00.000Z',
          exercises: [
            {
              id: 'we1',
              workoutSessionId: 'ws1',
              exerciseId: 'ex_back_squat',
              exerciseNameSnapshot: 'Squat barre',
              measurementTypeSnapshot: 'weight_reps',
              isUnilateralSnapshot: false,
              orderIndex: 0,
              restSeconds: 120,
              sets: [
                {
                  id: 's1',
                  workoutExerciseId: 'we1',
                  setOrder: 1,
                  setType: 'working',
                  weightKg: 100,
                  reps: 5,
                  isCompleted: true,
                },
              ],
            },
          ],
        },
      ],
      'ex_back_squat',
      'weight_reps'
    );

    expect(records.maxWeightKg?.value).toBe(100);
    expect(records.bestEstimated1RMKg?.value).toBe(112.5);
    expect(records.bestSessionVolumeKgReps?.value).toBe(500);
  });
});

describe('Calculs métaboliques — Mifflin–St Jeor & MET', () => {
  it('calcule Mifflin–St Jeor avec paramètre masculin, féminin ou plage non spécifiée', () => {
    // 10*80 + 6.25*180 - 5*30 = 800 + 1125 - 150 = 1775
    const male = calculateMifflinStJeorBmr({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      metabolicParameter: 'male_equation',
    });
    expect(male.exact).toBe(1780); // 1775 + 5

    const female = calculateMifflinStJeorBmr({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      metabolicParameter: 'female_equation',
    });
    expect(female.exact).toBe(1614); // 1775 - 161

    const unspecified = calculateMifflinStJeorBmr({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      metabolicParameter: 'unspecified',
    });
    expect(unspecified.exact).toBeUndefined();
    expect(unspecified.min).toBe(1614);
    expect(unspecified.max).toBe(1780);
  });

  it('calcule TDEE et distingue clairement MET brut et MET net au-dessus du repos', () => {
    const bmr = calculateMifflinStJeorBmr({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      metabolicParameter: 'male_equation',
    });
    const tdee = calculateTdeeFromBmr(bmr, 'moderately_active');
    expect(tdee.exact).toBe(Math.round(1780 * 1.55));

    // MET = 6, poids = 80 kg, durée = 60 min
    // Brut = 6 * 3.5 * 80 / 200 * 60 = 504 kcal
    // Net = (6 - 1) * 3.5 * 80 / 200 * 60 = 420 kcal
    const met = calculateMetSessionExpenditure({
      metValue: 6,
      weightKg: 80,
      durationMinutes: 60,
    });
    expect(met.grossKcal).toBe(504);
    expect(met.netKcal).toBe(420);
  });

  it('désactive toute cible de déficit calorique pour un mineur (< 18 ans)', () => {
    const res = computeSafeNutritionTargets({
      ageYears: 16,
      weightKg: 65,
      heightCm: 172,
      metabolicParameter: 'male_equation',
      activityLevel: 'moderately_active',
      primaryGoal: 'fat_loss',
    });
    expect(res.eligibleForDeficitOrSurplus).toBe(false);
    expect(res.recommendedMode).toBe('educational_only');
    expect(res.proteinRangeGramsPerDay).toBeNull();
  });
});

describe('Unités, Combat (0 tentative) et Séries temporelles', () => {
  it('convertit kg/lb et cm/in sans dérive et accepte la virgule française', () => {
    const kg = 100;
    const lb = kgToLb(kg);
    expect(lbToKg(lb)).toBeCloseTo(100, 6);

    const cm = 180;
    const inches = cmToIn(cm);
    expect(inToCm(inches)).toBeCloseTo(180, 6);

    expect(parseFrenchDecimal('77,5')).toBe(77.5);
    expect(parseFrenchDecimal('82.25')).toBe(82.25);
    expect(parseFrenchDecimal('')).toBeNull();
    expect(parseFrenchDecimal('abc')).toBeNull();
  });

  it('retourne non disponible (et jamais 0 %) pour zéro tentative en combat', () => {
    const zeroRate = computeTechniqueSuccessRate('Kimura', 0, 0);
    expect(zeroRate.available).toBe(false);
    expect(zeroRate.ratePercent).toBeNull();
    expect(zeroRate.denominatorLabel).toContain('Non disponible');

    const validRate = computeTechniqueSuccessRate('Armbar', 4, 3);
    expect(validRate.available).toBe(true);
    expect(validRate.ratePercent).toBe(75);
    expect(validRate.denominatorLabel).toBe('3/4 (75 %)');
    expect(validRate.lowSampleWarning).toBe(true);
  });

  it('calcule la moyenne mobile 7 jours et filtre les périodes', () => {
    const points = [
      { civilDate: '2026-10-01', value: 80.0 },
      { civilDate: '2026-10-18', value: 79.0 },
      { civilDate: '2026-10-20', value: 78.6 },
      { civilDate: '2026-10-24', value: 78.2 },
    ];
    const filtered7d = filterSeriesByPeriod(points, '7d', '2026-10-24');
    expect(filtered7d).toHaveLength(3); // 18, 20, 24 oct

    const withMa = computeMovingAverageSeries(filtered7d, 7);
    expect(withMa[0].movingAverage7d).toBeUndefined(); // 1 seul point dans la fenêtre
    expect(withMa[1].movingAverage7d).toBe(78.8); // moyenne(79.0, 78.6)
    expect(withMa[2].movingAverage7d).toBe(78.6); // moyenne(79.0, 78.6, 78.2)
  });
});
