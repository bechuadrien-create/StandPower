import type {
  EntityId,
  ExerciseMeasurementType,
  WorkoutSession,
  WorkoutSet,
} from '../types';

export interface BrzyckiResult {
  valid: boolean;
  estimated1RMKg: number | null;
  isExactSingle: boolean;
  label: string;
  reason?: string;
}

/**
 * Formule de Brzycki :
 * 1RM estimé = charge × 36 / (37 − répétitions)
 *
 * Contraintes strictes :
 * - Charge strictement positive (> 0 et finie)
 * - Répétitions entières (1 à 10 inclus pour une estimation fiable)
 * - Pour 1 répétition : estimation exactement égale à la charge
 * - Au-delà de 10 répétitions : non présenté comme estimation fiable (valid = false)
 * - Non calculé pour les exercices assistés, au poids du corps seul, à durée ou distance
 */
export function estimateBrzycki1RM(
  weightKg: number,
  reps: number,
  measurementType: ExerciseMeasurementType = 'weight_reps'
): BrzyckiResult {
  if (measurementType !== 'weight_reps') {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Non applicable',
      reason:
        measurementType === 'assisted_reps'
          ? "Pas d'estimation 1RM pour un mouvement avec assistance."
          : "Le 1RM Brzycki s'applique uniquement aux exercices avec charge externe comparable.",
    };
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Charge invalide',
      reason: 'La charge doit être strictement positive.',
    };
  }

  if (!Number.isFinite(reps) || !Number.isInteger(reps) || reps < 1) {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Répétitions invalides',
      reason: 'Le nombre de répétitions doit être un entier positif.',
    };
  }

  if (reps > 10) {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Au-delà de 10 rép. (non fiable)',
      reason: "Au-delà de 10 répétitions, l'estimation de 1RM par Brzycki perd sa fiabilité.",
    };
  }

  if (reps === 1) {
    return {
      valid: true,
      estimated1RMKg: weightKg,
      isExactSingle: true,
      label: 'Estimation 1RM (1 rép. réalisée)',
    };
  }

  const denominator = 37 - reps;
  if (denominator <= 0) {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Domaine invalide',
      reason: 'Division incohérente hors domaine Brzycki.',
    };
  }

  const rawEstimate = (weightKg * 36) / denominator;
  if (!Number.isFinite(rawEstimate) || rawEstimate <= 0) {
    return {
      valid: false,
      estimated1RMKg: null,
      isExactSingle: false,
      label: 'Erreur de calcul',
      reason: 'Résultat non fini.',
    };
  }

  return {
    valid: true,
    estimated1RMKg: Number(rawEstimate.toFixed(2)),
    isExactSingle: false,
    label: 'Estimation 1RM (Brzycki)',
  };
}

export interface VolumeResult {
  volumeKgReps: number;
  workingSetsCount: number;
  unit: 'kg·rép';
  comparable: boolean;
  reason?: string;
}

/**
 * Calcule le volume de travail (somme charge × répétitions) d'un exercice.
 * - Exclut par défaut les séries d'échauffement (setType === 'warmup')
 * - Ne traite jamais une assistance (ex: 20 kg d'aide aux tractions) comme une charge soulevée
 * - Ne mélange pas poids du corps seul et charge externe
 */
export function calculateExerciseVolume(
  sets: WorkoutSet[],
  measurementType: ExerciseMeasurementType,
  options: { includeWarmup?: boolean } = {}
): VolumeResult {
  const includeWarmup = options.includeWarmup ?? false;

  const eligibleSets = sets.filter(
    (s) => s.isCompleted && (includeWarmup || s.setType === 'working')
  );

  if (measurementType !== 'weight_reps' && measurementType !== 'weighted_bodyweight') {
    return {
      volumeKgReps: 0,
      workingSetsCount: eligibleSets.length,
      unit: 'kg·rép',
      comparable: false,
      reason:
        measurementType === 'assisted_reps'
          ? "La charge d'assistance allège l'effort et n'est pas additionnée en volume soulevé."
          : 'Exercice suivi en répétitions ou durée sans charge externe.',
    };
  }

  let totalVolume = 0;
  let validWorkingSets = 0;

  for (const s of eligibleSets) {
    const weight = s.weightKg;
    const reps = s.reps;
    if (
      typeof weight === 'number' &&
      Number.isFinite(weight) &&
      weight > 0 &&
      typeof reps === 'number' &&
      Number.isInteger(reps) &&
      reps > 0
    ) {
      totalVolume += weight * reps;
      validWorkingSets += 1;
    }
  }

  return {
    volumeKgReps: Number(totalVolume.toFixed(2)),
    workingSetsCount: validWorkingSets,
    unit: 'kg·rép',
    comparable: true,
  };
}

export interface ExerciseRecordSummary {
  exerciseId: EntityId;
  maxWeightKg: { value: number; reps: number; date: string } | null;
  bestEstimated1RMKg: { value: number; weightKg: number; reps: number; date: string } | null;
  bestRepsAtWeight: { weightKg: number; reps: number; date: string } | null;
  bestSessionVolumeKgReps: { value: number; date: string } | null;
}

/**
 * Calcule les records historiques pour un exercice donné sur l'ensemble des séances terminées.
 */
export function computeExerciseRecords(
  sessions: WorkoutSession[],
  exerciseId: EntityId,
  measurementType: ExerciseMeasurementType
): ExerciseRecordSummary {
  let maxWeightKg: ExerciseRecordSummary['maxWeightKg'] = null;
  let bestEstimated1RMKg: ExerciseRecordSummary['bestEstimated1RMKg'] = null;
  let bestRepsAtWeight: ExerciseRecordSummary['bestRepsAtWeight'] = null;
  let bestSessionVolumeKgReps: ExerciseRecordSummary['bestSessionVolumeKgReps'] = null;

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  for (const session of completedSessions) {
    const matchingExercises = session.exercises.filter((e) => e.exerciseId === exerciseId);
    if (matchingExercises.length === 0) continue;

    let sessionVolume = 0;

    for (const ex of matchingExercises) {
      const vol = calculateExerciseVolume(ex.sets, measurementType, { includeWarmup: false });
      if (vol.comparable) {
        sessionVolume += vol.volumeKgReps;
      }

      for (const set of ex.sets) {
        if (!set.isCompleted || set.setType !== 'working') continue;

        if (measurementType === 'weight_reps' || measurementType === 'weighted_bodyweight') {
          const w = set.weightKg;
          const r = set.reps;
          if (typeof w === 'number' && w > 0 && typeof r === 'number' && r >= 1) {
            if (!maxWeightKg || w > maxWeightKg.value || (w === maxWeightKg.value && r > maxWeightKg.reps)) {
              maxWeightKg = { value: w, reps: r, date: session.civilDate };
            }

            if (
              !bestRepsAtWeight ||
              r > bestRepsAtWeight.reps ||
              (r === bestRepsAtWeight.reps && w > bestRepsAtWeight.weightKg)
            ) {
              bestRepsAtWeight = { weightKg: w, reps: r, date: session.civilDate };
            }

            if (measurementType === 'weight_reps') {
              const est = estimateBrzycki1RM(w, r, 'weight_reps');
              if (est.valid && est.estimated1RMKg !== null) {
                if (!bestEstimated1RMKg || est.estimated1RMKg > bestEstimated1RMKg.value) {
                  bestEstimated1RMKg = {
                    value: est.estimated1RMKg,
                    weightKg: w,
                    reps: r,
                    date: session.civilDate,
                  };
                }
              }
            }
          }
        } else if (measurementType === 'bodyweight_reps') {
          const r = set.reps;
          if (typeof r === 'number' && r >= 1) {
            if (!bestRepsAtWeight || r > bestRepsAtWeight.reps) {
              bestRepsAtWeight = { weightKg: 0, reps: r, date: session.civilDate };
            }
          }
        }
      }
    }

    if (sessionVolume > 0) {
      if (!bestSessionVolumeKgReps || sessionVolume > bestSessionVolumeKgReps.value) {
        bestSessionVolumeKgReps = {
          value: Number(sessionVolume.toFixed(2)),
          date: session.civilDate,
        };
      }
    }
  }

  return {
    exerciseId,
    maxWeightKg,
    bestEstimated1RMKg,
    bestRepsAtWeight,
    bestSessionVolumeKgReps,
  };
}
