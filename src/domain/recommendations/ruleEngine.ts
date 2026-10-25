import type {
  DayOfWeek,
  EquipmentItem,
  Exercise,
  ProgramSessionTemplate,
  ProgramTemplate,
  QuestionnaireAnswers,
  RecommendationResult,
  RecommendedExercisePrescription,
  WeeklyScheduleSlot,
} from '../types';
import { computeSafeNutritionTargets } from '../calculations/metabolism';
import { BUILTIN_EXERCISES } from '../../data/seeds/exercisesSeed';
import { BUILTIN_PROGRAMS } from '../../data/seeds/programsSeed';

export const RULE_ENGINE_VERSION = '1.0.0-deterministic';

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABELS_FR: Record<DayOfWeek, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

function hasStrengthEquipment(equipment: EquipmentItem[]): boolean {
  const weighted: EquipmentItem[] = [
    'dumbbells',
    'kettlebell',
    'barbell_plates',
    'machines',
    'full_gym',
    'bands',
  ];
  return equipment.some((item) => weighted.includes(item));
}

function isExerciseCompatibleWithEquipment(
  exercise: Exercise,
  userEquipment: EquipmentItem[]
): boolean {
  if (exercise.equipment.includes('none')) return true;
  if (userEquipment.includes('full_gym')) return true;
  return exercise.equipment.some((req) => userEquipment.includes(req));
}

/**
 * 1. Choix déterministe du modèle de programme de départ
 */
export function selectBaseProgramTemplate(
  answers: QuestionnaireAnswers,
  templates: ProgramTemplate[] = BUILTIN_PROGRAMS
): { template: ProgramTemplate; reasons: string[] } {
  const reasons: string[] = [];
  const byId = (id: string) =>
    templates.find((t) => t.id === id) ?? templates[0];

  const effectiveDaysCount = Math.max(
    1,
    Math.min(answers.desiredSessionsPerWeek || 2, answers.availableDays.length || 3)
  );

  const hasWeights = hasStrengthEquipment(answers.availableEquipment);
  const hasBarbellAndRack =
    answers.availableEquipment.includes('full_gym') ||
    (answers.availableEquipment.includes('barbell_plates') &&
      answers.availableEquipment.includes('rack'));

  const highCombatLoad =
    answers.combatDiscipline !== 'none' &&
    (answers.combatSessionsPerWeek >= 3 ||
      (answers.combatSessionsPerWeek >= 2 && answers.combatIntensity === 'high'));

  // Règle matériel : aucun matériel -> Programme poids du corps
  if (!hasWeights) {
    reasons.push(
      'Aucun matériel de charge externe sélectionné : le programme « Maison Sans Matériel (Poids du corps) » est retenu pour garantir des séances réellement réalisables.'
    );
    return { template: byId('prog_home_bodyweight_3d'), reasons };
  }

  // Règle durée très courte (20 min)
  if (answers.sessionDurationMinutes <= 20) {
    reasons.push(
      `Durée disponible de ${answers.sessionDurationMinutes} minutes par séance : le modèle « Séance Express Essentielle » est retenu afin de conserver l’échauffement tout en réduisant les exercices accessoires.`
    );
    return { template: byId('prog_express_25m'), reasons };
  }

  // Règle priorité sports de combat ou charge combat importante
  if (highCombatLoad || answers.primaryGoal === 'combat_complement') {
    if (answers.combatDiscipline === 'bjj') {
      reasons.push(
        `Deux séances complètes sont proposées car tu pratiques déjà le JJB ${answers.combatSessionsPerWeek} fois par semaine.`
      );
      return { template: byId('prog_bjj_complement_2d'), reasons };
    }
    if (answers.combatDiscipline === 'boxing' || answers.combatDiscipline === 'mma' || answers.combatDiscipline === 'multiple') {
      reasons.push(
        `Deux séances complémentaires sont proposées car tu pratiques déjà un sport de combat (${answers.combatSessionsPerWeek} séances/semaine) : cela évite d’empiler une fatigue excessive.`
      );
      return { template: byId('prog_boxing_mma_complement_2d'), reasons };
    }
    reasons.push(
      'Objectif orienté complément sports de combat : un format 2 jours à volume maîtrisé est sélectionné.'
    );
    return { template: byId('prog_bjj_complement_2d'), reasons };
  }

  // Règle débutant : ne jamais proposer automatiquement un programme avancé même si objectif prise de masse
  if (answers.experienceLevel === 'beginner') {
    if (answers.primaryGoal === 'hypertrophy' || answers.primaryGoal === 'strength') {
      reasons.push(
        'Niveau débutant déclaré : un programme Full Body progressif est recommandé plutôt qu’un programme avancé afin de consolider la technique et la récupération.'
      );
    }
    if (effectiveDaysCount <= 2) {
      reasons.push(
        'Débutant avec 2 séances souhaitées par semaine : le « Débutant Full Body — 2 jours » offre le meilleur équilibre stimulation/récupération.'
      );
      return { template: byId('prog_beginner_fb_2d'), reasons };
    }
    reasons.push(
      'Débutant avec 3 jours disponibles : le « Débutant Full Body — 3 jours » permet de répartir le volume efficacement.'
    );
    return { template: byId('prog_beginner_fb_3d'), reasons };
  }

  // Règle objectif force avec barre/rack
  if (answers.primaryGoal === 'strength' && hasBarbellAndRack && effectiveDaysCount >= 3) {
    reasons.push(
      'Objectif force avec accès barre et rack : le programme « Force 5×5 Équilibré — 3 jours » (avec volume global raisonnable) est sélectionné.'
    );
    return { template: byId('prog_strength_5x5_3d'), reasons };
  }

  // Règle 4 jours disponibles et récupération compatible -> Haut/Bas
  if (
    effectiveDaysCount >= 4 &&
    answers.perceivedFatigue !== 'high' &&
    answers.combatSessionsPerWeek <= 2
  ) {
    reasons.push(
      '4 jours disponibles et récupération compatible : la répartition « Hypertrophie Haut / Bas — 4 jours (Cycle 8 semaines) » permet de structurer le volume sans séances interminables.'
    );
    return { template: byId('prog_hypertrophy_ul_4d_8w'), reasons };
  }

  if (effectiveDaysCount <= 2) {
    reasons.push(
      '2 séances hebdomadaires sélectionnées : un format Full Body 2 jours permet de solliciter chaque groupe musculaire deux fois par semaine.'
    );
    return { template: byId('prog_beginner_fb_2d'), reasons };
  }

  reasons.push(
    'Format 3 séances par semaine retenu : le Full Body 3 jours assure une fréquence optimale et adaptable.'
  );
  return { template: byId('prog_beginner_fb_3d'), reasons };
}

/**
 * 2. Adaptation au matériel et aux mouvements exclus + 3. Adaptation au temps et à la fatigue
 */
export function adaptProgramSessions(params: {
  template: ProgramTemplate;
  answers: QuestionnaireAnswers;
  exercisesCatalog?: Exercise[];
}): {
  adaptedSessions: RecommendationResult['sessionPrescriptions'];
  adaptationNotes: string[];
  warnings: string[];
} {
  const { template, answers, exercisesCatalog = BUILTIN_EXERCISES } = params;
  const adaptationNotes: string[] = [];
  const warnings: string[] = [];

  const catalogMap = new Map<string, Exercise>(
    exercisesCatalog.map((ex) => [ex.id, ex])
  );

  const hasWeights = hasStrengthEquipment(answers.availableEquipment);
  const isTimeLimited = answers.sessionDurationMinutes <= 30;
  const isHighFatigue = answers.perceivedFatigue === 'high';

  if (isTimeLimited) {
    adaptationNotes.push(
      `Temps limité (${answers.sessionDurationMinutes} min) : les exercices accessoires sont réduits à l’essentiel, mais l’échauffement articulaire est intégralement conservé.`
    );
  }

  if (isHighFatigue) {
    adaptationNotes.push(
      'Fatigue ressentie élevée : le volume de départ est réduit d’une série par exercice principal et la marge d’effort est fixée à 3 répétitions en réserve (3 RIR).'
    );
  }

  if (answers.medicalRestriction === 'yes') {
    warnings.push(
      'Restriction médicale signalée : ces repères sont généraux et ne constituent pas une prescription de rééducation. Valide les mouvements choisis avec ton médecin ou kinésithérapeute.'
    );
  }

  const findReplacementExercise = (original: Exercise): Exercise => {
    const isAllowed = (candidate: Exercise) => {
      const equipOk =
        !hasWeights
          ? candidate.equipment.includes('none')
          : isExerciseCompatibleWithEquipment(candidate, answers.availableEquipment);
      const avoidOk = !candidate.avoidTags.some((tag) =>
        answers.avoidedMovements.includes(tag)
      );
      return equipOk && avoidOk;
    };

    if (isAllowed(original)) return original;

    for (const altId of original.alternativeIds) {
      const alt = catalogMap.get(altId);
      if (alt && isAllowed(alt)) return alt;
    }

    const patternFallback = exercisesCatalog.find(
      (ex) => ex.movementPattern === original.movementPattern && isAllowed(ex)
    );
    if (patternFallback) return patternFallback;

    const bodyweightFallback = exercisesCatalog.find((ex) => isAllowed(ex));
    return bodyweightFallback ?? original;
  };

  let substitutedByEquipment = false;
  const substitutedByAvoidance: string[] = [];

  const adaptedSessions: RecommendationResult['sessionPrescriptions'] =
    template.sessions.map((session: ProgramSessionTemplate) => {
      const sourceExercises = isTimeLimited
        ? session.exercises.filter((e, idx) => e.isCoreLift || idx < 3).slice(0, 3)
        : session.exercises;

      const exercises: RecommendedExercisePrescription[] = sourceExercises.map(
        (item) => {
          const originalEx =
            catalogMap.get(item.exerciseId) ?? exercisesCatalog[0];
          const chosenEx = findReplacementExercise(originalEx);

          if (chosenEx.id !== originalEx.id) {
            const hadAvoidTag = originalEx.avoidTags.some((t) =>
              answers.avoidedMovements.includes(t)
            );
            if (hadAvoidTag) {
              substitutedByAvoidance.push(
                `${originalEx.nameFr} → ${chosenEx.nameFr}`
              );
            } else {
              substitutedByEquipment = true;
            }
          }

          let sets = item.sets;
          if (isHighFatigue || isTimeLimited) {
            sets = Math.max(2, sets - 1);
          }

          const restSeconds = isTimeLimited
            ? Math.min(item.restSeconds, 75)
            : item.restSeconds;

          const targetRir = isHighFatigue ? '3 RIR (effort modéré)' : item.targetRpeOrRir;

          const alternativesNames = chosenEx.alternativeIds
            .map((id) => catalogMap.get(id)?.nameFr)
            .filter((name): name is string => Boolean(name));

          return {
            exerciseId: chosenEx.id,
            exerciseName: chosenEx.nameFr,
            sets,
            repRangeMin: item.repMin,
            repRangeMax: item.repMax,
            durationSeconds: item.durationSeconds,
            restSeconds,
            targetRir,
            alternatives: alternativesNames,
            progressionRule:
              item.progressionIncrementKg > 0 && hasWeights
                ? `Double progression : valider ${item.repMax ?? item.repMin ?? 8} rép. sur toutes les séries avec ${targetRir} avant d’ajouter +${item.progressionIncrementKg.toString().replace('.', ',')} kg.`
                : 'Progression en répétitions et contrôle du tempo avant de passer à une variante plus exigeante.',
            notes: item.notes,
          };
        }
      );

      return {
        sessionKey: session.id,
        title: session.title,
        warmupNotes:
          session.warmup.join(' ') ||
          '5 minutes de mobilité articulaire et 2 séries légères d’approche.',
        exercises,
      };
    });

  if (substitutedByEquipment) {
    adaptationNotes.push(
      'Certains exercices ont été automatiquement remplacés par leurs équivalents compatibles avec ton matériel disponible.'
    );
  }

  if (substitutedByAvoidance.length > 0) {
    const uniqueSubs = Array.from(new Set(substitutedByAvoidance));
    adaptationNotes.push(
      `Mouvements adaptés selon tes exclusions : ${uniqueSubs.join(', ')}.`
    );
  }

  return { adaptedSessions, adaptationNotes, warnings };
}

/**
 * 4. Répartition hebdomadaire et 5. Ajustement de la charge liée aux sports de combat
 */
export function buildWeeklySchedule(params: {
  answers: QuestionnaireAnswers;
  adaptedSessions: RecommendationResult['sessionPrescriptions'];
}): {
  schedule: WeeklyScheduleSlot[];
  scheduleNotes: string[];
} {
  const { answers, adaptedSessions } = params;
  const scheduleNotes: string[] = [];

  const combatDaysSet = new Set<DayOfWeek>(
    answers.combatDiscipline !== 'none' ? answers.combatDays : []
  );

  const highCombatLoad =
    answers.combatDiscipline !== 'none' &&
    (answers.combatSessionsPerWeek >= 3 ||
      (answers.combatSessionsPerWeek >= 2 && answers.combatIntensity === 'high'));

  // Détermine le nombre cible de séances de musculation
  let targetStrengthSessions = Math.min(
    answers.desiredSessionsPerWeek || 2,
    adaptedSessions.length
  );

  if (highCombatLoad && targetStrengthSessions > 2) {
    targetStrengthSessions = 2;
    scheduleNotes.push(
      'La fréquence de musculation est plafonnée à 2 séances par semaine pour préserver ta récupération face aux séances de combat.'
    );
  }

  const userAvailableDays =
    answers.availableDays.length > 0
      ? answers.availableDays
      : (['mon', 'wed', 'fri'] as DayOfWeek[]);

  // Préférer les jours disponibles sans sport de combat
  const nonCombatAvailableDays = userAvailableDays.filter(
    (d) => !combatDaysSet.has(d)
  );
  const candidateStrengthDays =
    nonCombatAvailableDays.length >= targetStrengthSessions
      ? nonCombatAvailableDays
      : userAvailableDays;

  // Sélection espacée des jours de musculation
  const chosenStrengthDays: DayOfWeek[] = [];
  for (const day of candidateStrengthDays) {
    if (chosenStrengthDays.length >= targetStrengthSessions) break;
    const dayIdx = ALL_DAYS.indexOf(day);
    const hasAdjacentStrength = chosenStrengthDays.some(
      (prev) => Math.abs(ALL_DAYS.indexOf(prev) - dayIdx) === 1
    );
    if (!hasAdjacentStrength || candidateStrengthDays.length <= targetStrengthSessions) {
      chosenStrengthDays.push(day);
    }
  }
  for (const day of candidateStrengthDays) {
    if (chosenStrengthDays.length >= targetStrengthSessions) break;
    if (!chosenStrengthDays.includes(day)) {
      chosenStrengthDays.push(day);
    }
  }

  // Vérifier si une séance jambes exigeante tombe immédiatement la veille d'un jour de combat intense
  const orderedSessions = [...adaptedSessions];
  let reorderedForCombatProtection = false;

  const isLegHeavySession = (s: RecommendationResult['sessionPrescriptions'][number]) =>
    /bas du corps|squat|jambes|charnière/i.test(s.title);

  if (combatDaysSet.size > 0 && orderedSessions.length >= 2) {
    chosenStrengthDays.forEach((sDay, idx) => {
      const nextDay = ALL_DAYS[(ALL_DAYS.indexOf(sDay) + 1) % 7];
      const session = orderedSessions[idx % orderedSessions.length];
      if (combatDaysSet.has(nextDay) && isLegHeavySession(session)) {
        const swapIdx = orderedSessions.findIndex((cand) => !isLegHeavySession(cand));
        if (swapIdx !== -1 && swapIdx !== idx % orderedSessions.length) {
          const temp = orderedSessions[idx % orderedSessions.length];
          orderedSessions[idx % orderedSessions.length] = orderedSessions[swapIdx];
          orderedSessions[swapIdx] = temp;
          reorderedForCombatProtection = true;
        }
      }
    });
  }

  if (reorderedForCombatProtection) {
    scheduleNotes.push(
      'L’ordre des séances a été ajusté pour éviter une séance jambes exigeante immédiatement la veille d’un entraînement de combat.'
    );
  }

  let strengthSessionCursor = 0;
  let restDaysCount = 0;

  const schedule: WeeklyScheduleSlot[] = ALL_DAYS.map((day) => {
    const isStrength = chosenStrengthDays.includes(day);
    const isCombat = combatDaysSet.has(day);

    if (isStrength) {
      const session =
        orderedSessions[strengthSessionCursor % orderedSessions.length];
      strengthSessionCursor += 1;
      return {
        day,
        activityType: 'strength',
        title: session.title,
        durationMinutes: answers.sessionDurationMinutes,
        templateSessionId: session.sessionKey,
        notes: isCombat
          ? `${DAY_LABELS_FR[day]} : séance combinée avec ton sport de combat — garde 3 répétitions en réserve.`
          : undefined,
      };
    }

    if (isCombat) {
      const disciplineLabel =
        answers.combatDiscipline === 'bjj'
          ? 'JJB / Grappling'
          : answers.combatDiscipline === 'boxing'
          ? 'Boxe'
          : answers.combatDiscipline === 'mma'
          ? 'MMA'
          : 'Sports de combat';
      return {
        day,
        activityType: 'combat',
        title: `Entraînement ${disciplineLabel}`,
        durationMinutes: 60,
      };
    }

    restDaysCount += 1;
    return {
      day,
      activityType: 'rest',
      title: 'Repos complet ou mobilité douce',
    };
  });

  if (restDaysCount >= 1) {
    scheduleNotes.push(
      `Le planning prévoit ${restDaysCount} journée(s) de récupération sans entraînement intense.`
    );
  } else {
    scheduleNotes.push(
      'Attention : ton planning cumule des entraînements tous les jours. Prévois au moins une journée complète de repos chaque semaine pour éviter le surentraînement.'
    );
  }

  return { schedule, scheduleNotes };
}

/**
 * Point d'entrée principal du moteur de recommandation déterministe.
 * Même questionnaire + même version des règles = même recommandation.
 */
export function generateDeterministicRecommendation(
  answers: QuestionnaireAnswers,
  templates: ProgramTemplate[] = BUILTIN_PROGRAMS,
  exercisesCatalog: Exercise[] = BUILTIN_EXERCISES,
  fixedTimestamp = '2026-01-01T00:00:00.000Z'
): RecommendationResult {
  const { template, reasons } = selectBaseProgramTemplate(answers, templates);

  const { adaptedSessions, adaptationNotes, warnings } = adaptProgramSessions({
    template,
    answers,
    exercisesCatalog,
  });

  const { schedule, scheduleNotes } = buildWeeklySchedule({
    answers,
    adaptedSessions,
  });

  const nutrition = computeSafeNutritionTargets({
    ageYears: answers.ageYears,
    weightKg: answers.weightKg,
    heightCm: answers.heightCm,
    metabolicParameter: answers.metabolicParameter,
    activityLevel: answers.dailyActivityLevel,
    primaryGoal: answers.primaryGoal,
    specialSafetyFlags: answers.specialSafetyFlags,
    medicalRestriction: answers.medicalRestriction,
  });

  if (nutrition.safetyReason) {
    warnings.push(nutrition.safetyReason);
  }

  const firstSessionGuidance: string[] = [
    'StandPower ne déduit jamais tes charges de squat ou de développé couché à partir de ton poids corporel.',
    'Pour ta première séance : réalise 2 séries d’échauffement légères, puis monte progressivement jusqu’à une charge où il te reste 2 à 3 répétitions propres en réserve (2–3 RIR).',
    'Aucune tentative de charge maximale (1RM) n’est demandée ni nécessaire.',
    'Note simplement les charges réellement utilisées : elles serviront de point de départ fiable pour la double progression.',
  ];

  const estimatedSessionDurationMinutes = Math.min(
    answers.sessionDurationMinutes,
    template.estimatedSessionMinutes
  );

  return {
    id: `rec_${answers.id}_${RULE_ENGINE_VERSION}`,
    questionnaireId: answers.id,
    ruleEngineVersion: RULE_ENGINE_VERSION,
    recommendedProgramTemplateId: template.id,
    recommendedProgramName: template.nameFr,
    weeklySchedule: schedule,
    estimatedSessionDurationMinutes,
    sessionPrescriptions: adaptedSessions,
    explanations: [...reasons, ...adaptationNotes, ...scheduleNotes],
    warnings,
    firstSessionGuidance,
    nutritionSummary: {
      eligibleForDeficitOrSurplus: nutrition.eligibleForDeficitOrSurplus,
      safetyReason: nutrition.safetyReason,
      bmrEstimateKcal: {
        min: nutrition.bmr.min,
        max: nutrition.bmr.max,
        exact: nutrition.bmr.exact,
      },
      tdeeEstimateKcal: {
        min: nutrition.tdee.min,
        max: nutrition.tdee.max,
        exact: nutrition.tdee.exact,
      },
      targetKcal: {
        min: nutrition.targetKcal.min,
        max: nutrition.targetKcal.max,
        exact: nutrition.targetKcal.exact,
        mode: nutrition.recommendedMode,
      },
      proteinRangeGramsPerDay: nutrition.proteinRangeGramsPerDay
        ? {
            min: nutrition.proteinRangeGramsPerDay.min,
            max: nutrition.proteinRangeGramsPerDay.max,
          }
        : null,
    },
    createdAt: fixedTimestamp,
  };
}
