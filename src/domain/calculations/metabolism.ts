import type {
  DailyActivityLevel,
  MetabolicParameter,
  PrimaryGoal,
  SpecialSafetyFlags,
} from '../types';

export interface BmrEstimate {
  min: number;
  max: number;
  exact?: number;
  parameterUsed: MetabolicParameter;
  formulaDescription: string;
  explanation: string;
}

/**
 * Équation de Mifflin–St Jeor (1990) pour le métabolisme de repos estimé (BMR) :
 * - Paramètre masculin : 10 × poids_kg + 6,25 × taille_cm − 5 × âge + 5
 * - Paramètre féminin : 10 × poids_kg + 6,25 × taille_cm − 5 × âge − 161
 * - Si non renseigné : ne le devine pas, retourne la plage [équation féminine, équation masculine].
 */
export function calculateMifflinStJeorBmr(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  metabolicParameter: MetabolicParameter;
}): BmrEstimate {
  const { weightKg, heightCm, ageYears, metabolicParameter } = params;

  if (
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    !Number.isFinite(ageYears) ||
    ageYears <= 0
  ) {
    throw new Error('Paramètres anthropométriques invalides pour Mifflin–St Jeor.');
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const femaleEquationKcal = Math.round(base - 161);
  const maleEquationKcal = Math.round(base + 5);

  if (metabolicParameter === 'male_equation') {
    return {
      min: maleEquationKcal,
      max: maleEquationKcal,
      exact: maleEquationKcal,
      parameterUsed: 'male_equation',
      formulaDescription: '10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5',
      explanation:
        'Estimation du métabolisme de repos via l’équation de Mifflin–St Jeor (constante +5). Il s’agit d’une estimation statistique (±10 à 15 % selon la composition corporelle), non d’une mesure directe.',
    };
  }

  if (metabolicParameter === 'female_equation') {
    return {
      min: femaleEquationKcal,
      max: femaleEquationKcal,
      exact: femaleEquationKcal,
      parameterUsed: 'female_equation',
      formulaDescription: '10 × poids (kg) + 6,25 × taille (cm) − 5 × âge − 161',
      explanation:
        'Estimation du métabolisme de repos via l’équation de Mifflin–St Jeor (constante −161). Il s’agit d’une estimation statistique (±10 à 15 % selon la composition corporelle), non d’une mesure directe.',
    };
  }

  return {
    min: femaleEquationKcal,
    max: maleEquationKcal,
    parameterUsed: 'unspecified',
    formulaDescription:
      'Plage Mifflin–St Jeor entre la constante −161 et la constante +5 (écart de 166 kcal/j)',
    explanation:
      'Le paramètre physiologique de l’équation n’étant pas renseigné, StandPower ne le devine pas et affiche la plage complète entre les deux variantes de l’équation de Mifflin–St Jeor.',
  };
}

export const ACTIVITY_FACTORS: Record<
  DailyActivityLevel,
  { factor: number; labelFr: string; descriptionFr: string }
> = {
  sedentary: {
    factor: 1.2,
    labelFr: 'Sédentaire (bureau, peu de marche)',
    descriptionFr:
      'Travail assis, déplacements limités hors séances. Attention : si tu ajoutes déjà beaucoup de sport, ne double-compte pas avec un facteur élevé.',
  },
  lightly_active: {
    factor: 1.375,
    labelFr: 'Légèrement actif (marche régulière ou 1–3 séances/sem.)',
    descriptionFr:
      'Quotidien avec déplacements réguliers à pied ou 1 à 3 séances sportives hebdomadaires modérées déjà incluses.',
  },
  moderately_active: {
    factor: 1.55,
    labelFr: 'Modérément actif (quotidien dynamique ou 3–5 séances/sem.)',
    descriptionFr:
      'Inclut déjà un volume d’entraînement régulier (3 à 5 séances/semaine). Ne rajoute pas les calories MET des séances par-dessus ce total.',
  },
  very_active: {
    factor: 1.725,
    labelFr: 'Très actif (métier physique ou entraînement biquotidien)',
    descriptionFr:
      'Travail physique soutenu combiné à un entraînement fréquent. Inclut déjà une dépense sportive importante.',
  },
};

export interface TdeeEstimate {
  min: number;
  max: number;
  exact?: number;
  factor: number;
  activityLevel: DailyActivityLevel;
  antiDoubleCountingNotice: string;
}

/**
 * Calcule la dépense énergétique quotidienne totale estimée (TDEE) à partir du BMR.
 */
export function calculateTdeeFromBmr(
  bmr: BmrEstimate,
  activityLevel: DailyActivityLevel
): TdeeEstimate {
  const { factor } = ACTIVITY_FACTORS[activityLevel];
  const min = Math.round(bmr.min * factor);
  const max = Math.round(bmr.max * factor);
  const exact = bmr.exact !== undefined ? Math.round(bmr.exact * factor) : undefined;

  return {
    min,
    max,
    exact,
    factor,
    activityLevel,
    antiDoubleCountingNotice:
      'Ce facteur d’activité global inclut déjà une part de ton entraînement hebdomadaire. N’additionne pas automatiquement les calories estimées par séance (MET) à cette cible quotidienne afin d’éviter un double comptage.',
  };
}

export interface MetSessionEstimate {
  grossKcal: number;
  netKcal: number;
  metValue: number;
  durationMinutes: number;
  weightKg: number;
  activityLabel: string;
  uncertaintyWarning: string;
}

export const MET_REFERENCE_VALUES: Record<
  string,
  { met: number; labelFr: string; notesFr: string }
> = {
  strength_moderate: {
    met: 3.5,
    labelFr: 'Musculation traditionnelle (temps de repos inclus)',
    notesFr:
      'En musculation, la majeure partie de la séance est passée en récupération entre les séries : le MET moyen sur 60 min est modéré (environ 3,5).',
  },
  strength_vigorous: {
    met: 5.0,
    labelFr: 'Musculation dense / circuits avec repos courts',
    notesFr:
      'Applicable aux séances denses à dominante polyarticulaire avec repos courts.',
  },
  bjj_drills: {
    met: 5.5,
    labelFr: 'JJB — Technique et drills coopératifs',
    notesFr: 'Travail technique au sol, déplacements et répétitions contrôlées.',
  },
  bjj_rolling: {
    met: 7.8,
    labelFr: 'JJB — Séance complète avec sparring (rolling)',
    notesFr:
      'Moyenne sur une séance incluant échauffement, technique et rounds de combat au sol.',
  },
  boxing_bag: {
    met: 5.8,
    labelFr: 'Boxe — Travail au sac et shadow-boxing (moyenne séance)',
    notesFr: 'Prend en compte l’alternance entre rounds actifs et minutes de repos.',
  },
  boxing_mma_sparring: {
    met: 8.5,
    labelFr: 'Boxe / MMA — Entraînement soutenu et sparring',
    notesFr: 'Effort intermittent de haute intensité.',
  },
};

/**
 * Calcule la dépense énergétique estimée d'une séance via la méthode des MET :
 * - kcal brutes estimées = MET × 3,5 × poids_kg / 200 × durée_minutes
 * - kcal nettes estimées (au-dessus du repos) = (MET − 1) × 3,5 × poids_kg / 200 × durée_minutes
 */
export function calculateMetSessionExpenditure(params: {
  metValue: number;
  weightKg: number;
  durationMinutes: number;
  activityLabel?: string;
}): MetSessionEstimate {
  const { metValue, weightKg, durationMinutes, activityLabel = 'Séance sportive' } = params;

  if (
    !Number.isFinite(metValue) ||
    metValue <= 0 ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    throw new Error('Paramètres invalides pour le calcul MET.');
  }

  const grossKcal = Math.round((metValue * 3.5 * weightKg * durationMinutes) / 200);
  const netMet = Math.max(0, metValue - 1);
  const netKcal = Math.round((netMet * 3.5 * weightKg * durationMinutes) / 200);

  return {
    grossKcal,
    netKcal,
    metValue,
    durationMinutes,
    weightKg,
    activityLabel,
    uncertaintyWarning:
      'Estimation théorique par MET (et non mesure par capteur). En musculation et sports de combat intermittents, la dépense réelle varie fortement selon les temps de repos effectifs et l’intensité de chaque round. Utilise la dépense nette (au-dessus du repos) à titre purement indicatif sans l’ajouter automatiquement à ton objectif calorique quotidien.',
  };
}

export interface NutritionSafetyAndTargetsResult {
  eligibleForDeficitOrSurplus: boolean;
  safetyReason?: string;
  bmr: BmrEstimate;
  tdee: TdeeEstimate;
  recommendedMode: 'maintenance' | 'moderate_deficit' | 'moderate_surplus' | 'educational_only';
  targetKcal: {
    min: number;
    max: number;
    exact?: number;
  };
  proteinRangeGramsPerDay: {
    min: number;
    max: number;
    explanation: string;
  } | null;
}

/**
 * Évalue l'éligibilité aux repères nutritionnels chiffrés et calcule les cibles éducatives.
 * - Mineurs (< 18 ans) : aucun déficit calorique ni cible de perte de poids automatique.
 * - Grossesse/allaitement, troubles alimentaires ou suivi médical : désactive les cibles automatiques.
 */
export function computeSafeNutritionTargets(params: {
  ageYears: number;
  weightKg: number;
  heightCm: number;
  metabolicParameter: MetabolicParameter;
  activityLevel: DailyActivityLevel;
  primaryGoal: PrimaryGoal;
  specialSafetyFlags?: SpecialSafetyFlags;
  medicalRestriction?: 'yes' | 'no' | 'prefer_not_to_say';
}): NutritionSafetyAndTargetsResult {
  const {
    ageYears,
    weightKg,
    heightCm,
    metabolicParameter,
    activityLevel,
    primaryGoal,
    specialSafetyFlags,
  } = params;

  const bmr = calculateMifflinStJeorBmr({
    weightKg,
    heightCm,
    ageYears,
    metabolicParameter,
  });

  const tdee = calculateTdeeFromBmr(bmr, activityLevel);

  const isMinor = ageYears < 18;
  const hasSpecialFlag = Boolean(
    specialSafetyFlags?.pregnancyOrBreastfeeding ||
      specialSafetyFlags?.eatingDisorderHistory ||
      specialSafetyFlags?.medicalFollowUpRequired
  );

  if (isMinor) {
    return {
      eligibleForDeficitOrSurplus: false,
      safetyReason:
        'Moins de 18 ans : en période de croissance, StandPower ne propose aucune cible de déficit calorique ni d’objectif chiffré de perte de poids. Privilégie des repas complets et réguliers et consulte un professionnel de santé si besoin.',
      bmr,
      tdee,
      recommendedMode: 'educational_only',
      targetKcal: { min: tdee.min, max: tdee.max, exact: tdee.exact },
      proteinRangeGramsPerDay: null,
    };
  }

  if (hasSpecialFlag) {
    return {
      eligibleForDeficitOrSurplus: false,
      safetyReason:
        'Situation nécessitant un suivi adapté (grossesse/allaitement, antécédent de trouble alimentaire ou suivi médical spécifique) : les objectifs caloriques chiffrés automatiques sont désactivés au profit de repères qualitatifs généraux. Rapproche-toi d’un médecin ou diététicien diplômé.',
      bmr,
      tdee,
      recommendedMode: 'educational_only',
      targetKcal: { min: tdee.min, max: tdee.max, exact: tdee.exact },
      proteinRangeGramsPerDay: null,
    };
  }

  // Adulte éligible : maintien par défaut, ou surplus/déficit modéré selon objectif
  let recommendedMode: 'maintenance' | 'moderate_deficit' | 'moderate_surplus' = 'maintenance';
  let deltaKcal = 0;

  if (primaryGoal === 'fat_loss') {
    recommendedMode = 'moderate_deficit';
    deltaKcal = -300; // Déficit modéré et progressif (~300 kcal), jamais de restriction agressive
  } else if (primaryGoal === 'hypertrophy' || primaryGoal === 'strength') {
    recommendedMode = 'moderate_surplus';
    deltaKcal = 200; // Surplus modéré (~200 kcal)
  }

  // Plancher prudent jamais inférieur au métabolisme de repos
  const minTarget = Math.max(bmr.min, tdee.min + deltaKcal);
  const maxTarget = Math.max(bmr.max, tdee.max + deltaKcal);
  const exactTarget =
    tdee.exact !== undefined && bmr.exact !== undefined
      ? Math.max(bmr.exact, tdee.exact + deltaKcal)
      : undefined;

  // Plage protéique couramment utilisée chez l'adulte sportif : 1,4 à 2,0 g/kg/j
  const proteinMin = Math.round(weightKg * 1.4);
  const proteinMax = Math.round(weightKg * 2.0);

  return {
    eligibleForDeficitOrSurplus: true,
    bmr,
    tdee,
    recommendedMode,
    targetKcal: {
      min: minTarget,
      max: maxTarget,
      exact: exactTarget,
    },
    proteinRangeGramsPerDay: {
      min: proteinMin,
      max: proteinMax,
      explanation:
        'Plage indicative de 1,4 à 2,0 g/kg/jour couramment utilisée pour un adulte sans pathologie rénale pratiquant la musculation ou les sports de combat. Il s’agit d’une fourchette souple et non d’une cible au gramme près.',
    },
  };
}
