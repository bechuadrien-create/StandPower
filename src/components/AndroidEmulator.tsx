/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, UserProfile, CustomWorkout, CustomExercise, SetLog } from '../types';
import { formatTime, calculateWorkoutCalories, playAlertChime } from '../utils';
import { 
  Dumbbell, Weight, Timer, Flame, CheckCircle, Award, 
  Trophy, Play, RotateCcw, ChevronRight, ArrowLeft, Watch,
  TrendingUp, Compass, Check, ShieldAlert, Wifi, Battery, ChevronLeft, Plus, Trash2, Edit2, Scale
} from 'lucide-react';

interface AndroidEmulatorProps {
  onScreenChange: (codeKey: string) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
}

const DEFAULT_WORKOUTS: CustomWorkout[] = [
  {
    id: 'w1',
    name: 'Séance Pectoraux & Bras',
    exercises: [
      {
        name: 'Développé Couché (Barre)',
        sets: 4,
        reps: 8,
        targetLoadKg: 60
      },
      {
        name: 'Curl Haltères (Biceps)',
        sets: 3,
        reps: 12,
        targetLoadKg: 14
      }
    ]
  },
  {
    id: 'w2',
    name: 'Séance Bas du Corps (Jambes)',
    exercises: [
      {
        name: 'Squat Arrière (Barre)',
        sets: 4,
        reps: 8,
        targetLoadKg: 80
      },
      {
        name: 'Soulevé de Terre Roumain',
        sets: 3,
        reps: 10,
        targetLoadKg: 50
      }
    ]
  }
];

export default function AndroidEmulator({ onScreenChange, userProfile, setUserProfile }: AndroidEmulatorProps) {
  // Navigation screen
  const [screen, setScreen] = useState<AppScreen>('DASHBOARD');
  
  // Custom workouts listing
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([]);

  // Bodyweight config variables
  const [weightInput, setWeightInput] = useState<string>('75');
  const [isEditingWeight, setIsEditingWeight] = useState<boolean>(false);
  const [weightError, setWeightError] = useState<string>('');

  // Creation screen state
  const [newWorkoutName, setNewWorkoutName] = useState<string>('');
  const [draftExercises, setDraftExercises] = useState<CustomExercise[]>([]);
  const [draftName, setDraftName] = useState<string>('');
  const [draftSets, setDraftSets] = useState<number>(4);
  const [draftReps, setDraftReps] = useState<number>(10);
  const [draftLoad, setDraftLoad] = useState<number>(20);
  const [builderError, setBuilderError] = useState<string>('');

  // Active workout flow variables
  const [activeWorkout, setActiveWorkout] = useState<CustomWorkout | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [activeSetIndex, setActiveSetIndex] = useState<number>(0);
  const [completedSets, setCompletedSets] = useState<SetLog[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // rest timer variables
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restDuration, setRestDuration] = useState<number>(90); // default rest 90s
  const [restInitialSeconds, setRestInitialSeconds] = useState<number>(90);

  // AI execution sheet variables cache
  const [aiGuides, setAiGuides] = useState<Record<string, {properForm: string[], safetyTips: string[], targetMuscles: string[]}>>({});
  const [loadingAiGuide, setLoadingAiGuide] = useState<boolean>(false);

  // Phone topbar clocks and variables
  const [simulatedTime, setSimulatedTime] = useState<string>('12:00');
  const [simulatedBattery] = useState<number>(92);

  // Interval references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active screen states for Kotlin highlights
  useEffect(() => {
    switch (screen) {
      case 'DASHBOARD':
        onScreenChange('profile');
        break;
      case 'CREATE_WORKOUT':
        onScreenChange('workoutInit');
        break;
      case 'WORKOUT_FLOW':
        onScreenChange('exerciseGuides');
        break;
      case 'TIMER_MODAL':
        onScreenChange('restTimer');
        break;
      case 'SUMMARY':
        onScreenChange('summary');
        break;
    }
  }, [screen, onScreenChange]);

  // Load workouts list and weight Kg on mount from localStorage
  useEffect(() => {
    // 1. Poids de corps
    const savedWeight = localStorage.getItem('bb_weight_kg');
    if (savedWeight) {
      const parsed = parseFloat(savedWeight);
      if (!isNaN(parsed) && parsed > 30) {
        setUserProfile({ weightKg: parsed });
        setWeightInput(savedWeight);
      } else {
        setUserProfile({ weightKg: 75.0 });
      }
    } else {
      setUserProfile({ weightKg: 75.0 });
      localStorage.setItem('bb_weight_kg', '75.0');
    }

    // 2. Mes Séances Perso
    const savedWorkouts = localStorage.getItem('kinetix_custom_workouts');
    if (savedWorkouts) {
      try {
        const parsed = JSON.parse(savedWorkouts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkouts(parsed);
        } else {
          setWorkouts(DEFAULT_WORKOUTS);
          localStorage.setItem('kinetix_custom_workouts', JSON.stringify(DEFAULT_WORKOUTS));
        }
      } catch (err) {
        setWorkouts(DEFAULT_WORKOUTS);
      }
    } else {
      setWorkouts(DEFAULT_WORKOUTS);
      localStorage.setItem('kinetix_custom_workouts', JSON.stringify(DEFAULT_WORKOUTS));
    }
  }, [setUserProfile]);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setSimulatedTime(`${hrs}:${mins} ${ampm}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 30000);
    return () => clearInterval(clockInterval);
  }, []);

  // Workout live time counter (ticks when active and not in dashboard/summary)
  useEffect(() => {
    if (sessionStartTime && screen !== 'SUMMARY' && screen !== 'DASHBOARD' && screen !== 'CREATE_WORKOUT') {
      timerRef.current = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStartTime, screen]);

  // Countdowns rest timer trigger
  useEffect(() => {
    if (isRestTimerActive && restSecondsLeft > 0) {
      restTimerIntervalRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerIntervalRef.current!);
            setIsRestTimerActive(false);
            playAlertChime();
            // Go back to the workout screen when time runs out!
            setTimeout(() => {
              setScreen('WORKOUT_FLOW');
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerIntervalRef.current) {
        clearInterval(restTimerIntervalRef.current);
        restTimerIntervalRef.current = null;
      }
    }
    return () => {
      if (restTimerIntervalRef.current) clearInterval(restTimerIntervalRef.current);
    };
  }, [isRestTimerActive, restSecondsLeft]);

  // ON-DEMAND AI Exercise Guide generator fetcher
  const fetchAiTranslationForExercise = async (name: string) => {
    if (aiGuides[name]) return; // already in cache
    setLoadingAiGuide(true);
    try {
      const response = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseName: name })
      });
      const data = await response.json();
      setAiGuides(prev => ({
        ...prev,
        [name]: {
          properForm: data.properForm || [],
          safetyTips: data.safetyTips || [],
          targetMuscles: data.targetMuscles || []
        }
      }));
    } catch (err) {
      console.error("Failed to generate AI guide:", err);
      // fallback in case of errors
      setAiGuides(prev => ({
        ...prev,
        [name]: {
          properForm: [
            `Installez-vous correctement pour réaliser "${name}".`,
            "Garantissez une amplitude complète et un tronc stable.",
            "Visualisez la contraction des fibres musculaires."
          ],
          safetyTips: [
            "Contrôlez les charges, évitez les secousses brusques.",
            "Vérifiez vos appuis et votre respiration constante."
          ],
          targetMuscles: ["Groupe anatomique de travail"]
        }
      }));
    } finally {
      setLoadingAiGuide(false);
    }
  };

  // Launch guide fetch when active exercise loads in session
  const activeExercise = activeWorkout?.exercises[activeExerciseIndex];
  useEffect(() => {
    if (activeExercise && screen === 'WORKOUT_FLOW') {
      fetchAiTranslationForExercise(activeExercise.name);
    }
  }, [activeExerciseIndex, activeWorkout, screen]);

  // Weight controller handler
  const handleSaveWeight = (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed < 30 || parsed > 300) {
      setWeightError("Saisir un poids valide (30-300 kg)");
      return;
    }
    setWeightError('');
    localStorage.setItem('bb_weight_kg', parsed.toString());
    setUserProfile({ weightKg: parsed });
    setIsEditingWeight(false);
  };

  // Delete saved workout
  const handleDeleteWorkout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer cette séance ?")) {
      const updated = workouts.filter(w => w.id !== id);
      setWorkouts(updated);
      localStorage.setItem('kinetix_custom_workouts', JSON.stringify(updated));
    }
  };

  // Create Workout Draft Manager
  const handleAddExerciseToDraft = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setBuilderError("Donnez un nom à l'exercice");
      return;
    }
    if (draftSets < 1 || draftReps < 1 || draftLoad < 0) {
      setBuilderError("Indiquez des valeurs positives");
      return;
    }
    const newEx: CustomExercise = {
      name: trimmed,
      sets: draftSets,
      reps: draftReps,
      targetLoadKg: draftLoad
    };
    setDraftExercises(prev => [...prev, newEx]);
    setDraftName('');
    setBuilderError('');
  };

  // Save full Workout to localStorage
  const handleSaveWorkoutToDashboard = () => {
    const nameTrimmed = newWorkoutName.trim();
    if (!nameTrimmed) {
      setBuilderError("Veuillez donner un nom à la séance (ex: Push).");
      return;
    }
    if (draftExercises.length === 0) {
      setBuilderError("Ajoutez au moins un exercice à la séance.");
      return;
    }

    const savedWorkout: CustomWorkout = {
      id: 'custom_' + Date.now(),
      name: nameTrimmed,
      exercises: draftExercises
    };

    const updated = [...workouts, savedWorkout];
    setWorkouts(updated);
    localStorage.setItem('kinetix_custom_workouts', JSON.stringify(updated));

    // Clear Drafts
    setNewWorkoutName('');
    setDraftExercises([]);
    setScreen('DASHBOARD');
  };

  // Delete exercise from draft list when building
  const handleRemoveDraftExercise = (index: number) => {
    setDraftExercises(draftExercises.filter((_, i) => i !== index));
  };

  // Session triggers
  const handleStartWorkout = (workout: CustomWorkout) => {
    setActiveWorkout(workout);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
    setCompletedSets([]);
    setSessionDuration(0);
    setSessionStartTime(Date.now());
    setScreen('WORKOUT_FLOW');
  };

  // Complete a active series
  const handleConfirmSeries = () => {
    if (!activeWorkout || !activeExercise) return;

    const targetLoad = activeExercise.targetLoadKg;
    const targetReps = activeExercise.reps;

    const log: SetLog = {
      exerciseIndex: activeExerciseIndex,
      setIndex: activeSetIndex,
      loadKg: targetLoad,
      reps: targetReps,
      completed: true
    };

    const updatedLogs = [...completedSets, log];
    setCompletedSets(updatedLogs);

    // Turn rest timer active
    setRestInitialSeconds(restDuration);
    setRestSecondsLeft(restDuration);
    setIsRestTimerActive(true);
    setScreen('TIMER_MODAL');

    // Index calculation transitions
    if (activeSetIndex + 1 < activeExercise.sets) {
      setActiveSetIndex(prev => prev + 1);
    } else {
      // Current exercise is completely done! Move on to next exercise
      if (activeExerciseIndex + 1 < activeWorkout.exercises.length) {
        setActiveExerciseIndex(prev => prev + 1);
        setActiveSetIndex(0);
      } else {
        // Full workout completes!
      }
    }
  };

  // Skip Recovery
  const handleSkipRecovery = () => {
    setIsRestTimerActive(false);
    if (restTimerIntervalRef.current) clearInterval(restTimerIntervalRef.current);

    if (activeWorkout) {
      const totalRoundsRequired = activeWorkout.exercises.reduce((cumulative, item) => cumulative + item.sets, 0);
      if (completedSets.length >= totalRoundsRequired) {
        setScreen('SUMMARY');
      } else {
        setScreen('WORKOUT_FLOW');
      }
    }
  };

  // Early session cancellation/end
  const handleTerminateWorkoutForce = () => {
    if (confirm("Voulez-vous vraiment terminer la séance maintenant et calculer les kcal consommés ?")) {
      setScreen('SUMMARY');
    }
  };

  // Back to Dashboard
  const handleRestartToDashboard = () => {
    setScreen('DASHBOARD');
    setActiveWorkout(null);
    setCompletedSets([]);
    setSessionStartTime(null);
    setSessionDuration(0);
  };

  // MET calorie dynamic metrics
  const activeLogsCount = completedSets.length;
  const sumCompletedLoads = completedSets.reduce((acc, currentItem) => acc + currentItem.loadKg, 0);
  const averageLoadLoaded = activeLogsCount > 0 ? (sumCompletedLoads / activeLogsCount) : 30;

  const totalBurnedData = calculateWorkoutCalories(
    userProfile?.weightKg || 75.0,
    sessionDuration,
    averageLoadLoaded
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[430px] mx-auto py-2 font-sans select-none">
      
      {/* 3D Smartphone Device Outline bezel */}
      <div className="relative w-full aspect-[9/19.2] bg-[#0c0d12] rounded-[52px] p-3 shadow-[0_0_50px_rgba(0,0,0,0.85),inset_0_4px_10px_rgba(255,255,255,0.1),inset_0_-4px_10px_rgba(0,0,0,0.9)] border-[4.5px] border-slate-800 ring-4 ring-neutral-900/40 flex flex-col justify-between overflow-hidden">
        
        {/* Physical Action Layer inside device */}
        <div id="android-screen-viewport" className="relative flex flex-col w-full h-full bg-[#050505] rounded-[42px] overflow-hidden text-slate-100 ring-1 ring-white/10 flex-1">
          
          {/* Android Notification Bar */}
          <div className="flex items-center justify-between h-9 px-6 pt-2 bg-[#050505] border-b border-white/5 z-30 pointer-events-none select-none text-[11px] font-medium text-slate-300">
            <span className="font-semibold tracking-tight">{simulatedTime}</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-28 h-4.5 bg-black rounded-full border border-neutral-900 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#1a2d52] rounded-full"></span>
              <span className="w-8 h-1 bg-neutral-900 rounded-full"></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="text-slate-300" />
              <div className="flex items-center gap-0.5 font-mono">
                <span className="text-[10px] pr-0.5">{simulatedBattery}%</span>
                <Battery size={13} className="text-emerald-400 fill-emerald-400/30" />
              </div>
            </div>
          </div>

          {/* Device Active screens */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2 flex flex-col justify-between">
            
            {/* 1. DASHBOARD */}
            {screen === 'DASHBOARD' && (
              <div className="flex flex-col justify-between flex-1 h-full py-2 animate-fade-in">
                <div>
                  {/* Bodyweight Setup Bar */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-emerald-500/10 pointer-events-none">
                      <Scale size={46} />
                    </div>
                    {isEditingWeight ? (
                      <form onSubmit={handleSaveWeight} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Mettre à jour mon poids (KG)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            step="0.1"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            className="bg-black/80 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-bold w-24 text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button 
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-md uppercase"
                          >
                            Valider
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsEditingWeight(false)}
                            className="text-white/40 text-[10px] uppercase font-bold"
                          >
                            Annuler
                          </button>
                        </div>
                        {weightError && <p className="text-[10px] text-red-400 font-bold">⚠️ {weightError}</p>}
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase">Mon Poids Clinique</span>
                          <p className="text-xl font-black font-mono text-white mt-1">
                            {userProfile?.weightKg ? userProfile.weightKg.toFixed(1) : '75.0'} <span className="text-xs text-white/40 font-sans">KG</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditingWeight(true)}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase text-white/80 transition"
                          id="edit-weight-btn"
                        >
                          <Scale size={12} className="text-emerald-400" />
                          Configurer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Program list */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black tracking-wider text-white/50 uppercase">Mes Séances</h3>
                    <div className="h-0.5 bg-white/5 flex-1 mx-3" />
                  </div>

                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {workouts.map((wk) => (
                      <div 
                        key={wk.id}
                        onClick={() => handleStartWorkout(wk)}
                        className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 transition cursor-pointer relative"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate uppercase group-hover:text-emerald-400 font-sans">
                            {wk.name}
                          </h4>
                          <p className="text-[11px] text-white/40 truncate mt-1">
                            {wk.exercises.length} {wk.exercises.length > 1 ? 'exercices' : 'exercice'} • {wk.exercises.reduce((acc, exc) => acc + exc.sets, 0)} séries totales
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteWorkout(wk.id, e)}
                            className="p-2 text-white/30 hover:text-red-400 rounded-lg transition hover:bg-white/5"
                            title="Supprimer la séance"
                          >
                            <Trash2 size={13} />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition">
                            <Play size={12} className="fill-current stroke-[3] ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {workouts.length === 0 && (
                      <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10 text-white/40 px-4">
                        <Dumbbell className="mx-auto mb-2 text-white/20" size={24} />
                        <p className="text-xs font-semibold">Aucune séance personnalisée.</p>
                        <p className="text-[10px] mt-1 text-white/30">Cliquez sur le bouton ci-dessous pour créer votre premier entraînement.</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setScreen('CREATE_WORKOUT');
                    setDraftExercises([]);
                    setNewWorkoutName('');
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 px-6 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 shadow-[0_12px_24px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 mt-4"
                  id="create-new-workout-btn"
                >
                  <Plus size={16} className="stroke-[3]" />
                  Créer une nouvelle séance
                </button>
              </div>
            )}

            {/* 2. CREATE_WORKOUT (Custom Workout Builder) */}
            {screen === 'CREATE_WORKOUT' && (
              <div className="flex flex-col justify-between flex-1 h-full py-1 animate-fade-in text-left">
                <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                    <button 
                      onClick={() => setScreen('DASHBOARD')}
                      className="text-white/50 hover:text-white"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">BUILDER DE SÉANCE</span>
                      <h3 className="text-sm font-black text-white uppercase italic leading-none">Nouveau Workout</h3>
                    </div>
                  </div>

                  {/* Workout name and inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-400 tracking-wider uppercase mb-1.5">Nom de la Séance (ex : Push, Jambes)</label>
                      <input 
                        type="text" 
                        placeholder="Ma Séance Perso"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 text-white"
                      />
                    </div>

                    {/* Temporary Draft Exercises List */}
                    {draftExercises.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <span className="text-[9px] font-bold text-white/50 block mb-2 uppercase tracking-wide">Exercices Ajoutés ({draftExercises.length})</span>
                        <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                          {draftExercises.map((ex, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px]">
                              <div className="min-w-0">
                                <span className="font-bold text-white block truncate">{ex.name}</span>
                                <span className="text-[10px] text-white/40">{ex.sets} séries × {ex.reps} reps @ {ex.targetLoadKg} kg</span>
                              </div>
                              <button 
                                onClick={() => handleRemoveDraftExercise(idx)}
                                className="text-red-400 hover:text-red-500 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Exercise Box Form */}
                    <div className="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-3 border border-white/15 space-y-2">
                      <span className="text-[9px] font-black text-white/70 block uppercase tracking-wide">Ajouter un Exercice</span>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-white/40 block font-semibold uppercase">Nom de l'exercice</label>
                        <input 
                          type="text" 
                          placeholder="Développé Couché, Squat, Curl..."
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-white/40 block font-semibold uppercase">Séries</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="10"
                            value={draftSets}
                            onChange={(e) => setDraftSets(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-center text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-white/40 block font-semibold uppercase">Reps</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={draftReps}
                            onChange={(e) => setDraftReps(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-center text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-white/40 block font-semibold uppercase">Charge (kg)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={draftLoad}
                            onChange={(e) => setDraftLoad(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-400 text-center font-bold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddExerciseToDraft}
                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/15 font-black text-[10px] py-1.5 rounded-lg uppercase tracking-wider block transition"
                        id="add-draft-exercise-btn"
                      >
                        + Valider Cet Exercice
                      </button>
                    </div>

                    {builderError && (
                      <p className="text-red-400 text-[10px] font-bold text-center">⚠️ {builderError}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveWorkoutToDashboard}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 rounded-xl text-xs tracking-wider uppercase transition shadow-[0_10px_20px_rgba(16,185,129,0.15)]"
                    id="save-constructed-workout-btn"
                  >
                    Enregistrer la séance
                  </button>
                </div>
              </div>
            )}

            {/* 3. WORKOUT_FLOW (Workout Mode) */}
            {screen === 'WORKOUT_FLOW' && activeExercise && (
              <div className="flex flex-col justify-between flex-1 h-full py-1 animate-fade-in">
                <div>
                  {/* Active workout header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 flex items-center gap-1 uppercase">
                      <Compass size={11} className="animate-spin text-emerald-400" />
                      EXERCICE {activeExerciseIndex + 1} SUR {activeWorkout?.exercises.length || 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/70 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {formatTime(sessionDuration)}
                    </span>
                  </div>

                  {/* Active Card parameters */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg relative overflow-hidden mb-2.5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                      <Dumbbell size={32} className="text-emerald-500/10 rotate-45 transform" />
                    </div>
                    
                    <h3 className="text-base font-black text-white tracking-tight leading-none uppercase italic">
                      {activeExercise.name}
                    </h3>

                    {/* Load & Setup Grid details */}
                    <div className="mt-3 grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[9px] font-bold text-white/40 block uppercase">Charge Prévue</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {activeExercise.targetLoadKg} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-white/40 block uppercase">Séries x Reps</span>
                        <span className="text-xs font-bold text-slate-200">
                          {activeExercise.sets} Séries × {activeExercise.reps} Reps
                        </span>
                      </div>
                    </div>

                    {/* Dots tracker */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-white/50 font-bold uppercase">Séries :</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: activeExercise.sets }).map((_, i) => {
                          const isDone = completedSets.filter(c => c.exerciseIndex === activeExerciseIndex).some(c => c.setIndex === i);
                          const isActive = activeSetIndex === i;
                          return (
                            <span 
                              key={i} 
                              className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black leading-none transition ${
                                isDone 
                                  ? 'bg-emerald-500 text-black font-black' 
                                  : isActive 
                                    ? 'bg-emerald-400 text-black font-black ring-2 ring-emerald-400/30 font-bold' 
                                    : 'bg-white/5 border border-white/10 text-white/40'
                              }`}
                            >
                              {i + 1}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI Generated detailed execution guide sheet */}
                  <div className="bg-white/5 border border-white/10 rounded-xl max-h-[170px] overflow-y-auto pr-1">
                    <div className="p-3 text-left">
                      <span className="text-[9px] font-black tracking-wider text-emerald-400 block mb-2 uppercase border-b border-white/5 pb-1">
                        Fiche technique IA en Français
                      </span>

                      {loadingAiGuide ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-2">
                          <Compass className="animate-spin text-emerald-400" size={18} />
                          <span className="text-[10px] font-bold text-white/50 animate-pulse uppercase tracking-widest font-mono">Génération IA...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* target muscles */}
                          <div>
                            <span className="text-[9.5px] text-white/40 font-bold uppercase block mb-1">Cible anatomique :</span>
                            <div className="flex flex-wrap gap-1">
                              {aiGuides[activeExercise.name]?.targetMuscles?.map((muscle, idx) => (
                                <span key={idx} className="text-[9px] font-black bg-emerald-950/50 text-emerald-400 border border-emerald-800/20 px-2 py-0.5 rounded-full">
                                  🎯 {muscle}
                                </span>
                              )) || <span className="text-[10px] text-white/30 italic">Muscles associés</span>}
                            </div>
                          </div>

                          {/* mechanical form */}
                          <div>
                            <span className="text-[9.5px] text-white/40 font-bold uppercase block mb-0.5">Règles d'exécution :</span>
                            <ul className="text-[10.5px] text-slate-300 list-disc list-outside pl-4 space-y-0.5 leading-normal">
                              {aiGuides[activeExercise.name]?.properForm?.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              )) || (
                                <>
                                  <li>Effectuez des amplitudes de travail complètes.</li>
                                  <li>Contrôlez fermement la phase excentrique.</li>
                                </>
                              )}
                            </ul>
                          </div>

                          {/* safety warnings */}
                          <div className="bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg mt-1">
                            <span className="text-[9.5px] text-rose-400 font-black uppercase flex items-center gap-1 mb-0.5">
                              <ShieldAlert size={11} />
                              SÉCURITÉ :
                            </span>
                            <ul className="text-[10px] text-rose-300 pl-1 space-y-0.5">
                              {aiGuides[activeExercise.name]?.safetyTips?.map((tip, idx) => (
                                <li key={idx}>⚠️ {tip}</li>
                              )) || (
                                <>
                                  <li>⚠️ Ne verrouillez pas excessivement les articulations.</li>
                                  <li>⚠️ Gainez les abdos pour verrouiller le rachis.</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Validation and exit controls */}
                <div className="pt-3 flex flex-col gap-2">
                  <button
                    onClick={handleConfirmSeries}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                    id="validate-set-btn"
                  >
                    Valider la série {activeSetIndex + 1}
                  </button>

                  <button
                    onClick={handleTerminateWorkoutForce}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold py-2 px-6 rounded-xl text-[10.5px] tracking-wide uppercase transition"
                    id="finish-session-btn"
                  >
                    Passer et terminer la séance
                  </button>
                </div>
              </div>
            )}

            {/* 4. TIMER_MODAL (Rest Modal Countdown) */}
            {screen === 'TIMER_MODAL' && (
              <div className="flex flex-col justify-between flex-1 h-full py-2 animate-fade-in text-center">
                <div className="pt-4">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 flex items-center justify-center gap-1 uppercase">
                    <Timer size={12} className="animate-spin text-emerald-400" />
                    Chronomètre de repos en cours
                  </span>
                  
                  {activeExercise && (
                    <p className="text-[11px] text-white/40 mt-1 max-w-[280px] mx-auto truncate uppercase tracking-widest">
                      Suivant : {activeExercise.name} • Série {activeSetIndex + 1}
                    </p>
                  )}
                </div>

                {/* Circular timer element visual */}
                <div className="my-auto relative flex items-center justify-center w-40 h-40 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      className="stroke-white/5 fill-none" 
                      strokeWidth="6" 
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      className="stroke-emerald-500 fill-none" 
                      strokeWidth="6" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * (restSecondsLeft / restInitialSeconds))}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-extrabold font-mono text-white leading-none">
                      {restSecondsLeft}s
                    </span>
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest mt-1">RECUP</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setRestSecondsLeft(prev => prev + 30);
                        setRestInitialSeconds(prev => prev + 30);
                      }}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition"
                      id="add-rest-timer"
                    >
                      + 30s
                    </button>
                    
                    <button
                      onClick={handleSkipRecovery}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition"
                      id="skip-rest-btn"
                    >
                      Passer le repos
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SUMMARY (Workout Statistics Summary) */}
            {screen === 'SUMMARY' && (
              <div className="flex flex-col justify-between flex-1 h-full py-2 animate-fade-in text-left">
                <div>
                  <div className="text-center pt-3 pb-4 border-b border-white/5">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                      <Trophy size={20} className="stroke-[2.5]" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">RAPPORT KINETIX PRO</span>
                    <h3 className="text-xl font-extrabold text-white uppercase italic tracking-tight">Séance Terminée !</h3>
                  </div>

                  {/* Calories calculated */}
                  <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent rounded-2xl p-5 border border-emerald-500/20 text-center my-4 relative overflow-hidden shadow-lg">
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl" />
                    
                    <span className="text-[10px] text-white/50 uppercase font-black tracking-widest flex items-center justify-center gap-1">
                      <Flame size={12} className="text-amber-500 fill-amber-500/50" />
                      ÉNERGIE DÉPENSÉE (MET CLINIQUE)
                    </span>
                    <p className="text-4.5xl font-black font-mono text-emerald-400 italic mt-2 leading-none">
                      {totalBurnedData.calories.toFixed(1)} <span className="text-sm font-sans not-italic font-black text-white/50">KCAL</span>
                    </p>
                    
                    <p className="text-[10.5px] text-white/40 mt-3 max-w-[280px] mx-auto leading-relaxed">
                      Calcul clinique standardisé basé sur votre charge moyenne de lifting (<strong>{averageLoadLoaded.toFixed(1)} kg</strong>) pour un poids de corps de <strong>{userProfile?.weightKg} kg</strong>.
                    </p>
                  </div>

                  {/* Summary performance markers */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-white/40 font-bold uppercase text-[10px]">Durée Sportive :</span>
                      <span className="text-white font-mono font-black">{formatTime(sessionDuration)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-white/40 font-bold uppercase text-[10px]">Séries Validées :</span>
                      <span className="text-emerald-400 font-black">{completedSets.length} / {activeWorkout?.exercises.reduce((acc, exc) => acc + exc.sets, 0) || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-white/40 font-bold uppercase text-[10px]">Coefficient d'Intensité MET :</span>
                      <span className="text-blue-400 font-mono font-black">{totalBurnedData.dynamicMet.toFixed(1)} METs</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRestartToDashboard}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 rounded-xl text-xs tracking-wider uppercase transition shadow-[0_10px_20px_rgba(16,185,129,0.15)] text-center block"
                    id="back-to-dashboard-btn"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simulated Physical Android Soft Navigation bar buttons */}
          <div className="h-10 border-t border-white/5 flex items-center justify-around px-8 bg-[#050505]">
            {/* Soft navbar back (triangle) */}
            <button 
              onClick={() => {
                if (screen === 'CREATE_WORKOUT' || screen === 'WORKOUT_FLOW') {
                  setScreen('DASHBOARD');
                } else if (screen === 'TIMER_MODAL') {
                  setScreen('WORKOUT_FLOW');
                } else if (screen === 'SUMMARY') {
                  handleRestartToDashboard();
                }
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 focus:outline-none transition group active:scale-90"
              title="Android Soft Back Button"
            >
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-400" />
            </button>
            
            {/* Soft navbar home (circle) */}
            <button 
              onClick={() => handleRestartToDashboard()}
              className="w-4 h-4 rounded-full border-[2px] border-slate-400 hover:border-emerald-400 focus:outline-none transition active:scale-90"
              title="Android Soft Home Button"
            />
            
            {/* Soft navbar overview (square) */}
            <button 
              onClick={() => alert(`Écran actif : Émulateur Mobile Jetpack Compose\nÉtape actuelle du code : ${screen}`)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 focus:outline-none transition group active:scale-90"
              title="Android Soft Overview Button"
            >
              <div className="w-3 h-3 rounded-[3px] border-[2px] border-slate-400 group-hover:border-emerald-400" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
