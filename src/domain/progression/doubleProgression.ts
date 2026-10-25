import type {
  EquipmentItem,
  ExerciseMeasurementType,
  WorkoutSet,
} from '../types';

export interface ProgressionSuggestion {
  action: 'increase_weight' | 'increase_reps' | 'maintain' | 'reduce_load_optional';
  suggestedWeightKg?: number;
  suggestedTargetReps?: number;
  incrementKg: number;
  explanation: string;
  isMandatory: false;
}

/**
 * Détermine un incrément réaliste selon le matériel utilisé.
 */
export function getEquipmentCompatibleIncrementKg(
  equipment: EquipmentItem[],
  defaultIncrementKg = 2.5
): number {
  if (equipment.includes('barbell_plates') || equipment.includes('full_gym')) {
    return defaultIncrementKg >= 2.5 ? 2.5 : 1.25;
  }
  if (equipment.includes('dumbbells')) {
    return 2.0;
  }
  if (equipment.includes('kettlebell')) {
    return 4.0;
  }
  if (equipment.includes('machines')) {
    return 2.5;
  }
  return defaultIncrementKg;
}

/**
 * Calcule une suggestion de double progression à partir de la dernière séance réalisée.
 * - N'invente jamais une charge initiale à partir du poids corporel.
 * - Propose une augmentation uniquement si TOUTES les séries de travail ont atteint le haut
 *   de la plage de répétitions prévue avec une marge d'effort suffisante (RIR >= 1 ou RPE <= 9).
 * - Aucune augmentation n'est obligatoire.
 */
export function evaluateDoubleProgression(params: {
  lastWorkingSets: WorkoutSet[];
  targetRepMin: number;
  targetRepMax: number;
  measurementType: ExerciseMeasurementType;
  equipment: EquipmentItem[];
  preferredIncrementKg?: number;
}): ProgressionSuggestion {
  const {
    lastWorkingSets,
    targetRepMin,
    targetRepMax,
    measurementType,
    equipment,
    preferredIncrementKg = 2.5,
  } = params;

  const completedSets = lastWorkingSets.filter(
    (s) => s.isCompleted && s.setType === 'working'
  );

  const incrementKg = getEquipmentCompatibleIncrementKg(equipment, preferredIncrementKg);

  if (completedSets.length === 0) {
    return {
      action: 'maintain',
      incrementKg,
      explanation:
        'Première séance sur cet exercice : commence avec une charge conservatrice (2 à 3 répétitions en réserve) et monte progressivement.',
      isMandatory: false,
    };
  }

  const weights = completedSets
    .map((s) => s.weightKg)
    .filter((w): w is number => typeof w === 'number' && Number.isFinite(w) && w > 0);
  const referenceWeightKg = weights.length > 0 ? Math.max(...weights) : undefined;

  const allReachedTopOfRange = completedSets.every(
    (s) => typeof s.reps === 'number' && s.reps >= targetRepMax
  );

  const anyBelowBottomOfRange = completedSets.some(
    (s) => typeof s.reps === 'number' && s.reps < targetRepMin
  );

  const anyExcessiveStrain = completedSets.some(
    (s) => (typeof s.rpe === 'number' && s.rpe >= 9.5) || (typeof s.rir === 'number' && s.rir <= 0)
  );

  if (allReachedTopOfRange && !anyExcessiveStrain) {
    if (measurementType === 'weight_reps' && referenceWeightKg !== undefined) {
      const nextWeight = Number((referenceWeightKg + incrementKg).toFixed(2));
      return {
        action: 'increase_weight',
        suggestedWeightKg: nextWeight,
        suggestedTargetReps: targetRepMin,
        incrementKg,
        explanation: `Toutes les séries ont atteint ${targetRepMax} rép. avec une marge d'effort maîtrisée. Tu peux tester +${incrementKg.toString().replace('.', ',')} kg (${nextWeight.toString().replace('.', ',')} kg) en visant ${targetRepMin} rép., ou conserver la charge actuelle.`,
        isMandatory: false,
      };
    }

    return {
      action: 'increase_reps',
      suggestedWeightKg: referenceWeightKg,
      suggestedTargetReps: targetRepMax + 1,
      incrementKg: 0,
      explanation: `Haut de plage (${targetRepMax} rép.) validé sur toutes les séries. Tu peux ajouter 1 répétition par série ou passer à une variante plus exigeante.`,
      isMandatory: false,
    };
  }

  if (anyBelowBottomOfRange && anyExcessiveStrain) {
    const reducedWeight =
      referenceWeightKg !== undefined && referenceWeightKg > incrementKg
        ? Number((referenceWeightKg - incrementKg).toFixed(2))
        : referenceWeightKg;
    return {
      action: 'reduce_load_optional',
      suggestedWeightKg: reducedWeight,
      suggestedTargetReps: targetRepMin,
      incrementKg,
      explanation: `Certaines séries étaient sous ${targetRepMin} rép. avec un effort proche du maximum. Maintenir ou alléger légèrement la charge permet de consolider la technique sans fatigue excessive.`,
      isMandatory: false,
    };
  }

  return {
    action: 'maintain',
    suggestedWeightKg: referenceWeightKg,
    suggestedTargetReps: targetRepMax,
    incrementKg,
    explanation: `Conserve la charge actuelle et cherche à stabiliser ou ajouter 1 répétition dans la plage ${targetRepMin}–${targetRepMax} rép.`,
    isMandatory: false,
  };
}
