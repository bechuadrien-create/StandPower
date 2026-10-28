import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Film,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  fetchAiExerciseTechnicalSheet,
  loadFreeExerciseDatabase,
  resolveExerciseVisuals,
  type AnatomicalMuscleId,
  type ExerciseVisualDescriptor,
} from '../services/exerciseMediaService';
import { StickmanAnimator } from './StickmanAnimator';

export interface ExerciseVisualizerProps {
  exerciseName: string;
  compact?: boolean;
}

interface AnatomySvgProps {
  primaryMuscles: AnatomicalMuscleId[];
  secondaryMuscles: AnatomicalMuscleId[];
}

export const AnatomyMapSvg: React.FC<AnatomySvgProps> = ({
  primaryMuscles,
  secondaryMuscles,
}) => {
  const getMuscleColor = (muscle: AnatomicalMuscleId): string => {
    if (primaryMuscles.includes(muscle)) return '#10b981'; // emerald-500
    if (secondaryMuscles.includes(muscle)) return '#d946ef'; // fuchsia-500
    return '#27272a'; // zinc-800 inactive
  };

  const getMuscleOpacity = (muscle: AnatomicalMuscleId): number => {
    if (primaryMuscles.includes(muscle)) return 0.92;
    if (secondaryMuscles.includes(muscle)) return 0.78;
    return 0.45;
  };

  return (
    <div className="rounded-xl border border-sp-border bg-zinc-950/90 p-3 text-zinc-100 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Carte Anatomique des Muscles Ciblés
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Primaire
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" />
            Secondaire
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* VUE DE FACE */}
        <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-2 flex flex-col items-center">
          <span className="text-[11px] font-medium text-zinc-400 mb-1">
            Vue de Face
          </span>
          <svg
            viewBox="0 0 120 220"
            className="w-28 h-44"
            role="img"
            aria-label="Carte anatomique vue de face"
          >
            {/* Tête & Cou */}
            <circle cx="60" cy="20" r="12" fill="#3f3f46" />
            <rect x="55" y="32" width="10" height="8" rx="2" fill="#3f3f46" />

            {/* Épaules (Deltoïdes antérieurs/latéraux) */}
            <ellipse
              cx="36"
              cy="48"
              rx="8"
              ry="10"
              fill={getMuscleColor('Épaules')}
              fillOpacity={getMuscleOpacity('Épaules')}
            />
            <ellipse
              cx="84"
              cy="48"
              rx="8"
              ry="10"
              fill={getMuscleColor('Épaules')}
              fillOpacity={getMuscleOpacity('Épaules')}
            />

            {/* Pectoraux */}
            <rect
              x="44"
              y="42"
              width="15"
              height="18"
              rx="4"
              fill={getMuscleColor('Pectoraux')}
              fillOpacity={getMuscleOpacity('Pectoraux')}
            />
            <rect
              x="61"
              y="42"
              width="15"
              height="18"
              rx="4"
              fill={getMuscleColor('Pectoraux')}
              fillOpacity={getMuscleOpacity('Pectoraux')}
            />

            {/* Biceps & Avant-bras */}
            <rect
              x="26"
              y="58"
              width="9"
              height="24"
              rx="4"
              fill={getMuscleColor('Biceps')}
              fillOpacity={getMuscleOpacity('Biceps')}
            />
            <rect
              x="85"
              y="58"
              width="9"
              height="24"
              rx="4"
              fill={getMuscleColor('Biceps')}
              fillOpacity={getMuscleOpacity('Biceps')}
            />
            <rect x="24" y="84" width="8" height="22" rx="3" fill="#3f3f46" />
            <rect x="88" y="84" width="8" height="22" rx="3" fill="#3f3f46" />

            {/* Sangle abdominale (Abdos) */}
            <rect
              x="46"
              y="62"
              width="28"
              height="36"
              rx="5"
              fill={getMuscleColor('Abdos')}
              fillOpacity={getMuscleOpacity('Abdos')}
            />

            {/* Quadriceps */}
            <rect
              x="43"
              y="102"
              width="15"
              height="48"
              rx="6"
              fill={getMuscleColor('Quadriceps')}
              fillOpacity={getMuscleOpacity('Quadriceps')}
            />
            <rect
              x="62"
              y="102"
              width="15"
              height="48"
              rx="6"
              fill={getMuscleColor('Quadriceps')}
              fillOpacity={getMuscleOpacity('Quadriceps')}
            />

            {/* Mollets (Tibial / Gastrocnémien interne) */}
            <rect
              x="45"
              y="156"
              width="11"
              height="42"
              rx="5"
              fill={getMuscleColor('Mollets')}
              fillOpacity={getMuscleOpacity('Mollets')}
            />
            <rect
              x="64"
              y="156"
              width="11"
              height="42"
              rx="5"
              fill={getMuscleColor('Mollets')}
              fillOpacity={getMuscleOpacity('Mollets')}
            />
          </svg>
        </div>

        {/* VUE DE DOS */}
        <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-2 flex flex-col items-center">
          <span className="text-[11px] font-medium text-zinc-400 mb-1">
            Vue de Dos
          </span>
          <svg
            viewBox="0 0 120 220"
            className="w-28 h-44"
            role="img"
            aria-label="Carte anatomique vue de dos"
          >
            {/* Tête & Cou */}
            <circle cx="60" cy="20" r="12" fill="#3f3f46" />
            <rect x="55" y="32" width="10" height="8" rx="2" fill="#3f3f46" />

            {/* Épaules postérieures */}
            <ellipse
              cx="36"
              cy="48"
              rx="8"
              ry="10"
              fill={getMuscleColor('Épaules')}
              fillOpacity={getMuscleOpacity('Épaules')}
            />
            <ellipse
              cx="84"
              cy="48"
              rx="8"
              ry="10"
              fill={getMuscleColor('Épaules')}
              fillOpacity={getMuscleOpacity('Épaules')}
            />

            {/* Dos (Trapèzes, Grand dorsal, Rhomboïdes) */}
            <polygon
              points="42,40 78,40 74,88 46,88"
              fill={getMuscleColor('Dos')}
              fillOpacity={getMuscleOpacity('Dos')}
            />

            {/* Triceps */}
            <rect
              x="26"
              y="58"
              width="9"
              height="24"
              rx="4"
              fill={getMuscleColor('Triceps')}
              fillOpacity={getMuscleOpacity('Triceps')}
            />
            <rect
              x="85"
              y="58"
              width="9"
              height="24"
              rx="4"
              fill={getMuscleColor('Triceps')}
              fillOpacity={getMuscleOpacity('Triceps')}
            />
            <rect x="24" y="84" width="8" height="22" rx="3" fill="#3f3f46" />
            <rect x="88" y="84" width="8" height="22" rx="3" fill="#3f3f46" />

            {/* Fessiers */}
            <rect
              x="44"
              y="90"
              width="15"
              height="20"
              rx="6"
              fill={getMuscleColor('Fessiers')}
              fillOpacity={getMuscleOpacity('Fessiers')}
            />
            <rect
              x="61"
              y="90"
              width="15"
              height="20"
              rx="6"
              fill={getMuscleColor('Fessiers')}
              fillOpacity={getMuscleOpacity('Fessiers')}
            />

            {/* Ischio-jambiers */}
            <rect
              x="44"
              y="112"
              width="14"
              height="40"
              rx="5"
              fill={getMuscleColor('Ischios')}
              fillOpacity={getMuscleOpacity('Ischios')}
            />
            <rect
              x="62"
              y="112"
              width="14"
              height="40"
              rx="5"
              fill={getMuscleColor('Ischios')}
              fillOpacity={getMuscleOpacity('Ischios')}
            />

            {/* Mollets postérieurs */}
            <rect
              x="45"
              y="156"
              width="11"
              height="42"
              rx="5"
              fill={getMuscleColor('Mollets')}
              fillOpacity={getMuscleOpacity('Mollets')}
            />
            <rect
              x="64"
              y="156"
              width="11"
              height="42"
              rx="5"
              fill={getMuscleColor('Mollets')}
              fillOpacity={getMuscleOpacity('Mollets')}
            />
          </svg>
        </div>
      </div>

      {/* Badges récapitulatifs */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {primaryMuscles.map((m) => (
          <span
            key={`prim-${m}`}
            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          >
            Primaire : {m}
          </span>
        ))}
        {secondaryMuscles.map((m) => (
          <span
            key={`sec-${m}`}
            className="px-2 py-0.5 rounded-md text-xs font-medium bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
          >
            Secondaire : {m}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ExerciseVisualizer: React.FC<ExerciseVisualizerProps> = ({
  exerciseName,
  compact = false,
}) => {
  const [descriptor, setDescriptor] = useState<ExerciseVisualDescriptor>(() =>
    resolveExerciseVisuals(exerciseName)
  );
  const [activeView, setActiveView] = useState<'flipbook' | 'stickman' | 'anatomy'>('flipbook');
  const [frameIndex, setFrameIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    const resolved = resolveExerciseVisuals(exerciseName);
    setDescriptor(resolved);
    setImgError(false);
    setFrameIndex(0);
    // Si l'exercice n'a pas d'image free-exercise-db (ex: drill JJB), bascule sur le Stickman SVG
    if (!resolved.imageUrls) {
      setActiveView('stickman');
    } else {
      setActiveView('flipbook');
    }

    // Précharge la base free-exercise-db en tâche de fond si pas encore en cache
    void loadFreeExerciseDatabase().then((db) => {
      if (db.length > 0 && !resolved.imageUrls) {
        const refreshed = resolveExerciseVisuals(exerciseName);
        if (refreshed.imageUrls) {
          setDescriptor(refreshed);
          setActiveView('flipbook');
        }
      }
    });
  }, [exerciseName]);

  // Alternance automatique du Flipbook toutes les 800ms
  useEffect(() => {
    if (!isPlaying || activeView !== 'flipbook' || !descriptor.imageUrls || imgError) {
      return;
    }
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(timer);
  }, [isPlaying, activeView, descriptor.imageUrls, imgError]);

  const handleEnrichWithGemini = async () => {
    setLoadingAi(true);
    try {
      const enriched = await fetchAiExerciseTechnicalSheet(exerciseName);
      setDescriptor(enriched);
      if (enriched.imageUrls && !imgError) {
        setActiveView('flipbook');
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const hasValidPhotos = Boolean(descriptor.imageUrls && !imgError);

  return (
    <div className="space-y-3 rounded-2xl border border-sp-border bg-sp-surface p-3.5">
      {/* Barre d'onglets de visualisation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {hasValidPhotos && (
            <button
              type="button"
              onClick={() => setActiveView('flipbook')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'flipbook'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-sp-elevated text-sp-muted hover:text-sp-text'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Flipbook Photo
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveView('stickman')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'stickman'
                ? 'bg-violet-500 text-white'
                : 'bg-sp-elevated text-sp-muted hover:text-sp-text'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Stickman 2D
          </button>
          <button
            type="button"
            onClick={() => setActiveView('anatomy')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'anatomy'
                ? 'bg-fuchsia-500 text-white'
                : 'bg-sp-elevated text-sp-muted hover:text-sp-text'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Anatomie SVG
          </button>
        </div>

        <button
          type="button"
          onClick={handleEnrichWithGemini}
          disabled={loadingAi}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/25 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loadingAi ? 'Analyse IA...' : 'Fiche IA Gemini'}
        </button>
      </div>

      {/* NIVEAU 1 : Lecteur Flipbook Animé (800ms) */}
      {activeView === 'flipbook' && hasValidPhotos && descriptor.imageUrls && (
        <div className="rounded-xl border border-sp-border bg-zinc-950/90 p-3 text-zinc-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Flipbook Animé (800 ms) — Position {frameIndex + 1}/2
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((prev) => (prev === 0 ? 1 : 0));
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
              >
                Position 1 / Position 2
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden h-52 border border-zinc-800">
            <img
              src={descriptor.imageUrls[frameIndex]}
              alt={`${exerciseName} - Position ${frameIndex + 1}`}
              onError={() => {
                setImgError(true);
                setActiveView('stickman');
              }}
              className="max-h-full max-w-full object-contain transition-opacity duration-200"
            />
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-950/80 text-zinc-200 border border-zinc-700">
              {frameIndex === 0 ? 'Position 1 : Départ' : 'Position 2 : Fin / Contraction'}
            </span>
          </div>
        </div>
      )}

      {/* NIVEAU 3 : Stickman Cinématique SVG Animé (ou fallback automatique si hors-ligne / drill JJB) */}
      {(activeView === 'stickman' || (activeView === 'flipbook' && !hasValidPhotos)) && (
        <StickmanAnimator
          movementPattern={descriptor.movementPattern}
          combatSubType={descriptor.combatSubType}
          exerciseName={exerciseName}
        />
      )}

      {/* NIVEAU 2 : Carte Anatomique SVG (Face / Dos) */}
      {activeView === 'anatomy' && (
        <AnatomyMapSvg
          primaryMuscles={descriptor.primaryMuscles}
          secondaryMuscles={descriptor.secondaryMuscles}
        />
      )}

      {/* Résumé biomécanique & consignes de sécurité */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-sp-elevated/70 border border-sp-border space-y-1.5">
            <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Consignes d’exécution (Form Cues)
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sp-muted">
              {descriptor.formCues.map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ol>
          </div>

          <div className="p-2.5 rounded-xl bg-sp-elevated/70 border border-sp-border space-y-1.5">
            <p className="font-semibold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Sécurité & Prévention
            </p>
            <ul className="list-disc list-inside space-y-1 text-sp-muted">
              {descriptor.safetyTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
