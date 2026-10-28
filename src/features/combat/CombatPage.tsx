import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  SkipForward,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import {
  AlertBox,
  Badge,
  Button,
  Card,
  EmptyState,
} from '../../components/ui/Primitives';
import { ExerciseVisualizer } from '../../components/ExerciseVisualizer';
import { AiCoachPanel } from '../../components/AiCoachPanel';
import {
  createInitialTimerState,
  evaluateCombatTimer,
  pauseCombatTimer,
  resumeCombatTimer,
  skipToNextPhase,
  startCombatTimer,
  stopCombatTimerEarly,
  type CombatTimerConfig,
  type CombatTimerPersistedState,
} from '../../domain/calculations/timerEngine';
import { aggregateCombatStatistics } from '../../domain/calculations/combatStats';
import {
  formatCivilDateFr,
  getLocalCivilDate,
} from '../../domain/calculations/units';
import { triggerTimerCue } from '../../platform/lifecycle/audioFeedback';
import type {
  BjjAttire,
  CombatSessionCategory,
  Drill,
  DrillCategory,
  DrillCircuitItem,
  PerceivedIntensity,
  TechniqueEvent,
} from '../../domain/types';

const CATEGORY_LABELS: Record<CombatSessionCategory, string> = {
  drills: 'Séance de drills techniques',
  sparring_rolling: 'Sparring / Rolling',
  competition: 'Combat ou compétition',
  heavy_bag: 'Travail au sac de frappe',
  conditioning: 'Préparation physique combat',
};

const DRILL_CATEGORY_LABELS: Record<DrillCategory, string> = {
  mobility: 'Mobilité',
  ground_movement: 'Déplacements au sol',
  coordination: 'Coordination',
  hips: 'Hanches',
  stability: 'Stabilité / Gainage',
  conditioning: 'Conditionnement',
  solo: 'Travail solo',
  cooperative_partner: 'Partenaire coopératif',
};

const TIMER_STORAGE_KEY = 'standpower_combat_timer_state_v1';

export function CombatPage() {
  const snapshot = useAppStore((s) => s.snapshot);
  const getAllDrills = useAppStore((s) => s.getAllDrills);
  const saveCombatSession = useAppStore((s) => s.saveCombatSession);
  const deleteCombatSession = useAppStore((s) => s.deleteCombatSession);
  const saveDrillCircuit = useAppStore((s) => s.saveDrillCircuit);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  const [activeTab, setActiveTab] = useState<
    'journal' | 'timer' | 'drills' | 'stats'
  >('journal');

  // ==================== ÉTAT JOURNAL JJB / COMBAT ====================
  const [discipline, setDiscipline] = useState<
    'bjj' | 'boxing' | 'mma' | 'conditioning'
  >('bjj');
  const [category, setCategory] =
    useState<CombatSessionCategory>('sparring_rolling');
  const [civilDate, setCivilDate] = useState(getLocalCivilDate());
  const [bjjAttire, setBjjAttire] = useState<BjjAttire>('gi');
  const [context, setContext] = useState<'training' | 'competition'>('training');
  const [roundsCount, setRoundsCount] = useState(5);
  const [roundDurationMinutes, setRoundDurationMinutes] = useState(5);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(75);
  const [perceivedIntensity, setPerceivedIntensity] =
    useState<PerceivedIntensity>('moderate');
  const [partnerAlias, setPartnerAlias] = useState('');
  const [positionsInput, setPositionsInput] = useState(
    'Garde fermée, Demi-garde, Contrôle latéral'
  );
  const [techNameInput, setTechNameInput] = useState('');
  const [techAttemptsInput, setTechAttemptsInput] = useState(2);
  const [techSuccessInput, setTechSuccessInput] = useState(1);
  const [techniqueEvents, setTechniqueEvents] = useState<TechniqueEvent[]>([]);
  const [submissionsAttempted, setSubmissionsAttempted] = useState(2);
  const [submissionsSucceeded, setSubmissionsSucceeded] = useState(1);
  const [submissionsReceived, setSubmissionsReceived] = useState<string>('');
  const [competitionOutcome, setCompetitionOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [pointsToReview, setPointsToReview] = useState('');
  const [journalSavedBanner, setJournalSavedBanner] = useState(false);

  // ==================== ÉTAT MINUTEUR BOXE / MMA ====================
  const [timerPreset, setTimerPreset] = useState<
    'boxing' | 'technique' | 'mma' | 'custom'
  >('boxing');
  const [timerConfig, setTimerConfig] = useState<CombatTimerConfig>({
    totalRounds: 5,
    roundDurationSeconds: 180,
    restDurationSeconds: 60,
    prepDurationSeconds: 10,
  });

  const [timerState, setTimerState] = useState<CombatTimerPersistedState>(() => {
    try {
      const saved = sessionStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as CombatTimerPersistedState;
      }
    } catch {
      // Ignorer
    }
    return createInitialTimerState({
      totalRounds: 5,
      roundDurationSeconds: 180,
      restDurationSeconds: 60,
      prepDurationSeconds: 10,
    });
  });

  const [nowEpochMs, setNowEpochMs] = useState(() => Date.now());
  const prevPhaseRef = useRef<string>(timerState.status);

  // Comptage manuel facultatif après le round (Boxe / MMA)
  const [jabsCount, setJabsCount] = useState(0);
  const [crossCount, setCrossCount] = useState(0);
  const [hooksCount, setHooksCount] = useState(0);
  const [uppercutsCount, setUppercutsCount] = useState(0);
  const [kicksCount, setKicksCount] = useState(0);
  const [strikesAttempted, setStrikesAttempted] = useState<string>('');
  const [strikesLanded, setStrikesLanded] = useState<string>('');

  // Persistance immédiate de l'état de référence du minuteur
  useEffect(() => {
    try {
      sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch {
      // Ignorer
    }
  }, [timerState]);

  // Boucle de rafraîchissement visuel (basée sur Date.now() et recalcul au retour premier plan)
  useEffect(() => {
    if (timerState.status !== 'running') return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNowEpochMs(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const id = window.setInterval(() => {
      setNowEpochMs(Date.now());
    }, 200);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [timerState.status]);

  // WakeLock (garder l'écran allumé pendant le minuteur si supporté et activé)
  useEffect(() => {
    let wakeLockSentinel: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      if (
        timerState.status === 'running' &&
        snapshot.userPreferences.keepScreenAwakeDuringTimers &&
        typeof navigator !== 'undefined' &&
        'wakeLock' in navigator
      ) {
        try {
          wakeLockSentinel = await (
            navigator as unknown as {
              wakeLock: {
                request: (t: 'screen') => Promise<{ release: () => Promise<void> }>;
              };
            }
          ).wakeLock.request('screen');
        } catch {
          // Non supporté sur ce navigateur
        }
      }
    };
    void requestWakeLock();
    return () => {
      if (wakeLockSentinel) void wakeLockSentinel.release();
    };
  }, [
    timerState.status,
    snapshot.userPreferences.keepScreenAwakeDuringTimers,
  ]);

  const timerSnapshot = useMemo(
    () => evaluateCombatTimer(timerState, nowEpochMs),
    [timerState, nowEpochMs]
  );

  // Déclenchement des alertes sonores/vibrations lors des transitions de phase au premier plan
  useEffect(() => {
    const key = `${timerSnapshot.phase}_${timerSnapshot.currentRound}`;
    if (prevPhaseRef.current !== key && timerState.status === 'running') {
      if (timerSnapshot.phase === 'round') {
        triggerTimerCue({
          cueType: 'round_start',
          soundEnabled: snapshot.userPreferences.soundEnabled,
          vibrationEnabled: snapshot.userPreferences.vibrationEnabled,
        });
      } else if (
        timerSnapshot.phase === 'rest' ||
        timerSnapshot.phase === 'completed'
      ) {
        triggerTimerCue({
          cueType: 'round_end',
          soundEnabled: snapshot.userPreferences.soundEnabled,
          vibrationEnabled: snapshot.userPreferences.vibrationEnabled,
        });
      }
    }
    prevPhaseRef.current = key;
  }, [
    timerSnapshot.phase,
    timerSnapshot.currentRound,
    timerState.status,
    snapshot.userPreferences.soundEnabled,
    snapshot.userPreferences.vibrationEnabled,
  ]);

  const applyTimerPreset = (
    preset: 'boxing' | 'technique' | 'mma' | 'custom'
  ) => {
    setTimerPreset(preset);
    let nextConfig = timerConfig;
    if (preset === 'boxing') {
      nextConfig = {
        totalRounds: 5,
        roundDurationSeconds: 180,
        restDurationSeconds: 60,
        prepDurationSeconds: 10,
      };
    } else if (preset === 'technique') {
      nextConfig = {
        totalRounds: 5,
        roundDurationSeconds: 120,
        restDurationSeconds: 60,
        prepDurationSeconds: 10,
      };
    } else if (preset === 'mma') {
      nextConfig = {
        totalRounds: 3,
        roundDurationSeconds: 300,
        restDurationSeconds: 60,
        prepDurationSeconds: 10,
      };
    }
    setTimerConfig(nextConfig);
    setTimerState(createInitialTimerState(nextConfig));
  };

  // ==================== ÉTAT 30+ DRILLS & COMPOSITEUR DE CIRCUIT ====================
  const allDrills = getAllDrills();
  const [drillCategoryFilter, setDrillCategoryFilter] = useState<
    DrillCategory | 'all'
  >('all');
  const [drillModalityFilter, setDrillModalityFilter] = useState<
    'all' | 'solo' | 'cooperative_partner'
  >('all');
  const [selectedDrillDetail, setSelectedDrillDetail] = useState<Drill | null>(
    null
  );
  const [circuitItems, setCircuitItems] = useState<DrillCircuitItem[]>([
    {
      drillId: 'drill_shrimp_classic',
      drillNameSnapshot: 'Shrimp classique (Langouste / Fuite de hanches)',
      workSeconds: 45,
      restSeconds: 15,
    },
    {
      drillId: 'drill_shoulder_bridge',
      drillNameSnapshot: 'Pont contrôlé sur les épaules (Upa diagonal)',
      workSeconds: 45,
      restSeconds: 15,
    },
    {
      drillId: 'drill_technical_standup',
      drillNameSnapshot: 'Technical Stand-Up (Relevé technique sécurisé)',
      workSeconds: 45,
      restSeconds: 15,
    },
  ]);
  const [circuitName, setCircuitName] = useState(
    'Circuit Échauffement Sol Solo (6 min)'
  );
  const [circuitRounds, setCircuitRounds] = useState(2);

  const filteredDrills = useMemo(() => {
    return allDrills.filter((d) => {
      if (drillCategoryFilter !== 'all' && d.category !== drillCategoryFilter) {
        return false;
      }
      if (drillModalityFilter !== 'all' && d.modality !== drillModalityFilter) {
        return false;
      }
      return true;
    });
  }, [allDrills, drillCategoryFilter, drillModalityFilter]);

  const combatStats = useMemo(
    () => aggregateCombatStatistics(snapshot.combatSessions),
    [snapshot.combatSessions]
  );

  const handleAddTechniqueEvent = () => {
    if (!techNameInput.trim()) return;
    const safeAttempts = Math.max(0, Math.floor(techAttemptsInput));
    const safeSuccess = Math.min(
      safeAttempts,
      Math.max(0, Math.floor(techSuccessInput))
    );
    setTechniqueEvents([
      ...techniqueEvents,
      {
        id: `te_${Date.now()}`,
        combatSessionId: 'draft',
        category: 'sweep_pass',
        techniqueName: techNameInput.trim(),
        attempts: safeAttempts,
        successes: safeSuccess,
      },
    ]);
    setTechNameInput('');
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCombatSession({
      discipline,
      category,
      civilDate,
      bjjAttire: discipline === 'bjj' ? bjjAttire : 'not_applicable',
      context,
      roundsCount: Math.max(0, roundsCount),
      roundDurationSeconds: Math.max(30, roundDurationMinutes * 60),
      restDurationSeconds: 60,
      totalDurationMinutes: Math.max(5, totalDurationMinutes),
      perceivedIntensity,
      partnerAlias: partnerAlias.trim() || undefined,
      positionsWorked: positionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      techniqueEvents,
      submissionsAttempted: Math.max(0, submissionsAttempted),
      submissionsSucceeded: Math.min(
        Math.max(0, submissionsAttempted),
        Math.max(0, submissionsSucceeded)
      ),
      submissionsReceived:
        submissionsReceived.trim() !== ''
          ? Math.max(0, Number(submissionsReceived))
          : undefined,
      competitionOutcome:
        context === 'competition' ? competitionOutcome.trim() : undefined,
      rounds: [],
      notes: notes.trim(),
      pointsToReview: pointsToReview.trim(),
    });

    setTechniqueEvents([]);
    setNotes('');
    setPointsToReview('');
    setJournalSavedBanner(true);
    setTimeout(() => setJournalSavedBanner(false), 3500);
  };

  const handleSaveTimerSessionToJournal = async () => {
    await saveCombatSession({
      discipline: timerPreset === 'mma' ? 'mma' : 'boxing',
      category: 'heavy_bag',
      civilDate: getLocalCivilDate(),
      bjjAttire: 'not_applicable',
      context: 'training',
      roundsCount: timerConfig.totalRounds,
      roundDurationSeconds: timerConfig.roundDurationSeconds,
      restDurationSeconds: timerConfig.restDurationSeconds,
      totalDurationMinutes: Math.max(
        5,
        Math.round(
          (timerConfig.totalRounds *
            (timerConfig.roundDurationSeconds +
              timerConfig.restDurationSeconds)) /
            60
        )
      ),
      perceivedIntensity: 'moderate',
      positionsWorked: ['Striking / Rounds chronométrés'],
      techniqueEvents: [],
      submissionsAttempted: 0,
      submissionsSucceeded: 0,
      rounds: [
        {
          id: `r_${Date.now()}`,
          combatSessionId: 'timer',
          roundNumber: 1,
          durationSeconds: timerConfig.roundDurationSeconds,
          restSeconds: timerConfig.restDurationSeconds,
          intensity: 'moderate',
          strikingCounts: {
            jabs: jabsCount,
            crosses: crossCount,
            hooks: hooksCount,
            uppercuts: uppercutsCount,
            kicks: kicksCount,
            attemptedTotal: strikesAttempted ? Number(strikesAttempted) : undefined,
            landedTotal: strikesLanded ? Number(strikesLanded) : undefined,
          },
        },
      ],
      notes: `Comptage manuel post-séance : Jabs ${jabsCount}, Cross ${crossCount}, Crochets ${hooksCount}, Uppercuts ${uppercutsCount}, Kicks ${kicksCount}.`,
      pointsToReview: '',
    });
    setActiveTab('journal');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Sports de Combat</h1>
        <p className="text-xs text-sp-muted">
          Journal JJB/BJJ, Minuteur Boxe/MMA à instants de référence, {allDrills.length} drills et statistiques
        </p>
      </div>

      {/* Onglets internes Combat */}
      <div
        role="tablist"
        aria-label="Sections Sports de Combat"
        className="grid grid-cols-4 gap-1 bg-sp-surface p-1.5 rounded-2xl border border-sp-border"
      >
        {(
          [
            ['journal', 'Journal', Shield],
            ['timer', 'Minuteur', Clock],
            ['drills', '30+ Drills', BookOpen],
            ['stats', 'Stats', BarChart3],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`touch-target rounded-xl text-xs font-medium transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === id
                ? 'bg-sp-accent text-sp-accent-fg font-semibold'
                : 'text-sp-muted hover:text-sp-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Assistant Coach IA Gemini 2.5 Combat & Préparation Physique */}
      <AiCoachPanel
        context={{
          disciplines: ['JJB/BJJ', 'Boxe', 'MMA'],
          recentCombatCount: snapshot.combatSessions.length,
          recentWorkoutsCount: snapshot.workoutSessions.length,
        }}
      />

      {/* ==================== ONGLET 1 : JOURNAL JJB / COMBAT ==================== */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {journalSavedBanner && (
            <AlertBox tone="success" title="Séance de combat enregistrée">
              Ta séance a été sauvegardée localement et intégrée à tes statistiques.
            </AlertBox>
          )}

          <Card className="space-y-4">
            <h2 className="text-base font-bold">
              Nouvelle entrée — Journal JJB / Boxe / MMA
            </h2>

            <form onSubmit={handleSaveJournal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Discipline
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) =>
                      setDiscipline(
                        e.target.value as
                          | 'bjj'
                          | 'boxing'
                          | 'mma'
                          | 'conditioning'
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  >
                    <option value="bjj">JJB / BJJ / Grappling</option>
                    <option value="boxing">Boxe / Striking</option>
                    <option value="mma">MMA</option>
                    <option value="conditioning">Préparation physique</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Type de séance (séparation stricte)
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as CombatSessionCategory)
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={civilDate}
                    onChange={(e) => setCivilDate(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {discipline === 'bjj' && (
                  <div>
                    <label className="text-xs text-sp-muted block mb-1">
                      Tenue JJB
                    </label>
                    <select
                      value={bjjAttire}
                      onChange={(e) =>
                        setBjjAttire(e.target.value as BjjAttire)
                      }
                      className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                    >
                      <option value="gi">Gi (Kimono)</option>
                      <option value="no_gi">No-Gi / Grappling</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Cadre
                  </label>
                  <select
                    value={context}
                    onChange={(e) =>
                      setContext(e.target.value as 'training' | 'competition')
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  >
                    <option value="training">
                      Entraînement (apprentissage, pas de score gagné/perdu)
                    </option>
                    <option value="competition">Compétition officielle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Nombre de rounds
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={roundsCount}
                    onChange={(e) =>
                      setRoundsCount(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Durée totale (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={totalDurationMinutes}
                    onChange={(e) =>
                      setTotalDurationMinutes(
                        Math.max(5, Number(e.target.value) || 60)
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Durée d’un round (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={roundDurationMinutes}
                    onChange={(e) =>
                      setRoundDurationMinutes(
                        Math.max(1, Number(e.target.value) || 5)
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Intensité ressentie
                  </label>
                  <select
                    value={perceivedIntensity}
                    onChange={(e) =>
                      setPerceivedIntensity(
                        e.target.value as PerceivedIntensity
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  >
                    <option value="low">Légère / Technique</option>
                    <option value="moderate">Modérée / Contrôlée</option>
                    <option value="high">Élevée / Sparring soutenu</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Partenaire (pseudonyme facultatif)
                  </label>
                  <input
                    type="text"
                    value={partnerAlias}
                    onChange={(e) => setPartnerAlias(e.target.value)}
                    placeholder="Ex: Mehdi, Lucas..."
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Positions travaillées (séparées par virgule)
                </label>
                <input
                  type="text"
                  value={positionsInput}
                  onChange={(e) => setPositionsInput(e.target.value)}
                  placeholder="Ex: Garde papillon, Demi-garde profonde, Passage Toreando"
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                />
              </div>

              {/* Ajout de techniques tentées et réussies */}
              <div className="bg-sp-elevated rounded-xl p-3 space-y-2.5">
                <p className="text-xs font-bold text-sp-text">
                  Techniques travaillées (Tentatives & Réussites)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={techNameInput}
                    onChange={(e) => setTechNameInput(e.target.value)}
                    placeholder="Nom (ex: Sweep papillon, Knee cut)"
                    className="sm:col-span-2 min-h-[44px] rounded-lg bg-sp-surface border border-sp-border px-3 text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-sp-muted">Tentées:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={techAttemptsInput}
                      onChange={(e) =>
                        setTechAttemptsInput(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full min-h-[44px] rounded-lg bg-sp-surface border border-sp-border px-2 text-xs tabular-nums"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-sp-muted">Réussies:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={techSuccessInput}
                      onChange={(e) =>
                        setTechSuccessInput(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full min-h-[44px] rounded-lg bg-sp-surface border border-sp-border px-2 text-xs tabular-nums"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleAddTechniqueEvent}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {techniqueEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {techniqueEvents.map((ev) => (
                      <Badge key={ev.id} tone="sage">
                        {ev.techniqueName} ({ev.successes}/{ev.attempts})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Soumissions tentées / réussies / subies (distinctes du nombre de rounds) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Soumissions tentées
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={submissionsAttempted}
                    onChange={(e) =>
                      setSubmissionsAttempted(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Soumissions réussies
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={submissionsSucceeded}
                    onChange={(e) =>
                      setSubmissionsSucceeded(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Soumissions subies (facultatif)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={submissionsReceived}
                    onChange={(e) => setSubmissionsReceived(e.target.value)}
                    placeholder="Optionnel"
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              {context === 'competition' && (
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Résultat du combat (Compétition uniquement)
                  </label>
                  <input
                    type="text"
                    value={competitionOutcome}
                    onChange={(e) => setCompetitionOutcome(e.target.value)}
                    placeholder="Ex: Victoire aux points (6-2)"
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Notes de séance
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sensations, cardio, séquences fluides..."
                    className="w-full rounded-xl bg-sp-elevated border border-sp-border p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Points techniques à retravailler
                  </label>
                  <textarea
                    rows={2}
                    value={pointsToReview}
                    onChange={(e) => setPointsToReview(e.target.value)}
                    placeholder="Ex: Défense d’underhook côté droit en demi-garde..."
                    className="w-full rounded-xl bg-sp-elevated border border-sp-border p-3 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" fullWidth>
                <Check className="w-4 h-4" />
                Enregistrer dans le journal de combat
              </Button>
            </form>
          </Card>

          {/* Historique des séances de combat */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold">
              Historique des séances de combat ({snapshot.combatSessions.length})
            </h3>
            {snapshot.combatSessions.length === 0 ? (
              <EmptyState
                title="Aucune séance de combat enregistrée"
                description="Note tes séances de JJB, Boxe ou MMA pour suivre tes minutes de pratique, tes rounds et les techniques travaillées."
              />
            ) : (
              snapshot.combatSessions.map((cs) => (
                <Card key={cs.id} className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="terracotta">
                          {cs.discipline.toUpperCase()}
                        </Badge>
                        {cs.discipline === 'bjj' && (
                          <Badge tone="neutral">
                            {cs.bjjAttire === 'gi' ? 'Gi' : 'No-Gi'}
                          </Badge>
                        )}
                        <Badge tone="sage">{CATEGORY_LABELS[cs.category]}</Badge>
                      </div>
                      <p className="text-xs text-sp-muted mt-1">
                        {formatCivilDateFr(cs.civilDate)} •{' '}
                        {cs.totalDurationMinutes} min • {cs.roundsCount} rounds
                        {cs.partnerAlias ? ` • Partenaire : ${cs.partnerAlias}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteCombatSession(cs.id)}
                      aria-label="Supprimer cette séance de combat"
                      className="touch-target p-2 rounded-lg text-sp-muted hover:text-sp-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {cs.positionsWorked.length > 0 && (
                    <p className="text-xs text-sp-text">
                      <strong>Positions :</strong> {cs.positionsWorked.join(', ')}
                    </p>
                  )}

                  {cs.notes && (
                    <p className="text-xs text-sp-muted">{cs.notes}</p>
                  )}
                  {cs.pointsToReview && (
                    <p className="text-xs text-sp-accent">
                      <strong>À retravailler :</strong> {cs.pointsToReview}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== ONGLET 2 : MINUTEUR BOXE / MMA ==================== */}
      {activeTab === 'timer' && (
        <div className="space-y-4">
          {/* Presets : Boxe 3/1, Technique 2/1, MMA 5/1, Personnalisé */}
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sp-muted">
                Préréglages du minuteur
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void updatePreferences({
                      soundEnabled: !snapshot.userPreferences.soundEnabled,
                    })
                  }
                  className="touch-target px-3 py-1.5 rounded-xl bg-sp-elevated border border-sp-border text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {snapshot.userPreferences.soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-sp-accent" />
                      Son actif
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-sp-muted" />
                      Mode silencieux
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['boxing', 'Boxe (3 min / 1 min)'],
                  ['technique', 'Technique (2 min / 1 min)'],
                  ['mma', 'MMA (5 min / 1 min)'],
                  ['custom', 'Personnalisé'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyTimerPreset(id)}
                  className={`touch-target rounded-xl text-xs font-semibold border px-2.5 ${
                    timerPreset === id
                      ? 'bg-sp-accent text-sp-accent-fg border-sp-accent'
                      : 'bg-sp-elevated border-sp-border text-sp-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Configuration personnalisée */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] text-sp-muted block mb-1">
                  Rounds
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  disabled={timerState.status === 'running'}
                  value={timerConfig.totalRounds}
                  onChange={(e) => {
                    const next = {
                      ...timerConfig,
                      totalRounds: Math.max(1, Number(e.target.value) || 1),
                    };
                    setTimerPreset('custom');
                    setTimerConfig(next);
                    setTimerState(createInitialTimerState(next));
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] text-sp-muted block mb-1">
                  Round (sec)
                </label>
                <input
                  type="number"
                  min={15}
                  max={1200}
                  step={15}
                  disabled={timerState.status === 'running'}
                  value={timerConfig.roundDurationSeconds}
                  onChange={(e) => {
                    const next = {
                      ...timerConfig,
                      roundDurationSeconds: Math.max(
                        15,
                        Number(e.target.value) || 60
                      ),
                    };
                    setTimerPreset('custom');
                    setTimerConfig(next);
                    setTimerState(createInitialTimerState(next));
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] text-sp-muted block mb-1">
                  Repos (sec)
                </label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  step={15}
                  disabled={timerState.status === 'running'}
                  value={timerConfig.restDurationSeconds}
                  onChange={(e) => {
                    const next = {
                      ...timerConfig,
                      restDurationSeconds: Math.max(
                        0,
                        Number(e.target.value) || 0
                      ),
                    };
                    setTimerPreset('custom');
                    setTimerConfig(next);
                    setTimerState(createInitialTimerState(next));
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] text-sp-muted block mb-1">
                  Préparation (sec)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  disabled={timerState.status === 'running'}
                  value={timerConfig.prepDurationSeconds}
                  onChange={(e) => {
                    const next = {
                      ...timerConfig,
                      prepDurationSeconds: Math.max(
                        0,
                        Number(e.target.value) || 0
                      ),
                    };
                    setTimerPreset('custom');
                    setTimerConfig(next);
                    setTimerState(createInitialTimerState(next));
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                />
              </div>
            </div>
          </Card>

          {/* Grand affichage lisible de loin */}
          <Card
            className={`text-center py-8 px-4 space-y-5 border-2 ${
              timerSnapshot.phase === 'round'
                ? 'border-sp-accent bg-sp-surface'
                : timerSnapshot.phase === 'rest'
                ? 'border-sp-terracotta bg-sp-elevated'
                : 'border-sp-border'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Badge
                tone={
                  timerSnapshot.phase === 'round'
                    ? 'sage'
                    : timerSnapshot.phase === 'rest'
                    ? 'terracotta'
                    : 'neutral'
                }
              >
                {timerSnapshot.phase === 'preparation'
                  ? 'PRÉPARATION'
                  : timerSnapshot.phase === 'round'
                  ? `ROUND ${timerSnapshot.currentRound} / ${timerSnapshot.totalRounds}`
                  : timerSnapshot.phase === 'rest'
                  ? `REPOS (${timerSnapshot.currentRound} / ${timerSnapshot.totalRounds})`
                  : timerSnapshot.phase === 'completed'
                  ? 'SÉANCE TERMINÉE'
                  : `PRÊT — ${timerSnapshot.totalRounds} ROUNDS`}
              </Badge>
            </div>

            <div
              aria-live="polite"
              className="text-6xl sm:text-7xl font-bold font-mono tabular-nums tracking-tight text-sp-text"
            >
              {String(
                Math.floor(timerSnapshot.remainingSecondsCeil / 60)
              ).padStart(2, '0')}
              :
              {String(timerSnapshot.remainingSecondsCeil % 60).padStart(2, '0')}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {timerState.status === 'idle' ||
              timerState.status === 'completed' ? (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    const now = Date.now();
                    setNowEpochMs(now);
                    setTimerState(
                      startCombatTimer(
                        createInitialTimerState(timerConfig),
                        now
                      )
                    );
                  }}
                >
                  <Play className="w-5 h-5" />
                  Démarrer le minuteur
                </Button>
              ) : timerState.status === 'running' ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    const now = Date.now();
                    setNowEpochMs(now);
                    setTimerState(pauseCombatTimer(timerState, now));
                  }}
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    const now = Date.now();
                    setNowEpochMs(now);
                    setTimerState(resumeCombatTimer(timerState, now));
                  }}
                >
                  <Play className="w-5 h-5" />
                  Reprendre
                </Button>
              )}

              {timerState.status !== 'idle' &&
                timerState.status !== 'completed' && (
                  <>
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={() => {
                        const now = Date.now();
                        setNowEpochMs(now);
                        setTimerState(skipToNextPhase(timerState, now));
                      }}
                    >
                      <SkipForward className="w-4 h-4" />
                      Suivant
                    </Button>

                    <Button
                      size="md"
                      variant="danger"
                      onClick={() =>
                        setTimerState(stopCombatTimerEarly(timerState))
                      }
                    >
                      <Square className="w-4 h-4" />
                      Fin anticipée
                    </Button>
                  </>
                )}

              <Button
                size="md"
                variant="ghost"
                onClick={() =>
                  setTimerState(createInitialTimerState(timerConfig))
                }
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
          </Card>

          {/* Saisie manuelle facultative après le round (aucune fausse détection par capteur) */}
          <Card className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">
                Comptage manuel facultatif (Saisie après le round ou la séance)
              </h3>
              <p className="text-xs text-sp-muted">
                StandPower ne prétend pas détecter les coups avec le microphone ou l’accéléromètre. Note tes repères après le round sans toucher ton téléphone pendant l’effort.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(
                [
                  ['Jabs', jabsCount, setJabsCount],
                  ['Cross', crossCount, setCrossCount],
                  ['Crochets', hooksCount, setHooksCount],
                  ['Uppercuts', uppercutsCount, setUppercutsCount],
                  ['Kicks (MMA)', kicksCount, setKicksCount],
                ] as const
              ).map(([label, val, setter]) => (
                <div
                  key={label}
                  className="bg-sp-elevated rounded-xl p-2.5 text-center space-y-1.5"
                >
                  <span className="font-semibold block">{label}</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setter(Math.max(0, val - 5))}
                      className="w-8 h-8 rounded-lg bg-sp-surface border border-sp-border font-bold"
                    >
                      -
                    </button>
                    <span className="tabular-nums font-bold text-sm w-8">
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={() => setter(val + 5)}
                      className="w-8 h-8 rounded-lg bg-sp-surface border border-sp-border font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Frappes tentées (facultatif)
                </label>
                <input
                  type="number"
                  min={0}
                  value={strikesAttempted}
                  onChange={(e) => setStrikesAttempted(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Touches estimées (facultatif)
                </label>
                <input
                  type="number"
                  min={0}
                  value={strikesLanded}
                  onChange={(e) => setStrikesLanded(e.target.value)}
                  placeholder="Ex: 65"
                  className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs tabular-nums"
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleSaveTimerSessionToJournal()}
            >
              <Check className="w-4 h-4" />
              Enregistrer ces rounds dans le journal de combat
            </Button>
          </Card>

          <AlertBox
            tone="info"
            title="Précision temporelle et limite honnête en arrière-plan"
          >
            Le minuteur calcule son état à partir d’instants de référence absolus : si l’écran s’éteint ou si l’application est suspendue, le round exact et le temps restant sont recalculés sans dérive dès le retour au premier plan. En revanche, les restrictions d’économie de batterie d’Android peuvent différer une alerte sonore lorsque l’écran est verrouillé : garde l’option « Écran allumé » active pendant tes rounds.
          </AlertBox>
        </div>
      )}

      {/* ==================== ONGLET 3 : 30+ DRILLS JJB & CIRCUITS ==================== */}
      {activeTab === 'drills' && (
        <div className="space-y-4">
          {/* Compositeur de circuit de drills */}
          <Card className="space-y-3 border-sp-accent/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge tone="sage">Circuit personnalisable</Badge>
                <h2 className="text-base font-bold mt-1">{circuitName}</h2>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const totalWorkSec =
                    circuitItems.reduce((acc, i) => acc + i.workSeconds, 0) /
                    Math.max(1, circuitItems.length);
                  const totalRestSec =
                    circuitItems.reduce((acc, i) => acc + i.restSeconds, 0) /
                    Math.max(1, circuitItems.length);
                  const nextCfg: CombatTimerConfig = {
                    totalRounds: Math.max(
                      1,
                      circuitItems.length * circuitRounds
                    ),
                    roundDurationSeconds: Math.round(totalWorkSec),
                    restDurationSeconds: Math.round(totalRestSec),
                    prepDurationSeconds: 10,
                  };
                  setTimerConfig(nextCfg);
                  setTimerState(
                    startCombatTimer(createInitialTimerState(nextCfg), Date.now())
                  );
                  void saveDrillCircuit({
                    name: circuitName,
                    rounds: circuitRounds,
                    items: circuitItems,
                  });
                  setActiveTab('timer');
                }}
              >
                <Play className="w-4 h-4" />
                Lancer le circuit ({circuitItems.length * circuitRounds} postes)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={circuitName}
                onChange={(e) => setCircuitName(e.target.value)}
                aria-label="Nom du circuit de drills"
                className="sm:col-span-2 min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
              />
              <select
                value={circuitRounds}
                onChange={(e) => setCircuitRounds(Number(e.target.value))}
                aria-label="Nombre de tours du circuit"
                className="min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
              >
                {[1, 2, 3, 4].map((r) => (
                  <option key={r} value={r}>
                    {r} tour{r > 1 ? 's' : ''} complet{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              {circuitItems.map((item, idx) => (
                <div
                  key={`${item.drillId}_${idx}`}
                  className="bg-sp-elevated rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="font-medium">
                    {idx + 1}. {item.drillNameSnapshot}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-sp-muted">
                      {item.workSeconds}s / repos {item.restSeconds}s
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCircuitItems(
                          circuitItems.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-sp-danger p-1"
                      aria-label="Retirer du circuit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Filtres des 32 drills */}
          <Card className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={drillCategoryFilter}
                onChange={(e) =>
                  setDrillCategoryFilter(e.target.value as DrillCategory | 'all')
                }
                aria-label="Filtrer par catégorie de drill"
                className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
              >
                <option value="all">
                  Toutes les familles ({allDrills.length} fiches)
                </option>
                {Object.entries(DRILL_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={drillModalityFilter}
                onChange={(e) =>
                  setDrillModalityFilter(
                    e.target.value as 'all' | 'solo' | 'cooperative_partner'
                  )
                }
                aria-label="Filtrer par modalité solo ou partenaire"
                className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
              >
                <option value="all">Solo & Partenaire coopératif</option>
                <option value="solo">Travail Solo uniquement</option>
                <option value="cooperative_partner">
                  Avec partenaire coopératif
                </option>
              </select>
            </div>
          </Card>

          {/* Fiche détaillée d'un drill sélectionné */}
          {selectedDrillDetail && (
            <Card className="border-sp-accent space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="sage">
                      {DRILL_CATEGORY_LABELS[selectedDrillDetail.category]}
                    </Badge>
                    <Badge tone="neutral">
                      {selectedDrillDetail.modality === 'solo'
                        ? 'Solo'
                        : 'Partenaire coopératif'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold mt-1">
                    {selectedDrillDetail.nameFr}
                  </h3>
                  <p className="text-xs text-sp-muted">
                    Objectif : {selectedDrillDetail.objective}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDrillDetail(null)}
                >
                  Fermer
                </Button>
              </div>

              {/* Animateur Stickman SVG Cinématique & Carte Anatomique pour le Drill */}
              <ExerciseVisualizer exerciseName={selectedDrillDetail.nameFr} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
                  <p className="font-bold">Étapes d’exécution</p>
                  <ol className="list-decimal list-inside text-sp-muted space-y-1">
                    {selectedDrillDetail.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                <div className="bg-sp-elevated rounded-xl p-3 space-y-1.5">
                  <p className="font-bold">Erreurs fréquentes & Précautions</p>
                  <ul className="list-disc list-inside text-sp-muted space-y-1">
                    {selectedDrillDetail.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <p className="text-sp-text pt-1">
                    <strong>Précaution :</strong>{' '}
                    {selectedDrillDetail.precautions}
                  </p>
                  <p className="text-sp-accent">
                    <strong>Variante plus simple :</strong>{' '}
                    {selectedDrillDetail.simplerVariant}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Liste des fiches de drills */}
          <div className="space-y-2.5">
            {filteredDrills.map((drill) => (
              <Card
                key={drill.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDrillDetail(drill)}
                      className="text-left font-bold text-sm hover:text-sp-accent"
                    >
                      {drill.nameFr}
                    </button>
                    <Badge tone="neutral">
                      {DRILL_CATEGORY_LABELS[drill.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-sp-muted">{drill.objective}</p>
                  <p className="text-[11px] text-sp-accent">
                    Volume conseillé : {drill.recommendedDurationOrReps}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedDrillDetail(drill)}
                  >
                    Fiche
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      setCircuitItems([
                        ...circuitItems,
                        {
                          drillId: drill.id,
                          drillNameSnapshot: drill.nameFr,
                          workSeconds: drill.defaultDurationSeconds,
                          restSeconds: 15,
                        },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Circuit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================== ONGLET 4 : STATISTIQUES COMBAT ==================== */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <Card>
              <p className="text-xs text-sp-muted">Minutes de pratique</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {combatStats.totalMinutes}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-sp-muted">Rounds cumulés</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {combatStats.totalRounds}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-sp-muted">Répartition Gi / No-Gi</p>
              <p className="text-lg font-bold tabular-nums mt-1">
                {combatStats.giCount} Gi / {combatStats.noGiCount} No-Gi
              </p>
            </Card>
            <Card>
              <p className="text-xs text-sp-muted">Soumissions (réussite)</p>
              <p className="text-sm font-bold tabular-nums mt-2">
                {combatStats.submissionSuccessSummary.denominatorLabel}
              </p>
            </Card>
          </div>

          <Card className="space-y-3">
            <div>
              <h3 className="text-base font-bold">
                Taux de réussite déclaré par technique (avec dénominateur)
              </h3>
              <p className="text-xs text-sp-muted">
                Zéro tentative affiche « Non disponible », jamais 0 %. Un échantillon inférieur à 5 tentatives est signalé comme indicatif.
              </p>
            </div>

            {combatStats.topTechniques.length === 0 ? (
              <p className="text-xs text-sp-muted py-4">
                Aucune technique spécifique enregistrée pour le moment.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {combatStats.topTechniques.map((tech) => (
                  <div
                    key={tech.techniqueName}
                    className="bg-sp-elevated rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-sp-text">
                        {tech.techniqueName}
                      </span>
                      {tech.lowSampleWarning && (
                        <span className="ml-2 text-[11px] text-sp-muted">
                          (Échantillon faible &lt; 5 tentatives)
                        </span>
                      )}
                    </div>
                    <Badge tone={tech.available ? 'sage' : 'neutral'}>
                      {tech.denominatorLabel}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
