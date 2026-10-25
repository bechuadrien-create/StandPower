import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Clock,
  Copy,
  Dumbbell,
  Edit3,
  Heart,
  History,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import {
  AlertBox,
  Badge,
  Button,
  Card,
  EmptyState,
} from '../../components/ui/Primitives';
import {
  calculateExerciseVolume,
  computeExerciseRecords,
  estimateBrzycki1RM,
} from '../../domain/calculations/strength';
import { evaluateDoubleProgression } from '../../domain/progression/doubleProgression';
import {
  convertWeightForInput,
  formatCivilDateFr,
  formatWeight,
  parseFrenchDecimal,
  parseWeightFromInput,
} from '../../domain/calculations/units';
import { triggerTimerCue } from '../../platform/lifecycle/audioFeedback';
import type {
  EquipmentItem,
  Exercise,
  ExerciseMeasurementType,
  MovementPattern,
  MuscleGroup,
  WorkoutSession,
} from '../../domain/types';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras / Grip',
  core: 'Abdominaux / Gainage',
  full_body: 'Corps complet',
};

const EQUIPMENT_LABELS: Record<EquipmentItem, string> = {
  none: 'Sans matériel',
  bands: 'Élastiques',
  dumbbells: 'Haltères',
  kettlebell: 'Kettlebell',
  bench: 'Banc',
  barbell_plates: 'Barre & disques',
  rack: 'Rack / Barre fixe',
  machines: 'Machines / Poulies',
  full_gym: 'Salle complète',
  heavy_bag: 'Sac de frappe',
  mat: 'Tapis / Tatami',
  drill_partner: 'Partenaire',
};

const PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Squat',
  hinge: 'Charnière (Hinge)',
  horizontal_push: 'Poussée horizontale',
  vertical_push: 'Poussée verticale',
  horizontal_pull: 'Tirage horizontal',
  vertical_pull: 'Tirage vertical',
  lunge_single_leg: 'Unilatéral jambes',
  carry_conditioning: 'Transport / Conditionnement',
  core_stability: 'Gainage / Stabilité',
  isolation: 'Isolation',
};

const MEASUREMENT_LABELS: Record<ExerciseMeasurementType, string> = {
  weight_reps: 'Charge + répétitions',
  bodyweight_reps: 'Poids du corps + répétitions',
  weighted_bodyweight: 'Poids du corps lesté',
  assisted_reps: 'Assistance + répétitions',
  duration: 'Temps (secondes)',
  distance: 'Distance (mètres)',
};

function ElapsedWorkoutTimer({
  startedAtIso,
  accumulatedPauseSeconds,
  isPaused,
  pausedAtIso,
}: {
  startedAtIso: string;
  accumulatedPauseSeconds: number;
  isPaused: boolean;
  pausedAtIso?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  const startMs = new Date(startedAtIso).getTime();
  const refMs = isPaused && pausedAtIso ? new Date(pausedAtIso).getTime() : nowMs;
  const elapsedSec = Math.max(
    0,
    Math.floor((refMs - startMs) / 1000) - accumulatedPauseSeconds
  );

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;

  return (
    <span className="tabular-nums font-mono font-semibold text-sm">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

function ActiveRestBanner({
  startedAtMs,
  durationSeconds,
  onClear,
  onAdjustDuration,
  soundEnabled,
  vibrationEnabled,
}: {
  startedAtMs: number;
  durationSeconds: number;
  onClear: () => void;
  onAdjustDuration: (newDuration: number) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      const elapsedSec = Math.floor((current - startedAtMs) / 1000);
      if (elapsedSec >= durationSeconds) {
        triggerTimerCue({
          cueType: 'rest_done',
          soundEnabled,
          vibrationEnabled,
        });
        onClear();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAtMs, durationSeconds, onClear, soundEnabled, vibrationEnabled]);

  const elapsedSec = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const remainingSec = Math.max(0, durationSeconds - elapsedSec);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  return (
    <div className="bg-sp-elevated border border-sp-accent/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-sp-accent" />
        <div>
          <p className="text-xs text-sp-muted">Repos en cours</p>
          <p className="text-xl font-bold tabular-nums font-mono text-sp-text">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAdjustDuration(Math.max(15, durationSeconds - 15))}
        >
          -15s
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAdjustDuration(durationSeconds + 15)}
        >
          +15s
        </Button>
        <Button size="sm" variant="primary" onClick={onClear}>
          Passer
        </Button>
      </div>
    </div>
  );
}

export function StrengthPage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const getAllExercises = useAppStore((s) => s.getAllExercises);
  const undoWorkoutSnapshot = useAppStore((s) => s.undoWorkoutSnapshot);
  const undoLabel = useAppStore((s) => s.undoLabel);

  const startFreeWorkout = useAppStore((s) => s.startFreeWorkout);
  const startWorkoutFromProgramSession = useAppStore(
    (s) => s.startWorkoutFromProgramSession
  );
  const addExerciseToActiveWorkout = useAppStore((s) => s.addExerciseToActiveWorkout);
  const removeExerciseFromActiveWorkout = useAppStore(
    (s) => s.removeExerciseFromActiveWorkout
  );
  const moveExerciseInActiveWorkout = useAppStore(
    (s) => s.moveExerciseInActiveWorkout
  );
  const addSetToWorkoutExercise = useAppStore((s) => s.addSetToWorkoutExercise);
  const duplicateSetInWorkoutExercise = useAppStore(
    (s) => s.duplicateSetInWorkoutExercise
  );
  const updateWorkoutSet = useAppStore((s) => s.updateWorkoutSet);
  const toggleCompleteWorkoutSet = useAppStore((s) => s.toggleCompleteWorkoutSet);
  const deleteSetFromWorkoutExercise = useAppStore(
    (s) => s.deleteSetFromWorkoutExercise
  );
  const undoLastWorkoutChange = useAppStore((s) => s.undoLastWorkoutChange);
  const startWorkoutRestTimer = useAppStore((s) => s.startWorkoutRestTimer);
  const clearWorkoutRestTimer = useAppStore((s) => s.clearWorkoutRestTimer);
  const pauseActiveWorkout = useAppStore((s) => s.pauseActiveWorkout);
  const resumeActiveWorkout = useAppStore((s) => s.resumeActiveWorkout);
  const updateActiveWorkoutNotes = useAppStore((s) => s.updateActiveWorkoutNotes);
  const finishActiveWorkout = useAppStore((s) => s.finishActiveWorkout);
  const abandonActiveWorkout = useAppStore((s) => s.abandonActiveWorkout);
  const updateHistoricalWorkoutSession = useAppStore(
    (s) => s.updateHistoricalWorkoutSession
  );
  const toggleFavoriteExercise = useAppStore((s) => s.toggleFavoriteExercise);
  const saveCustomExercise = useAppStore((s) => s.saveCustomExercise);

  const [activeTab, setActiveTab] = useState<'session' | 'library' | 'history'>(
    'session'
  );
  const [freeSessionTitle, setFreeSessionTitle] = useState('');
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Fin de séance & Résumé
  const [showFinishPanel, setShowFinishPanel] = useState(false);
  const [finishFeeling, setFinishFeeling] =
    useState<WorkoutSession['perceivedFeeling']>('good');
  const [completedSummarySession, setCompletedSummarySession] =
    useState<WorkoutSession | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  // Filtres Bibliothèque
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentItem | 'all'>('all');
  const [patternFilter, setPatternFilter] = useState<MovementPattern | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] =
    useState<Exercise | null>(null);

  // Création d'exercice personnalisé
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<EquipmentItem>('dumbbells');
  const [customPattern, setCustomPattern] =
    useState<MovementPattern>('horizontal_push');
  const [customMeasurement, setCustomMeasurement] =
    useState<ExerciseMeasurementType>('weight_reps');
  const [customError, setCustomError] = useState<string | null>(null);

  // Édition d'une ancienne séance
  const [editingHistoricalSession, setEditingHistoricalSession] =
    useState<WorkoutSession | null>(null);

  const weightUnit = snapshot.userPreferences.weightUnit;
  const allExercises = getAllExercises();
  const activeWorkout = snapshot.workoutSessions.find(
    (s) => s.status === 'in_progress' || s.status === 'paused'
  );
  const completedWorkouts = useMemo(
    () => snapshot.workoutSessions.filter((s) => s.status === 'completed'),
    [snapshot.workoutSessions]
  );

  const activeProgramInstance = snapshot.programInstances.find(
    (inst) => inst.status === 'active'
  );

  // Recherche et filtrage bibliothèque
  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allExercises.filter((ex) => {
      if (onlyFavorites && !ex.isFavorite) return false;
      if (muscleFilter !== 'all' && !ex.primaryMuscles.includes(muscleFilter)) {
        return false;
      }
      if (equipmentFilter !== 'all' && !ex.equipment.includes(equipmentFilter)) {
        return false;
      }
      if (patternFilter !== 'all' && ex.movementPattern !== patternFilter) {
        return false;
      }
      if (!q) return true;
      const inName = ex.nameFr.toLowerCase().includes(q);
      const inAliases = ex.aliases.some((a) => a.toLowerCase().includes(q));
      return inName || inAliases;
    });
  }, [
    allExercises,
    searchQuery,
    onlyFavorites,
    muscleFilter,
    equipmentFilter,
    patternFilter,
  ]);

  // Calcul de progression de la séance active
  const workoutProgressStats = useMemo(() => {
    if (!activeWorkout) {
      return {
        totalWorkingSets: 0,
        completedWorkingSets: 0,
        currentExerciseName: null as string | null,
        currentSetLabel: null as string | null,
        totalVolumeKgReps: 0,
      };
    }

    let totalWorkingSets = 0;
    let completedWorkingSets = 0;
    let totalVolumeKgReps = 0;
    let currentExerciseName: string | null = null;
    let currentSetLabel: string | null = null;

    for (const ex of activeWorkout.exercises) {
      const vol = calculateExerciseVolume(ex.sets, ex.measurementTypeSnapshot);
      if (vol.comparable) {
        totalVolumeKgReps += vol.volumeKgReps;
      }

      for (const s of ex.sets) {
        if (s.setType === 'working') {
          totalWorkingSets += 1;
          if (s.isCompleted) {
            completedWorkingSets += 1;
          } else if (!currentExerciseName) {
            currentExerciseName = ex.exerciseNameSnapshot;
            currentSetLabel = `Série ${s.setOrder}`;
          }
        }
      }
    }

    return {
      totalWorkingSets,
      completedWorkingSets,
      currentExerciseName,
      currentSetLabel,
      totalVolumeKgReps: Number(totalVolumeKgReps.toFixed(1)),
    };
  }, [activeWorkout]);

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setCustomError('Veuillez saisir un nom pour l’exercice.');
      return;
    }
    setCustomError(null);
    await saveCustomExercise({
      nameFr: customName.trim(),
      aliases: customAlias
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      primaryMuscles: [customMuscle],
      secondaryMuscles: [],
      equipment: [customEquipment],
      movementPattern: customPattern,
      measurementType: customMeasurement,
      isUnilateral: false,
      avoidTags: [],
      setupInstructions: ['Placement personnalisé défini par l’utilisateur.'],
      executionSteps: ['Exécuter sur une amplitude maîtrisée sans élan excessif.'],
      commonMistakes: ['Perte du gainage ou charge excessive.'],
      breathingCues: 'Inspirer à la phase excentrique, expirer à l’effort.',
      generalPrecautions: 'Respecter son confort articulaire.',
      alternativeIds: [],
    });
    setCustomName('');
    setCustomAlias('');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-5">
      {/* En-tête et accès rapide aux Programmes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Musculation</h1>
          <p className="text-xs text-sp-muted">
            Carnet de séance hors-ligne, bibliothèque ({allExercises.length} exercices) et records
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/programmes')}
        >
          <BookOpen className="w-4 h-4" />
          Programmes ({snapshot.programTemplates.filter((p) => !p.isArchived).length})
        </Button>
      </div>

      {/* Onglets internes Musculation */}
      <div
        role="tablist"
        aria-label="Sections Musculation"
        className="grid grid-cols-3 gap-1.5 bg-sp-surface p-1.5 rounded-2xl border border-sp-border"
      >
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'session'}
          onClick={() => setActiveTab('session')}
          className={`touch-target rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'session'
              ? 'bg-sp-accent text-sp-accent-fg font-semibold'
              : 'text-sp-muted hover:text-sp-text'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Séance</span>
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'library'}
          onClick={() => setActiveTab('library')}
          className={`touch-target rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'library'
              ? 'bg-sp-accent text-sp-accent-fg font-semibold'
              : 'text-sp-muted hover:text-sp-text'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Exercices</span>
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          className={`touch-target rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-sp-accent text-sp-accent-fg font-semibold'
              : 'text-sp-muted hover:text-sp-text'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique</span>
        </button>
      </div>

      {/* Résumé après fin de séance */}
      {completedSummarySession && (
        <Card className="border-sp-accent space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone="sage">Séance enregistrée</Badge>
              <h2 className="text-lg font-bold mt-1">
                {completedSummarySession.title}
              </h2>
              <p className="text-xs text-sp-muted">
                {formatCivilDateFr(completedSummarySession.civilDate)} • Durée :{' '}
                {Math.round(completedSummarySession.durationSeconds / 60)} min
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCompletedSummarySession(null)}
            >
              Fermer
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">Exercices</p>
              <p className="text-lg font-bold tabular-nums">
                {completedSummarySession.exercises.length}
              </p>
            </div>
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">Séries travail</p>
              <p className="text-lg font-bold tabular-nums">
                {completedSummarySession.exercises.reduce(
                  (acc, ex) =>
                    acc +
                    ex.sets.filter((s) => s.isCompleted && s.setType === 'working')
                      .length,
                  0
                )}
              </p>
            </div>
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">Volume travail</p>
              <p className="text-lg font-bold tabular-nums">
                {completedSummarySession.exercises.reduce((acc, ex) => {
                  const v = calculateExerciseVolume(
                    ex.sets,
                    ex.measurementTypeSnapshot
                  );
                  return acc + (v.comparable ? v.volumeKgReps : 0);
                }, 0)}{' '}
                <span className="text-xs font-normal">kg·rép</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ==================== VUE 1 : SÉANCE ==================== */}
      {activeTab === 'session' && (
        <div className="space-y-4">
          {!activeWorkout ? (
            <div className="space-y-4">
              {/* Démarrage depuis le programme actif */}
              {activeProgramInstance && (
                <Card className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Badge tone="sage">Programme actif</Badge>
                      <h2 className="text-base font-bold mt-1">
                        {activeProgramInstance.customName}
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/programmes')}
                    >
                      Gérer
                    </Button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {activeProgramInstance.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="bg-sp-elevated rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-sm">{sess.title}</p>
                          <p className="text-xs text-sp-muted">
                            {sess.exercises.length} exercices • ~
                            {sess.estimatedDurationMinutes} min
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            void startWorkoutFromProgramSession(
                              sess,
                              activeProgramInstance
                            )
                          }
                        >
                          <Play className="w-4 h-4" />
                          Lancer cette séance
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Démarrage séance libre */}
              <Card className="space-y-3">
                <h2 className="text-base font-bold">Démarrer une séance libre</h2>
                <p className="text-xs text-sp-muted leading-relaxed">
                  Compose ta séance au fil de l’entraînement. Toutes les séries sont sauvegardées localement à chaque action.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={freeSessionTitle}
                    onChange={(e) => setFreeSessionTitle(e.target.value)}
                    placeholder="Titre facultatif (ex: Haut du corps & Grip)"
                    aria-label="Titre de la séance libre"
                    className="flex-1 min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3.5 text-sm text-sp-text placeholder:text-sp-muted"
                  />
                  <Button
                    variant="primary"
                    onClick={() =>
                      void startFreeWorkout(
                        freeSessionTitle.trim() || 'Séance libre de musculation',
                        ['ex_goblet_squat', 'ex_dumbbell_bench_press', 'ex_one_arm_db_row']
                      )
                    }
                  >
                    <Play className="w-4 h-4" />
                    Démarrer séance libre
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* SÉANCE EN COURS */
            <div className="space-y-4">
              {/* Bandeau d'état de la séance en cours */}
              <Card className="space-y-3 border-sp-accent/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          activeWorkout.status === 'paused' ? 'warning' : 'sage'
                        }
                      >
                        {activeWorkout.status === 'paused'
                          ? 'En pause'
                          : 'Séance en cours'}
                      </Badge>
                      <ElapsedWorkoutTimer
                        startedAtIso={activeWorkout.startedAt}
                        accumulatedPauseSeconds={
                          activeWorkout.accumulatedPauseSeconds
                        }
                        isPaused={activeWorkout.status === 'paused'}
                        pausedAtIso={activeWorkout.pausedAt}
                      />
                    </div>
                    <h2 className="text-lg font-bold mt-1">
                      {activeWorkout.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeWorkout.status === 'in_progress' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void pauseActiveWorkout()}
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => void resumeActiveWorkout()}
                      >
                        <Play className="w-4 h-4" />
                        Reprendre
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="terracotta"
                      onClick={() => setShowFinishPanel(true)}
                    >
                      <Check className="w-4 h-4" />
                      Terminer
                    </Button>
                  </div>
                </div>

                {/* Indicateurs : Exercice en cours, Série en cours, Progression, Volume */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="bg-sp-elevated rounded-xl p-2.5">
                    <span className="text-sp-muted block">En cours</span>
                    <span className="font-semibold text-sp-text truncate block">
                      {workoutProgressStats.currentExerciseName
                        ? `${workoutProgressStats.currentExerciseName} (${workoutProgressStats.currentSetLabel})`
                        : 'Toutes les séries validées'}
                    </span>
                  </div>
                  <div className="bg-sp-elevated rounded-xl p-2.5">
                    <span className="text-sp-muted block">Progression</span>
                    <span className="font-semibold tabular-nums text-sp-text">
                      {workoutProgressStats.completedWorkingSets} /{' '}
                      {workoutProgressStats.totalWorkingSets} séries travail
                    </span>
                  </div>
                  <div className="bg-sp-elevated rounded-xl p-2.5 col-span-2 sm:col-span-1">
                    <span className="text-sp-muted block">Volume cumulé</span>
                    <span className="font-semibold tabular-nums text-sp-text">
                      {workoutProgressStats.totalVolumeKgReps
                        .toString()
                        .replace('.', ',')}{' '}
                      kg·rép
                    </span>
                  </div>
                </div>
              </Card>

              {/* Minuteur de repos actif */}
              {activeWorkout.activeRestTimer && (
                <ActiveRestBanner
                  startedAtMs={activeWorkout.activeRestTimer.startedAtMs}
                  durationSeconds={
                    activeWorkout.activeRestTimer.durationSeconds
                  }
                  onClear={() => void clearWorkoutRestTimer()}
                  onAdjustDuration={(newSec) =>
                    void startWorkoutRestTimer(
                      newSec,
                      activeWorkout.activeRestTimer!.exerciseId
                    )
                  }
                  soundEnabled={snapshot.userPreferences.soundEnabled}
                  vibrationEnabled={snapshot.userPreferences.vibrationEnabled}
                />
              )}

              {/* Bouton d'annulation (Undo) en cas de suppression accidentelle */}
              {undoWorkoutSnapshot && (
                <div className="bg-sp-elevated border border-sp-border rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                  <span>{undoLabel ?? 'Modification effectuée'}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void undoLastWorkoutChange()}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Annuler la suppression
                  </Button>
                </div>
              )}

              {/* Liste des exercices de la séance */}
              {activeWorkout.exercises.map((we, exIdx) => {
                const catalogEx = allExercises.find(
                  (e) => e.id === we.exerciseId
                );
                const prevSessionsForEx = completedWorkouts
                  .flatMap((ws) =>
                    ws.exercises
                      .filter((e) => e.exerciseId === we.exerciseId)
                      .map((e) => ({ date: ws.civilDate, ex: e }))
                  );
                const lastPerf = prevSessionsForEx[0];
                const lastWorkingSets =
                  lastPerf?.ex.sets.filter(
                    (s) => s.isCompleted && s.setType === 'working'
                  ) ?? [];

                const progressionAdvice = evaluateDoubleProgression({
                  lastWorkingSets,
                  targetRepMin: we.targetRepMin ?? 8,
                  targetRepMax: we.targetRepMax ?? 12,
                  measurementType: we.measurementTypeSnapshot,
                  equipment: catalogEx?.equipment ?? ['dumbbells'],
                });

                const exVolume = calculateExerciseVolume(
                  we.sets,
                  we.measurementTypeSnapshot
                );

                return (
                  <Card key={we.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-sp-accent">
                            #{exIdx + 1}
                          </span>
                          <h3 className="text-base font-bold">
                            {we.exerciseNameSnapshot}
                          </h3>
                          <Badge tone="neutral">
                            {MEASUREMENT_LABELS[we.measurementTypeSnapshot]}
                          </Badge>
                        </div>

                        {we.isUnilateralSnapshot &&
                          we.unilateralConventionSnapshot && (
                            <p className="text-xs text-sp-muted mt-1">
                              Unilatéral : {we.unilateralConventionSnapshot}
                            </p>
                          )}

                        {/* Dernière performance et conseil de progression */}
                        <div className="mt-1.5 text-xs text-sp-muted space-y-0.5">
                          {lastPerf && lastWorkingSets.length > 0 ? (
                            <p>
                              Dernière perf ({formatCivilDateFr(lastPerf.date)}) :{' '}
                              <span className="text-sp-text font-medium tabular-nums">
                                {lastWorkingSets
                                  .map((s) =>
                                    s.weightKg !== undefined
                                      ? `${formatWeight(s.weightKg, weightUnit)} × ${s.reps ?? 0}`
                                      : `${s.reps ?? s.durationSeconds ?? 0} rép/s`
                                  )
                                  .join(' | ')}
                              </span>
                            </p>
                          ) : (
                            <p>
                              Aucune séance précédente : commence léger (2–3 RIR) et monte progressivement.
                            </p>
                          )}
                          <p className="text-sp-accent">
                            Repère : {progressionAdvice.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Réorganisation et suppression */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            void moveExerciseInActiveWorkout(we.id, 'up')
                          }
                          disabled={exIdx === 0}
                          aria-label="Monter l'exercice"
                          className="touch-target p-2 rounded-lg text-sp-muted hover:text-sp-text disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void moveExerciseInActiveWorkout(we.id, 'down')
                          }
                          disabled={exIdx === activeWorkout.exercises.length - 1}
                          aria-label="Descendre l'exercice"
                          className="touch-target p-2 rounded-lg text-sp-muted hover:text-sp-text disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void removeExerciseFromActiveWorkout(we.id)
                          }
                          aria-label={`Supprimer ${we.exerciseNameSnapshot}`}
                          className="touch-target p-2 rounded-lg text-sp-danger hover:bg-sp-danger/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tableau des séries */}
                    <div className="space-y-2">
                      {we.sets.map((s) => {
                        const needsWeight =
                          we.measurementTypeSnapshot === 'weight_reps' ||
                          we.measurementTypeSnapshot === 'weighted_bodyweight' ||
                          we.measurementTypeSnapshot === 'assisted_reps';
                        const needsReps =
                          we.measurementTypeSnapshot !== 'duration' &&
                          we.measurementTypeSnapshot !== 'distance';
                        const needsDuration =
                          we.measurementTypeSnapshot === 'duration';
                        const needsDistance =
                          we.measurementTypeSnapshot === 'distance';

                        const brzycki =
                          we.measurementTypeSnapshot === 'weight_reps' &&
                          typeof s.weightKg === 'number' &&
                          typeof s.reps === 'number'
                            ? estimateBrzycki1RM(
                                s.weightKg,
                                s.reps,
                                'weight_reps'
                              )
                            : null;

                        return (
                          <div
                            key={s.id}
                            className={`rounded-xl p-2.5 border transition-colors ${
                              s.isCompleted
                                ? 'bg-sp-accent/10 border-sp-accent/50'
                                : 'bg-sp-elevated border-sp-border'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Type de série : Échauffement / Travail */}
                              <button
                                type="button"
                                onClick={() =>
                                  void updateWorkoutSet(we.id, s.id, {
                                    setType:
                                      s.setType === 'working'
                                        ? 'warmup'
                                        : 'working',
                                  })
                                }
                                className={`min-h-[48px] px-2.5 rounded-lg text-xs font-semibold tabular-nums border ${
                                  s.setType === 'warmup'
                                    ? 'bg-sp-warning/20 border-sp-warning/50 text-sp-text'
                                    : 'bg-sp-surface border-sp-border text-sp-text'
                                }`}
                                title="Basculer entre série d'échauffement et série de travail"
                              >
                                {s.setType === 'warmup'
                                  ? `Éch. ${s.setOrder}`
                                  : `Série ${s.setOrder}`}
                              </button>

                              {/* Champ Poids / Lest / Assistance */}
                              {needsWeight && (
                                <div className="flex-1 min-w-[92px]">
                                  <label className="block text-[11px] text-sp-muted mb-0.5">
                                    {we.measurementTypeSnapshot ===
                                    'assisted_reps'
                                      ? `Aide (${weightUnit})`
                                      : we.measurementTypeSnapshot ===
                                        'weighted_bodyweight'
                                      ? `Lest (${weightUnit})`
                                      : `Charge (${weightUnit})`}
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    defaultValue={convertWeightForInput(
                                      s.weightKg,
                                      weightUnit
                                    )}
                                    placeholder="0"
                                    aria-label={`Charge série ${s.setOrder} pour ${we.exerciseNameSnapshot}`}
                                    onBlur={(e) => {
                                      const parsedKg = parseWeightFromInput(
                                        e.target.value,
                                        weightUnit
                                      );
                                      void updateWorkoutSet(we.id, s.id, {
                                        weightKg:
                                          parsedKg !== null && parsedKg >= 0
                                            ? parsedKg
                                            : undefined,
                                      });
                                    }}
                                    className="w-full min-h-[48px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm font-semibold tabular-nums text-sp-text"
                                  />
                                </div>
                              )}

                              {/* Champ Répétitions */}
                              {needsReps && (
                                <div className="flex-1 min-w-[82px]">
                                  <label className="block text-[11px] text-sp-muted mb-0.5">
                                    Répétitions
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    defaultValue={
                                      s.reps !== undefined ? String(s.reps) : ''
                                    }
                                    placeholder="8"
                                    aria-label={`Répétitions série ${s.setOrder} pour ${we.exerciseNameSnapshot}`}
                                    onBlur={(e) => {
                                      const parsed = parseFrenchDecimal(
                                        e.target.value
                                      );
                                      void updateWorkoutSet(we.id, s.id, {
                                        reps:
                                          parsed !== null &&
                                          parsed >= 0 &&
                                          Number.isInteger(parsed)
                                            ? parsed
                                            : undefined,
                                      });
                                    }}
                                    className="w-full min-h-[48px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm font-semibold tabular-nums text-sp-text"
                                  />
                                </div>
                              )}

                              {/* Champ Durée (secondes) */}
                              {needsDuration && (
                                <div className="flex-1 min-w-[90px]">
                                  <label className="block text-[11px] text-sp-muted mb-0.5">
                                    Durée (sec)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    defaultValue={
                                      s.durationSeconds !== undefined
                                        ? String(s.durationSeconds)
                                        : ''
                                    }
                                    placeholder="45"
                                    aria-label={`Durée série ${s.setOrder}`}
                                    onBlur={(e) => {
                                      const parsed = parseFrenchDecimal(
                                        e.target.value
                                      );
                                      void updateWorkoutSet(we.id, s.id, {
                                        durationSeconds:
                                          parsed !== null && parsed > 0
                                            ? Math.round(parsed)
                                            : undefined,
                                      });
                                    }}
                                    className="w-full min-h-[48px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm font-semibold tabular-nums text-sp-text"
                                  />
                                </div>
                              )}

                              {/* Champ Distance (mètres) */}
                              {needsDistance && (
                                <div className="flex-1 min-w-[90px]">
                                  <label className="block text-[11px] text-sp-muted mb-0.5">
                                    Distance (m)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    defaultValue={
                                      s.distanceMeters !== undefined
                                        ? String(s.distanceMeters)
                                        : ''
                                    }
                                    placeholder="500"
                                    aria-label={`Distance série ${s.setOrder}`}
                                    onBlur={(e) => {
                                      const parsed = parseFrenchDecimal(
                                        e.target.value
                                      );
                                      void updateWorkoutSet(we.id, s.id, {
                                        distanceMeters:
                                          parsed !== null && parsed > 0
                                            ? Math.round(parsed)
                                            : undefined,
                                      });
                                    }}
                                    className="w-full min-h-[48px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm font-semibold tabular-nums text-sp-text"
                                  />
                                </div>
                              )}

                              {/* Champ RIR facultatif */}
                              <div className="w-16">
                                <label className="block text-[11px] text-sp-muted mb-0.5">
                                  RIR
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  defaultValue={
                                    s.rir !== undefined ? String(s.rir) : ''
                                  }
                                  placeholder="2"
                                  aria-label={`RIR série ${s.setOrder}`}
                                  onBlur={(e) => {
                                    const parsed = parseFrenchDecimal(
                                      e.target.value
                                    );
                                    void updateWorkoutSet(we.id, s.id, {
                                      rir:
                                        parsed !== null &&
                                        parsed >= 0 &&
                                        parsed <= 10
                                          ? parsed
                                          : undefined,
                                    });
                                  }}
                                  className="w-full min-h-[48px] rounded-lg bg-sp-surface border border-sp-border px-2 text-sm tabular-nums text-sp-text"
                                />
                              </div>

                              {/* Actions de la série : Valider, Dupliquer, Supprimer */}
                              <div className="flex items-center gap-1 pt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void toggleCompleteWorkoutSet(we.id, s.id)
                                  }
                                  aria-label={
                                    s.isCompleted
                                      ? `Annuler validation série ${s.setOrder}`
                                      : `Valider série ${s.setOrder}`
                                  }
                                  className={`touch-target px-3 rounded-xl font-semibold text-xs inline-flex items-center gap-1 ${
                                    s.isCompleted
                                      ? 'bg-sp-accent text-sp-accent-fg'
                                      : 'bg-sp-surface border border-sp-border text-sp-text hover:border-sp-accent'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                  {s.isCompleted ? 'Validée' : 'Valider'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void duplicateSetInWorkoutExercise(
                                      we.id,
                                      s.id
                                    )
                                  }
                                  aria-label={`Dupliquer série ${s.setOrder}`}
                                  title="Dupliquer cette série"
                                  className="touch-target p-2 rounded-lg text-sp-muted hover:text-sp-text"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteSetFromWorkoutExercise(
                                      we.id,
                                      s.id
                                    )
                                  }
                                  aria-label={`Supprimer série ${s.setOrder}`}
                                  className="touch-target p-2 rounded-lg text-sp-muted hover:text-sp-danger"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Affichage du 1RM estimé Brzycki avec mention explicite « estimation » */}
                            {brzycki && brzycki.valid && brzycki.estimated1RMKg && (
                              <p className="text-[11px] text-sp-muted mt-1.5 tabular-nums">
                                {brzycki.label} :{' '}
                                <span className="font-semibold text-sp-text">
                                  {formatWeight(brzycki.estimated1RMKg, weightUnit)}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pied de carte exercice : Ajouter série + Volume de l'exercice */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void addSetToWorkoutExercise(we.id, 'working')
                          }
                        >
                          <Plus className="w-4 h-4" />
                          Série de travail
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void addSetToWorkoutExercise(we.id, 'warmup')
                          }
                        >
                          + Échauffement
                        </Button>
                      </div>

                      {exVolume.comparable && (
                        <span className="text-xs text-sp-muted tabular-nums">
                          Volume travail :{' '}
                          <strong className="text-sp-text">
                            {exVolume.volumeKgReps.toString().replace('.', ',')}{' '}
                            {exVolume.unit}
                          </strong>
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Ajouter un exercice à la séance active */}
              {!showAddExercisePicker ? (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowAddExercisePicker(true)}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un exercice à la séance
                </Button>
              ) : (
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">
                      Choisir un exercice à ajouter
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddExercisePicker(false)}
                    >
                      Fermer
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Rechercher par nom ou alias (ex: Squat, Bench, RDL)..."
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3.5 text-sm"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {allExercises
                      .filter((ex) => {
                        const q = pickerSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          ex.nameFr.toLowerCase().includes(q) ||
                          ex.aliases.some((a) => a.toLowerCase().includes(q))
                        );
                      })
                      .slice(0, 20)
                      .map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            void addExerciseToActiveWorkout(ex.id);
                            setShowAddExercisePicker(false);
                            setPickerSearch('');
                          }}
                          className="w-full touch-target text-left px-3 py-2.5 rounded-xl bg-sp-elevated hover:bg-sp-border/60 flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="font-medium">{ex.nameFr}</span>
                          <span className="text-xs text-sp-muted">
                            {MUSCLE_LABELS[ex.primaryMuscles[0]]}
                          </span>
                        </button>
                      ))}
                  </div>
                </Card>
              )}

              {/* Notes de séance */}
              <Card className="space-y-2">
                <label
                  htmlFor="active-workout-notes"
                  className="text-sm font-semibold block"
                >
                  Notes de la séance
                </label>
                <textarea
                  id="active-workout-notes"
                  rows={2}
                  value={activeWorkout.notes}
                  onChange={(e) => void updateActiveWorkoutNotes(e.target.value)}
                  placeholder="Sensations techniques, réglages de banc, points à retenir..."
                  className="w-full rounded-xl bg-sp-elevated border border-sp-border p-3 text-sm text-sp-text"
                />
              </Card>

              {/* Panneau de confirmation de fin de séance */}
              {showFinishPanel && (
                <Card className="border-sp-accent space-y-3">
                  <h3 className="text-base font-bold">
                    Terminer et enregistrer la séance
                  </h3>
                  <div>
                    <label className="text-xs text-sp-muted block mb-1.5">
                      Ressenti global de la séance
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {(
                        [
                          ['great', 'Très bien'],
                          ['good', 'Bien'],
                          ['normal', 'Normal'],
                          ['tough', 'Exigeant'],
                          ['exhausted', 'Éprouvant'],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFinishFeeling(val)}
                          className={`touch-target rounded-xl text-xs font-medium border px-2 ${
                            finishFeeling === val
                              ? 'bg-sp-accent text-sp-accent-fg border-sp-accent font-semibold'
                              : 'bg-sp-elevated border-sp-border text-sp-text'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowFinishPanel(false)}
                    >
                      Continuer la séance
                    </Button>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        const done = await finishActiveWorkout({
                          perceivedFeeling: finishFeeling,
                        });
                        setShowFinishPanel(false);
                        if (done) setCompletedSummarySession(done);
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Valider et clôturer la séance
                    </Button>
                  </div>
                </Card>
              )}

              {/* Abandon définitif avec confirmation explicite */}
              <div className="pt-2">
                {!confirmAbandon ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmAbandon(true)}
                  >
                    Abandonner la séance en cours
                  </Button>
                ) : (
                  <Card className="border-sp-danger space-y-3">
                    <p className="text-sm font-semibold text-sp-danger">
                      Confirmer l’abandon définitif de cette séance ?
                    </p>
                    <p className="text-xs text-sp-muted">
                      Les séries saisies dans cette séance en cours seront supprimées sans être ajoutées à l’historique.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmAbandon(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          await abandonActiveWorkout();
                          setConfirmAbandon(false);
                        }}
                      >
                        Oui, abandonner définitivement
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== VUE 2 : BIBLIOTHÈQUE D'EXERCICES ==================== */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-sp-muted absolute left-3.5 top-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou alias (ex: Squat, RDL, Bench)..."
                  aria-label="Rechercher un exercice"
                  className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl bg-sp-elevated border border-sp-border text-sm"
                />
              </div>
              <Button
                variant={onlyFavorites ? 'primary' : 'secondary'}
                onClick={() => setOnlyFavorites((v) => !v)}
              >
                <Heart className="w-4 h-4" />
                Favoris
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCustomForm((v) => !v)}
              >
                <Plus className="w-4 h-4" />
                Créer
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={muscleFilter}
                onChange={(e) =>
                  setMuscleFilter(e.target.value as MuscleGroup | 'all')
                }
                aria-label="Filtrer par muscle"
                className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs text-sp-text"
              >
                <option value="all">Tous les muscles</option>
                {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={equipmentFilter}
                onChange={(e) =>
                  setEquipmentFilter(e.target.value as EquipmentItem | 'all')
                }
                aria-label="Filtrer par matériel"
                className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs text-sp-text"
              >
                <option value="all">Tout le matériel</option>
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={patternFilter}
                onChange={(e) =>
                  setPatternFilter(e.target.value as MovementPattern | 'all')
                }
                aria-label="Filtrer par patron de mouvement"
                className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs text-sp-text"
              >
                <option value="all">Tous les mouvements</option>
                {Object.entries(PATTERN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Formulaire de création d'exercice personnalisé */}
          {showCustomForm && (
            <Card className="space-y-3 border-sp-accent">
              <h2 className="text-base font-bold">
                Nouvel exercice personnalisé
              </h2>
              {customError && <AlertBox tone="error">{customError}</AlertBox>}
              <form onSubmit={handleCreateCustomExercise} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Nom français *
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ex: Tirage serviette Gi"
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Alias éventuels (séparés par virgule)
                    </label>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      placeholder="Ex: Gi pull-ups, Traction kimono"
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Muscle principal
                    </label>
                    <select
                      value={customMuscle}
                      onChange={(e) =>
                        setCustomMuscle(e.target.value as MuscleGroup)
                      }
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-2.5 text-xs"
                    >
                      {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Matériel
                    </label>
                    <select
                      value={customEquipment}
                      onChange={(e) =>
                        setCustomEquipment(e.target.value as EquipmentItem)
                      }
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-2.5 text-xs"
                    >
                      {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Mouvement
                    </label>
                    <select
                      value={customPattern}
                      onChange={(e) =>
                        setCustomPattern(e.target.value as MovementPattern)
                      }
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-2.5 text-xs"
                    >
                      {Object.entries(PATTERN_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Mesure
                    </label>
                    <select
                      value={customMeasurement}
                      onChange={(e) =>
                        setCustomMeasurement(
                          e.target.value as ExerciseMeasurementType
                        )
                      }
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-2.5 text-xs"
                    >
                      {Object.entries(MEASUREMENT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCustomForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary">
                    Enregistrer l’exercice
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Fiche détaillée de l'exercice sélectionné */}
          {selectedExerciseDetail && (
            <Card className="border-sp-accent space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="sage">
                      {PATTERN_LABELS[selectedExerciseDetail.movementPattern]}
                    </Badge>
                    <Badge tone="neutral">
                      {
                        MEASUREMENT_LABELS[
                          selectedExerciseDetail.measurementType
                        ]
                      }
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold mt-1">
                    {selectedExerciseDetail.nameFr}
                  </h2>
                  {selectedExerciseDetail.aliases.length > 0 && (
                    <p className="text-xs text-sp-muted">
                      Alias : {selectedExerciseDetail.aliases.join(', ')}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedExerciseDetail(null)}
                >
                  Fermer
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-sp-text">Placement</p>
                  <ul className="list-disc list-inside text-sp-muted space-y-1">
                    {selectedExerciseDetail.setupInstructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-sp-text">Exécution</p>
                  <ul className="list-disc list-inside text-sp-muted space-y-1">
                    {selectedExerciseDetail.executionSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-sp-text">
                    Erreurs fréquentes
                  </p>
                  <ul className="list-disc list-inside text-sp-muted space-y-1">
                    {selectedExerciseDetail.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-sp-text">
                    Respiration & Précautions
                  </p>
                  <p className="text-sp-muted">
                    <strong>Respiration :</strong>{' '}
                    {selectedExerciseDetail.breathingCues}
                  </p>
                  <p className="text-sp-muted">
                    <strong>Précautions :</strong>{' '}
                    {selectedExerciseDetail.generalPrecautions}
                  </p>
                </div>
              </div>

              {/* Alternatives adaptées au matériel */}
              {selectedExerciseDetail.alternativeIds.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold">Alternatives : </span>
                  <span className="text-sp-muted">
                    {selectedExerciseDetail.alternativeIds
                      .map(
                        (id) => allExercises.find((e) => e.id === id)?.nameFr
                      )
                      .filter(Boolean)
                      .join(' • ')}
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* Liste des exercices */}
          <p className="text-xs text-sp-muted">
            {filteredExercises.length} exercice
            {filteredExercises.length > 1 ? 's' : ''} affiché
            {filteredExercises.length > 1 ? 's' : ''}
          </p>

          <div className="space-y-2.5">
            {filteredExercises.map((ex) => {
              const records = computeExerciseRecords(
                completedWorkouts,
                ex.id,
                ex.measurementType
              );
              return (
                <Card
                  key={ex.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseDetail(ex)}
                        className="text-left font-bold text-sm hover:text-sp-accent"
                      >
                        {ex.nameFr}
                      </button>
                      {ex.isCustom && <Badge tone="terracotta">Perso</Badge>}
                    </div>
                    <p className="text-xs text-sp-muted">
                      {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}{' '}
                      • {ex.equipment.map((eq) => EQUIPMENT_LABELS[eq]).join(', ')}
                    </p>
                    {records.bestEstimated1RMKg && (
                      <p className="text-xs text-sp-accent tabular-nums">
                        Meilleur 1RM estimé :{' '}
                        {formatWeight(
                          records.bestEstimated1RMKg.value,
                          weightUnit
                        )}{' '}
                        ({formatWeight(records.bestEstimated1RMKg.weightKg, weightUnit)} ×{' '}
                        {records.bestEstimated1RMKg.reps})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleFavoriteExercise(ex.id)}
                      aria-label={
                        ex.isFavorite
                          ? `Retirer ${ex.nameFr} des favoris`
                          : `Ajouter ${ex.nameFr} aux favoris`
                      }
                      className={`touch-target p-2.5 rounded-xl border ${
                        ex.isFavorite
                          ? 'bg-sp-terracotta/20 border-sp-terracotta text-sp-terracotta'
                          : 'bg-sp-elevated border-sp-border text-sp-muted'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedExerciseDetail(ex)}
                    >
                      Fiche
                    </Button>

                    {activeWorkout && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          void addExerciseToActiveWorkout(ex.id);
                          setActiveTab('session');
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Séance
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== VUE 3 : HISTORIQUE & RECORDS ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {completedWorkouts.length === 0 ? (
            <EmptyState
              title="Aucune séance terminée dans l’historique"
              description="Tes séances validées apparaîtront ici avec leur volume de travail en kg·rép, tes records par exercice et la possibilité de les corriger."
              action={
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('session')}
                >
                  Aller à l’onglet Séance
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {/* Édition d'une ancienne séance avec recalcul cohérent */}
              {editingHistoricalSession && (
                <Card className="border-sp-accent space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">
                      Modifier la séance du{' '}
                      {formatCivilDateFr(editingHistoricalSession.civilDate)}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingHistoricalSession(null)}
                    >
                      Annuler
                    </Button>
                  </div>

                  {editingHistoricalSession.exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id}
                      className="bg-sp-elevated rounded-xl p-3 space-y-2"
                    >
                      <p className="text-sm font-semibold">
                        {ex.exerciseNameSnapshot}
                      </p>
                      {ex.sets.map((s, sIdx) => (
                        <div
                          key={s.id}
                          className="grid grid-cols-3 gap-2 items-center text-xs"
                        >
                          <span>Série {s.setOrder}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            defaultValue={
                              s.weightKg !== undefined ? String(s.weightKg) : ''
                            }
                            placeholder="Charge (kg)"
                            onChange={(e) => {
                              const val = parseFrenchDecimal(e.target.value);
                              const nextExs =
                                editingHistoricalSession.exercises.map(
                                  (item, i) =>
                                    i !== exIdx
                                      ? item
                                      : {
                                          ...item,
                                          sets: item.sets.map((st, j) =>
                                            j !== sIdx
                                              ? st
                                              : {
                                                  ...st,
                                                  weightKg:
                                                    val !== null && val > 0
                                                      ? val
                                                      : undefined,
                                                }
                                          ),
                                        }
                                );
                              setEditingHistoricalSession({
                                ...editingHistoricalSession,
                                exercises: nextExs,
                              });
                            }}
                            className="min-h-[42px] rounded-lg bg-sp-surface border border-sp-border px-2 tabular-nums"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            defaultValue={
                              s.reps !== undefined ? String(s.reps) : ''
                            }
                            placeholder="Rép."
                            onChange={(e) => {
                              const val = parseFrenchDecimal(e.target.value);
                              const nextExs =
                                editingHistoricalSession.exercises.map(
                                  (item, i) =>
                                    i !== exIdx
                                      ? item
                                      : {
                                          ...item,
                                          sets: item.sets.map((st, j) =>
                                            j !== sIdx
                                              ? st
                                              : {
                                                  ...st,
                                                  reps:
                                                    val !== null &&
                                                    val > 0 &&
                                                    Number.isInteger(val)
                                                      ? val
                                                      : undefined,
                                                }
                                          ),
                                        }
                                );
                              setEditingHistoricalSession({
                                ...editingHistoricalSession,
                                exercises: nextExs,
                              });
                            }}
                            className="min-h-[42px] rounded-lg bg-sp-surface border border-sp-border px-2 tabular-nums"
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        await updateHistoricalWorkoutSession(
                          editingHistoricalSession
                        );
                        setEditingHistoricalSession(null);
                      }}
                    >
                      Enregistrer et recalculer
                    </Button>
                  </div>
                </Card>
              )}

              {completedWorkouts.map((ws) => {
                const sessionVolume = ws.exercises.reduce((acc, ex) => {
                  const v = calculateExerciseVolume(
                    ex.sets,
                    ex.measurementTypeSnapshot
                  );
                  return acc + (v.comparable ? v.volumeKgReps : 0);
                }, 0);

                return (
                  <Card key={ws.id} className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-sp-muted">
                          {formatCivilDateFr(ws.civilDate)} •{' '}
                          {Math.max(1, Math.round(ws.durationSeconds / 60))} min
                        </p>
                        <h3 className="text-base font-bold">{ws.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge tone="sage">
                          {sessionVolume.toString().replace('.', ',')} kg·rép
                        </Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingHistoricalSession(ws)}
                        >
                          <Edit3 className="w-4 h-4" />
                          Modifier
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {ws.exercises.map((ex) => {
                        const workingSets = ex.sets.filter(
                          (s) => s.isCompleted && s.setType === 'working'
                        );
                        return (
                          <div
                            key={ex.id}
                            className="flex flex-wrap items-center justify-between gap-2 bg-sp-elevated rounded-xl px-3 py-2"
                          >
                            <span className="font-semibold">
                              {ex.exerciseNameSnapshot}
                            </span>
                            <span className="text-sp-muted tabular-nums">
                              {workingSets
                                .map((s) =>
                                  s.weightKg !== undefined
                                    ? `${formatWeight(s.weightKg, weightUnit)} × ${s.reps ?? 0}`
                                    : `${s.reps ?? s.durationSeconds ?? 0} rép/s`
                                )
                                .join(' | ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {ws.notes && (
                      <p className="text-xs text-sp-muted italic">
                        Note : {ws.notes}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
