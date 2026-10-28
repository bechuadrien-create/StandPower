import { BUILTIN_EXERCISES } from '../data/seeds/exercisesSeed';
import { BUILTIN_DRILLS } from '../data/seeds/drillsSeed';
import type { MuscleGroup } from '../domain/types';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'core'
  | 'combat_ground'
  | 'combat_striking';

export type AnatomicalMuscleId =
  | 'Pectoraux'
  | 'Dos'
  | 'Épaules'
  | 'Biceps'
  | 'Triceps'
  | 'Abdos'
  | 'Quadriceps'
  | 'Ischios'
  | 'Mollets'
  | 'Fessiers';

export type CombatDrillSubType =
  | 'shrimp'
  | 'sprawl'
  | 'technical_standup'
  | 'granby_roll'
  | 'bridge'
  | 'guard_retention'
  | 'takedown_shot'
  | 'shadow_boxing';

export interface ExerciseVisualDescriptor {
  exerciseName: string;
  englishMatchKey: string | null;
  imageUrls: [string, string] | null;
  movementPattern: MovementPattern;
  combatSubType?: CombatDrillSubType;
  primaryMuscles: AnatomicalMuscleId[];
  secondaryMuscles: AnatomicalMuscleId[];
  formCues: string[];
  safetyTips: string[];
  source: 'free-exercise-db' | 'ai-gemini' | 'local-expert';
}

export interface FreeExerciseDbEntry {
  id: string;
  name: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

export interface CoachChatResponse {
  reply: string;
  actionableTips: string[];
  suggestedDrillsOrExercises: string[];
  recoveryWarning?: string;
  source: 'gemini-2.5-flash' | 'local-rule-engine';
}

const FREE_EXERCISE_DB_JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREE_EXERCISE_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/**
 * Dictionnaire complet Français -> ID exact dans yuhonas/free-exercise-db
 */
export const FRENCH_TO_FREE_EXERCISE_DB_MAP: Record<string, string> = {
  // Pectoraux / Push
  'développé couché': 'Barbell_Bench_Press_-_Medium_Grip',
  'développé couché barre': 'Barbell_Bench_Press_-_Medium_Grip',
  'développé couché haltères': 'Dumbbell_Bench_Press',
  'développé incliné': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'développé incliné barre': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'développé incliné haltères': 'Incline_Dumbbell_Press',
  'écartés haltères': 'Dumbbell_Flyes',
  'écartés poulie vis-à-vis': 'Cable_Crossover',
  'dips': 'Dips_-_Chest_Version',
  'dips aux barres parallèles': 'Dips_-_Chest_Version',
  'pompes': 'Pushups',
  'pompes classiques': 'Pushups',
  'pompes diamant': 'Close-Grip_Push-Up_off_of_a_Dumbbell',
  'pompes lestées': 'Pushups',
  'développé assis machine': 'Machine_Bench_Press',

  // Épaules
  'développé militaire': 'Standing_Military_Press',
  'développé militaire barre debout': 'Standing_Military_Press',
  'développé épaules haltères': 'Dumbbell_Shoulder_Press',
  'développé épaules haltères assis': 'Dumbbell_Shoulder_Press',
  'élévations latérales': 'Side_Lateral_Raise',
  'élévations latérales haltères': 'Side_Lateral_Raise',
  'élévations latérales poulie': 'Cable_Seated_Lateral_Raise',
  'oiseau haltères': 'Seated_Bent-Over_Rear_Delt_Raise',
  'oiseau buste penché': 'Seated_Bent-Over_Rear_Delt_Raise',
  'face pull': 'Face_Pull',
  'face pull à la poulie haute': 'Face_Pull',
  'landmine press': 'Landmine_180s',
  'landmine press unilatéral': 'Landmine_180s',

  // Dos / Pull
  'tractions': 'Pullups',
  'tractions pronation': 'Pullups',
  'tractions supination': 'Chin-Up',
  'tractions neutres': 'Pullups',
  'tirage vertical': 'Wide-Grip_Lat_Pulldown',
  'tirage vertical poitrine': 'Wide-Grip_Lat_Pulldown',
  'rowing barre': 'Bent_Over_Barbell_Row',
  'rowing barre buste penché': 'Bent_Over_Barbell_Row',
  'rowing pendlay': 'Pendlay_Rown',
  'rowing haltère': 'One-Arm_Dumbbell_Row',
  'rowing haltère unilatéral': 'One-Arm_Dumbbell_Row',
  'tirage horizontal': 'Seated_Cable_Rows',
  'tirage horizontal poulie basse': 'Seated_Cable_Rows',
  'rowing t-bar': 'Lying_T-Bar_Row',
  'pull-over poulie haute': 'Straight-Arm_Pulldown',
  'shrugs': 'Barbell_Shrug',
  'shrugs haltères': 'Dumbbell_Shrug',

  // Jambes (Squat & Hinge)
  'squat': 'Barbell_Full_Squat',
  'squat barre': 'Barbell_Full_Squat',
  'squat barre (back squat)': 'Barbell_Full_Squat',
  'front squat': 'Front_Barbell_Squat',
  'squat avant': 'Front_Barbell_Squat',
  'goblet squat': 'Goblet_Squat',
  'presse à cuisses': 'Leg_Press',
  'presse à cuisses inclinée': 'Leg_Press',
  'hack squat': 'Hack_Squat',
  'fentes': 'Dumbbell_Lunges',
  'fentes marchées': 'Dumbbell_Lunges',
  'fentes marchées haltères': 'Dumbbell_Lunges',
  'squat bulgare': 'Single_Leg_Squat',
  'squat bulgare haltères': 'Single_Leg_Squat',
  'leg extension': 'Leg_Extensions',
  'extension des genoux (leg extension)': 'Leg_Extensions',
  'soulevé de terre': 'Barbell_Deadlift',
  'soulevé de terre classique': 'Barbell_Deadlift',
  'soulevé de terre sumo': 'Sumo_Deadlift',
  'soulevé de terre roumain': 'Romanian_Deadlift',
  'soulevé de terre roumain barre': 'Romanian_Deadlift',
  'soulevé de terre roumain haltères': 'Stiff-Legged_Dumbbell_Deadlift',
  'hip thrust': 'Barbell_Glute_Bridge',
  'hip thrust barre': 'Barbell_Glute_Bridge',
  'leg curl': 'Seated_Leg_Curl',
  'leg curl allongé': 'Lying_Leg_Curls',
  'flexion des ischios (leg curl)': 'Lying_Leg_Curls',
  'good morning': 'Good_Morning',
  'kettlebell swing': 'One-Arm_Kettlebell_Swings',
  'swing kettlebell': 'One-Arm_Kettlebell_Swings',
  'mollets debout': 'Standing_Calf_Raises',
  'extension mollets debout': 'Standing_Calf_Raises',
  'mollets assis': 'Seated_Calf_Raise',

  // Bras (Biceps & Triceps)
  'curl barre': 'Barbell_Curl',
  'curl barre ez': 'EZ-Bar_Curl',
  'curl haltères': 'Dumbbell_Bicep_Curl',
  'curl haltères alterné': 'Dumbbell_Alternate_Bicep_Curl',
  'curl marteau': 'Hammer_Curls',
  'curl marteau haltères': 'Hammer_Curls',
  'curl incliné': 'Incline_Dumbbell_Curl',
  'curl pupitre': 'Preacher_Curl',
  'extension triceps poulie': 'Triceps_Pushdown',
  'extension triceps poulie haute corde': 'Triceps_Pushdown_-_Rope_Attachment',
  'barre au front': 'Lying_Triceps_Press',
  'extension triceps haltère': 'Standing_Dumbbell_Triceps_Extension',
  'développé couché prise serrée': 'Close-Grip_Barbell_Bench_Press',

  // Sangle abdominale / Core
  'gainage': 'Plank',
  'gainage planche': 'Plank',
  'gainage latéral': 'Side_Bridge',
  'roue abdominale': 'Ab_Roller',
  'ab wheel': 'Ab_Roller',
  'relevé de jambes': 'Hanging_Leg_Raise',
  'relevé de jambes suspendu': 'Hanging_Leg_Raise',
  'crunch poulie haute': 'Cable_Crunch',
  'pallof press': 'Pallof_Press_With_Rotation',
  'farmer walk': 'Farmers_Walk',
  'marche du fermier': 'Farmers_Walk',
};

let cachedExternalDb: FreeExerciseDbEntry[] | null = null;
let pendingFetchPromise: Promise<FreeExerciseDbEntry[]> | null = null;

export function buildFreeExerciseImageUrls(englishMatchKey: string): [string, string] {
  const cleanKey = englishMatchKey.trim();
  return [
    `${FREE_EXERCISE_IMG_BASE}/${cleanKey}/0.jpg`,
    `${FREE_EXERCISE_IMG_BASE}/${cleanKey}/1.jpg`,
  ];
}

/**
 * Charge et met en cache la base JSON yuhonas/free-exercise-db si le réseau est disponible.
 */
export async function loadFreeExerciseDatabase(): Promise<FreeExerciseDbEntry[]> {
  if (cachedExternalDb) return cachedExternalDb;
  if (pendingFetchPromise) return pendingFetchPromise;

  pendingFetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(FREE_EXERCISE_DB_JSON_URL, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as FreeExerciseDbEntry[];
      if (Array.isArray(data)) {
        cachedExternalDb = data;
        return data;
      }
      return [];
    } catch {
      return [];
    } finally {
      pendingFetchPromise = null;
    }
  })();

  return pendingFetchPromise;
}

/**
 * Convertit un groupe musculaire interne StandPower vers l'identifiant SVG anatomique normalisé.
 */
export function mapDomainMuscleToAnatomical(muscle: MuscleGroup): AnatomicalMuscleId {
  switch (muscle) {
    case 'chest':
      return 'Pectoraux';
    case 'back':
      return 'Dos';
    case 'shoulders':
      return 'Épaules';
    case 'biceps':
    case 'forearms':
      return 'Biceps';
    case 'triceps':
      return 'Triceps';
    case 'core':
      return 'Abdos';
    case 'quads':
      return 'Quadriceps';
    case 'hamstrings':
      return 'Ischios';
    case 'calves':
      return 'Mollets';
    case 'glutes':
    case 'full_body':
      return 'Fessiers';
  }
}

export function normalizeMuscleStringList(rawList: string[]): AnatomicalMuscleId[] {
  const validSet = new Set<AnatomicalMuscleId>();
  for (const item of rawList) {
    const low = item.toLowerCase();
    if (low.includes('pector') || low.includes('chest')) validSet.add('Pectoraux');
    else if (low.includes('dos') || low.includes('lat') || low.includes('back') || low.includes('trap'))
      validSet.add('Dos');
    else if (low.includes('épaul') || low.includes('epaul') || low.includes('delt') || low.includes('shoulder') || low.includes('cou'))
      validSet.add('Épaules');
    else if (low.includes('bicep') || low.includes('avant-bras') || low.includes('forearm'))
      validSet.add('Biceps');
    else if (low.includes('tricep')) validSet.add('Triceps');
    else if (low.includes('abdo') || low.includes('core') || low.includes('gainage') || low.includes('oblique'))
      validSet.add('Abdos');
    else if (low.includes('quadri')) validSet.add('Quadriceps');
    else if (low.includes('ischio') || low.includes('hamstring') || low.includes('lombaire'))
      validSet.add('Ischios');
    else if (low.includes('mollet') || low.includes('calf') || low.includes('calves'))
      validSet.add('Mollets');
    else if (low.includes('fessier') || low.includes('glute') || low.includes('hanche'))
      validSet.add('Fessiers');
  }
  return Array.from(validSet);
}

/**
 * Détecte le sous-type de drill combat/JJB/MMA pour animer le Stickman avec la cinématique correspondante.
 */
export function inferCombatDrillSubType(name: string): CombatDrillSubType {
  const low = name.toLowerCase();
  if (low.includes('shrimp') || low.includes('langouste') || low.includes('hip escape')) {
    return 'shrimp';
  }
  if (low.includes('sprawl')) {
    return 'sprawl';
  }
  if (low.includes('technical stand') || low.includes('relevé technique')) {
    return 'technical_standup';
  }
  if (low.includes('granby') || low.includes('roulade') || low.includes('inversion')) {
    return 'granby_roll';
  }
  if (low.includes('pont') || low.includes('bridge') || low.includes('upa')) {
    return 'bridge';
  }
  if (low.includes('garde') || low.includes('guard') || low.includes('pummeling') || low.includes('triangle')) {
    return 'guard_retention';
  }
  if (low.includes('level change') || low.includes('pénétration') || low.includes('double leg') || low.includes('single leg') || low.includes('lutte')) {
    return 'takedown_shot';
  }
  return 'shadow_boxing';
}

/**
 * Résout immédiatement (de façon synchrone et déterministe) le descripteur visuel d'un exercice ou drill.
 */
export function resolveExerciseVisuals(exerciseName: string): ExerciseVisualDescriptor {
  const cleanName = exerciseName.trim();
  const normalized = cleanName.toLowerCase();

  // 1. Recherche dans le catalogue embarqué des 54 exercices de musculation
  const builtinEx = BUILTIN_EXERCISES.find(
    (e) =>
      e.nameFr.toLowerCase() === normalized ||
      normalized.includes(e.nameFr.toLowerCase()) ||
      e.nameFr.toLowerCase().includes(normalized)
  );

  // 2. Recherche dans le catalogue embarqué des 32 drills de combat
  const builtinDrill = BUILTIN_DRILLS.find(
    (d) =>
      d.nameFr.toLowerCase() === normalized ||
      normalized.includes(d.nameFr.toLowerCase()) ||
      d.nameFr.toLowerCase().includes(normalized)
  );

  // 3. Recherche d'une clé anglaise free-exercise-db
  let englishMatchKey: string | null = FRENCH_TO_FREE_EXERCISE_DB_MAP[normalized] ?? null;
  if (!englishMatchKey) {
    for (const [frKey, enId] of Object.entries(FRENCH_TO_FREE_EXERCISE_DB_MAP)) {
      if (normalized.includes(frKey) || frKey.includes(normalized)) {
        englishMatchKey = enId;
        break;
      }
    }
  }

  // Recherche additionnelle dans le cache free-exercise-db si déjà chargé en mémoire
  if (!englishMatchKey && cachedExternalDb) {
    const match = cachedExternalDb.find(
      (entry) =>
        entry.name.toLowerCase() === normalized ||
        entry.id.toLowerCase() === normalized.replace(/\s+/g, '_')
    );
    if (match) {
      englishMatchKey = match.id;
    }
  }

  if (builtinDrill) {
    const subType = inferCombatDrillSubType(builtinDrill.nameFr);
    const isStriking =
      builtinDrill.category === 'conditioning' ||
      builtinDrill.category === 'coordination' ||
      subType === 'shadow_boxing' ||
      subType === 'sprawl' ||
      subType === 'takedown_shot';

    return {
      exerciseName: builtinDrill.nameFr,
      englishMatchKey: null,
      imageUrls: null,
      movementPattern: isStriking ? 'combat_striking' : 'combat_ground',
      combatSubType: subType,
      primaryMuscles: isStriking
        ? ['Épaules', 'Quadriceps', 'Abdos']
        : ['Abdos', 'Fessiers', 'Ischios'],
      secondaryMuscles: isStriking ? ['Mollets', 'Dos', 'Triceps'] : ['Épaules', 'Dos', 'Quadriceps'],
      formCues: builtinDrill.steps,
      safetyTips: [
        builtinDrill.precautions,
        ...builtinDrill.commonMistakes.map((m) => `À éviter : ${m}`),
      ],
      source: 'local-expert',
    };
  }

  if (builtinEx) {
    const primaryMuscles = Array.from(
      new Set(builtinEx.primaryMuscles.map(mapDomainMuscleToAnatomical))
    );
    const secondaryMuscles = Array.from(
      new Set(
        builtinEx.secondaryMuscles
          .map(mapDomainMuscleToAnatomical)
          .filter((m) => !primaryMuscles.includes(m))
      )
    );

    let pattern: MovementPattern = 'push';
    if (
      builtinEx.movementPattern === 'horizontal_pull' ||
      builtinEx.movementPattern === 'vertical_pull'
    ) {
      pattern = 'pull';
    } else if (
      builtinEx.movementPattern === 'squat' ||
      builtinEx.movementPattern === 'lunge_single_leg'
    ) {
      pattern = 'squat';
    } else if (builtinEx.movementPattern === 'hinge') {
      pattern = 'hinge';
    } else if (
      builtinEx.movementPattern === 'core_stability' ||
      builtinEx.movementPattern === 'carry_conditioning'
    ) {
      pattern = 'core';
    } else if (
      builtinEx.movementPattern === 'isolation' &&
      builtinEx.primaryMuscles.includes('biceps')
    ) {
      pattern = 'pull';
    }

    return {
      exerciseName: builtinEx.nameFr,
      englishMatchKey,
      imageUrls: englishMatchKey ? buildFreeExerciseImageUrls(englishMatchKey) : null,
      movementPattern: pattern,
      primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : ['Pectoraux'],
      secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : ['Triceps', 'Épaules'],
      formCues: builtinEx.executionSteps,
      safetyTips: [
        builtinEx.generalPrecautions,
        ...builtinEx.commonMistakes.map((m) => `À éviter : ${m}`),
      ],
      source: englishMatchKey ? 'free-exercise-db' : 'local-expert',
    };
  }

  // Heuristique pour tout autre nom saisi librement (drill ou exercice personnalisé)
  const isCombatKeyword =
    normalized.includes('jjb') ||
    normalized.includes('bjj') ||
    normalized.includes('shrimp') ||
    normalized.includes('sprawl') ||
    normalized.includes('granby') ||
    normalized.includes('stand-up') ||
    normalized.includes('boxe') ||
    normalized.includes('mma') ||
    normalized.includes('garde') ||
    normalized.includes('shadow');

  if (isCombatKeyword) {
    const subType = inferCombatDrillSubType(cleanName);
    const isStriking =
      subType === 'shadow_boxing' || subType === 'sprawl' || subType === 'takedown_shot';
    return {
      exerciseName: cleanName,
      englishMatchKey: null,
      imageUrls: null,
      movementPattern: isStriking ? 'combat_striking' : 'combat_ground',
      combatSubType: subType,
      primaryMuscles: ['Abdos', 'Fessiers', 'Épaules'],
      secondaryMuscles: ['Quadriceps', 'Dos', 'Ischios'],
      formCues: [
        'Maintenez une garde compacte et le menton rentré.',
        'Engagez le centre du corps (gainage) sur chaque transition.',
        'Respirez de manière fluide sans bloquer en apnée.',
      ],
      safetyTips: [
        'Ne pontez jamais directement sur le sommet du crâne ; prenez appui sur le haut des épaules.',
        'Contrôlez vos réceptions au sol pour protéger les coudes et les genoux.',
      ],
      source: 'local-expert',
    };
  }

  let inferredPattern: MovementPattern = 'push';
  let inferredPrimary: AnatomicalMuscleId[] = ['Pectoraux', 'Épaules'];
  let inferredSecondary: AnatomicalMuscleId[] = ['Triceps'];

  if (
    normalized.includes('traction') ||
    normalized.includes('tirage') ||
    normalized.includes('row') ||
    normalized.includes('curl')
  ) {
    inferredPattern = 'pull';
    inferredPrimary = ['Dos', 'Biceps'];
    inferredSecondary = ['Épaules'];
  } else if (
    normalized.includes('squat') ||
    normalized.includes('fente') ||
    normalized.includes('presse') ||
    normalized.includes('leg extension')
  ) {
    inferredPattern = 'squat';
    inferredPrimary = ['Quadriceps', 'Fessiers'];
    inferredSecondary = ['Ischios', 'Mollets'];
  } else if (
    normalized.includes('terre') ||
    normalized.includes('deadlift') ||
    normalized.includes('hip thrust') ||
    normalized.includes('swing') ||
    normalized.includes('ischio')
  ) {
    inferredPattern = 'hinge';
    inferredPrimary = ['Ischios', 'Fessiers'];
    inferredSecondary = ['Dos', 'Abdos'];
  } else if (
    normalized.includes('gainage') ||
    normalized.includes('plank') ||
    normalized.includes('abdo') ||
    normalized.includes('crunch')
  ) {
    inferredPattern = 'core';
    inferredPrimary = ['Abdos'];
    inferredSecondary = ['Épaules', 'Fessiers'];
  }

  return {
    exerciseName: cleanName,
    englishMatchKey,
    imageUrls: englishMatchKey ? buildFreeExerciseImageUrls(englishMatchKey) : null,
    movementPattern: inferredPattern,
    primaryMuscles: inferredPrimary,
    secondaryMuscles: inferredSecondary,
    formCues: [
      `Placez-vous en posture stable avant d'initier "${cleanName}".`,
      'Contrôlez la phase excentrique (2 à 3 secondes) sur toute l’amplitude utile.',
      'Expirez pendant la phase concentrique en maintenant le gainage.',
    ],
    safetyTips: [
      'Démarrez toujours avec 1 à 2 séries d’échauffement progressif.',
      'Interrompez la série si la technique se dégrade ou en cas de douleur articulaire.',
    ],
    source: englishMatchKey ? 'free-exercise-db' : 'local-expert',
  };
}

/**
 * Interroge la route backend POST /api/exercise-info (Gemini 2.5 Flash côté serveur)
 * et bascule automatiquement sur le moteur local déterministe si hors-ligne.
 */
export async function fetchAiExerciseTechnicalSheet(
  exerciseName: string
): Promise<ExerciseVisualDescriptor> {
  const localBaseline = resolveExerciseVisuals(exerciseName);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch('/api/exercise-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseName }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return localBaseline;
    }

    const data = (await response.json()) as {
      englishMatchKey?: string;
      movementPattern?: MovementPattern;
      primaryMuscles?: string[];
      secondaryMuscles?: string[];
      formCues?: string[];
      properForm?: string[];
      safetyTips?: string[];
    };

    const resolvedKey =
      data.englishMatchKey && data.englishMatchKey.trim().length > 0
        ? data.englishMatchKey.trim()
        : localBaseline.englishMatchKey;

    const primary = normalizeMuscleStringList(data.primaryMuscles ?? []);
    const secondary = normalizeMuscleStringList(data.secondaryMuscles ?? []);

    return {
      exerciseName,
      englishMatchKey: resolvedKey,
      imageUrls: resolvedKey ? buildFreeExerciseImageUrls(resolvedKey) : localBaseline.imageUrls,
      movementPattern: data.movementPattern ?? localBaseline.movementPattern,
      combatSubType: localBaseline.combatSubType,
      primaryMuscles: primary.length > 0 ? primary : localBaseline.primaryMuscles,
      secondaryMuscles: secondary.length > 0 ? secondary : localBaseline.secondaryMuscles,
      formCues:
        data.formCues && data.formCues.length > 0
          ? data.formCues
          : data.properForm && data.properForm.length > 0
            ? data.properForm
            : localBaseline.formCues,
      safetyTips:
        data.safetyTips && data.safetyTips.length > 0
          ? data.safetyTips
          : localBaseline.safetyTips,
      source: 'ai-gemini',
    };
  } catch {
    return localBaseline;
  }
}

/**
 * Interroge la route backend POST /api/coach-chat (Gemini 2.5 Flash côté serveur)
 * avec fallback local expert hors-ligne.
 */
export async function sendCoachChatMessage(
  message: string,
  context?: {
    disciplines?: string[];
    recentWorkoutsCount?: number;
    recentCombatCount?: number;
    weightKg?: number;
  }
): Promise<CoachChatResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('/api/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as CoachChatResponse;
      if (data && typeof data.reply === 'string') {
        return {
          ...data,
          source: data.source ?? 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback local déterministe ci-dessous
  }

  const low = message.toLowerCase();
  if (low.includes('jjb') || low.includes('bjj') || low.includes('combat') || low.includes('mma') || low.includes('boxe')) {
    return {
      reply:
        'Pour concilier sports de combat et musculation sans surcharger tes articulations, privilégie 2 à 3 séances courtes orientées force sous-maximale (RPE 7,5 à 8) et garde au moins 6 heures d’écart (ou des jours distincts) entre une séance jambes/dos lourde et un sparring intense.',
      actionableTips: [
        'Intègre 5 minutes de drills solo (Hip Escape / Shrimp, Sprawl, Technical Stand-up) en échauffement.',
        'Évite l’échec musculaire sur les lombaires et les avant-bras la veille d’un entraînement Gi.',
        'Surveille ton ratio réussites/tentatives dans le journal de combat pour cibler 1 seule position prioritaire par semaine.',
      ],
      suggestedDrillsOrExercises: [
        'Sortie de bassin (Shrimp / Hip Escape)',
        'Relevé technique (Technical Stand-Up)',
        'Sprawl réactif et remise en garde',
      ],
      recoveryWarning:
        'Si ta fatigue perçue dépasse 4/5 ou en cas de raideur cervicale/lombaire, réduis le volume de travail de 25 % aujourd’hui.',
      source: 'local-rule-engine',
    };
  }

  return {
    reply:
      'Pour progresser durablement en force et hypertrophie, applique la double progression : conserve la même charge tant que toutes tes séries de travail n’atteignent pas le haut de la fourchette de répétitions cible avec un RPE ≤ 8,5, puis augmente de +1 à +2,5 kg.',
    actionableTips: [
      'Contrôle systématiquement la phase excentrique (2 secondes) et évite tout rebond en bas du mouvement.',
      'Respecte 2 à 3 minutes de repos sur les polyarticulaires lourds (Squat, Développé couché, Soulevé de terre, Tractions).',
      'Vise un apport protéique compris entre 1,6 et 2,0 g/kg/jour réparti en 3 à 4 prises.',
    ],
    suggestedDrillsOrExercises: [
      'Squat barre (Back Squat)',
      'Développé couché barre',
      'Tractions pronation',
      'Face pull à la poulie haute',
    ],
    source: 'local-rule-engine',
  };
}
