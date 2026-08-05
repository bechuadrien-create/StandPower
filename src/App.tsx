/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// ==========================================
/// LES IMPORTS
/// Cette section regroupe tous les modules React, les listes d'exercices,
/// les fonctions utilitaires et les icônes nécessaires à l'application.
/// ==========================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CLASSIC_EXERCISES, JJB_EXERCISES, ExerciseDefinition } from './data/exercisesData';
import { formatTime, calculateWorkoutCalories, playAlertChime, secureSave, secureLoad } from './utils';
import { CustomWorkout, CustomExercise, SetLog } from './types';
import { 
  Dumbbell, Scale, Medal, Trophy, Flame, Play, Timer, ArrowLeft,
  Plus, Trash2, ShieldAlert, Award, Compass, TrendingUp, Info, Check,
  Target, ChevronLeft, ChevronRight, User, AlertCircle, Calendar, RefreshCw, Zap, X,
  Sparkles, Camera, Sliders, Volume2, Brain
} from 'lucide-react';

/// ==========================================
/// INTERFACES ET TYPES DE DONNÉES
/// Cette section regroupe toutes les structures TypeScript pour le profil,
/// le suivi du poids (WeightLog) et les performances sportives.
/// ==========================================
interface ExtendedProfile {
  weightKg: number;
  heightCm: number;
  goal: 'Sèche' | 'Prise de masse' | 'Maintien';
  beltColor: 'Blanche' | 'Bleue' | 'Violette' | 'Marron' | 'Noire';
  beltStripes: number; // 0 to 4
  age: number;
  activityLevel: 'Sédentaire' | 'Actif' | 'Très Actif';
}

interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
}

interface MensurationLog {
  id: string;
  date: string;
  brasCm: number;
  poitrineCm: number;
  tailleCm: number;
  cuisseCm: number;
}

interface PersonalRecord {
  id: string;
  exerciseName: string;
  maxWeightKg: number;
  reps: number;
  date: string;
}

interface BjjRollLog {
  id: string;
  date: string;
  roundsCount: number;
  roundMinutes: number;
  technique: string;
  intensity: 'Souple' | 'Technique' | 'Dur';
}

const getExerciseDescription = (name: string, category: string): string => {
  if (category === 'Pectoraux') {
    return "Cibles : Grand pectoral. Conservez la cage thoracique haute, serrez les omoplates contre le dossier et contrôlez la descente (phase excentrique). Poussez de manière explosive.";
  }
  if (category === 'Dos') {
    return "Cibles : Grand dorsal, trapèzes. Tirez avec vos coudes plutôt qu'avec la force des mains, bombez le torse à la contraction et ouvrez l'amplitude.";
  }
  if (category === 'Jambes') {
    return "Cibles : Quadriceps et fessiers. Veillez à pousser activement dans le centre du pied, genoux orientés vers l'extérieur. Gardez le dos fort.";
  }
  if (category === 'Épaules') {
    return "Cibles : Deltoïdes. Maintenez le rachis neutre sans cambrer le bas du dos à l'effort. Stabilisez vos coudes.";
  }
  if (category === 'Bras') {
    return "Cibles : Biceps ou triceps. Verrouillez scrupuleusement la position des coudes le long du buste, évitez le ballant des charges.";
  }
  if (category === 'Abdos') {
    return "Cibles : Sangle abdominale. Enroulez la colonne plutôt que plier la hanche, expirez profondément en aspirant le nombril lors de la contraction.";
  }
  return "Renforcement mécanique global. Entraînez-vous avec une amplitude maximale propre, une cadence maîtrisée et maintenez un gainage athlétique.";
};

/// ==========================================
/// CALCUL DES CALORIES DE SPARRED SESSION (MET)
/// Cette fonction évalue l'estimation des calories brûlées
/// durant les sessions de sparring/combat (JJB, Boxe, MMA, Muay-Thaï)
/// en utilisant l'intensité métabolique (MET) et le poids corporel de l'athlète.
/// ==========================================
const calculateCombatCalories = (sportId: string, durationSeconds: number, weightKg: number): number => {
  if (!sportId || durationSeconds <= 0 || weightKg <= 0) return 0;

  // Realistic MET values from the Compendium of Physical Activities
  const MET_VALUES: Record<string, number> = {
    jjb: 10.0,         // Brazilian Jiu-Jitsu / Grappling / Wrestling (Compendium code 15430)
    boxe: 12.8,        // Boxing, sparring / vigorous in-ring (Compendium code 15070)
    mma: 12.0,         // Mixed Martial Arts, vigorous sparring (Compendium code 15075)
    muay_thai: 12.5,   // Kickboxing / Muay-Thai sparring (Compendium code 15425)
    lutte: 11.0,       // Wrestling (Compendium code 15430)
    judo: 10.0         // Judo / Aikido / Ju-Jitsu (Compendium code 15430)
  };

  const id = sportId.toLowerCase();
  const met = MET_VALUES[id] !== undefined ? MET_VALUES[id] : 10.0; // Default baseline sparring
  const minutes = durationSeconds / 60;
  const calories = (met * 3.5 * weightKg * minutes) / 200;
  return Math.round(calories);
};

// Distinctive color palettes for each athletic discipline
const SPORT_THEMES: Record<string, {
  primary: string;
  bgGradient: string;
  border: string;
  badgeWorkBg: string;
  badgeWorkText: string;
  progressWork: string;
  labelTextColor: string;
  btnBgGradient: string;
  btnBorder: string;
  drillCardBg: string;
  drillCardBorder: string;
  drillCardText: string;
  shadowGlow: string;
  glowOrb: string;
}> = {
  muscu: {
    primary: '#FBBF24',
    bgGradient: 'from-amber-950/40 via-[#12082b] to-[#090514]',
    border: 'border-amber-500/15',
    badgeWorkBg: 'bg-amber-500',
    badgeWorkText: 'text-black',
    progressWork: 'bg-amber-400',
    labelTextColor: 'text-amber-400',
    btnBgGradient: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500',
    btnBorder: 'border-amber-500/20',
    drillCardBg: 'bg-amber-950/20',
    drillCardBorder: 'border-amber-500/30',
    drillCardText: 'text-amber-200',
    shadowGlow: 'shadow-amber-500/10',
    glowOrb: 'bg-amber-500/10'
  },
  powerlifting: {
    primary: '#F59E0B',
    bgGradient: 'from-yellow-950/40 via-[#0d071d] to-[#090514]',
    border: 'border-yellow-500/15',
    badgeWorkBg: 'bg-yellow-500',
    badgeWorkText: 'text-black',
    progressWork: 'bg-yellow-400',
    labelTextColor: 'text-yellow-400',
    btnBgGradient: 'from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400',
    btnBorder: 'border-yellow-500/20',
    drillCardBg: 'bg-yellow-950/20',
    drillCardBorder: 'border-yellow-500/30',
    drillCardText: 'text-yellow-200',
    shadowGlow: 'shadow-yellow-500/10',
    glowOrb: 'bg-yellow-500/10'
  },
  jjb: {
    primary: '#8B5CF6',
    bgGradient: 'from-purple-900/40 via-[#12082b] to-[#090514]',
    border: 'border-purple-500/15',
    badgeWorkBg: 'bg-purple-600',
    badgeWorkText: 'text-white',
    progressWork: 'bg-purple-500',
    labelTextColor: 'text-purple-400',
    btnBgGradient: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
    btnBorder: 'border-purple-500/20',
    drillCardBg: 'bg-purple-950/20',
    drillCardBorder: 'border-purple-500/30',
    drillCardText: 'text-purple-200',
    shadowGlow: 'shadow-purple-500/10',
    glowOrb: 'bg-purple-600/10'
  },
  boxe: {
    primary: '#EF4444',
    bgGradient: 'from-red-950/40 via-[#14060e] to-[#090514]',
    border: 'border-red-500/15',
    badgeWorkBg: 'bg-red-600',
    badgeWorkText: 'text-white',
    progressWork: 'bg-red-500',
    labelTextColor: 'text-red-400',
    btnBgGradient: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
    btnBorder: 'border-red-500/20',
    drillCardBg: 'bg-red-950/20',
    drillCardBorder: 'border-red-500/30',
    drillCardText: 'text-red-200',
    shadowGlow: 'shadow-red-500/10',
    glowOrb: 'bg-red-500/10'
  },
  mma: {
    primary: '#06B6D4',
    bgGradient: 'from-cyan-950/40 via-[#060c1c] to-[#090514]',
    border: 'border-cyan-500/15',
    badgeWorkBg: 'bg-cyan-600',
    badgeWorkText: 'text-white',
    progressWork: 'bg-cyan-500',
    labelTextColor: 'text-cyan-400',
    btnBgGradient: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    btnBorder: 'border-cyan-500/20',
    drillCardBg: 'bg-cyan-950/20',
    drillCardBorder: 'border-cyan-500/30',
    drillCardText: 'text-cyan-200',
    shadowGlow: 'shadow-cyan-500/10',
    glowOrb: 'bg-cyan-500/10'
  },
  muay_thai: {
    primary: '#F97316',
    bgGradient: 'from-orange-950/40 via-[#170905] to-[#090514]',
    border: 'border-orange-500/15',
    badgeWorkBg: 'bg-orange-600',
    badgeWorkText: 'text-white',
    progressWork: 'bg-orange-500',
    labelTextColor: 'text-orange-400',
    btnBgGradient: 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
    btnBorder: 'border-orange-500/20',
    drillCardBg: 'bg-orange-950/20',
    drillCardBorder: 'border-orange-500/30',
    drillCardText: 'text-orange-200',
    shadowGlow: 'shadow-orange-500/10',
    glowOrb: 'bg-orange-500/10'
  }
};

// ==========================================
// ACCENTS NÉON CYBERPUNK ET STYLES DE GLOW
// ==========================================
const ACCENT_STYLES = {
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    accent: '#06B6D4',
    bgLight: 'bg-cyan-50',
    pulse: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    name: 'Cyan Électrique'
  },
  magenta: {
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500',
    border: 'border-fuchsia-500/30',
    glow: 'shadow-fuchsia-500/20',
    accent: '#D946EF',
    bgLight: 'bg-fuchsia-50',
    pulse: 'shadow-[0_0_15px_rgba(217,70,239,0.6)]',
    name: 'Magenta Néo-Punk'
  },
  lime: {
    text: 'text-lime-400',
    bg: 'bg-lime-500',
    border: 'border-lime-500/30',
    glow: 'shadow-lime-500/20',
    accent: '#84CC16',
    bgLight: 'bg-lime-50',
    pulse: 'shadow-[0_0_15px_rgba(132,204,22,0.6)]',
    name: 'Lime Toxique'
  },
  gold: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[#FBBF24]',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    accent: '#FBBF24',
    bgLight: 'bg-amber-50',
    pulse: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]',
    name: 'Or Solaire'
  },
  violet: {
    text: 'text-purple-400',
    bg: 'bg-purple-500',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    accent: '#A78BFA',
    bgLight: 'bg-purple-50',
    pulse: 'shadow-[0_0_15px_rgba(167,139,250,0.6)]',
    name: 'Violet Shogun'
  }
};

/// ==========================================
/// LES ÉTATS GLOBAUX
/// Cette section regroupe tous les états locaux et globaux (onboarding,
/// profil, historique de poids, entraînement actif, et minuteurs).
/// ==========================================
export default function App() {
  // Onboarding states
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => localStorage.getItem('standpower_onboarding_done') === 'true');
  const [onboardingSelectedSports, setOnboardingSelectedSports] = useState<string[]>(() => {
    const saved = localStorage.getItem('standpower_onboarding_sports');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation: muscu, records, jjb, weight, profil
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('standpower_onboarding_sports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      } catch {}
    }
    return 'muscu';
  });

  // Discipline selection grid state (null = show home grid)
  const [selectedSport, setSelectedSport] = useState<string | null>(() => {
    const saved = localStorage.getItem('standpower_onboarding_sports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      } catch {}
    }
    return 'muscu';
  });

  // Filter for Séance home screen disciplines
  const [sportFilter, setSportFilter] = useState<'all' | 'muscu' | 'jjb' | 'boxe' | 'mma' | 'muay_thai' | 'powerlifting'>('all');

  // AdMob simulation states
  const [isAdVisible, setIsAdVisible] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(3);
  const [adCallback, setAdCallback] = useState<(() => void) | null>(null);

  // Combat Sports states
  const [combatRoundsCount, setCombatRoundsCount] = useState<number>(3);
  const [combatRoundDuration, setCombatRoundDuration] = useState<number>(180); // seconds
  const [combatRestDuration, setCombatRestDuration] = useState<number>(60); // seconds
  const [combatTimeLeft, setCombatTimeLeft] = useState<number>(180);
  const [combatActiveRound, setCombatActiveRound] = useState<number>(1);
  const [isCombatTimerActive, setIsCombatTimerActive] = useState<boolean>(false);
  const [isCombatRestMode, setIsCombatRestMode] = useState<boolean>(false);
  const [combatSessionDone, setCombatSessionDone] = useState<boolean>(false);
  const [combatTotalElapsed, setCombatTotalElapsed] = useState<number>(0);
  const [combatCheckedDrills, setCombatCheckedDrills] = useState<Record<string, boolean>>({});

  // Sub-screens within workouts (DASHBOARD, CREATE_WORKOUT, WORKOUT_FLOW, SUMMARY)
  const [muscuScreen, setMuscuScreen] = useState<'DASHBOARD' | 'CREATE_WORKOUT' | 'WORKOUT_FLOW' | 'SUMMARY'>('DASHBOARD');

  // Sport selection switcher modal state
  const [isSportSwitcherOpen, setIsSportSwitcherOpen] = useState<boolean>(false);

  // Profile data
  const [profile, setProfile] = useState<ExtendedProfile>({
    weightKg: 78.5,
    heightCm: 182,
    goal: 'Prise de masse',
    beltColor: 'Blanche',
    beltStripes: 0,
    age: 28,
    activityLevel: 'Actif'
  });

  // History states
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [mensurations, setMensurations] = useState<MensurationLog[]>([]);
  const [bjjRolls, setBjjRolls] = useState<BjjRollLog[]>([]);
  
  // Custom Workouts for Musculation
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([]);

  // Key Personal Lift Records
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  // Weight entry form inputs
  const [weightInput, setWeightInput] = useState<string>('');

  // Personal Records inline updates
  const [newPrWeight, setNewPrWeight] = useState<Record<string, string>>({});
  const [newPrReps, setNewPrReps] = useState<Record<string, string>>({});

  // BJJ Sparring Form
  const [rollRounds, setRollRounds] = useState<number>(3);
  const [rollMinutes, setRollMinutes] = useState<number>(5);
  const [rollTechnique, setRollTechnique] = useState<string>('');
  const [rollIntensity, setRollIntensity] = useState<'Souple' | 'Technique' | 'Dur'>('Technique');

  // Create Custom Workout form states
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutTypeForCreation, setWorkoutTypeForCreation] = useState<'muscu' | 'jjb'>('muscu');
  const [newWorkoutName, setNewWorkoutName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Pectoraux');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [draftSets, setDraftSets] = useState<number>(4);
  const [draftReps, setDraftReps] = useState<number>(10);
  const [draftLoad, setDraftLoad] = useState<number>(20);
  const [draftExercises, setDraftExercises] = useState<CustomExercise[]>([]);
  const [builderError, setBuilderError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeExerciseStatuses, setActiveExerciseStatuses] = useState<Record<number, 'idle' | 'in_progress' | 'completed'>>({});
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);

  // Active workout flow session parameters
  const [activeWorkout, setActiveWorkout] = useState<CustomWorkout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // CRUCIAL DYNAMIC SET-LEVEL WEIGHT AND REP TRACKER DURING SESSIONS
  // Key: "exerciseIndex-setIndex" -> value
  const [liveSetWeights, setLiveSetWeights] = useState<Record<string, number>>({});
  const [liveSetReps, setLiveSetReps] = useState<Record<string, number>>({});
  const [liveSetCompleted, setLiveSetCompleted] = useState<Record<string, boolean>>({});

  // Recovery countdown settings
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restInitialSeconds, setRestInitialSeconds] = useState<number>(90);
  const [timerExerciseName, setTimerExerciseName] = useState<string>('');

  // 1RM Brzycki Calculator inputs
  const [calcLoad, setCalcLoad] = useState<string>('80');
  const [calcReps, setCalcReps] = useState<string>('5');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // Circumferences inputs
  const [measArm, setMeasArm] = useState<string>('38');
  const [measChest, setMeasChest] = useState<string>('104');
  const [measWaist, setMeasWaist] = useState<string>('82');
  const [measThigh, setMeasThigh] = useState<string>('58');

  // Custom non-blocking Toast & Confirmation modal states
  const [inAppToast, setInAppToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ==========================================
  // NEW CYBERPUNK CHRONO, THEME OPTIONS & AI GOALS
  // ==========================================
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('kinetic_theme_mode') as 'system' | 'dark' | 'light') || 'system';
  });
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const isLightMode = useMemo(() => {
    if (themeMode === 'light') return true;
    if (themeMode === 'dark') return false;
    return !isSystemDark;
  }, [themeMode, isSystemDark]);

  const [accentColor, setAccentColor] = useState<'cyan' | 'magenta' | 'lime' | 'gold' | 'violet'>(() => {
    return (localStorage.getItem('kinetic_accent_color') as 'cyan' | 'magenta' | 'lime' | 'gold' | 'violet') || 'cyan';
  });

  const [isLogoPulsing, setIsLogoPulsing] = useState<boolean>(false);

  const [coachGender, setCoachGender] = useState<'masculin' | 'feminin'>(() => {
    return (localStorage.getItem('kinetic_coach_gender') as 'masculin' | 'feminin') || 'masculin';
  });
  const [coachAccent, setCoachAccent] = useState<'francais' | 'quebecois' | 'combat' | 'energes'>(() => {
    return (localStorage.getItem('kinetic_coach_accent') as 'francais' | 'quebecois' | 'combat' | 'energes') || 'francais';
  });
  const [coachSpeed, setCoachSpeed] = useState<'lente' | 'normale' | 'rapide'>(() => {
    return (localStorage.getItem('kinetic_coach_speed') as 'lente' | 'normale' | 'rapide') || 'normale';
  });

  const [notifyPref, setNotifyPref] = useState<'important' | 'all' | 'none'>(() => {
    return (localStorage.getItem('kinetic_notify_pref') as 'important' | 'all' | 'none') || 'all';
  });

  const [aiGoalsCompleted, setAiGoalsCompleted] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('kinetic_ai_goals_completed');
    return saved ? JSON.parse(saved) : {
      goal1: false, // "Enregistrer sa pesée du jour"
      goal2: false, // "Compléter 3 séries de musculation"
      goal3: false, // "Faire 5 min d'étirements du dos"
      goal4: false  // "Générer et compléter la routine d'entraînement IA"
    };
  });

  // Pompe Marathon progressive levels & reps
  const [pompeReps, setPompeReps] = useState<number>(() => {
    const saved = localStorage.getItem('standpower_pompe_reps');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentPompeLevel, setCurrentPompeLevel] = useState<number>(() => {
    const saved = localStorage.getItem('standpower_pompe_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Daily IA Workout generated state
  const [iaWorkoutGenerated, setIaWorkoutGenerated] = useState<boolean>(() => {
    return localStorage.getItem('standpower_ia_workout_generated') === 'true';
  });
  const [iaWorkoutCompletedExercises, setIaWorkoutCompletedExercises] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('standpower_ia_workout_completed_ex');
    return saved ? JSON.parse(saved) : {};
  });



  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setInAppToast({ message, type });
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setInAppToast(prev => prev && prev.message === message ? null : prev);
    }, 4000);
  };

  // AI guide downloader & viewers
  const [aiGuides, setAiGuides] = useState<Record<string, { properForm: string[], safetyTips: string[], targetMuscles: string[] }>>({});
  const [loadingAiGuide, setLoadingAiGuide] = useState<boolean>(false);
  const [activeGuideExercise, setActiveGuideExercise] = useState<string | null>(null);

  // Clocks hooks
  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Swipe Gestures for Navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null || 
      touchEndX.current === null || 
      touchStartY.current === null || 
      touchEndY.current === null
    ) {
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Must be a clear horizontal swipe (diffX threshold 70, diffY < 60)
    if (Math.abs(diffX) > 70 && Math.abs(diffY) < 60) {
      const activeSportsList = onboardingSelectedSports.length > 0 
        ? onboardingSelectedSports 
        : ['muscu', 'jjb', 'boxe', 'mma', 'muay_thai', 'powerlifting'];
        
      const tabOrder = [...activeSportsList, 'dashboard_ia', 'records', 'weight', 'profil'];
      const currentIdx = tabOrder.indexOf(activeTab);
      
      if (currentIdx !== -1) {
        if (diffX > 0) {
          // Swipe Left -> Next Tab
          const nextIdx = (currentIdx + 1) % tabOrder.length;
          const nextTab = tabOrder[nextIdx];
          setActiveTab(nextTab);
          if (activeSportsList.includes(nextTab)) {
            setSelectedSport(nextTab);
          } else {
            setSelectedSport(null);
          }
        } else {
          // Swipe Right -> Previous Tab
          const prevIdx = (currentIdx - 1 + tabOrder.length) % tabOrder.length;
          const prevTab = tabOrder[prevIdx];
          setActiveTab(prevTab);
          if (activeSportsList.includes(prevTab)) {
            setSelectedSport(prevTab);
          } else {
            setSelectedSport(null);
          }
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // Auto-scroll selected bottom tab into center view
  useEffect(() => {
    const activeEl = document.getElementById(`dock-tab-${activeTab}`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('standpower_pompe_reps', pompeReps.toString());
  }, [pompeReps]);

  useEffect(() => {
    localStorage.setItem('standpower_pompe_level', currentPompeLevel.toString());
  }, [currentPompeLevel]);

  useEffect(() => {
    localStorage.setItem('standpower_ia_workout_generated', iaWorkoutGenerated.toString());
  }, [iaWorkoutGenerated]);

  useEffect(() => {
    localStorage.setItem('standpower_ia_workout_completed_ex', JSON.stringify(iaWorkoutCompletedExercises));
  }, [iaWorkoutCompletedExercises]);
  


  // Dynamic Metabolism Calculations (Mifflin-St Jeor & Protein Needs)
  const latestWeight = weightHistory.length > 0 ? weightHistory[0].weightKg : profile.weightKg;
  const computedBmr = (10 * latestWeight) + (6.25 * profile.heightCm) - (5 * (profile.age || 28)) + 5;
  
  let currentActivityMultiplier = 1.55;
  if (profile.activityLevel === 'Sédentaire') currentActivityMultiplier = 1.2;
  else if (profile.activityLevel === 'Très Actif') currentActivityMultiplier = 1.8;
  
  const computedMaintenance = Math.round(computedBmr * currentActivityMultiplier);
  
  let computedDailyCalories = computedMaintenance;
  if (profile.goal === 'Sèche') {
    computedDailyCalories = computedMaintenance - 500;
  } else if (profile.goal === 'Prise de masse') {
    computedDailyCalories = computedMaintenance + 300;
  }
  
  const computedDailyProteins = Math.round(latestWeight * 2);

/// ==========================================
/// LES USEEFFECTS
/// Cette section regroupe tous les cycles de vie, synchronisations
/// locales sécurisées et minuteurs actifs de l'application.
/// ==========================================
  useEffect(() => {
    // 1. Profile load securely
    const defaultProf: ExtendedProfile = {
      weightKg: 78.5,
      heightCm: 182,
      goal: 'Prise de masse',
      beltColor: 'Blanche',
      beltStripes: 0,
      age: 28,
      activityLevel: 'Actif'
    };
    const parsedProf = secureLoad<ExtendedProfile>('kinetic_profile_extended', defaultProf);
    setProfile({
      weightKg: parsedProf.weightKg ?? 78.5,
      heightCm: parsedProf.heightCm ?? 182,
      goal: parsedProf.goal ?? 'Prise de masse',
      beltColor: parsedProf.beltColor ?? 'Blanche',
      beltStripes: parsedProf.beltStripes ?? 0,
      age: parsedProf.age ?? 28,
      activityLevel: parsedProf.activityLevel ?? 'Actif'
    });

    // 2. Weight History load securely
    const defaultWeightHistory: WeightLog[] = [
      { id: '1', date: '2026-06-10', weightKg: 77.2 },
      { id: '2', date: '2026-06-12', weightKg: 77.8 },
      { id: '3', date: '2026-06-15', weightKg: 78.1 },
      { id: '4', date: '2026-06-18', weightKg: 78.5 }
    ];
    setWeightHistory(secureLoad<WeightLog[]>('kinetic_weight_history', defaultWeightHistory));

    // 3. Body Measurements load securely
    const defaultMens: MensurationLog[] = [
      { id: '1', date: '2026-06-01', brasCm: 37.0, poitrineCm: 102.0, tailleCm: 84.0, cuisseCm: 56.5 },
      { id: '2', date: '2026-06-15', brasCm: 38.0, poitrineCm: 104.0, tailleCm: 82.0, cuisseCm: 58.0 }
    ];
    setMensurations(secureLoad<MensurationLog[]>('kinetic_mensurations', defaultMens));

    // 4. BJJ Rolls load securely
    const defaultRolls: BjjRollLog[] = [
      { id: '1', date: '2026-06-14', roundsCount: 4, roundMinutes: 5, technique: 'Passage Papillon', intensity: 'Technique' },
      { id: '2', date: '2026-06-17', roundsCount: 6, roundMinutes: 6, technique: 'Défense clé de bras', intensity: 'Dur' }
    ];
    setBjjRolls(secureLoad<BjjRollLog[]>('kinetic_bjj_rolls', defaultRolls));

    // 5. Personal Lifts Records load securely
    const defaultPr: PersonalRecord[] = [
      { id: '1', exerciseName: "Développé Couché (Barre)", maxWeightKg: 140, reps: 3, date: '2026-06-10' },
      { id: '2', exerciseName: "Squats Arrière (Barre)", maxWeightKg: 180, reps: 5, date: '2026-06-12' },
      { id: '3', exerciseName: "Soulevé de Terre (Barre)", maxWeightKg: 210, reps: 1, date: '2026-06-15' },
      { id: '4', exerciseName: "Tractions Pronation (Lestées)", maxWeightKg: 30, reps: 6, date: '2026-06-16' },
      { id: '5', exerciseName: "Presse à Cuisses (Leg Press)", maxWeightKg: 500, reps: 8, date: '2026-06-17' }
    ];
    setPersonalRecords(secureLoad<PersonalRecord[]>('kinetic_personal_records', defaultPr));

    // 6. Gemini AI Guides cache load securely
    const cachedGuides = secureLoad<Record<string, { properForm: string[], safetyTips: string[], targetMuscles: string[] }>>('kinetic_ai_guides', {});
    setAiGuides(cachedGuides);
  }, []);

  // Custom Workouts list load reactively based on active sport
  useEffect(() => {
    if (!selectedSport) return;
    
    // We only have custom strength workouts for Force sports
    const isForce = selectedSport === 'muscu' || selectedSport === 'powerlifting';
    if (!isForce) return;

    const key = 'kinetic_workouts_' + selectedSport;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch (e) {
        setWorkouts([]);
      }
    } else {
      let defaultWorkouts: CustomWorkout[] = [];
      if (selectedSport === 'muscu') {
        defaultWorkouts = [
          {
            id: 'muscu_1',
            name: 'Séance Push (Pec, Épaules, Triceps)',
            exercises: [
              { name: "Développé Couché (Barre)", sets: 4, reps: 8, targetLoadKg: 60 },
              { name: "Développé Militaire (Barre)", sets: 4, reps: 8, targetLoadKg: 40 },
              { name: "Élévations Latérales (Haltères)", sets: 3, reps: 12, targetLoadKg: 10 },
              { name: "Extensions Triceps Poulie (Corde)", sets: 3, reps: 12, targetLoadKg: 20 }
            ]
          },
          {
            id: 'muscu_2',
            name: 'Renforcement Spécial JJB & Sol',
            exercises: [
              { name: "Turkish Get-Up (Relevé technique lourd)", sets: 3, reps: 5, targetLoadKg: 16 },
              { name: "Tractions avec Serviette (Grip Training)", sets: 4, reps: 8, targetLoadKg: 0 },
              { name: "Hip Thrusts Explosifs (Pontages de Garde)", sets: 4, reps: 12, targetLoadKg: 50 },
              { name: "Sprawls Explosifs (Anti-takedown)", sets: 3, reps: 15, targetLoadKg: 0 }
            ]
          }
        ];
      } else if (selectedSport === 'powerlifting') {
        defaultWorkouts = [
          {
            id: 'power_1',
            name: 'Séance SBD Classique (Force Athlétique)',
            exercises: [
              { name: "Squats Arrière (Barre)", sets: 5, reps: 5, targetLoadKg: 100 },
              { name: "Développé Couché (Barre)", sets: 5, reps: 5, targetLoadKg: 80 },
              { name: "Soulevé de Terre (Barre)", sets: 3, reps: 5, targetLoadKg: 120 }
            ]
          }
        ];
      }
      setWorkouts(defaultWorkouts);
      localStorage.setItem(key, JSON.stringify(defaultWorkouts));
    }
  }, [selectedSport]);

  const updateProfileAndSave = (updated: ExtendedProfile) => {
    setProfile(updated);
    secureSave('kinetic_profile_extended', updated);
  };

  // ---------------------------------------------------------------------------
  // RUNTIME CLOCKS CONTROLLER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (sessionStartTime && muscuScreen === 'WORKOUT_FLOW') {
      activeTimerRef.current = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (activeTimerRef.current) {
        clearInterval(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    }
    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, [sessionStartTime, muscuScreen]);

  useEffect(() => {
    if (isRestTimerActive && restSecondsLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current!);
            setIsRestTimerActive(false);
            playAlertChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestTimerActive, restSecondsLeft]);

  // 1. Simulated AdMob countdown loop
  useEffect(() => {
    let adInterval: NodeJS.Timeout | null = null;
    if (isAdVisible && adCountdown > 0) {
      adInterval = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (adInterval) clearInterval(adInterval);
    };
  }, [isAdVisible, adCountdown]);

  // 2. Active Combat Sports round countdown timer loop
  useEffect(() => {
    let combatInterval: NodeJS.Timeout | null = null;
    if (isCombatTimerActive && combatTimeLeft > 0) {
      combatInterval = setInterval(() => {
        setCombatTimeLeft(prev => {
          if (prev <= 1) {
            try { playAlertChime(); } catch(e) {}
            
            if (!isCombatRestMode) {
              // End of work round
              if (combatActiveRound >= combatRoundsCount) {
                // Completed whole session!
                setIsCombatTimerActive(false);
                setCombatSessionDone(true);
                return 0;
              } else {
                setIsCombatRestMode(true);
                return combatRestDuration;
              }
            } else {
              // End of rest, start next work round
              setIsCombatRestMode(false);
              setCombatActiveRound(r => r + 1);
              return combatRoundDuration;
            }
          }
          return prev - 1;
        });
        setCombatTotalElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (combatInterval) clearInterval(combatInterval);
    }
    return () => {
      if (combatInterval) clearInterval(combatInterval);
    };
  }, [isCombatTimerActive, combatTimeLeft, isCombatRestMode, combatActiveRound, combatRoundsCount, combatRoundDuration, combatRestDuration]);

  // System Dark preference media query listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);



/// ==========================================
/// FONCTIONS UTILITAIRES ET GESTIONNAIRES D'ÉVÉNEMENTS
/// Cette section contient tous les handlers pour l'entraînement,
/// les publicités d'intermission, la pesée dynamique, les records
/// et les fiches IA de force.
/// ==========================================


  // Complete an AI daily goal
  const handleCompleteAiGoal = (goalKey: string) => {
    setAiGoalsCompleted(prev => {
      const next = { ...prev, [goalKey]: !prev[goalKey] };
      localStorage.setItem('kinetic_ai_goals_completed', JSON.stringify(next));
      if (next[goalKey]) {
        showToast("Objectif IA complété ! +100 points de force. 🔥", "success");
        setIsLogoPulsing(true);
        setTimeout(() => setIsLogoPulsing(false), 1000);
      }
      return next;
    });
  };

  const POMPE_LEVEL_TARGETS = [10, 20, 50, 100, 200, 500];
  const POMPE_LEVEL_NAMES = [
    "Niveau 1 : Initiation Tactique",
    "Niveau 2 : Guerrier de Bronze",
    "Niveau 3 : Athlète d'Argent",
    "Niveau 4 : Spécialiste d'Or",
    "Niveau 5 : Maître de la Force",
    "Niveau 6 : Légende de l'Octogone"
  ];

  const handleAddPompe = (increment: number = 1) => {
    const newReps = pompeReps + increment;
    setPompeReps(newReps);
    
    // Calculate new level based on cumulative thresholds
    let nextLevel = currentPompeLevel;
    for (let i = 0; i < POMPE_LEVEL_TARGETS.length; i++) {
      if (newReps >= POMPE_LEVEL_TARGETS[i]) {
        nextLevel = Math.min(POMPE_LEVEL_TARGETS.length, i + 2);
      }
    }

    if (nextLevel > currentPompeLevel) {
      setCurrentPompeLevel(nextLevel);
      showToast(`🏆 NIVEAU REUSSI ! Vous passez au ${POMPE_LEVEL_NAMES[nextLevel - 1]} ! Nouveau défi : ${POMPE_LEVEL_TARGETS[nextLevel - 1] || 500} pompes.`, "success");
    } else {
      const currentTarget = POMPE_LEVEL_TARGETS[currentPompeLevel - 1] || 100;
      showToast(`Pompe enregistrée (${newReps}/${currentTarget}) ! Force et Honneur ! 🦾`, "success");
    }
  };

  const getPersonalizedIaWorkout = () => {
    const activeSportsList = onboardingSelectedSports.length > 0 
      ? onboardingSelectedSports 
      : ['muscu', 'jjb', 'boxe', 'mma', 'muay_thai', 'powerlifting'];
      
    const mainSport = activeSportsList[0] || 'muscu';
    const secondarySport = activeSportsList[1] || 'mma';
    
    const exercises: { name: string; target: string; reps: string; icon: string }[] = [];
    
    if (mainSport === 'muscu' || mainSport === 'powerlifting') {
      exercises.push({ name: "Développé Couché Incliné lourd", target: "Surcharge Progressive Force", reps: "4 séries x 6-8 reps", icon: "Dumbbell" });
    } else if (mainSport === 'jjb') {
      exercises.push({ name: "Drill de Passage de Garde", target: "Hanches & Agilité au sol", reps: "3 rounds x 3 minutes", icon: "Award" });
    } else if (mainSport === 'boxe' || mainSport === 'mma') {
      exercises.push({ name: "Shadow Boxing lesté", target: "Vitesse d'impact & Cardiox", reps: "3 rounds x 3 minutes", icon: "Zap" });
    } else if (mainSport === 'muay_thai') {
      exercises.push({ name: "Middle Kicks explosifs au sac", target: "Hanches & Puissance jambe", reps: "50 kicks par jambe", icon: "Flame" });
    }
    
    if (secondarySport === 'muscu' || secondarySport === 'powerlifting') {
      exercises.push({ name: "Soulevé de Terre (Deadlift) technique", target: "Chaîne Postérieure", reps: "3 séries x 5 reps", icon: "Medal" });
    } else if (secondarySport === 'jjb') {
      exercises.push({ name: "Pontages explosifs (Hip Thrusts)", target: "Force de Garde & Relevés", reps: "4 séries x 12 reps", icon: "Trophy" });
    } else if (secondarySport === 'boxe' || secondarySport === 'mma' || secondarySport === 'muay_thai') {
      exercises.push({ name: "Sprawls + Enchaînement Directs", target: "Anti-takedown & Cardio", reps: "3 séries x 15 reps", icon: "Timer" });
    }
    
    exercises.push({ name: "Gainage actif avec rotation", target: "Stabilité du tronc (Core)", reps: "3 séries x 1 minute", icon: "ShieldAlert" });
    
    return exercises;
  };

  // Core monetization trigger
  const triggerAd = (onAdClosed: () => void) => {
    setIsAdVisible(true);
    setAdCountdown(3);
    setAdCallback(() => onAdClosed);
  };

  // Discipline selection router
  const selectSportDiscipline = (sport: 'muscu' | 'jjb' | 'boxe' | 'mma' | 'muay_thai' | 'powerlifting') => {
    setSelectedSport(sport);
    setActiveTab(sport);
    
    // De-activate existing trackers to avoid overlapping sound alerts
    setIsRestTimerActive(false);
    setRestSecondsLeft(0);
    
    // Reset combat state attributes
    setIsCombatTimerActive(false);
    setIsCombatRestMode(false);
    setCombatSessionDone(false);
    setCombatActiveRound(1);
    setCombatTotalElapsed(0);
    setCombatCheckedDrills({});
    
    // Apply dynamic sports specific standards
    if (sport === 'boxe') {
      setCombatRoundsCount(3);
      setCombatRoundDuration(180);
      setCombatRestDuration(60);
      setCombatTimeLeft(180);
    } else if (sport === 'mma') {
      setCombatRoundsCount(5);
      setCombatRoundDuration(300);
      setCombatRestDuration(60);
      setCombatTimeLeft(300);
    } else if (sport === 'muay_thai') {
      setCombatRoundsCount(5);
      setCombatRoundDuration(180);
      setCombatRestDuration(120);
      setCombatTimeLeft(180);
    } else if (sport === 'powerlifting') {
      // Powerlifting standards: heavy sets with rest
      setCombatRoundsCount(5);
      setCombatRoundDuration(180);
      setCombatRestDuration(180);
      setCombatTimeLeft(180);
      setMuscuScreen('DASHBOARD');
    } else if (sport === 'muscu') {
      setMuscuScreen('DASHBOARD');
    }
  };

  // Handle switching sports and toggling them in the bottom dock list
  const handleSwitchSport = (sportId: string) => {
    const currentActiveList = onboardingSelectedSports.length > 0 
      ? onboardingSelectedSports 
      : ['muscu', 'jjb', 'boxe', 'mma', 'muay_thai', 'powerlifting'];

    const isCurrent = selectedSport === sportId;

    if (isCurrent) {
      // Re-clicking the active sport: remove it from the bottom bar list
      const updated = currentActiveList.filter(id => id !== sportId);
      if (updated.length === 0) {
        // Cannot have 0 sports in the dock!
        return;
      }
      setOnboardingSelectedSports(updated);
      localStorage.setItem('standpower_onboarding_sports', JSON.stringify(updated));

      // Switch active sport to the first remaining sport in the list
      selectSportDiscipline(updated[0] as any);
    } else {
      // Clicking an inactive sport:
      // If it is already in the dock, just activate/switch to it
      if (currentActiveList.includes(sportId)) {
        selectSportDiscipline(sportId as any);
      } else {
        // If it is not in the dock, add it to the dock and activate it
        const updated = [...currentActiveList, sportId];
        setOnboardingSelectedSports(updated);
        localStorage.setItem('standpower_onboarding_sports', JSON.stringify(updated));
        selectSportDiscipline(sportId as any);
      }
    }
  };

  // Handle default selects for creation
  useEffect(() => {
    const list = workoutTypeForCreation === 'muscu' 
      ? CLASSIC_EXERCISES.filter(ex => ex.category === selectedCategory)
      : JJB_EXERCISES;
    
    if (list.length > 0) {
      setSelectedExerciseName(list[0].name);
      setDraftSets(list[0].defaultSets);
      setDraftReps(list[0].defaultReps);
      setDraftLoad(list[0].defaultLoadKg);
    }
  }, [selectedCategory, workoutTypeForCreation]);

  const handleExerciseSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const list = workoutTypeForCreation === 'muscu' ? CLASSIC_EXERCISES : JJB_EXERCISES;
    const found = list.find(x => x.name === e.target.value);
    if (found) {
      setSelectedExerciseName(found.name);
      setDraftSets(found.defaultSets);
      setDraftReps(found.defaultReps);
      setDraftLoad(found.defaultLoadKg);
    }
  };

  // ---------------------------------------------------------------------------
  // SESSIONS BUILDER & DELETER
  // ---------------------------------------------------------------------------
  const handleAddNewExerciseToDraft = () => {
    if (!selectedExerciseName) {
      setBuilderError("Sélectionnez un exercice pour continuer.");
      return;
    }
    if (draftSets < 1 || draftReps < 1) {
      setBuilderError("Les séries et répétitions doivent être supérieures à zéro.");
      return;
    }
    if (draftExercises.some(ex => ex.name === selectedExerciseName)) {
      setBuilderError("Cet exercice est déjà renseigné dans votre séance.");
      return;
    }

    const nEx: CustomExercise = {
      name: selectedExerciseName,
      sets: draftSets,
      reps: draftReps,
      targetLoadKg: draftLoad
    };

    setDraftExercises(prev => [...prev, nEx]);
    setBuilderError('');
    showToast(`Exercice "${selectedExerciseName}" ajouté.`, "success");
  };

  const handleRemoveDraftExercise = (idx: number) => {
    setDraftExercises(prev => prev.filter((_, i) => i !== idx));
    showToast("Exercice retiré de la séance.", "info");
  };

  const handleSaveWholeWorkout = () => {
    const trimmedName = newWorkoutName.trim();
    if (!trimmedName) {
      setBuilderError("Indiquez un nom de séance valide.");
      return;
    }
    if (draftExercises.length === 0) {
      setBuilderError("Configurez au moins un exercice.");
      return;
    }

    let updatedList: CustomWorkout[];
    if (editingWorkoutId) {
      updatedList = workouts.map(w => w.id === editingWorkoutId ? { ...w, name: trimmedName, exercises: draftExercises } : w);
    } else {
      const finalWorkout: CustomWorkout = {
        id: 'wk_' + Date.now(),
        name: trimmedName,
        exercises: draftExercises
      };
      updatedList = [...workouts, finalWorkout];
    }

    setWorkouts(updatedList);
    localStorage.setItem('kinetic_workouts_' + (selectedSport || 'muscu'), JSON.stringify(updatedList));

    showToast(editingWorkoutId ? "Séance d'entraînement modifiée !" : "Nouvelle séance d'entraînement créée !", "success");
    setMuscuScreen('DASHBOARD');
    setNewWorkoutName('');
    setDraftExercises([]);
    setEditingWorkoutId(null);
  };

  const startEditingWorkout = (wk: CustomWorkout) => {
    setEditingWorkoutId(wk.id);
    setNewWorkoutName(wk.name);
    setDraftExercises(wk.exercises);
    setSearchQuery('');
    setMuscuScreen('CREATE_WORKOUT');
  };

  const handleDeleteSavedWorkout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessionToDeleteId === id) {
      const remaining = workouts.filter(w => w.id !== id);
      setWorkouts(remaining);
      localStorage.setItem('kinetic_workouts_' + (selectedSport || 'muscu'), JSON.stringify(remaining));
      setSessionToDeleteId(null);
    } else {
      setSessionToDeleteId(id);
    }
  };

  // ---------------------------------------------------------------------------
  // PROGRESSIVE OVERLOAD ACTIVE TRAINING ENGINE (LIVE TRACKING SETS)
  // ---------------------------------------------------------------------------
  const startWorkoutSession = (wk: CustomWorkout) => {
    setActiveWorkout(wk);
    setSessionDuration(0);
    setSessionStartTime(Date.now());
    
    // Initialize LIVE custom sets map
    const newWeights: Record<string, number> = {};
    const newReps: Record<string, number> = {};
    const newCompleted: Record<string, boolean> = {};
    const initialStatuses: Record<number, 'idle' | 'in_progress' | 'completed'> = {};

    wk.exercises.forEach((ex, exIdx) => {
      initialStatuses[exIdx] = exIdx === 0 ? 'in_progress' : 'idle';
      for (let sIdx = 0; sIdx < ex.sets; sIdx++) {
        const key = `${exIdx}-${sIdx}`;
        newWeights[key] = ex.targetLoadKg;
        newReps[key] = ex.reps;
        newCompleted[key] = false;
      }
    });

    setLiveSetWeights(newWeights);
    setLiveSetReps(newReps);
    setLiveSetCompleted(newCompleted);
    setActiveExerciseStatuses(initialStatuses);
    setIsRestTimerActive(false);
    setRestSecondsLeft(0);
    setMuscuScreen('WORKOUT_FLOW');
  };

  const handleUpdateExerciseStatus = (exIdx: number, newStatus: 'idle' | 'in_progress' | 'completed') => {
    setActiveExerciseStatuses(prev => ({ ...prev, [exIdx]: newStatus }));
    
    if (newStatus === 'completed') {
      try { playAlertChime(); } catch (e) { console.error(e); }
      if (activeWorkout) {
        const currentExerciseName = activeWorkout.exercises[exIdx].name;
        setTimerExerciseName(currentExerciseName);
        setRestSecondsLeft(restInitialSeconds);
        setIsRestTimerActive(true);

        // Auto move to next exercise in_progress
        if (exIdx + 1 < activeWorkout.exercises.length) {
          setActiveExerciseStatuses(prev => ({
            ...prev,
            [exIdx]: 'completed',
            [exIdx + 1]: 'in_progress'
          }));
        }
      }
    }
  };

  const handleToggleSetCompletion = (exIdx: number, sIdx: number, exerciseName: string) => {
    const key = `${exIdx}-${sIdx}`;
    const wasCompleted = !!liveSetCompleted[key];
    const targetStatus = !wasCompleted;

    setLiveSetCompleted(prev => ({ ...prev, [key]: targetStatus }));

    // Trigger automatic recovery countdown if completed
    if (targetStatus) {
      setTimerExerciseName(exerciseName);
      setRestSecondsLeft(restInitialSeconds);
      setIsRestTimerActive(true);
    } else {
      // If unticked, we can keep timer but typically mute or let it be
    }
  };

  const handleModifyLiveSetWeight = (exIdx: number, sIdx: number, delta: number) => {
    const key = `${exIdx}-${sIdx}`;
    const curVal = liveSetWeights[key] !== undefined ? liveSetWeights[key] : 20;
    const nextVal = Math.max(0, curVal + delta);
    setLiveSetWeights(prev => ({ ...prev, [key]: nextVal }));
  };

  const handleModifyLiveSetReps = (exIdx: number, sIdx: number, delta: number) => {
    const key = `${exIdx}-${sIdx}`;
    const curVal = liveSetReps[key] !== undefined ? liveSetReps[key] : 10;
    const nextVal = Math.max(1, curVal + delta);
    setLiveSetReps(prev => ({ ...prev, [key]: nextVal }));
  };

  const handleManualInputWeight = (exIdx: number, sIdx: number, val: string) => {
    const key = `${exIdx}-${sIdx}`;
    const sanitized = val.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0) {
      setLiveSetWeights(prev => ({ ...prev, [key]: parsed }));
    } else if (val === '') {
      setLiveSetWeights(prev => ({ ...prev, [key]: 0 }));
    }
  };

  const handleManualInputReps = (exIdx: number, sIdx: number, val: string) => {
    const key = `${exIdx}-${sIdx}`;
    const sanitized = val.replace(/[^\d]/g, '');
    const parsed = parseInt(sanitized, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setLiveSetReps(prev => ({ ...prev, [key]: parsed }));
    } else if (val === '') {
      setLiveSetReps(prev => ({ ...prev, [key]: 1 }));
    }
  };

  // AI guide prompt downloader using Gemini
  const triggerAiGuideDownload = (exerciseName: string) => {
    if (aiGuides[exerciseName]) {
      setActiveGuideExercise(exerciseName);
      return;
    }

    setLoadingAiGuide(true);
    setActiveGuideExercise(exerciseName);

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = `${baseUrl}/api/generate-guide`;

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseName })
    })
    .then(res => res.json())
    .then(data => {
      const guideData = {
        properForm: data.properForm || ["Poste d'exécution stable avec appuis.", "Contrôlez la descente en résistant."],
        safetyTips: data.safetyTips || ["Ne surchargez pas trop vite.", "Gainez le tronc."],
        targetMuscles: data.targetMuscles || ["Cible dynamique"]
      };
      setAiGuides(prev => {
        const next = { ...prev, [exerciseName]: guideData };
        secureSave('kinetic_ai_guides', next);
        return next;
      });
    })
    .catch(() => {
      const fallbackData = {
        properForm: ["Placez les appuis fermement au sol.", "Effectuez le mouvement dans l'axe articulaire naturel.", "Expirez pendant la contraction forcée."],
        safetyTips: ["Évitez les à-coups balistiques.", "Sécurisez les prises de charge."],
        targetMuscles: ["Groupe moteur ciblé"]
      };
      setAiGuides(prev => {
        const next = { ...prev, [exerciseName]: fallbackData };
        secureSave('kinetic_ai_guides', next);
        return next;
      });
    })
    .finally(() => setLoadingAiGuide(false));
  };

  // Convert active session records into general logs for historic stats
  const getCompiledSetLogsList = (): SetLog[] => {
    if (!activeWorkout) return [];
    const logs: SetLog[] = [];
    activeWorkout.exercises.forEach((ex, exIdx) => {
      for (let sIdx = 0; sIdx < ex.sets; sIdx++) {
        const key = `${exIdx}-${sIdx}`;
        if (liveSetCompleted[key]) {
          logs.push({
            exerciseIndex: exIdx,
            setIndex: sIdx,
            loadKg: liveSetWeights[key] !== undefined ? liveSetWeights[key] : ex.targetLoadKg,
            reps: liveSetReps[key] !== undefined ? liveSetReps[key] : ex.reps,
            completed: true
          });
        }
      }
    });
    return logs;
  };

  // ---------------------------------------------------------------------------
  // MODULES LOADS
  // ---------------------------------------------------------------------------
  const registerWeightLog = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(weightInput);
    if (!parsed || isNaN(parsed) || parsed < 30 || parsed > 300) {
      showToast("Indiquez un poids corporel valide (30 à 300kg).", "error");
      return;
    }

    const newLog: WeightLog = {
      id: 'w_log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      weightKg: parsed
    };

    const nextHist = [newLog, ...weightHistory].slice(0, 10);
    setWeightHistory(nextHist);
    secureSave('kinetic_weight_history', nextHist);

    updateProfileAndSave({
      ...profile,
      weightKg: parsed
    });

    setWeightInput('');
  };

  const deleteWeightLog = (id: string) => {
    setCustomConfirm({
      message: "Supprimer cet historique de pesée ?",
      onConfirm: () => {
        const updated = weightHistory.filter(w => w.id !== id);
        setWeightHistory(updated);
        secureSave('kinetic_weight_history', updated);
        showToast("Historique de pesée supprimé.", "info");
      }
    });
  };

  const getWeightTrend = () => {
    if (weightHistory.length < 2) return { text: "Stable (Besoin de repères)", color: "text-slate-400 bg-slate-400/10 border-slate-500/10" };
    const sorted = [...weightHistory].reverse();
    const firstWeight = sorted[0].weightKg;
    const lastWeight = sorted[sorted.length - 1].weightKg;
    const diff = lastWeight - firstWeight;

    if (diff > 0.4) {
      return { text: `Prise de masse active (+${diff.toFixed(1)} kg)`, color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" };
    } else if (diff < -0.4) {
      return { text: `Sèche active / Affûtage (${diff.toFixed(1)} kg)`, color: "text-amber-400 bg-amber-400/10 border-amber-500/20" };
    } else {
      return { text: "Maintien de forme stable", color: "text-[#FBBF24] bg-[#FBBF24]/10 border-[#FBBF24]/20" };
    }
  };

  const handleSaveMensurations = (e: React.FormEvent) => {
    e.preventDefault();
    const arm = parseFloat(measArm) || 0;
    const chest = parseFloat(measChest) || 0;
    const waist = parseFloat(measWaist) || 0;
    const thigh = parseFloat(measThigh) || 0;

    const entry: MensurationLog = {
      id: 'mens_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      brasCm: arm,
      poitrineCm: chest,
      tailleCm: waist,
      cuisseCm: thigh
    };

    const updated = [entry, ...mensurations].slice(0, 10);
    setMensurations(updated);
    secureSave('kinetic_mensurations', updated);
    showToast("Mensurations archivées avec succès !", "success");
  };

  const deleteMensurationLog = (id: string) => {
    setCustomConfirm({
      message: "Supprimer cette ligne de mensurations ?",
      onConfirm: () => {
        const updated = mensurations.filter(m => m.id !== id);
        setMensurations(updated);
        secureSave('kinetic_mensurations', updated);
        showToast("Ligne de mensurations supprimée.", "info");
      }
    });
  };

  // 1RM Formula (Brzycki)
  const handleCalculate1RM = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(calcLoad);
    const r = parseInt(calcReps);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) {
      showToast("Indiquez des charges et répétitions supérieures à 0", "error");
      return;
    }
    const rm = w / (1.0278 - (0.0278 * r));
    setCalcResult(Math.round(rm * 10) / 10);
  };

  // ---------------------------------------------------------------------------
  // PERSONAL MILESTONES / KEY LIFT RECORDS MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleUpdateKeyPR = (id: string, exerciseName: string) => {
    const weightVal = parseFloat(newPrWeight[id]);
    const repsVal = parseInt(newPrReps[id]);

    if (!weightVal || isNaN(weightVal) || weightVal <= 0) {
      showToast("Indiquez une charge maximale de référence supérieure à 0.", "error");
      return;
    }
    const finalReps = repsVal && !isNaN(repsVal) ? repsVal : 1;

    const updated = personalRecords.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          maxWeightKg: weightVal,
          reps: finalReps,
          date: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    setPersonalRecords(updated);
    secureSave('kinetic_personal_records', updated);
    
    // reset form fields
    setNewPrWeight(prev => ({ ...prev, [id]: '' }));
    setNewPrReps(prev => ({ ...prev, [id]: '' }));
    showToast(`Record de "${exerciseName}" mis à jour ! ✓`, "success");
  };

  const handleAddNewCustomPR = (exerciseNameInput: string) => {
    const name = exerciseNameInput.trim();
    if (!name) return;
    
    // Check if duplicate
    if (personalRecords.some(pr => pr.exerciseName.toLowerCase() === name.toLowerCase())) {
      showToast("Cet exercice est déjà présent dans vos records.", "error");
      return;
    }

    const nPr: PersonalRecord = {
      id: 'pr_' + Date.now(),
      exerciseName: name,
      maxWeightKg: 0,
      reps: 1,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [...personalRecords, nPr];
    setPersonalRecords(updated);
    secureSave('kinetic_personal_records', updated);
  };

  const handleDeletePR = (id: string) => {
    setCustomConfirm({
      message: "Supprimer cet exercice de vos fiches de performance ?",
      onConfirm: () => {
        const updated = personalRecords.filter(item => item.id !== id);
        setPersonalRecords(updated);
        secureSave('kinetic_personal_records', updated);
        showToast("Exercice supprimé des fiches de performance.", "info");
      }
    });
  };

  // ---------------------------------------------------------------------------
  // JIU-JITSU BRÉSILIEN SOL ROLLING ENGINE
  // ---------------------------------------------------------------------------
  const registerBjjRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollRounds < 1) {
      showToast("Saisissez au moins 1 round combat.", "error");
      return;
    }

    triggerAd(() => {
      const nRoll: BjjRollLog = {
        id: 'roll_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        roundsCount: rollRounds,
        roundMinutes: rollMinutes,
        technique: rollTechnique.trim() || 'Roulade libre / Technique du jour',
        intensity: rollIntensity
      };

      const updated = [nRoll, ...bjjRolls].slice(0, 10);
      setBjjRolls(updated);
      secureSave('kinetic_bjj_rolls', updated);

      setRollTechnique('');
      showToast("Séance de combat au Sol enregistrée ! OSS 🥋", "success");
    });
  };

  const deleteBjjRoll = (id: string) => {
    setCustomConfirm({
      message: "Supprimer cet archivage de combat ?",
      onConfirm: () => {
        const updated = bjjRolls.filter(r => r.id !== id);
        setBjjRolls(updated);
        secureSave('kinetic_bjj_rolls', updated);
        showToast("Archivage de combat supprimé.", "info");
      }
    });
  };

  // Exercises search filter (Memoized for high performance on 100+ exercises)
  const filteredExercises = useMemo((): ExerciseDefinition[] => {
    const list = workoutTypeForCreation === 'muscu' 
      ? CLASSIC_EXERCISES.filter(x => x.category === selectedCategory)
      : JJB_EXERCISES;
    
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    
    // If searching, we filter from the ENTIRE exercise pool for convenience
    const fullPool = workoutTypeForCreation === 'muscu' ? CLASSIC_EXERCISES : JJB_EXERCISES;
    return fullPool.filter(ex => 
      ex.name.toLowerCase().includes(query) || 
      (ex.category && ex.category.toLowerCase().includes(query))
    );
  }, [workoutTypeForCreation, selectedCategory, searchQuery]);

  if (!onboardingDone) {
    const toggleOnboardingSport = (sport: string) => {
      setOnboardingSelectedSports(prev => {
        const next = prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport];
        return next;
      });
    };

    const handleCompleteOnboarding = () => {
      localStorage.setItem('standpower_onboarding_done', 'true');
      localStorage.setItem('standpower_onboarding_sports', JSON.stringify(onboardingSelectedSports));
      setOnboardingDone(true);
      if (onboardingSelectedSports.length === 1) {
        setSportFilter(onboardingSelectedSports[0] as any);
      }
    };

    return (
      <div className="w-full min-h-screen bg-[#090514] text-slate-100 flex flex-col font-sans relative overflow-x-hidden p-6 justify-center items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10 text-center">
          {/* Logo Identity */}
          <div className="space-y-2 animate-fade-in">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-[#FBBF24] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Dumbbell size={22} className="text-white stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black tracking-wider uppercase text-white">
              STAND<span className="text-[#FBBF24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">POWER</span>
            </h1>
            <p className="text-xs text-purple-400 font-mono font-black tracking-widest uppercase">
              Muscu, Combat & Poids
            </p>
          </div>

          {/* Welcome Card */}
          <div className="bg-[#120a24]/60 border border-purple-500/15 p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md">
            <div className="space-y-1">
              <h2 className="text-base font-black uppercase text-white">Choisis ton sport</h2>
              <p className="text-[11px] text-white/50">
                Sélectionnez une ou plusieurs disciplines principales pour votre entraînement. Vous pouvez aussi n'en choisir aucune pour tout explorer.
              </p>
            </div>

            {/* Sports Selector Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {[
                { id: 'muscu', label: '🏋️ Musculation', desc: 'Force & hypertrophie', icon: Dumbbell, color: '#FBBF24' },
                { id: 'jjb', label: '🥋 Jiu-Jitsu (JJB)', desc: 'Combat au sol & clés', icon: Award, color: '#A78BFA' },
                { id: 'boxe', label: '🥊 Boxe', desc: 'Esquives & directs lourds', icon: Zap, color: '#F87171' },
                { id: 'mma', label: '🤼 MMA', desc: 'Art martial complet', icon: Trophy, color: '#F472B6' },
                { id: 'muay_thai', label: '🦵 Muay-Thaï', desc: 'Genoux, coudes & kicks', icon: Flame, color: '#FB923C' },
                { id: 'powerlifting', label: '🏋️‍♂️ Powerlifting', desc: 'SBD records maximaux', icon: Medal, color: '#FBBF24' }
              ].map((sport) => {
                const isSelected = onboardingSelectedSports.includes(sport.id);
                const IconComp = sport.icon;
                return (
                  <button
                    key={sport.id}
                    onClick={() => toggleOnboardingSport(sport.id)}
                    className={`p-3 rounded-xl border text-left transition duration-150 relative overflow-hidden group active:scale-95 flex flex-col justify-between min-h-[95px] ${
                      isSelected 
                        ? 'bg-purple-900/20 border-[#FBBF24] shadow-lg shadow-amber-500/5' 
                        : 'bg-black/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isSelected ? 'bg-amber-400/10 text-[#FBBF24]' : 'bg-white/5 text-white/40'
                      }`}>
                        <IconComp size={12} />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
                      )}
                    </div>
                    <div className="mt-2">
                      <h4 className={`text-[11px] font-black uppercase ${isSelected ? 'text-[#FBBF24]' : 'text-white'}`}>{sport.label}</h4>
                      <p className="text-[8px] text-white/40 mt-0.5 leading-tight">{sport.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={handleCompleteOnboarding}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
              >
                {onboardingSelectedSports.length > 0 
                  ? `Rejoindre l'Arène (${onboardingSelectedSports.length}) ➔` 
                  : "Continuer sans choix ➔"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

/// ==========================================
/// COMPOSANTS D'AFFICHAGE ET BLOC DE RENDU
/// Cette section gère tout l'affichage de l'interface principale
/// (Header, Onglets de disciplines, Panels actifs de musculation et sports de combat).
/// ==========================================
  const activeTheme = SPORT_THEMES[selectedSport || 'muscu'] || SPORT_THEMES.muscu;

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans relative overflow-x-hidden pb-24 transition-colors duration-300 ${
      isLightMode 
        ? 'bg-[#F1F0F5] text-slate-800 selection:bg-purple-600/20 selection:text-purple-900' 
        : 'bg-[#090514] text-slate-100 selection:bg-purple-600/30 selection:text-[#FBBF24]'
    }`}>
      
      {/* GLOWING ORBS FOR INTENSE ATHLETIC ANIME MOOD */}
      <div className={`absolute top-0 right-1/4 w-80 h-80 ${activeTheme.glowOrb} rounded-full blur-[140px] pointer-events-none z-0`} />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* HEADER SECTION */}
      <header className={`border-b px-5 py-4 sticky top-0 z-40 transition-all duration-300 ${
        isLightMode 
          ? 'border-purple-500/10 bg-white/90 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.04)]' 
          : 'border-purple-500/10 bg-[#090514]/85 backdrop-blur-md shadow-[0_4px_30px_rgba(168,85,247,0.05)]'
      }`}>
        <div className="flex items-center justify-between max-w-lg mx-auto gap-2">
          
          <div className="flex items-center gap-2.5">
            {selectedSport !== null ? (
              <button
                onClick={() => {
                  setIsCombatTimerActive(false);
                  setIsCombatRestMode(false);
                  setCombatSessionDone(false);
                  setCombatActiveRound(1);
                  setCombatTotalElapsed(0);
                  setCombatCheckedDrills({});
                  setCombatTimeLeft(180);
                  setSelectedSport(null);
                  setActiveTab('muscu');
                }}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-white/5 shadow-inner"
                id="back-to-disciplines-btn"
              >
                <ArrowLeft size={11} className="text-[#FBBF24]" />
                Sports
              </button>
            ) : (
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isLogoPulsing 
                    ? 'scale-110 rotate-12 shadow-[0_0_20px_rgba(6,182,212,0.8)]' 
                    : 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                }`}
                style={{ 
                  background: `linear-gradient(135deg, #8B5CF6 0%, ${ACCENT_STYLES[accentColor].accent} 100%)`,
                  boxShadow: isLogoPulsing ? `0 0 25px ${ACCENT_STYLES[accentColor].accent}` : `0 0 15px rgba(168, 85, 247, 0.3)`
                }}
              >
                <Dumbbell size={15} className="text-white stroke-[2.5]" />
              </div>
            )}
            
            <div className="text-left">
              <h1 className={`text-xs sm:text-sm font-black tracking-widest text-white uppercase font-sans transition-all duration-300 ${isLogoPulsing ? 'scale-105' : ''}`}>
                STAND<span 
                  className="transition-all duration-300"
                  style={{ 
                    color: ACCENT_STYLES[accentColor].accent, 
                    textShadow: `0 0 12px ${ACCENT_STYLES[accentColor].accent}` 
                  }}
                >
                  POWER
                </span>
              </h1>
              <span className="text-[8px] sm:text-[9px] text-purple-400 font-mono font-black uppercase tracking-wider block">
                Muscu, Combat & Poids
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#FBBF24] font-bold flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
            {profile.weightKg.toFixed(1)} KG
          </div>
        </div>
      </header>

      {/* FULL-SCREEN IMMERSIVE STOPWATCH REST OVERLAY */}
      {isRestTimerActive && restSecondsLeft > 0 && (
        <div className="fixed inset-0 z-[100] bg-[#07080c]/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
          {/* Glowing Radial Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#FBBF24]/5 blur-[80px] pointer-events-none" />

          {/* Icon indicator */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border border-white/5 bg-white/5 flex items-center justify-center shadow-inner relative animate-pulse">
              <Timer size={28} className="text-[#FBBF24] animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-[#07080c]">
              ✓
            </div>
          </div>

          {/* Exercise / Series Info */}
          <div className="mb-4">
            <span className="text-[10px] text-[#FBBF24] font-black tracking-widest uppercase block mb-1">RÉCUPÉRATION ATHLÉTIQUE</span>
            <h4 className="text-lg font-black text-white uppercase italic tracking-wide max-w-sm px-4 leading-tight">
              {timerExerciseName || "Exercice validé"}
            </h4>
            <span className="text-[11px] text-white/40 block mt-2.5 uppercase font-medium">Baisse du rythme cardiaque & resynthèse de l'ATP</span>
          </div>

          {/* Giant ticking/pulsing stopwatch */}
          <div className="my-8 relative select-none">
            <span className="font-mono text-7xl sm:text-8xl font-black text-white tracking-widest drop-shadow-[0_0_20px_rgba(251,191,36,0.15)] block">
              {formatTime(restSecondsLeft)}
            </span>
            {/* Visual ticking indicator progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
              <div 
                className="h-full bg-[#FBBF24] transition-all duration-1000"
                style={{ width: `${Math.min(100, (restSecondsLeft / restInitialSeconds) * 100)}%` }}
              />
            </div>
          </div>

          {/* Quote Block or Motivational Snippet */}
          <div className="bg-[#120c24]/80 border border-purple-500/10 rounded-2xl p-4 max-w-sm w-full mb-8 text-left space-y-1 shadow-2xl">
            <span className="text-[8px] font-black text-[#FBBF24]/70 uppercase tracking-widest block font-mono">CONSEIL DE RÉCUPÉRATION</span>
            <p className="text-[11px] text-white/70 italic leading-snug">
              {restSecondsLeft > 45 
                ? "Inspirez profondément par le nez en ouvrant la sangle abdominale, puis expirez lentement par la bouche pour apaiser votre système nerveux."
                : restSecondsLeft > 20
                ? "Prenez de micro-gorgées d'eau tempérée. Gardez le focus sur l'énergie que vous allez insuffler dans la prochaine série lourde."
                : "La phase de repos se termine. Re-concentrez vos appuis au sol et préparez-vous mentalement à engager le muscle cible !"}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 max-w-sm w-full">
            <button
              onClick={() => setRestSecondsLeft(prev => prev + 30)}
              className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider border border-white/5 transition"
            >
              +30s Repos
            </button>
            <button
              onClick={() => {
                setIsRestTimerActive(false);
                setRestSecondsLeft(0);
                try { playAlertChime(); } catch(e){}
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Passer ➔
            </button>
          </div>
        </div>
      )}

      {/* CORE VIEWPORT */}
      <main 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full max-w-lg mx-auto px-4 py-4 relative z-10"
      >

        {/* =========================================
            DISCIPLINE SELECTION GRID (LANDING HOME SCREEN)
            ========================================= */}
        {/* =========================================
            DISCIPLINE SELECTION GRID (LANDING HOME SCREEN)
            ========================================= */}
        {selectedSport === null && activeTab === 'muscu' ? (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Catchy anime-style banner */}
            <div className="bg-gradient-to-r from-purple-900/40 via-[#12082b] to-amber-900/20 border border-purple-500/20 p-5 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-purple-400 pointer-events-none">
                <Medal size={140} />
              </div>
              <div className="relative space-y-1.5">
                <div className="bg-amber-400/15 border border-amber-400/30 w-fit px-2.5 py-0.5 rounded-full">
                  <span className="text-[8.5px] font-black text-[#FBBF24] tracking-widest uppercase block">CONVICTION • INTENSITÉ • PUISSANCE</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-wide">
                  CHOISISSEZ VOTRE <span className="text-[#FBBF24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">ARENE</span>
                </h2>
                <p className="text-[11px] text-purple-200/60 leading-relaxed font-sans">
                  "StandPower" synchronise vos objectifs de force musculaire, de combat au sol et d'endurance de frappe sous une seule interface de combat d'élite.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-purple-400 block font-mono">FILTRER LES DISCIPLINES</span>
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none max-w-full">
                {[
                  { id: 'all', label: '🌐 Tous' },
                  { id: 'muscu', label: '🏋️ Muscu' },
                  { id: 'jjb', label: '🥋 JJB' },
                  { id: 'boxe', label: '🥊 Boxe' },
                  { id: 'mma', label: '🤼 MMA' },
                  { id: 'muay_thai', label: '🦵 Muay' },
                  { id: 'powerlifting', label: '🏋️‍♂️ Power' }
                ].map((filter) => {
                  const isSelected = sportFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSportFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition shrink-0 border select-none active:scale-95 ${
                        isSelected 
                          ? 'bg-[#FBBF24] border-[#FBBF24] text-black shadow-md shadow-amber-500/10 font-bold'
                          : 'bg-[#120a24]/80 border-purple-500/10 text-white/50 hover:text-white/80'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of Sports */}
            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-widest uppercase text-purple-400 block font-mono">DISCIPLINES DISPONIBLES</span>
              <div className="grid grid-cols-2 gap-3">
                
                {/* 1. MUSCULATION */}
                {(sportFilter === 'all' || sportFilter === 'muscu') && (
                  <button
                    onClick={() => selectSportDiscipline('muscu')}
                    className="bg-gradient-to-br from-[#1b152d] to-[#0d0a17] hover:from-purple-900/30 hover:to-amber-950/20 border border-purple-500/10 hover:border-[#FBBF24]/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
                        <Dumbbell size={16} className="group-hover:rotate-12 transition" />
                      </div>
                      <span className="text-[8px] font-bold text-[#FBBF24] bg-amber-500/10 border border-[#FBBF24]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Muscu</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-[#FBBF24] transition">🏋️ Musculation</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Surcharge progressive & hypertrophie brute.</p>
                    </div>
                  </button>
                )}

                {/* 2. JJB */}
                {(sportFilter === 'all' || sportFilter === 'jjb') && (
                  <button
                    onClick={() => selectSportDiscipline('jjb')}
                    className="bg-gradient-to-br from-[#151c2d] to-[#0a0e17] hover:from-purple-900/30 hover:to-blue-950/20 border border-purple-500/10 hover:border-purple-400/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Award size={16} className="group-hover:scale-110 transition" />
                      </div>
                      <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">JJB</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-purple-400 transition">🥋 Jiu-Jitsu (JJB)</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Combat au sol, technique & clés de soumission.</p>
                    </div>
                  </button>
                )}

                {/* 3. BOXE */}
                {(sportFilter === 'all' || sportFilter === 'boxe') && (
                  <button
                    onClick={() => selectSportDiscipline('boxe')}
                    className="bg-gradient-to-br from-[#241515] to-[#140a0a] hover:from-red-950/30 hover:to-purple-950/20 border border-purple-500/10 hover:border-red-500/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <Zap size={16} className="group-hover:animate-pulse" />
                      </div>
                      <span className="text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Boxe</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-red-400 transition">🥊 Boxe</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Directs lourds, esquives & jeu de jambes fluide.</p>
                    </div>
                  </button>
                )}

                {/* 4. MMA */}
                {(sportFilter === 'all' || sportFilter === 'mma') && (
                  <button
                    onClick={() => selectSportDiscipline('mma')}
                    className="bg-gradient-to-br from-[#201524] to-[#120a14] hover:from-fuchsia-950/30 hover:to-purple-950/20 border border-purple-500/10 hover:border-fuchsia-500/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                        <Trophy size={16} className="group-hover:rotate-6 transition" />
                      </div>
                      <span className="text-[8px] font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">MMA</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-fuchsia-400 transition">🤼 MMA</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Full integration, transitions cage & chaos physique.</p>
                    </div>
                  </button>
                )}

                {/* 5. MUAY-THAI */}
                {(sportFilter === 'all' || sportFilter === 'muay_thai') && (
                  <button
                    onClick={() => selectSportDiscipline('muay_thai')}
                    className="bg-gradient-to-br from-[#241d15] to-[#14100a] hover:from-amber-950/30 hover:to-orange-950/20 border border-purple-500/10 hover:border-amber-500/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Flame size={16} className="group-hover:animate-bounce" />
                      </div>
                      <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Muay-Thai</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-amber-400 transition">🦵 Muay-Thaï</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Art des 8 membres, coudes affûtés & clinchs.</p>
                    </div>
                  </button>
                )}

                {/* 6. POWERLIFTING */}
                {(sportFilter === 'all' || sportFilter === 'powerlifting') && (
                  <button
                    onClick={() => selectSportDiscipline('powerlifting')}
                    className="bg-gradient-to-br from-[#1d1b15] to-[#121008] hover:from-yellow-950/30 hover:to-amber-950/20 border border-purple-500/10 hover:border-yellow-500/30 rounded-2xl p-4 text-left transition duration-200 group active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-[#FBBF24]">
                        <Medal size={16} className="group-hover:scale-110 transition" />
                      </div>
                      <span className="text-[8px] font-bold text-[#FBBF24] bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Power</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-[#FBBF24] transition">🏋️‍♂️ Powerlifting</h3>
                      <p className="text-[10px] text-white/50 leading-tight mt-1 font-sans">Squat, développé couché & soulevé de terre maximum.</p>
                    </div>
                  </button>
                )}

              </div>
            </div>

            {/* Quick motiv snippet */}
            <div className="bg-[#120a24]/50 border border-purple-500/10 p-4 rounded-2xl flex gap-3">
              <Zap size={18} className="text-[#FBBF24] shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <span className="text-[11px] font-black text-white uppercase block leading-none">VOTRE STAND ATHLÉTIQUE</span>
                <p className="text-[10px] text-white/50 leading-normal">
                  Chaque entraînement de combat ou de fonte développe votre puissance fonctionnelle. Vos records de charges lourdes et fiches de pesées restent accessibles à tout instant dans les onglets ci-dessous.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* =========================================
            COMBAT SPORTS WORKOUT CORNER (JJB, BOXE, MMA, MUAY-THAI)
            ========================================= */}
        {selectedSport !== null && (selectedSport === 'jjb' || selectedSport === 'boxe' || selectedSport === 'mma' || selectedSport === 'muay_thai') && activeTab === selectedSport ? (
          <div className="space-y-4 animate-fade-in text-left">
            {/* Header info card */}
            <div className={`bg-gradient-to-br ${activeTheme.bgGradient} border ${activeTheme.border} p-4 rounded-2xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-3 text-white/5 pointer-events-none">
                <Zap size={54} />
              </div>
              <span className={`text-[9px] font-black tracking-widest uppercase block mb-1 ${activeTheme.labelTextColor}`}>
                ENTRAÎNEMENT DE COMBAT {selectedSport.toUpperCase().replace('_', ' ')}
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-none">
                    {selectedSport === 'boxe' ? 'BOXE ANGLAISE' :
                     selectedSport === 'mma' ? 'MIXED MARTIAL ARTS' :
                     selectedSport === 'muay_thai' ? 'MUAY-THAÏ CAMP' :
                     selectedSport === 'jjb' ? 'JIU-JITSU BRÉSILIEN' :
                     'COMBAT ARENA'}
                  </h3>
                  <p className="text-[11px] text-white/40 mt-1 uppercase font-semibold">
                    {selectedSport === 'boxe' ? "Directs, crochets, esquives et vitesse" :
                     selectedSport === 'mma' ? "Clinch de cage, takedowns et ground & pound" :
                     selectedSport === 'muay_thai' ? "Kicks lourds, coudes tranchants et paos" :
                     selectedSport === 'jjb' ? "Sol technique, ceintures, sparrings & drills" :
                     "Contrôle au corps, sprawls et projections"}
                  </p>
                </div>
                <button
                  onClick={() => setIsSportSwitcherOpen(true)}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-[9px] px-3 py-2 rounded-xl uppercase tracking-wider transition border border-white/5"
                >
                  Changer
                </button>
              </div>
            </div>

            {/* Combat Session Done Celebration */}
            {combatSessionDone ? (
              <div className="bg-gradient-to-br from-[#1c0c2a]/90 via-black/80 to-black border border-purple-500/30 p-6 rounded-3xl text-center space-y-4 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-500">
                  <Trophy size={140} />
                </div>
                
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                  <Trophy size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase">ENTRAÎNEMENT COMPLÉTÉ</h4>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Félicitations pour avoir tenu la distance athlétique ! Votre intensité de combat a été loggée.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl text-left border border-white/5 font-mono">
                  <div>
                    <span className="text-[8px] text-white/30 block uppercase font-sans">Rounds Complétés</span>
                    <span className="text-white font-extrabold text-xs sm:text-sm">{combatRoundsCount} rounds</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/30 block uppercase font-sans">Durée de l'effort</span>
                    <span className="text-[#FBBF24] font-extrabold text-xs sm:text-sm">{formatTime(combatTotalElapsed)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/30 block uppercase font-sans">Dépense Estimée</span>
                    <span className="text-emerald-400 font-extrabold text-[11px] sm:text-xs leading-snug block">
                      {calculateCombatCalories(selectedSport || '', combatTotalElapsed, latestWeight)} kcal brûlées
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerAd(() => {
                      setIsCombatTimerActive(false);
                      setIsCombatRestMode(false);
                      setCombatSessionDone(false);
                      setCombatActiveRound(1);
                      setCombatTotalElapsed(0);
                      setCombatCheckedDrills({});
                      // Reset to sport standard round duration
                      const defaultDuration = selectedSport === 'mma' ? 300 : 180;
                      setCombatTimeLeft(defaultDuration);
                      setSelectedSport(null);
                      setActiveTab('muscu');
                    });
                  }}
                  className={`w-full bg-gradient-to-r ${activeTheme.btnBgGradient} text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg transition active:scale-95 ${activeTheme.shadowGlow} border ${activeTheme.btnBorder}`}
                >
                  Fermer & Enregistrer la session
                </button>
              </div>
            ) : (
              <>
                {/* Round countdown stopwatch */}
                <div className={`bg-[#0f0b1e] border ${activeTheme.border} rounded-2xl p-5 text-center space-y-3 relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 px-3.5 py-1.5 rounded-bl-xl text-[8.5px] font-black font-mono uppercase tracking-widest ${
                    isCombatRestMode ? 'bg-amber-500 text-black' : `${activeTheme.badgeWorkBg} ${activeTheme.badgeWorkText}`
                  }`}>
                    {isCombatRestMode ? 'REPOS ATHLÉTIQUE' : `ROUND ${combatActiveRound} / ${combatRoundsCount}`}
                  </div>
                  
                  <span className={`text-[9px] font-black tracking-widest uppercase block ${isCombatRestMode ? 'text-amber-400' : activeTheme.labelTextColor}`}>
                    {isCombatRestMode ? "RÉHYDRATATION & FOCUS" : "TEMPS DE TRAVAIL RESTANT"}
                  </span>

                  <div className="my-1.5 select-none">
                    <span className="font-mono text-5xl sm:text-6xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(168,85,247,0.2)] block">
                      {formatTime(combatTimeLeft)}
                    </span>
                    <div className="w-32 h-1 bg-white/10 rounded-full mx-auto mt-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          isCombatRestMode ? 'bg-amber-400' : activeTheme.progressWork
                        }`}
                        style={{ width: `${Math.min(100, (combatTimeLeft / (isCombatRestMode ? combatRestDuration : combatRoundDuration)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center max-w-xs mx-auto">
                    <button
                      onClick={() => setIsCombatTimerActive(!isCombatTimerActive)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition duration-150 active:scale-95 ${
                        isCombatTimerActive 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white'
                          : `${activeTheme.badgeWorkBg} ${activeTheme.badgeWorkText} hover:opacity-90`
                      }`}
                    >
                      {isCombatTimerActive ? 'PAUSE' : 'COMBATTRE ➔'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCombatTimerActive(false);
                        setIsCombatRestMode(false);
                        setCombatActiveRound(1);
                        setCombatTimeLeft(combatRoundDuration);
                        setCombatTotalElapsed(0);
                        setCombatCheckedDrills({});
                      }}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95"
                    >
                      RESET
                    </button>
                  </div>
                </div>

                {/* Specific drill checklists */}
                <div className={`bg-[#0f0b1e] border ${activeTheme.border} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <span className={`text-[10px] font-black tracking-widest uppercase ${activeTheme.labelTextColor}`}>
                      OBJECTIFS TECHNIQUES DU COMBATTANT
                    </span>
                    <span className="text-[9px] font-mono text-white/40">
                      {Object.values(combatCheckedDrills).filter(Boolean).length} / 6 VALIDÉS
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(selectedSport === 'boxe' ? [
                      "Échauffement & Shadow Boxing fluides",
                      "Directs du bras avant (Jab & Double Jab) répétés",
                      "Combinaisons Direct-Crochet lourdes au sac",
                      "Esquives rotatives glissées & contre-attaques",
                      "Sac de frappe lourd intensif (Endurance force)",
                      "Coordination reflexes au poire de vitesse"
                     ] : selectedSport === 'mma' ? [
                      "Entrées de jambes explosives (Double Leg shoot)",
                      "Contrôle en clinch contre la cage",
                      "Ground and Pound contrôlé sur mannequin/sac",
                      "Transitions articulaires de soumission au sol",
                      "Combos Pieds-Poings suivis de Sprawl de lutte",
                      "Combat sparring souple technique (Playflow)"
                     ] : selectedSport === 'muay_thai' ? [
                      "Shadow Muay-Thaï complet",
                      "Kicks circulaires répétitifs aux paos",
                      "Enchaînements coudes ascendants & circulaires",
                      "Clinch thaïlandais actif (Contrôle cervical)",
                      "Coups de genoux directs répétés au sac",
                      "Conditionnement abdominal actif"
                     ] : [
                      "Échauffement articulaire lourd & gainage",
                      "Squat lourd : Travail technique de profondeur",
                      "Développé Couché : Fixation omoplates & arching",
                      "Soulevé de terre : Tension initiale & bracing",
                      "Accessoire : Renforcement de la poigne (Grip/Farmer)",
                      "Étirements & décompression de la colonne"
                    ]).map((drill, idx) => {
                      const key = `${selectedSport}-${idx}`;
                      const isDone = !!combatCheckedDrills[key];
                      return (
                        <div 
                          key={idx}
                          onClick={() => setCombatCheckedDrills(prev => ({ ...prev, [key]: !isDone }))}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                            isDone 
                              ? `${activeTheme.drillCardBg} ${activeTheme.drillCardBorder} ${activeTheme.drillCardText}` 
                              : 'bg-black/40 border-white/5 text-white/70 hover:border-white/10'
                          }`}
                        >
                          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition shrink-0 ${
                            isDone ? `${activeTheme.badgeWorkBg} ${activeTheme.badgeWorkText} border-transparent` : 'border-white/20 bg-black/40'
                          }`}>
                            {isDone && <Check size={11} className="stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] leading-snug ${isDone ? 'line-through opacity-60 font-medium' : 'font-semibold'}`}>
                            {drill}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Terminer Workout Button */}
                <button
                  onClick={() => {
                    setIsCombatTimerActive(false);
                    triggerAd(() => {
                      setCombatSessionDone(true);
                    });
                  }}
                  className={`w-full bg-gradient-to-r ${activeTheme.btnBgGradient} text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition active:scale-95 text-center block shadow-lg ${activeTheme.shadowGlow} border ${activeTheme.btnBorder}`}
                >
                  Terminer l'entraînement de combat ✓
                </button>
              </>
            )}

            {/* INTEGRATED JIU-JITSU BRÉSILIEN (JJB) BELTS & ROLLS LOGS */}
            {selectedSport === 'jjb' && (
              <div className="space-y-4 pt-6 mt-6 border-t border-purple-500/15">
                
                {/* GRADUATION INTERACTIVE CHANGER + HORIZONTAL SVG BELT */}
                <div className="bg-gradient-to-br from-[#0f111a] to-black border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block mb-1">GRADE ACTUEL EN JIU-JITSU BRÉSILIEN (JJB)</span>
                  
                  <div className="flex flex-col gap-4 mt-3">
                    
                    {/* HORIZONTAL SLEEVE SVG CONTEXT */}
                    <div className="flex flex-col items-center justify-center bg-black/60 border border-white/5 p-4 rounded-xl min-h-[90px]">
                      <svg className="w-56 h-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" viewBox="0 0 240 40">
                        {/* Belt Cloth Canvas */}
                        <rect 
                          x="5" 
                          y="14" 
                          width="230" 
                          height="12" 
                          rx="3" 
                          fill={
                            profile.beltColor === 'Blanche' ? '#f8fafc' : 
                            profile.beltColor === 'Bleue' ? '#2563eb' : 
                            profile.beltColor === 'Violette' ? '#7c3aed' : 
                            profile.beltColor === 'Marron' ? '#78350f' : '#111115'
                          } 
                        />
                        
                        {/* Black or Red Sleeve depending on normal colors or Black belt rank */}
                        <rect 
                          x="165" 
                          y="14" 
                          width="45" 
                          height="12" 
                          fill={profile.beltColor === 'Noire' ? '#dc2626' : '#111115'} 
                        />

                        {/* Sleeve gold border limits */}
                        <rect x="163" y="14" width="2" height="12" fill="#eab308" />
                        <rect x="210" y="14" width="2" height="12" fill="#eab308" />

                        {/* Render white strap stripes (degrees tape barrettes) */}
                        {Array.from({ length: profile.beltStripes }).map((_, i) => (
                          <rect 
                            key={i}
                            x={170 + (i * 8)} 
                            y="14" 
                            width="3.5" 
                            height="12" 
                            fill="#ffffff" 
                          />
                        ))}
                      </svg>

                      <span className="text-[11px] font-black text-white uppercase italic mt-2.5">
                        Ceinture {profile.beltColor} &bull; {profile.beltStripes} {profile.beltStripes > 1 ? 'barrettes' : profile.beltStripes === 1 ? 'barrette' : 'sans barrette'}
                      </span>
                    </div>

                    {/* EDITORS BELT & STRIPES OPTIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-white/40 uppercase font-black block mb-1.5">Modifier la Couleur</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(['Blanche', 'Bleue', 'Violette', 'Marron', 'Noire'] as const).map((color) => (
                            <button
                              key={color}
                              onClick={() => updateProfileAndSave({ ...profile, beltColor: color })}
                              className={`w-7 h-7 rounded-lg border transition text-[9px] font-black ${
                                profile.beltColor === color 
                                  ? 'border-[#FBBF24] scale-110' 
                                  : 'border-white/10'
                              }`}
                              style={{
                                backgroundColor: 
                                  color === 'Blanche' ? '#ffffff' : 
                                  color === 'Bleue' ? '#2563eb' : 
                                  color === 'Violette' ? '#7c3aed' : 
                                  color === 'Marron' ? '#78350f' : '#111115',
                                color: color === 'Blanche' ? '#000000' : '#ffffff'
                              }}
                            >
                              {color.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-white/40 uppercase font-black block mb-1.5">Barrettes / Degrés (0-4)</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((n) => (
                            <button
                              key={n}
                              onClick={() => updateProfileAndSave({ ...profile, beltStripes: n })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                                profile.beltStripes === n 
                                  ? 'bg-[#FBBF24] text-black font-black' 
                                  : 'bg-white/5 hover:bg-white/10 text-white/60'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* BJJ DRILLED EXERCISES BASE COMPACT DOCK */}
                <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase block mb-1">Base de 30 Drills Physique d'Entraînement JJB</span>
                  <p className="text-[11px] text-white/50 mb-3">Retrouvez les mouvements préenregistrés et exploitables dans le créateur de séance pour augmenter votre grip et votre fluidité.</p>

                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {JJB_EXERCISES.map((ex, i) => (
                      <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-slate-300 font-medium">
                        ⚡ {ex.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LIVE BJJ COMBAT LOGGER TABLE */}
                <div className="bg-[#0f111a] border border-white/5 p-4 rounded-2xl space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block">Enregistrer mes Sparrings de Combat au Sol</span>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug">Notez les détails de vos roulements et techniques étudiées aujourd'hui.</p>
                  </div>

                  <form onSubmit={registerBjjRoll} className="space-y-3 font-sans">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] uppercase text-white/45 block mb-1">Nombre de Rounds</label>
                        <input 
                          type="number"
                          min="1"
                          value={rollRounds}
                          onChange={(e) => setRollRounds(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-black border border-white/5 rounded-lg py-1.5 text-xs text-center font-mono text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase text-white/45 block mb-1">Durée Round (Min)</label>
                        <input 
                          type="number"
                          min="1"
                          value={rollMinutes}
                          onChange={(e) => setRollMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                          className="w-full bg-black border border-white/5 rounded-lg py-1.5 text-xs text-center font-mono text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase text-white/45 block mb-1">Intensité</label>
                        <select
                          value={rollIntensity}
                          onChange={(e) => setRollIntensity(e.target.value as any)}
                          className="w-full bg-black border border-white/5 rounded-lg py-1.5 text-[10px] text-center text-white font-bold"
                        >
                          <option value="Souple">Souple (Relaxed)</option>
                          <option value="Technique">Technique</option>
                          <option value="Dur">Dur (Hard roll)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] uppercase text-white/45 block mb-1">Technique étudiée principale du jour</label>
                      <input 
                        type="text"
                        placeholder="Ex: Établissement de la demi-garde profonde"
                        value={rollTechnique}
                        onChange={(e) => setRollTechnique(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white/5 hover:bg-[#FBBF24]/10 hover:text-[#FBBF24] text-white border border-white/10 text-xs font-black py-2 rounded-xl uppercase tracking-wider transition"
                    >
                      Enregistrer ce Sparring (OSS) 🥋
                    </button>
                  </form>

                  {/* BJJ Recent Fight Logs Table */}
                  {bjjRolls.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[8.5px] font-black text-white/30 tracking-wider uppercase block mb-2">Historique de mes combats au sol</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {bjjRolls.map((roll) => (
                          <div key={roll.id} className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-[11px] gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-white/40 font-mono text-[9px] block">{roll.date} &bull; <em className="text-[#FBBF24] not-italic font-bold">{roll.intensity}</em></span>
                              <span className="text-white font-bold block truncate text-xs mt-0.5">{roll.technique}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-2 py-0.5 rounded text-[10px] text-[#FBBF24] font-black">
                                {roll.roundsCount}R &times; {roll.roundMinutes}M
                              </span>
                              <button 
                                onClick={() => deleteBjjRoll(roll.id)}
                                className="text-red-400/50 hover:text-red-400 p-1"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        ) : null}

        {/* =========================================
            TAB 1: MUSCULATION SESSIONS DOCK
            ========================================= */}
        {(selectedSport === 'muscu' || selectedSport === 'powerlifting') && activeTab === selectedSport && (
          <div className="space-y-4 animate-fade-in text-left">

            {/* SCREEN: DASHBOARD */}
            {muscuScreen === 'DASHBOARD' && (
              <div className="space-y-5">
                {/* ATHLETIC TARGET CARD */}
                <div className="bg-gradient-to-br from-[#0f111a] to-[#07080c] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-white/5 pointer-events-none">
                    <Award size={54} />
                  </div>
                  <span className="text-[9px] font-black text-[#FBBF24] tracking-widest uppercase block mb-1">MÉTA-STATUT ATHLÈTE</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase italic leading-none">OBJECTIF : {profile.goal}</h3>
                      <p className="text-[11px] text-white/40 mt-1 uppercase font-semibold">Taille: {profile.heightCm}cm &bull; Poids: {profile.weightKg}kg</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => setIsSportSwitcherOpen(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black text-[10px] px-3 py-2 rounded-xl uppercase tracking-wider transition"
                      >
                        Changer
                      </button>
                      <button 
                        onClick={() => setActiveTab('profil')}
                        className="bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition"
                      >
                        Bilan Profil
                      </button>
                    </div>
                  </div>
                </div>

                {/* SAVED SESSIONS GRID */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-white/40 tracking-wider">Mes séances d'entraînement</h3>
                    <div className="h-[1px] bg-white/5 flex-1 mx-3" />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {workouts.map((wk) => (
                      <div 
                        key={wk.id}
                        onClick={() => startEditingWorkout(wk)}
                        className="bg-[#0f111a]/90 border border-white/5 hover:border-[#FBBF24]/30 hover:bg-[#131622] rounded-xl p-4 flex items-center justify-between gap-4 transition cursor-pointer group animate-fade-in"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-sm truncate uppercase group-hover:text-[#FBBF24] transition">
                            {wk.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
                            <span>{wk.exercises.length} {wk.exercises.length > 1 ? 'exercices' : 'exercice'}</span>
                            <span>&bull;</span>
                            <span>{wk.exercises.reduce((acc, ex) => acc + ex.sets, 0)} séries</span>
                            <span>&bull;</span>
                            <span className="text-[#FBBF24]/80 font-semibold group-hover:text-[#FBBF24] transition">Modifier/Voir</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDeleteSavedWorkout(wk.id, e)}
                            className={`p-2 transition rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 ${
                              sessionToDeleteId === wk.id
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-white/25 hover:text-red-400 hover:bg-white/5'
                            }`}
                            title={sessionToDeleteId === wk.id ? "Confirmer la suppression ?" : "Supprimer la séance"}
                          >
                            <Trash2 size={13} />
                            {sessionToDeleteId === wk.id && (
                              <span className="text-[10px] font-black uppercase tracking-wider animate-pulse">SUPPR ?</span>
                            )}
                          </button>
                          <button
                            onClick={() => startWorkoutSession(wk)}
                            className="w-10 h-10 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] hover:bg-[#FBBF24] hover:text-black flex items-center justify-center transition shadow-md shrink-0"
                            title="Lancer la séance (Play)"
                          >
                            <Play size={13} className="fill-current stroke-[3] ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {workouts.length === 0 && (
                      <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/5 text-white/30">
                        <Dumbbell className="mx-auto text-white/10 mb-2" size={24} />
                        <p className="text-xs font-bold font-sans">Aucune séance personnalisée créée pour le moment.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BTN TRIGGER NEW */}
                <button
                  onClick={() => {
                    setWorkoutTypeForCreation('muscu');
                    setDraftExercises([]);
                    setNewWorkoutName('');
                    setSearchQuery('');
                    setMuscuScreen('CREATE_WORKOUT');
                  }}
                  className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black py-4 px-6 rounded-2xl text-xs tracking-wider uppercase transition active:scale-95 shadow-[0_12px_24px_rgba(207,255,0,0.15)] flex items-center justify-center gap-2"
                >
                  <Plus size={15} className="stroke-[3]" />
                  Créer une nouvelle séance
                </button>
              </div>
            )}

            {/* SCREEN: CREATE_WORKOUT (Gym Builder with Search Query) */}
            {muscuScreen === 'CREATE_WORKOUT' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <button 
                    onClick={() => {
                      setMuscuScreen('DASHBOARD');
                      setEditingWorkoutId(null);
                      setNewWorkoutName('');
                      setDraftExercises([]);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition"
                  >
                    <ArrowLeft size={15} strokeWidth={2.5} />
                  </button>
                  <div>
                    <span className="text-[8px] font-black text-[#FBBF24] block tracking-widest uppercase mb-0.5 font-mono">Custom Builder</span>
                    <h3 className="text-xs font-black text-white uppercase italic leading-none">{editingWorkoutId ? "Configuration / Modification de la séance" : "Création d'entraînement personnalisé"}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Title of the session */}
                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Nom de votre Séance</label>
                    <input 
                      type="text"
                      placeholder="Ex: Séance Pecs Explosifs"
                      value={newWorkoutName}
                      onChange={(e) => setNewWorkoutName(e.target.value)}
                      className="w-full bg-[#0f111a]/80 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>

                  {/* Added list */}
                  {draftExercises.length > 0 && (
                    <div className="bg-[#0f111a] rounded-xl p-3 border border-white/5 space-y-1.5 animate-fade-in">
                      <span className="text-[9px] font-black text-white/40 block uppercase tracking-wider mb-2">Exercices planifiés ({draftExercises.length})</span>
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {draftExercises.map((ex, i) => (
                          <div key={i} className="flex flex-col gap-2.5 bg-black/45 p-3 rounded-xl border border-white/5 shadow-inner">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#FBBF24] uppercase block truncate tracking-wide max-w-[80%]">{ex.name}</span>
                              <button 
                                onClick={() => handleRemoveDraftExercise(i)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                                title="Supprimer cet exercice"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center pt-2.5 border-t border-white/5">
                              {/* Sets / Séries */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-white/40 uppercase font-black tracking-wider mb-1">Séries</span>
                                <div className="flex items-center gap-1.5 bg-black/50 px-1.5 py-0.5 rounded border border-white/5">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].sets = Math.max(1, updated[i].sets - 1);
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >-</button>
                                  <span className="text-xs font-mono font-black text-white">{ex.sets}</span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].sets = updated[i].sets + 1;
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >+</button>
                                </div>
                              </div>
                              
                              {/* Reps */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-white/40 uppercase font-black tracking-wider mb-1">Reps</span>
                                <div className="flex items-center gap-1.5 bg-black/50 px-1.5 py-0.5 rounded border border-white/5">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].reps = Math.max(1, updated[i].reps - 1);
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >-</button>
                                  <span className="text-xs font-mono font-bold text-slate-300">{ex.reps}</span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].reps = updated[i].reps + 1;
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >+</button>
                                </div>
                              </div>

                              {/* Charge */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-white/40 uppercase font-black tracking-wider mb-1 font-mono">Poids (kg)</span>
                                <div className="flex items-center gap-1.5 bg-black/50 px-1.5 py-0.5 rounded border border-white/5">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].targetLoadKg = Math.max(0, updated[i].targetLoadKg - 2.5);
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >-</button>
                                  <input 
                                    type="number" 
                                    step="2.5"
                                    value={ex.targetLoadKg}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updated = [...draftExercises];
                                      updated[i].targetLoadKg = Math.max(0, val);
                                      setDraftExercises(updated);
                                    }}
                                    className="w-8 bg-transparent text-xs font-mono font-black text-center text-white focus:outline-none"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...draftExercises];
                                      updated[i].targetLoadKg = updated[i].targetLoadKg + 2.5;
                                      setDraftExercises(updated);
                                    }}
                                    className="w-4 h-4 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition"
                                  >+</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adding Workout Block with Instant Filter / Fuzzy Search */}
                  <div className="bg-gradient-to-b from-[#0f111a] to-[#050508] rounded-2xl p-4 border border-white/5 space-y-3.5">
                    <span className="text-[10px] font-black tracking-widest text-[#FBBF24] uppercase block mb-1">Insérer un exercice depuis la base</span>

                    {/* Instant Search Bar */}
                    <div>
                      <input 
                        type="text"
                        placeholder="Rechercher (ex: développé, squat, curl, grip...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    {!searchQuery && (
                      <div>
                        <label className="block text-[8px] font-black text-white/30 uppercase tracking-wider mb-1">Ou filtrer par groupe musculaire</label>
                        <div className="flex flex-wrap gap-1">
                          {['Pectoraux', 'Dos', 'Jambes', 'Épaules', 'Bras', 'Abdos', 'JJB / Prép physique'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                                selectedCategory === cat 
                                  ? 'bg-[#FBBF24] text-black font-black' 
                                  : 'bg-white/5 hover:bg-white/10 text-white/60'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC LIST BASED ON FUZZY FILTER */}
                    <div>
                      <label className="block text-[8px] font-black text-white/30 uppercase tracking-wider mb-1">Sélectionner l'exercice mécanique</label>
                      <select
                        value={selectedExerciseName}
                        onChange={handleExerciseSelectionChange}
                        className="w-full bg-black border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      >
                        {filteredExercises.map((item, idx) => (
                          <option key={idx} value={item.name} className="text-white">{item.name}</option>
                        ))}
                        {filteredExercises.length === 0 && (
                          <option value="">Aucun exercice trouvé</option>
                        )}
                      </select>
                    </div>

                    {/* SPECIFY REPS / TARGET LOAD FOR THE DESIGN */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[8px] font-black text-white/30 uppercase tracking-wider mb-1 text-center">Séries</label>
                        <input 
                          type="number" 
                          min="1"
                          value={draftSets}
                          onChange={(e) => setDraftSets(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono font-bold text-center text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-white/30 uppercase tracking-wider mb-1 text-center">Reps</label>
                        <input 
                          type="number" 
                          min="1"
                          value={draftReps}
                          onChange={(e) => setDraftReps(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono font-bold text-center text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-white/30 uppercase tracking-wider mb-1 text-center">Charge (KG)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={draftLoad}
                          onChange={(e) => setDraftLoad(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono font-black text-center text-[#FBBF24] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewExerciseToDraft}
                      className="w-full bg-white/5 hover:bg-[#FBBF24]/10 hover:text-[#FBBF24] text-white border border-white/10 text-xs font-black py-2.5 rounded-xl uppercase transition"
                    >
                      + Ajouter l'exercice à la séance
                    </button>
                  </div>

                  {builderError && <p className="text-xs text-red-400 font-bold block text-center">⚠️ {builderError}</p>}
                </div>

                 {/* Final control box buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setMuscuScreen('DASHBOARD');
                      setEditingWorkoutId(null);
                      setNewWorkoutName('');
                      setDraftExercises([]);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-bold py-3.5 rounded-2xl text-xs uppercase"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveWholeWorkout}
                    className="flex-1 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-wide shadow-md"
                  >
                    Sauvegarder la séance
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: WORKOUT_FLOW (Live Workout Flow - CRUCIAL SET INDIVIDUAL EDITOR) */}
            {muscuScreen === 'WORKOUT_FLOW' && activeWorkout && (
              <div className="space-y-4">
                
                {/* Live Header Info */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest uppercase font-black text-[#FBBF24]">Séance active : {activeWorkout.name}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-white bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">
                    {formatTime(sessionDuration)}
                  </span>
                </div>

                {/* DYNAMIC LIST OF EXERCISES AND LIVE EDITORS FOR ALL SETS */}
                <div className="space-y-4">
                  {activeWorkout.exercises.map((ex, exIdx) => {
                    const status = activeExerciseStatuses[exIdx] || 'idle';
                    const isIdle = status === 'idle';
                    const isInProgress = status === 'in_progress';
                    const isCompleted = status === 'completed';

                    return (
                      <div 
                        key={exIdx}
                        className={`border rounded-2xl p-4 shadow-xl transition-all duration-350 relative overflow-hidden flex flex-col gap-3.5 ${
                          isCompleted
                            ? 'bg-[#0a0c14]/40 border-emerald-500/10 opacity-60'
                            : isInProgress
                            ? 'bg-gradient-to-br from-[#0f111a] to-[#07080c] border-[#FBBF24]/25 shadow-[#FBBF24]/5 ring-1 ring-[#FBBF24]/10'
                            : 'bg-gradient-to-br from-[#0f111a]/60 to-[#07080c]/65 border-white/5 opacity-50'
                        }`}
                      >
                        {/* Status Halo Accent */}
                        {isInProgress && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#FBBF24]" />
                        )}
                        {isCompleted && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        )}
                        
                        {/* Exercise Header */}
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[8px] font-mono text-[#FBBF24] font-black tracking-widest uppercase">
                                EXERCICE {exIdx + 1} / {activeWorkout.exercises.length}
                              </span>
                              <span>&bull;</span>
                              <span className={`text-[8.5px] font-mono font-bold uppercase rounded px-1.5 py-0.2 ${
                                isCompleted 
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : isInProgress
                                  ? 'bg-[#FBBF24]/10 text-[#FBBF24]'
                                  : 'bg-white/5 text-white/40'
                              }`}>
                                {isCompleted ? 'Complété' : isInProgress ? 'En cours' : 'En attente'}
                              </span>
                            </div>
                            <h4 className={`text-sm font-black uppercase italic truncate pr-2 ${
                              isCompleted ? 'text-white/50 line-through' : 'text-white'
                            }`}>
                              {ex.name}
                            </h4>
                          </div>
                          
                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => triggerAiGuideDownload(ex.name)}
                              className="px-2.5 py-1 text-[8.5px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500 hover:text-black transition shrink-0"
                            >
                              Fiche Technique IA
                            </button>
                          )}
                        </div>

                        {/* STATUS SELECTION TRIGGER BUTTONS */}
                        <div className="flex items-center gap-2 mt-0.5" onClick={e => e.stopPropagation()}>
                          {isIdle && (
                            <button
                              type="button"
                              onClick={() => setActiveExerciseStatuses(prev => ({ ...prev, [exIdx]: 'in_progress' }))}
                              className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] active:scale-[0.98] text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                            >
                              <Play size={11} className="fill-current" />
                              Démarrer l'exercice
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleUpdateExerciseStatus(exIdx, 'completed')}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10"
                            >
                              <Check size={13} strokeWidth={3} />
                              Valider l'exercice (Suivant)
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setActiveExerciseStatuses(prev => ({ ...prev, [exIdx]: 'in_progress' }))}
                              className="text-xs font-semibold text-[#FBBF24]/60 hover:text-[#FBBF24] underline"
                            >
                              Réouvrir / Recommencer cet exercice
                            </button>
                          )}
                        </div>

                        {/* TARGET DESCRIPTION (Shown dynamically when exercise is put in progress) */}
                        {isInProgress && (
                          <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-slate-300 text-[11px] leading-relaxed italic animate-fade-in">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-[#FBBF24]/80 block not-italic mb-1">Coup d'œil exécution & anatomie :</span>
                            <p>{getExerciseDescription(ex.name, ex.category || 'Renforcement')}</p>
                          </div>
                        )}

                        {/* INDIVIDUAL SETS WORKOUT ROW LIST (Hole grid displayed primarily when En cours or complete) */}
                        {(!isIdle || isCompleted) && (
                          <div className="space-y-2 border-t border-white/5 pt-3 animate-fade-in">
                            {/* Legend */}
                            <div className="grid grid-cols-12 gap-1 text-[8px] font-black uppercase text-white/30 tracking-wider text-center">
                              <div className="col-span-2 text-left">Série</div>
                              <div className="col-span-5">Poids (KG)</div>
                              <div className="col-span-3">Reps</div>
                              <div className="col-span-2">Statut</div>
                            </div>

                            {/* Set Rows iterator */}
                            {Array.from({ length: ex.sets }).map((_, sIdx) => {
                              const key = `${exIdx}-${sIdx}`;
                              const isDone = !!liveSetCompleted[key];
                              const activeW = liveSetWeights[key] !== undefined ? liveSetWeights[key] : ex.targetLoadKg;
                              const activeR = liveSetReps[key] !== undefined ? liveSetReps[key] : ex.reps;

                              return (
                                <div 
                                  key={sIdx}
                                  className={`grid grid-cols-12 gap-1 items-center py-1.5 px-2 rounded-lg transition ${
                                    isDone 
                                      ? 'bg-emerald-500/10 border border-emerald-500/15' 
                                      : 'bg-black/40 border border-white/5'
                                  }`}
                                >
                                  {/* Set Label */}
                                  <div className="col-span-2 text-xs font-mono font-black text-slate-300">
                                    S{sIdx + 1}
                                  </div>

                                  {/* Live Weight adjuster with micro plus/minus */}
                                  <div className="col-span-5 flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleModifyLiveSetWeight(exIdx, sIdx, -2.5)}
                                      className="w-5 h-5 bg-white/5 rounded text-[11px] font-mono font-bold flex items-center justify-center hover:bg-white/10 text-white"
                                    >
                                      -
                                    </button>
                                    <input 
                                      type="number"
                                      step="0.5"
                                      value={activeW}
                                      onChange={(e) => handleManualInputWeight(exIdx, sIdx, e.target.value)}
                                      className="w-11 bg-black text-[#FBBF24] border border-white/5 rounded py-0.5 text-xs font-mono font-black text-center focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleModifyLiveSetWeight(exIdx, sIdx, 2.5)}
                                      className="w-5 h-5 bg-white/5 rounded text-[11px] font-mono font-bold flex items-center justify-center hover:bg-white/10 text-white"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Live Reps Adjuster with micro plus/minus */}
                                  <div className="col-span-3 flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleModifyLiveSetReps(exIdx, sIdx, -1)}
                                      className="w-4 h-4 bg-white/5 rounded text-[11px] font-mono font-bold flex items-center justify-center hover:bg-white/10 text-white"
                                    >
                                      -
                                    </button>
                                    <input 
                                      type="number"
                                      value={activeR}
                                      onChange={(e) => handleManualInputReps(exIdx, sIdx, e.target.value)}
                                      className="w-7 bg-black text-slate-200 border border-white/5 rounded py-0.5 text-xs font-mono font-bold text-center focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleModifyLiveSetReps(exIdx, sIdx, 1)}
                                      className="w-4 h-4 bg-white/5 rounded text-[11px] font-mono font-bold flex items-center justify-center hover:bg-white/10 text-white"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Status interactive check button */}
                                  <div className="col-span-2 flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSetCompletion(exIdx, sIdx, ex.name)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                                        isDone 
                                          ? 'bg-[#10b981] text-black border-transparent shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                          : 'border-white/20 hover:border-white/50 bg-transparent'
                                      }`}
                                    >
                                      <Check size={11} strokeWidth={isDone ? 4 : 2} className={isDone ? 'text-black' : 'text-white/30'} />
                                    </button>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Technical exercise sheet panel drawer overlay if active */}
                {activeGuideExercise && (
                  <div className="bg-[#0f111a] border border-emerald-500/20 rounded-2xl p-4 text-left space-y-3 font-sans animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Guide mécanique : {activeGuideExercise}</span>
                      <button 
                        onClick={() => setActiveGuideExercise(null)}
                        className="text-[9px] font-bold text-white/50 hover:text-white uppercase font-mono px-2 py-0.5 bg-white/5 rounded"
                      >
                        Fermer le guide [X]
                      </button>
                    </div>

                    {loadingAiGuide ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-1">
                        <Compass className="animate-spin text-emerald-400" size={16} />
                        <span className="text-[9px] font-bold text-white/40 animate-pulse uppercase tracking-wider font-mono">Génération IA de la fiche par Gemini...</span>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans text-xs">
                        {/* Muscle groups targeted */}
                        <div>
                          <span className="text-[8.5px] font-bold uppercase text-white/30 block mb-0.5">Structure anatomique impactée :</span>
                          <div className="flex flex-wrap gap-1">
                            {aiGuides[activeGuideExercise]?.targetMuscles?.map((m, idx) => (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded border border-emerald-500/10">
                                🎯 {m}
                              </span>
                            )) || <span className="text-white/40 italic text-[10px]">Cible mécanique</span>}
                          </div>
                        </div>

                        {/* Proper execution steps */}
                        <div>
                          <span className="text-[8.5px] font-bold uppercase text-white/30 block mb-0.5">Alignement & exécution athlétique :</span>
                          <ul className="list-disc pl-3.5 space-y-0.5 text-slate-300 leading-tight text-[10.5px]">
                            {aiGuides[activeGuideExercise]?.properForm?.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            )) || (
                              <>
                                <li>Configurez vos leviers articulaires sagement.</li>
                                <li>Contrôlez la descente et poussez explosivement.</li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Safety margins warnings */}
                        <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl p-2.5">
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                            <ShieldAlert size={11} /> Consignes de sécurité incontournables :
                          </span>
                          <ul className="text-[10px] text-rose-300 space-y-0.5 pl-3.5 list-disc">
                            {aiGuides[activeGuideExercise]?.safetyTips?.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            )) || (
                              <li>Maintenez la rectitude vertébrale constante.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation and session logging triggers */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const completedCount = getCompiledSetLogsList().length;
                      if (completedCount === 0) {
                        showToast("Validez au moins une série de travail avant de clore l'entraînement.", "error");
                        return;
                      }
                      setCustomConfirm({
                        message: "Clore définitivement la séance d'entraînement courante et sauvegarder vos accomplissements ?",
                        onConfirm: () => {
                          triggerAd(() => {
                            setMuscuScreen('SUMMARY');
                          });
                        }
                      });
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl text-xs tracking-wider uppercase transition active:scale-95 text-center block shadow-lg shadow-purple-500/10 border border-purple-500/20"
                  >
                    Arrêter et Enregistrer l'Entraînement ✓
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: SUMMARY (Training report review) */}
            {muscuScreen === 'SUMMARY' && activeWorkout && (
              <div className="space-y-4 text-left animate-fade-in">
                <div className="text-center py-4 border-b border-white/5">
                  <div className="w-11 h-11 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <Trophy size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-[#FBBF24] uppercase block">ENTRAÎNEMENT TERMINÉ ET LOGGÉ SUCCÈS</span>
                  <h3 className="text-xl font-extrabold text-white uppercase italic tracking-tight leading-none mt-1">Excellent travail, athlète !</h3>
                </div>

                {/* Clinically calculated MET stats */}
                <div className="bg-gradient-to-br from-[#10b981]/15 via-black/30 to-transparent rounded-2xl p-5 border border-[#10b981]/20 text-center relative overflow-hidden">
                  <span className="text-[9px] text-white/45 uppercase tracking-widest font-black flex items-center justify-center gap-1">
                    <Flame size={12} className="text-[#FBBF24] animate-bounce" />
                    Calories consommées (Modèle MET dynamique)
                  </span>
                  
                  {(() => {
                    const loggedSets = getCompiledSetLogsList();
                    const sumLoad = loggedSets.reduce((acc, c) => acc + c.loadKg, 0);
                    const avgLoad = loggedSets.length > 0 ? (sumLoad / loggedSets.length) : 40;
                    const calculated = calculateWorkoutCalories(profile.weightKg, sessionDuration, avgLoad);

                    return (
                      <>
                        <p className="text-4xl font-black font-mono text-[#FBBF24] mt-2 leading-none">
                          {calculated.calories.toFixed(1)} <span className="text-xs font-sans font-black text-white/40 tracking-normal">KCAL</span>
                        </p>
                        <p className="text-[10px] text-white/40 mt-3 max-w-[290px] mx-auto leading-normal">
                          Calcul clinique dynamique basé sur la charge moyenne de lift de <strong>{avgLoad.toFixed(1)} kg</strong> pour un poids de corps athlétique de <strong>{profile.weightKg.toFixed(1)} kg</strong>.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-xs text-left font-sans">
                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                            <span className="text-[8px] text-white/30 block font-semibold uppercase">Durée Totale</span>
                            <span className="text-white font-mono font-bold block mt-0.5">{formatTime(sessionDuration)}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                            <span className="text-[8px] text-white/30 block font-semibold uppercase">Séries indexées</span>
                            <span className="text-[#FBBF24] font-bold block mt-0.5">{loggedSets.length} séries validées</span>
                          </div>
                        </div>

                        {/* Display a quick recap of sets lifted in detail */}
                        <div className="mt-4 pt-3 border-t border-white/5 text-xs text-left">
                          <span className="text-[8px] text-white/30 uppercase block font-black mb-1.5">Tableau des volumes validés :</span>
                          <div className="bg-black/50 p-2 rounded-lg text-[10px] leading-relaxed max-h-36 overflow-y-auto font-mono text-slate-300">
                            {activeWorkout.exercises.map((ex, exIdx) => {
                              const setsMatched = loggedSets.filter(s => s.exerciseIndex === exIdx);
                              if (setsMatched.length === 0) return null;
                              return (
                                <div key={exIdx} className="border-b border-white/5 pb-1 mb-1">
                                  <span className="font-bold text-white uppercase text-[9.5px] block">{ex.name}</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {setsMatched.map((sLog, sIdx) => (
                                      <span key={sIdx} className="bg-white/5 px-1.5 py-0.5 rounded text-slate-300">
                                        S{sLog.setIndex + 1}: {sLog.loadKg}kg x {sLog.reps}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <button
                  onClick={() => {
                    triggerAd(() => {
                      setMuscuScreen('DASHBOARD');
                      setActiveWorkout(null);
                      setSessionDuration(0);
                      setSessionStartTime(null);
                      setLiveSetWeights({});
                      setLiveSetReps({});
                      setLiveSetCompleted({});
                      setActiveExerciseStatuses({});
                      setRestSecondsLeft(0);
                      setIsRestTimerActive(false);
                    });
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition text-center block shadow-lg border border-purple-500/20"
                >
                  Fermer & Retourner au Dashboard
                </button>
              </div>
            )}

          </div>
        )}

        {/* =========================================
            TAB IA: TABLEAU DE BORD INTÉLLIGENT IA
            ========================================= */}
        {activeTab === 'dashboard_ia' && (
          <div className="space-y-4 animate-fade-in text-left">
            
            {/* Header banner */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
              isLightMode 
                ? 'bg-white border-purple-500/10 shadow-md' 
                : 'bg-gradient-to-br from-[#120a24] to-black border-purple-500/15 shadow-2xl'
            }`}>
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${ACCENT_STYLES[accentColor].accent}15` }} />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-[#8B5CF6] text-white shadow-lg shadow-purple-500/10">
                  <Brain size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[9px] font-black tracking-widest uppercase block font-mono" style={{ color: ACCENT_STYLES[accentColor].accent }}>
                    CONSEILS EN TEMPS RÉEL
                  </span>
                  <h2 className={`text-base font-black uppercase ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    HUB ATHLÉTIQUE IA
                  </h2>
                </div>
              </div>
              <p className={`text-[11px] leading-relaxed mt-3 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Votre coach virtuel analyse votre profil ({profile.age} ans, {latestWeight} kg, niveau {profile.activityLevel}) et vos objectifs pour maximiser votre surcharge progressive et vos performances de combat.
              </p>
            </div>

            {/* Grid stats & objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Daily Goals Checklist */}
              <div className={`p-4 rounded-3xl border transition-all duration-300 ${
                isLightMode ? 'bg-white border-purple-500/10 shadow-sm' : 'bg-[#120a24]/40 border-white/5'
              }`}>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                    Objectifs du Jour
                  </h3>
                  <span className="text-[10px] font-mono font-black" style={{ color: ACCENT_STYLES[accentColor].accent }}>
                    {Object.values(aiGoalsCompleted).filter(Boolean).length} / 4 COMPLÉTÉS
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'goal1', text: `Enregistrer son poids du jour (${latestWeight} kg actuel)` },
                    { key: 'goal2', text: "Compléter 3 séries de musculation" },
                    { key: 'goal3', text: "Faire 5 min d'étirements ou gainage actif" },
                    { key: 'goal4', text: "Compléter la routine d'entraînement IA du jour" }
                  ].map((goal) => {
                    const done = !!aiGoalsCompleted[goal.key];
                    return (
                      <button
                        key={goal.key}
                        onClick={() => handleCompleteAiGoal(goal.key)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 ${
                          done 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold' 
                            : isLightMode 
                              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                              : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs font-medium font-sans leading-snug">{goal.text}</span>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-400/45'
                        }`}>
                          {done && <Check size={12} className="stroke-[3.5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Muscle Group Pie Chart Simulator */}
              <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                isLightMode ? 'bg-white border-purple-500/10 shadow-sm' : 'bg-[#120a24]/40 border-white/5'
              }`}>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                    Répartition Musculaire
                  </h3>
                  <p className="text-[10px] text-white/40 mb-3">Estimation IA basée sur vos séances et records</p>
                </div>

                {/* Simulated Pie / Circular Progress Chart */}
                <div className="relative h-32 flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    {/* Ring 1: Chest */}
                    <circle cx="56" cy="56" r="46" fill="transparent" stroke={isLightMode ? '#e2e8f0' : '#1e1e2f'} strokeWidth="5" />
                    <circle cx="56" cy="56" r="46" fill="transparent" stroke={ACCENT_STYLES[accentColor].accent} strokeWidth="6" strokeDasharray={288} strokeDashoffset={72} strokeLinecap="round" className="transition-all duration-1000" />
                    
                    {/* Ring 2: Back */}
                    <circle cx="56" cy="56" r="36" fill="transparent" stroke={isLightMode ? '#e2e8f0' : '#1e1e2f'} strokeWidth="5" />
                    <circle cx="56" cy="56" r="36" fill="transparent" stroke="#8B5CF6" strokeWidth="6" strokeDasharray={226} strokeDashoffset={60} strokeLinecap="round" className="transition-all duration-1000" />

                    {/* Ring 3: Legs */}
                    <circle cx="56" cy="56" r="26" fill="transparent" stroke={isLightMode ? '#e2e8f0' : '#1e1e2f'} strokeWidth="5" />
                    <circle cx="56" cy="56" r="26" fill="transparent" stroke="#EF4444" strokeWidth="6" strokeDasharray={163} strokeDashoffset={50} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  
                  {/* Custom legend */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className={`text-base font-black ${isLightMode ? 'text-slate-800' : 'text-white'}`}>82%</span>
                    <span className="text-[8px] font-mono text-purple-400 font-bold uppercase">Volume</span>
                  </div>
                </div>

                {/* Custom Legends row */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-center">
                  <div>
                    <span className="text-[8px] font-mono text-white/40 block">PECTORAUX</span>
                    <span className="text-[10px] font-bold" style={{ color: ACCENT_STYLES[accentColor].accent }}>75%</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-white/40 block">DOS</span>
                    <span className="text-[10px] font-bold text-purple-400">70%</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-white/40 block">CUISSES</span>
                    <span className="text-[10px] font-bold text-red-400">68%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* AI Custom Recommendations Banner */}
            <div className={`p-4 rounded-3xl border transition-all duration-300 ${
              isLightMode ? 'bg-white border-purple-500/10 shadow-sm' : 'bg-black/40 border-white/5'
            }`}>
              <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-wider block mb-2.5">
                ✦ RECOMMANDATIONS IA DU JOUR
              </span>
              
              <div className="space-y-3">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                    <Zap size={13} />
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-xs font-black uppercase block ${isLightMode ? 'text-slate-700' : 'text-white'}`}>
                      Focus Surcharge Progressive
                    </span>
                    <p className={`text-[10.5px] leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
                      {profile.goal === 'Prise de masse' 
                        ? `Votre métabolisme est réglé sur un surplus calorique de ${computedDailyCalories} kcal. Pour briser le plateau sur vos Records, ciblez une augmentation de +2.5 KG sur vos Lifts lourds cette semaine.` 
                        : `En période de Sèche à ${computedDailyCalories} kcal, privilégiez le maintien de vos charges maximales avec un apport de ${computedDailyProteins}g de protéines pour préserver votre masse musculaire.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start border-t border-white/5 pt-3">
                  <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5 shrink-0">
                    <Compass size={13} />
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-xs font-black uppercase block ${isLightMode ? 'text-slate-700' : 'text-white'}`}>
                      Récupération Posturale Combat
                    </span>
                    <p className={`text-[10.5px] leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
                      Grappling ou boxe active détectés : effectuez 5 minutes d'étirements (cobra ou suspension passive à la barre fixe) pour relâcher les muscles spinaux et corriger la posture voûtée de garde.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ROUTINE D'ENTRAÎNEMENT DU JOUR IA */}
            <div className={`p-4 rounded-3xl border transition-all duration-300 ${
              isLightMode ? 'bg-white border-purple-500/10 shadow-sm' : 'bg-[#120a24]/40 border-white/5'
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles size={13} />
                  </div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                    Routine d'Entraînement IA
                  </h3>
                </div>
                {iaWorkoutGenerated && (
                  <button
                    onClick={() => {
                      setIaWorkoutCompletedExercises({});
                      setIaWorkoutGenerated(false);
                      showToast("Routine d'entraînement réinitialisée.", "info");
                    }}
                    className="text-[9px] font-bold text-white/40 hover:text-white/80 uppercase font-mono transition-all"
                  >
                    Regénérer ↺
                  </button>
                )}
              </div>

              {!iaWorkoutGenerated ? (
                <div className="text-center py-4 space-y-3">
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Générez une routine d'entraînement sur-mesure d'après vos sports actifs ({onboardingSelectedSports.length > 0 ? onboardingSelectedSports.join(', ').toUpperCase() : 'MUSCU, COMBAT'}) et vos objectifs athlétiques actuels.
                  </p>
                  <button
                    onClick={() => {
                      setIaWorkoutGenerated(true);
                      setIaWorkoutCompletedExercises({});
                      showToast("Routine IA générée sur-mesure pour vous ! 🔥", "success");
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95 shadow-lg shadow-purple-500/20"
                  >
                    ✦ Générer l'Entraînement IA
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Progress info */}
                  {(() => {
                    const workoutExs = getPersonalizedIaWorkout();
                    const completedCount = Object.values(iaWorkoutCompletedExercises).filter(Boolean).length;
                    const percent = Math.round((completedCount / workoutExs.length) * 100);
                    
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                          <span className="text-purple-400">PROGRESSION DE LA SESSION</span>
                          <span className={isLightMode ? 'text-slate-700' : 'text-white'}>{completedCount} / {workoutExs.length} EXERCICES</span>
                        </div>
                        <div className={`h-2 w-full rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-black/60 border border-white/5'}`}>
                          <div className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Exercises Checklist */}
                  <div className="space-y-2 pt-1">
                    {getPersonalizedIaWorkout().map((ex, index) => {
                      const isCompleted = !!iaWorkoutCompletedExercises[index];
                      const IconComponent = ex.icon === 'Dumbbell' ? Dumbbell : 
                                            ex.icon === 'Award' ? Award : 
                                            ex.icon === 'Zap' ? Zap : 
                                            ex.icon === 'Flame' ? Flame : 
                                            ex.icon === 'Medal' ? Medal : 
                                            ex.icon === 'Trophy' ? Trophy : 
                                            ex.icon === 'Timer' ? Timer : ShieldAlert;
                                            
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            const updated = { ...iaWorkoutCompletedExercises, [index]: !isCompleted };
                            setIaWorkoutCompletedExercises(updated);
                            
                            const totalExsCount = getPersonalizedIaWorkout().length;
                            const newCompletedCount = Object.values(updated).filter(Boolean).length;
                            
                            if (newCompletedCount === totalExsCount) {
                              if (!aiGoalsCompleted.goal4) {
                                handleCompleteAiGoal('goal4');
                              }
                              showToast("🏆 FÉLICITATIONS ! Vous avez complété votre routine IA du jour !", "success");
                            } else {
                              showToast(isCompleted ? "Exercice décoché." : "Exercice validé ! Continuez comme ça ! 💪", "success");
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                            isCompleted 
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold' 
                              : isLightMode 
                                ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                                : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              <IconComponent size={14} />
                            </div>
                            <div className="space-y-0.5">
                              <span className={`text-xs font-black uppercase block leading-tight ${isCompleted ? 'text-emerald-400' : isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {ex.name}
                              </span>
                              <span className="text-[9px] font-mono opacity-50 block leading-tight">{ex.target} &bull; {ex.reps}</span>
                            </div>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-400/45'
                          }`}>
                            {isCompleted && <Check size={12} className="stroke-[3.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Challenge Card */}
            {(() => {
              const currentTarget = POMPE_LEVEL_TARGETS[currentPompeLevel - 1] || 100;
              const currentPercent = Math.min(100, Math.round((pompeReps / currentTarget) * 100));
              const currentLevelName = POMPE_LEVEL_NAMES[currentPompeLevel - 1] || "Expert";
              return (
                <div className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                  isLightMode 
                    ? 'bg-gradient-to-br from-purple-50 to-white border-purple-500/10 shadow-md' 
                    : 'bg-gradient-to-br from-[#1b1130] to-black border-purple-500/20'
                }`}>
                  <div className="absolute top-0 right-0 p-2 text-purple-500 opacity-10">
                    <Trophy size={96} />
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest font-mono">
                      DÉFI PROGRESSIF EN COURS &bull; {currentLevelName.toUpperCase()}
                    </span>
                    <h4 className={`text-sm font-black uppercase ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      Le Marathon des Pompes IA
                    </h4>
                    <p className={`text-[10.5px] leading-relaxed pb-3 ${isLightMode ? 'text-slate-500' : 'text-white/60'}`}>
                      Progressez d'étape en étape ! Relevez le défi pour débloquer les niveaux successifs : de 10 à 20, 50, 100, 200, puis 500 pompes !
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-purple-400">{currentPercent} % COMPLÉTÉ</span>
                        <span className={isLightMode ? 'text-slate-700' : 'text-white'}>{pompeReps} / {currentTarget} REPS</span>
                      </div>
                      <div className={`h-2.5 w-full rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-black/60 border border-white/5'}`}>
                        <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${currentPercent}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button 
                        onClick={() => handleAddPompe(1)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95 text-center block shadow-lg shadow-purple-500/15"
                      >
                        +1 POMPE 💥
                      </button>
                      <button 
                        onClick={() => handleAddPompe(5)}
                        className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95 text-center block shadow-lg shadow-purple-900/15"
                      >
                        +5 POMPES 🔥
                      </button>
                      <button 
                        onClick={() => {
                          setPompeReps(0);
                          setCurrentPompeLevel(1);
                          showToast("Défi des Pompes réinitialisé au Niveau 1. 💪", "info");
                        }}
                        className={`px-3 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition border ${
                          isLightMode 
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700' 
                            : 'bg-black/40 border-white/10 hover:border-white/20 text-white/80'
                        }`}
                        title="Réinitialiser au niveau 1"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}



        {/* =========================================
            TAB 2: DEDICATED PERSONAL RECORDS & 1RM
            ========================================= */}
        {activeTab === 'records' && (
          <div className="space-y-4 animate-fade-in text-left">
            
            <div className="bg-gradient-to-br from-[#0f111a] to-black border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block mb-1">MISES À JOUR DE MES PERFORMANCES</span>
              <p className="text-[11px] text-white/50 leading-relaxed mb-3">Conservez précieusement vos repères de charges de références (Poids de travail maximum rattaché) pour mesurer l'historique de votre surcharge progressive sur les exercices piliers.</p>

              {/* Records Lift List */}
              <div className="space-y-2.5">
                {personalRecords.map((item) => (
                  <div key={item.id} className="bg-black/50 border border-white/5 hover:border-[#FBBF24]/20 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                        <h4 className="font-bold text-white text-xs truncate uppercase">{item.exerciseName}</h4>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 font-mono">
                        Dernière référence : <span className="text-[#FBBF24] font-bold">{item.maxWeightKg} kg</span> &times; {item.reps} reps (le {item.date})
                      </p>
                    </div>

                    {/* Inline Update Controls */}
                    <div className="flex items-center gap-1 text-center bg-white/5 p-1 rounded-lg">
                      <input 
                        type="number"
                        placeholder="KG"
                        value={newPrWeight[item.id] !== undefined ? newPrWeight[item.id] : ''}
                        onChange={(e) => setNewPrWeight(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-11 bg-black border border-white/5 rounded py-1 text-center font-mono text-[10px] text-slate-200 focus:outline-none"
                      />
                      <span className="text-[9px] text-white/30 font-bold px-0.5">&times;</span>
                      <input 
                        type="number"
                        placeholder="Reps"
                        value={newPrReps[item.id] !== undefined ? newPrReps[item.id] : ''}
                        onChange={(e) => setNewPrReps(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-10 bg-black border border-white/5 rounded py-1 text-center font-mono text-[10px] text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateKeyPR(item.id, item.exerciseName)}
                        className="bg-[#FBBF24] text-black hover:bg-[#F59E0B] text-[9px] font-black rounded px-2 py-1 uppercase ml-1"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => handleDeletePR(item.id)}
                        className="text-red-400/50 hover:text-red-400 p-1"
                        title="Masquer de l'affichage"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Exercise to Performance Tracker */}
              <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                <input 
                  type="text"
                  placeholder="Créer une nouvelle PR (ex: Curl incliné)"
                  id="custom-pr-name-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewCustomPR((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 flex-1 focus:outline-none focus:border-[#FBBF24]"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('custom-pr-name-input') as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleAddNewCustomPR(el.value);
                      el.value = '';
                    }
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-white/10 uppercase transition"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* CALCULATEUR 1RM BRZYCKI */}
            <div className="bg-gradient-to-br from-[#0f111a] to-black border border-white/5 p-4 rounded-2xl space-y-3.5">
              <div>
                <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block flex items-center gap-1.5">
                  <Zap size={12} className="text-[#FBBF24]" /> Estimations de force maximale Brzycki
                </span>
                <p className="text-[10.5px] text-white/50 mt-1 leading-snug">Renseignez votre charge de travail moyenne et reps associées sur un développé couché ou squat pour calculer votre 1RM théorique.</p>
              </div>

              <form onSubmit={handleCalculate1RM} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-mono font-bold uppercase text-white/40 block mb-1">Charge Soulevée (KG)</label>
                  <input 
                    type="number"
                    value={calcLoad}
                    onChange={(e) => setCalcLoad(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono font-bold uppercase text-white/40 block mb-1">Nombre de Répétitions</label>
                  <input 
                    type="number"
                    value={calcReps}
                    onChange={(e) => setCalcReps(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="col-span-2 bg-white/5 hover:bg-white/10 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition border border-white/10"
                >
                  Calculer le 1RM
                </button>
              </form>

              {calcResult !== null && (
                <div className="bg-emerald-500/15 border border-emerald-500/20 rounded-xl p-3.5 text-center">
                  <span className="text-[9px] font-bold text-emerald-400 block uppercase font-mono">1RM Levier théorique</span>
                  <p className="text-3xl font-black font-mono text-emerald-400 leading-none mt-1">
                    {calcResult} <span className="text-xs font-sans text-white/50 font-black">KG</span>
                  </p>
                  
                  {/* Detailed structural RM breakdown safety index */}
                  <div className="mt-3.5 pt-3.5 border-t border-emerald-500/10 grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <span className="text-white/40 block">90% du RM</span>
                      <span className="font-mono text-white font-bold">{(calcResult * 0.9).toFixed(1)} kg</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">80% du RM</span>
                      <span className="font-mono text-white font-bold">{(calcResult * 0.8).toFixed(1)} kg</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">70% du RM</span>
                      <span className="font-mono text-white font-bold">{(calcResult * 0.7).toFixed(1)} kg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}



        {/* =========================================
            TAB 4: BODYWEIGHT LOG & SVG SPARKLINE TRENDS
            ========================================= */}
        {activeTab === 'weight' && (
          <div className="space-y-4 animate-fade-in text-left">
            
            {/* WEIGHT INPUT BOARD */}
            <div className="bg-gradient-to-br from-[#0f111a] to-[#07080c] border border-white/5 p-4 rounded-2xl space-y-3">
              <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block">Enregistrer ma pesée corporelle du jour</span>
              
              <form onSubmit={registerWeightLog} className="flex gap-2">
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 78.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="bg-black border border-white/5 rounded-xl px-4 py-3 text-xs font-mono font-bold text-[#FBBF24] placeholder-white/20 flex-1 focus:outline-none focus:border-[#FBBF24]"
                />
                <button
                  type="submit"
                  className="bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition"
                >
                  Valider
                </button>
              </form>
            </div>

            {/* WEIGHT INLINE SVG LINE PLOT GRAPHIC */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4">
              <span className="text-[10px] font-black text-white/40 tracking-widest uppercase block mb-2">Courbe d'évolution du poids de corps</span>
              
              {weightHistory.length >= 2 ? (
                <div className="py-2 flex flex-col items-center">
                  {(() => {
                    const sorted = [...weightHistory].reverse();
                    const weights = sorted.map(w => w.weightKg);
                    const minW = Math.min(...weights) - 1;
                    const maxW = Math.max(...weights) + 1;
                    const spread = maxW - minW || 1;

                    // Plot variables
                    const width = 360;
                    const height = 90;
                    const points = sorted.map((item, idx) => {
                      const x = (idx / (sorted.length - 1)) * (width - 40) + 20;
                      const y = height - ((item.weightKg - minW) / spread) * (height - 30) - 15;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <div className="w-full relative">
                        <svg className="w-full h-24 bg-black/40 rounded-xl" viewBox={`0 0 ${width} ${height}`}>
                          <defs>
                            <linearGradient id="gWeightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>

                          {/* Grid separator lines */}
                          <line x1="10" y1={height/2} x2={width-10} y2={height/2} stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3 3" />

                          {/* Area shading */}
                          <path 
                            d={`M 20,${height - 5} L ${points} L ${width - 20},${height - 5} Z`}
                            fill="url(#gWeightGrad)"
                          />

                          {/* Line drawing */}
                          <polyline 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2.5" 
                            points={points} 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Highlight coordinates circle nodes and weight indicators overlay */}
                          {sorted.map((item, idx) => {
                            const x = (idx / (sorted.length - 1)) * (width - 40) + 20;
                            const y = height - ((item.weightKg - minW) / spread) * (height - 30) - 15;
                            return (
                              <g key={item.id}>
                                <circle cx={x} cy={y} r="3.5" fill="#10b981" stroke="#050508" strokeWidth="1.5" />
                                <text x={x} y={y - 7} fill="#ffffff" fontSize="7.5" fontWeight="black" textAnchor="middle" opacity="0.8">
                                  {item.weightKg.toFixed(1)}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-6 text-center text-[11px] text-white/30 italic">
                  Ajoutez au moins 2 pesées chronologiques pour tracer la tendance graphique.
                </div>
              )}
            </div>

            {/* WEIGHT LIST HISTORY MAP */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4">
              <span className="text-[10px] font-black text-white/30 tracking-widest uppercase block mb-2">Historique de mes dernières pesées ({weightHistory.length})</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {weightHistory.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 font-mono">
                    <span className="text-white/40">{w.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-white">{w.weightKg.toFixed(1)} kg</span>
                      <button 
                        onClick={() => deleteWeightLog(w.id)}
                        className="text-red-400/50 hover:text-red-400 p-1 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            TAB 5: MEASUREMENTS & GOALS PROFIL
            ========================================= */}
        {activeTab === 'profil' && (
          <div className="space-y-4 animate-fade-in text-left font-sans">
            
            {/* PROFILE OBJECTIVES */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4 space-y-4">
              <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block">Objectifs d'Entraînement Athlétique</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wide block mb-1">Objectif Actuel</label>
                  <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl">
                    {(['Sèche', 'Prise de masse', 'Maintien'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => updateProfileAndSave({ ...profile, goal: g })}
                        className={`text-[9.5px] py-2 px-1 rounded-lg font-bold transition leading-tight ${
                          profile.goal === g 
                            ? 'bg-[#FBBF24] text-black font-black' 
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wide block mb-1">Taille Déclarée (CM)</label>
                  <input 
                    type="number"
                    value={profile.heightCm}
                    onChange={(e) => updateProfileAndSave({ ...profile, heightCm: parseInt(e.target.value) || 180 })}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wide block mb-1">Âge (Ans)</label>
                  <input 
                    type="number"
                    value={profile.age}
                    onChange={(e) => updateProfileAndSave({ ...profile, age: Math.max(1, parseInt(e.target.value) || 28) })}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wide block mb-1">Niveau d’Activité Physique</label>
                  <select
                    value={profile.activityLevel}
                    onChange={(e) => updateProfileAndSave({ ...profile, activityLevel: e.target.value as any })}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FBBF24]"
                  >
                    <option value="Sédentaire">Sédentaire (Bureau, peu de sport)</option>
                    <option value="Actif">Actif (Entraînements réguliers)</option>
                    <option value="Très Actif">Très Actif (Intense / Double Séances)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* INTAKE TARGET DASHBOARD (METABOLIC RESULTS) */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none text-[#FBBF24]">
                <Flame size={120} />
              </div>
              
              <div>
                <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase block mb-1">Besoins Nutritionnels Quotidiens</span>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Basé sur la formule de <strong className="text-white">Mifflin-St Jeor</strong>, calibrée avec votre dernier poids enregistré (<strong className="text-white">{latestWeight.toFixed(1)} kg</strong>) et un métabolisme de base évalué à <strong className="text-white">{Math.round(computedBmr)} kcal</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Calories Card */}
                <div className="bg-black/55 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <Flame size={14} className="fill-current" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-white/40">Objectif Calories</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none font-mono">
                      {computedDailyCalories.toLocaleString('fr-FR')} <span className="text-xs text-orange-400 font-bold">kcal</span>
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] text-white/40 font-bold">Maintien: {computedMaintenance} kcal</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                        profile.goal === 'Sèche' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        profile.goal === 'Prise de masse' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20'
                      }`}>
                        {profile.goal === 'Sèche' ? '-500' : profile.goal === 'Prise de masse' ? '+300' : 'Maintien'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Protein Card */}
                <div className="bg-black/55 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center text-[#FBBF24]">
                      <Zap size={14} className="fill-current" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-white/40">Objectif Protéines</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-[#FBBF24] leading-none font-mono">
                      {computedDailyProteins} <span className="text-xs text-white/60 font-medium">g</span>
                    </span>
                    <div className="mt-1.5">
                      <span className="text-[9px] text-white/40 font-bold block">Ratio: 2g / kg de poids</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BODY MEASUREMENT TRACKER (MENSURATIONS) */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4 space-y-4">
              <div>
                <span className="text-[10px] font-black text-white/40 tracking-widest uppercase block">Évolution Physique & Mensurations Chronologiques</span>
                <p className="text-[10.5px] text-white/40 mt-1 leading-snug">Renseignez vos principaux repères corporels en centimètres pour piloter adéquatement votre recomposition forcée.</p>
              </div>

              <form onSubmit={handleSaveMensurations} className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[8px] font-bold uppercase text-white/40 mb-1 text-center">Bras (cm)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={measArm}
                    onChange={(e) => setMeasArm(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono text-center text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold uppercase text-white/40 mb-1 text-center">Poitrine</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={measChest}
                    onChange={(e) => setMeasChest(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono text-center text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold uppercase text-white/40 mb-1 text-center">Taille (cm)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={measWaist}
                    onChange={(e) => setMeasWaist(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono text-center text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold uppercase text-white/40 mb-1 text-center">Cuisse</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={measThigh}
                    onChange={(e) => setMeasThigh(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-lg py-2 text-xs font-mono text-center text-white font-bold"
                  />
                </div>

                <button 
                  type="submit"
                  className="col-span-4 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition mt-1.5"
                >
                  Enregistrer les mensurations
                </button>
              </form>

              {/* Mensurations Historical Logs List */}
              {mensurations.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[9px] font-black text-white/30 tracking-widest uppercase block mb-2">Logs historiques des mensurations</span>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {mensurations.map((log) => (
                      <div key={log.id} className="bg-black/50 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-[11px] gap-2 font-mono">
                        <span className="text-white/40 shrink-0 font-medium">{log.date}</span>
                        
                        <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                          <div>
                            <span className="text-[7.5px] text-white/20 block uppercase font-sans">Bras</span>
                            <span className="text-[#FBBF24] font-bold text-xs">{log.brasCm}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-white/20 block uppercase font-sans">Poitrine</span>
                            <span className="text-white font-bold text-xs">{log.poitrineCm}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-white/20 block uppercase font-sans">Taille</span>
                            <span className="text-white font-bold text-xs">{log.tailleCm}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-white/20 block uppercase font-sans">Cuisse</span>
                            <span className="text-white font-bold text-xs">{log.cuisseCm}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => deleteMensurationLog(log.id)}
                          className="text-red-400/40 hover:text-red-400 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* INTENSITY METRIC INFORMATION EXCLUSIVES */}
            <div className="bg-[#10b981]/10 border border-[#10b981]/10 p-4 rounded-2xl flex gap-3">
              <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black text-white uppercase block leading-none">Énergie Métabolique MET standardisée</span>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Toutes vos statistiques d'entraînement calibrent exactement votre dépense calorique réelle basée sur vos ratios de charge mécanique et votre poids corporel actualisé.
                </p>
              </div>
            </div>

            {/* CYBERPUNK CUSTOMIZATION & AI COACH VOICE SETTINGS */}
            <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Sliders size={15} className="text-[#FBBF24]" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest block font-mono">
                  CONFIGURATION COCH IA & ACCENTS NÉON
                </span>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wide block">
                  Couleur d'accentuation Néon Cyberpunk
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['cyan', 'magenta', 'lime', 'gold', 'violet'] as const).map((color) => {
                    const style = ACCENT_STYLES[color];
                    const isSel = accentColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setAccentColor(color);
                          localStorage.setItem('kinetic_accent_color', color);
                          showToast(`Néon ${style.name} synchronisé avec le HUD ! ⚡`, "success");
                          setIsLogoPulsing(true);
                          setTimeout(() => setIsLogoPulsing(false), 850);
                        }}
                        className={`py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 text-center ${
                          isSel 
                            ? 'border-white text-white shadow-lg' 
                            : 'border-white/5 text-white/40 hover:border-white/10 hover:text-white'
                        }`}
                        style={{ 
                          backgroundColor: `${style.accent}15`, 
                          boxShadow: isSel ? `0 0 12px ${style.accent}50` : '',
                          borderColor: isSel ? style.accent : ''
                        }}
                      >
                        <span className="w-2 h-2 rounded-full inline-block mr-1 align-middle" style={{ backgroundColor: style.accent }} />
                        {style.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* IA Coach voice settings */}
              <div className="space-y-3.5 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Volume2 size={13} className="text-purple-400" />
                  <span className="text-[9.5px] font-black uppercase text-purple-400 tracking-wider">Voix & Attitude du Coach IA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gender Selector */}
                  <div>
                    <label className="text-[8.5px] text-white/40 uppercase font-black block mb-1">Identité Vocale</label>
                    <div className="grid grid-cols-2 gap-1 bg-black p-1 rounded-xl">
                      {[
                        { id: 'masculin', label: 'Masculin' },
                        { id: 'feminin', label: 'Féminin' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            setCoachGender(g.id as any);
                            localStorage.setItem('kinetic_coach_gender', g.id);
                            showToast(`Coach IA configuré en voix de genre ${g.label}.`, "info");
                          }}
                          className={`text-[9px] py-1.5 px-0.5 rounded-lg font-bold transition ${
                            coachGender === g.id 
                              ? 'bg-purple-600 text-white font-black' 
                              : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Selector */}
                  <div>
                    <label className="text-[8.5px] text-white/40 uppercase font-black block mb-1">Attitude & Accent</label>
                    <div className="grid grid-cols-2 gap-1 bg-black p-1 rounded-xl">
                      {[
                        { id: 'francais', label: 'Français' },
                        { id: 'quebecois', label: 'Québécois' },
                        { id: 'combat', label: 'Spartiate' },
                        { id: 'energes', label: 'Énergique' }
                      ].map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setCoachAccent(acc.id as any);
                            localStorage.setItem('kinetic_coach_accent', acc.id);
                            showToast(`Attitude vocale réglée sur "${acc.label}".`, "info");
                          }}
                          className={`text-[8.5px] py-1.5 px-0.5 rounded-lg font-bold transition truncate ${
                            coachAccent === acc.id 
                              ? 'bg-purple-600 text-white font-black' 
                              : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speech Speed */}
                  <div>
                    <label className="text-[8.5px] text-white/40 uppercase font-black block mb-1">Débit Verbal</label>
                    <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl">
                      {[
                        { id: 'lente', label: 'Lent' },
                        { id: 'normale', label: 'Normal' },
                        { id: 'rapide', label: 'Rapide' }
                      ].map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => {
                            setCoachSpeed(sp.id as any);
                            localStorage.setItem('kinetic_coach_speed', sp.id);
                            showToast(`Débit verbal ajusté en mode ${sp.label}.`, "info");
                          }}
                          className={`text-[8.5px] py-1.5 px-0.5 rounded-lg font-bold transition ${
                            coachSpeed === sp.id 
                              ? 'bg-purple-600 text-white font-black' 
                              : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification preferences toggles */}
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <span className="text-[9.5px] font-black uppercase text-white/40 tracking-wider block">Préférences d'Alerte Tactiques</span>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Push toggle */}
                  <label className="flex-1 bg-black/40 border border-white/5 hover:border-white/10 p-3 rounded-2xl flex items-center justify-between cursor-pointer select-none">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Alertes d'hydratation</span>
                      <span className="text-[9px] text-white/40 block">Rappels quotidiens d'eau</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyPref.pushActive}
                      onChange={(e) => {
                        const next = { ...notifyPref, pushActive: e.target.checked };
                        setNotifyPref(next);
                        localStorage.setItem('kinetic_notify_preferences', JSON.stringify(next));
                        showToast(e.target.checked ? "Alertes hydratation activées." : "Alertes hydratation désactivées.", "info");
                      }}
                      className="w-4 h-4 text-purple-600 bg-black border-white/10 rounded focus:ring-purple-500 shrink-0"
                    />
                  </label>

                  {/* Rest audio toggle */}
                  <label className="flex-1 bg-black/40 border border-white/5 hover:border-white/10 p-3 rounded-2xl flex items-center justify-between cursor-pointer select-none">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Sons de repos</span>
                      <span className="text-[9px] text-white/40 block">Rappels audio fin de repos</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyPref.restTimerAudio}
                      onChange={(e) => {
                        const next = { ...notifyPref, restTimerAudio: e.target.checked };
                        setNotifyPref(next);
                        localStorage.setItem('kinetic_notify_preferences', JSON.stringify(next));
                        showToast(e.target.checked ? "Signaux audio de repos activés." : "Signaux audio de repos désactivés.", "info");
                      }}
                      className="w-4 h-4 text-purple-600 bg-black border-white/10 rounded focus:ring-purple-500 shrink-0"
                    />
                  </label>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FIXED PREMIUM BOTTOM NAVIGATION BAR (100% NATIVE DOCK FEEL) WITH SCROLL TRIGGERS & AUTO-CENTERING */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto select-none">
        
        {/* Left Scroll Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const dock = document.getElementById('app-bottom-dock');
            if (dock) {
              dock.scrollBy({ left: -100, behavior: 'smooth' });
            }
          }}
          className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center z-50 backdrop-blur-sm transition-all active:scale-95 border-r ${
            isLightMode 
              ? 'bg-white/80 text-slate-700 border-purple-500/10' 
              : 'bg-[#090514]/85 text-slate-100 border-purple-500/10'
          }`}
          title="Faire défiler vers la gauche"
        >
          <ChevronLeft size={16} className="stroke-[2.5]" />
        </button>

        <nav 
          id="app-bottom-dock" 
          className={`h-16 border-t overflow-x-auto whitespace-nowrap hide-scrollbar flex items-center justify-start gap-1 px-8 py-1 transition-all duration-300 scroll-smooth ${
            isLightMode 
              ? 'bg-white/95 border-purple-500/10 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] text-slate-700' 
              : 'bg-[#090514]/90 border-purple-500/10 shadow-[0_-4px_30px_rgba(168,85,247,0.05)] text-slate-100'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          
          {/* Dynamic Sport Tabs */}
          {(() => {
            const activeSportsList = onboardingSelectedSports.length > 0 
              ? onboardingSelectedSports 
              : ['muscu', 'jjb', 'boxe', 'mma', 'muay_thai', 'powerlifting'];

            const sportDetailsMap: Record<string, { label: string, icon: React.ComponentType<any> }> = {
              muscu: { label: 'Muscu', icon: Dumbbell },
              powerlifting: { label: 'Power', icon: Medal },
              jjb: { label: 'JJB', icon: Award },
              boxe: { label: 'Boxe', icon: Zap },
              mma: { label: 'MMA', icon: Trophy },
              muay_thai: { label: 'Muay', icon: Flame }
            };

            return activeSportsList.map((sportId) => {
              const detail = sportDetailsMap[sportId] || { label: sportId, icon: Dumbbell };
              const IconComp = detail.icon;
              const isActive = activeTab === sportId;
              return (
                <button
                  key={sportId}
                  id={`dock-tab-${sportId}`}
                  onClick={() => {
                    setActiveTab(sportId);
                    setSelectedSport(sportId);
                    if (sportId === 'muscu' || sportId === 'powerlifting') {
                      setMuscuScreen('DASHBOARD');
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-1 rounded-xl transition select-none shrink-0 min-w-[64px] px-2 ${
                    isActive 
                      ? '' 
                      : isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
                  }`}
                  style={{ color: isActive ? ACCENT_STYLES[accentColor].accent : '' }}
                >
                  <IconComp size={17} className={isActive ? 'stroke-[2.5]' : ''} />
                  <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">{detail.label}</span>
                </button>
              );
            });
          })()}

          {/* Separator Line */}
          <div className={`h-6 w-[1px] shrink-0 mx-1 ${isLightMode ? 'bg-slate-200' : 'bg-white/5'}`} />

          {/* TAB IA: COACH IA & DASHBOARD */}
          <button
            id="dock-tab-dashboard_ia"
            onClick={() => {
              setActiveTab('dashboard_ia');
              setSelectedSport(null);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition select-none shrink-0 min-w-[64px] px-2 ${
              activeTab === 'dashboard_ia' 
                ? '' 
                : isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
            }`}
            style={{ color: activeTab === 'dashboard_ia' ? ACCENT_STYLES[accentColor].accent : '' }}
          >
            <Sparkles size={17} className={activeTab === 'dashboard_ia' ? 'stroke-[2.5]' : ''} />
            <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">Coach IA</span>
          </button>



          {/* TAB 2: RECORDS */}
          <button
            id="dock-tab-records"
            onClick={() => {
              setActiveTab('records');
              setSelectedSport(null);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition select-none shrink-0 min-w-[64px] px-2 ${
              activeTab === 'records' 
                ? '' 
                : isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
            }`}
            style={{ color: activeTab === 'records' ? ACCENT_STYLES[accentColor].accent : '' }}
          >
            <Trophy size={17} className={activeTab === 'records' ? 'stroke-[2.5]' : ''} />
            <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">Records</span>
          </button>

          {/* TAB 3: SUIVI POIDS */}
          <button
            id="dock-tab-weight"
            onClick={() => {
              setActiveTab('weight');
              setSelectedSport(null);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition select-none shrink-0 min-w-[64px] px-2 ${
              activeTab === 'weight' 
                ? '' 
                : isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
            }`}
            style={{ color: activeTab === 'weight' ? ACCENT_STYLES[accentColor].accent : '' }}
          >
            <TrendingUp size={17} className={activeTab === 'weight' ? 'stroke-[2.5]' : ''} />
            <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">Poids</span>
          </button>

          {/* TAB 4: PROFILE */}
          <button
            id="dock-tab-profil"
            onClick={() => {
              setActiveTab('profil');
              setSelectedSport(null);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition select-none shrink-0 min-w-[64px] px-2 ${
              activeTab === 'profil' 
                ? '' 
                : isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
            }`}
            style={{ color: activeTab === 'profil' ? ACCENT_STYLES[accentColor].accent : '' }}
          >
            <User size={17} className={activeTab === 'profil' ? 'stroke-[2.5]' : ''} />
            <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">Profil</span>
          </button>

        </nav>

        {/* Right Scroll Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const dock = document.getElementById('app-bottom-dock');
            if (dock) {
              dock.scrollBy({ left: 100, behavior: 'smooth' });
            }
          }}
          className={`absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center z-50 backdrop-blur-sm transition-all active:scale-95 border-l ${
            isLightMode 
              ? 'bg-white/80 text-slate-700 border-purple-500/10' 
              : 'bg-[#090514]/85 text-slate-100 border-purple-500/10'
          }`}
          title="Faire défiler vers la droite"
        >
          <ChevronRight size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* ADMOB SIMULATED INTERSTITIAL AD OVERLAY */}
      {isAdVisible && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
          <div className="max-w-sm w-full bg-[#120a24]/95 border border-purple-500/20 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl">
            {/* Sponsor header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-black text-[#FBBF24] tracking-widest font-mono uppercase bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                SPONSORISÉ • ADMOB
              </span>
              <span className="text-[9px] font-mono text-white/40">STANDPOWER PREMIUM</span>
            </div>

            {/* Simulated Ad Visual Asset */}
            <div className="bg-gradient-to-br from-purple-900/60 to-black rounded-2xl p-5 border border-purple-500/10 relative overflow-hidden aspect-[4/3] flex flex-col justify-between text-left">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="space-y-1 relative">
                <span className="text-[9px] text-[#FBBF24] font-black uppercase tracking-wider block">PREMIUM SHAKER XP</span>
                <h5 className="text-sm font-black text-white uppercase italic tracking-wide">DÉBLOQUEZ VOTRE FORCE MAXIMUM</h5>
              </div>
              <div className="bg-black/60 border border-white/5 p-2 rounded-xl text-[9px] leading-snug text-slate-300 relative font-sans">
                "StandPower est propulsé par les shakers d'énergie brute. Sentez l'éveil musculaire à chaque répétition lourde."
              </div>
            </div>

            {/* Actions / Countdown close control */}
            <div className="space-y-2">
              <button
                disabled={adCountdown > 0}
                onClick={() => {
                  setIsAdVisible(false);
                  if (adCallback) {
                    adCallback();
                  }
                }}
                className={`w-full font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition ${
                  adCountdown > 0
                    ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                    : 'bg-[#FBBF24] hover:bg-[#F59E0B] text-black shadow-lg shadow-amber-500/15'
                }`}
              >
                {adCountdown > 0 ? `Fermeture dans ${adCountdown}s...` : 'Fermer la publicité ❯'}
              </button>
              <span className="text-[8.5px] text-white/30 block font-mono">
                Soutenez StandPower en regardant de courts sponsors.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM SPORT SWITCHER MODAL */}
      {isSportSwitcherOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-[#0d071d] border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
            
            {/* Visual background highlight */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#FBBF24]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-[#FBBF24] tracking-widest uppercase block font-mono">STANDPOWER ATHLÈTE</span>
                <h4 className="text-sm font-black text-white uppercase italic">CHANGER DE DISCIPLINE</h4>
              </div>
              <button 
                onClick={() => setIsSportSwitcherOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[10px] text-white/50 leading-relaxed font-sans">
              Cliquez sur un sport pour l'activer. <strong>Recliquez sur le sport actif</strong> pour le retirer de votre barre du bas (dock).
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'muscu', label: 'Musculation', desc: 'Fonte, Surcharge', icon: Dumbbell, color: 'text-[#FBBF24] bg-amber-500/10 border-amber-500/20' },
                { id: 'jjb', label: 'Jiu-Jitsu (JJB)', desc: 'Sol & Soumissions', icon: Award, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                { id: 'boxe', label: 'Boxe Anglaise', desc: 'Vitesse & Frappe', icon: Zap, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                { id: 'mma', label: 'MMA Cage', desc: 'Complet & Lutte', icon: Trophy, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
                { id: 'muay_thai', label: 'Muay-Thaï', desc: 'Art des 8 membres', icon: Flame, color: 'text-orange-400 bg-amber-500/10 border-amber-500/20' },
                { id: 'powerlifting', label: 'Powerlifting', desc: 'Force Absolue', icon: Medal, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }
              ].map((sport) => {
                const IconComp = sport.icon;
                const isCurrent = selectedSport === sport.id;
                const currentActiveList = onboardingSelectedSports.length > 0 
                  ? onboardingSelectedSports 
                  : ['muscu', 'jjb', 'boxe', 'mma', 'muay_thai', 'powerlifting'];
                const isInDock = currentActiveList.includes(sport.id);

                return (
                  <button
                    key={sport.id}
                    onClick={() => {
                      handleSwitchSport(sport.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition duration-200 flex flex-col justify-between min-h-[90px] active:scale-95 group relative overflow-hidden ${
                      isCurrent 
                        ? 'bg-[#FBBF24]/10 border-[#FBBF24] shadow-[0_0_12px_rgba(251,191,36,0.15)]' 
                        : isInDock
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-black/40 border-white/5 hover:border-purple-500/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                        isCurrent ? sport.color : isInDock ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-white/40 bg-white/5 border-white/10'
                      }`}>
                        <IconComp size={14} className="group-hover:scale-110 transition" />
                      </div>
                      {isCurrent ? (
                        <span className="text-[7.5px] font-black text-[#FBBF24] bg-amber-500/20 border border-[#FBBF24]/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono shrink-0">Actif</span>
                      ) : isInDock ? (
                        <span className="text-[7.5px] font-black text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono shrink-0">Docké</span>
                      ) : null}
                    </div>
                    <div className="mt-2.5">
                      <h5 className={`text-xs font-black uppercase tracking-wide transition leading-none ${
                        isCurrent ? 'text-[#FBBF24]' : isInDock ? 'text-emerald-400' : 'text-white/60 group-hover:text-purple-400'
                      }`}>
                        {sport.label}
                      </h5>
                      <span className="text-[8px] text-white/40 block mt-0.5 font-sans font-medium truncate">{sport.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsSportSwitcherOpen(false)}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition text-center block border border-white/10"
            >
              Retour à l'arène
            </button>

          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION OVERLAY */}
      {inAppToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-4 animate-fade-in pointer-events-none">
          <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
            inAppToast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
              : inAppToast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
              : 'bg-[#120a24]/95 border-purple-500/30 text-purple-200'
          }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              inAppToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
              inAppToast.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
              'bg-purple-500/10 text-purple-400'
            }`}>
              {inAppToast.type === 'success' ? <Check size={14} strokeWidth={3} /> :
               inAppToast.type === 'error' ? <ShieldAlert size={14} /> :
               <Info size={14} />}
            </div>
            <p className="text-xs font-bold leading-tight select-none">{inAppToast.message}</p>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {customConfirm && (
        <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0f111a] border border-purple-500/20 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Ambient Top Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-[#FBBF24] to-indigo-500" />
            
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-black tracking-widest text-[#FBBF24] uppercase block font-mono">CONFIRMATION REQUISE</span>
              <p className="text-xs font-bold text-white leading-relaxed mt-2">
                {customConfirm.message}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white border border-white/5 font-bold py-3 px-4 rounded-xl text-[10.5px] uppercase tracking-wider transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  try {
                    customConfirm.onConfirm();
                  } catch (e) {
                    console.error(e);
                  }
                  setCustomConfirm(null);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black py-3 px-4 rounded-xl text-[10.5px] uppercase tracking-wider shadow-lg transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
