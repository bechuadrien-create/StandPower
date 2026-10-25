import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Check,
  Copy,
  Play,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import {
  AlertBox,
  Badge,
  Button,
  Card,
} from '../../components/ui/Primitives';
import type { ProgramTemplate } from '../../domain/types';

export function ProgramsPage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const getAllExercises = useAppStore((s) => s.getAllExercises);
  const activateProgramTemplate = useAppStore((s) => s.activateProgramTemplate);
  const duplicateProgramTemplate = useAppStore(
    (s) => s.duplicateProgramTemplate
  );
  const archiveProgramTemplate = useAppStore((s) => s.archiveProgramTemplate);
  const replaceExerciseInActiveProgram = useAppStore(
    (s) => s.replaceExerciseInActiveProgram
  );
  const startWorkoutFromProgramSession = useAppStore(
    (s) => s.startWorkoutFromProgramSession
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    snapshot.programTemplates[0]?.id ?? 'prog_beginner_fb_2d'
  );
  const [replacingSlot, setReplacingSlot] = useState<{
    sessionId: string;
    oldExerciseId: string;
  } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const allExercises = getAllExercises();
  const activeInstance = snapshot.programInstances.find(
    (i) => i.status === 'active'
  );

  const visibleTemplates = snapshot.programTemplates.filter((t) =>
    showArchived ? true : !t.isArchived
  );

  const selectedTemplate: ProgramTemplate | undefined =
    visibleTemplates.find((t) => t.id === selectedTemplateId) ??
    visibleTemplates[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Programmes d’entraînement
          </h1>
          <p className="text-xs text-sp-muted">
            8 programmes embarqués complets + personnalisation locale sans altérer l’historique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/onboarding')}
          >
            <Sliders className="w-4 h-4" />
            Questionnaire
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Masquer archivés' : 'Voir archivés'}
          </Button>
        </div>
      </div>

      {/* Programme actif actuellement */}
      {activeInstance && (
        <Card className="border-sp-accent space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge tone="sage">Programme actif</Badge>
              <h2 className="text-lg font-bold mt-1">
                {activeInstance.customName}
              </h2>
              <p className="text-xs text-sp-muted">
                Semaine {activeInstance.currentWeek} • Jours planifiés :{' '}
                {activeInstance.assignedDays.join(', ').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {activeInstance.sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-sp-elevated rounded-xl p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{sess.title}</p>
                    <p className="text-xs text-sp-muted">
                      ~{sess.estimatedDurationMinutes} min • Échauffement :{' '}
                      {sess.warmup.join(' ')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await startWorkoutFromProgramSession(
                        sess,
                        activeInstance
                      );
                      navigate('/musculation');
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Démarrer
                  </Button>
                </div>

                {/* Liste des exercices avec bouton Remplacer */}
                <div className="space-y-1.5 text-xs">
                  {sess.exercises.map((exItem, idx) => {
                    const exObj = allExercises.find(
                      (e) => e.id === exItem.exerciseId
                    );
                    const isReplacingThis =
                      replacingSlot?.sessionId === sess.id &&
                      replacingSlot?.oldExerciseId === exItem.exerciseId;

                    return (
                      <div
                        key={`${exItem.exerciseId}_${idx}`}
                        className="bg-sp-surface rounded-lg p-2.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sp-text">
                              {exObj?.nameFr ?? exItem.exerciseId}
                            </span>
                            <span className="text-sp-muted ml-2 tabular-nums">
                              {exItem.sets} ×{' '}
                              {exItem.durationSeconds
                                ? `${exItem.durationSeconds}s`
                                : `${exItem.repMin}–${exItem.repMax} rép.`}{' '}
                              • {exItem.targetRpeOrRir}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setReplacingSlot(
                                isReplacingThis
                                  ? null
                                  : {
                                      sessionId: sess.id,
                                      oldExerciseId: exItem.exerciseId,
                                    }
                              )
                            }
                            className="text-xs font-medium text-sp-accent hover:underline inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Remplacer
                          </button>
                        </div>

                        {isReplacingThis && (
                          <div className="pt-1 border-t border-sp-border space-y-1.5">
                            <p className="text-[11px] text-sp-muted">
                              Choisir un exercice de remplacement (n’altère aucune séance passée) :
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {allExercises
                                .filter(
                                  (cand) =>
                                    cand.id !== exItem.exerciseId &&
                                    (exObj?.alternativeIds.includes(cand.id) ||
                                      cand.movementPattern ===
                                        exObj?.movementPattern)
                                )
                                .slice(0, 6)
                                .map((cand) => (
                                  <button
                                    key={cand.id}
                                    type="button"
                                    onClick={async () => {
                                      await replaceExerciseInActiveProgram(
                                        sess.id,
                                        exItem.exerciseId,
                                        cand.id
                                      );
                                      setReplacingSlot(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-sp-elevated hover:bg-sp-accent hover:text-sp-accent-fg text-xs font-medium"
                                  >
                                    {cand.nameFr}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Catalogue des 8 programmes embarqués + copies personnalisées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {visibleTemplates.map((tpl) => {
          const isSelected = selectedTemplate?.id === tpl.id;
          const isCurrentlyActive = activeInstance?.templateId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`text-left rounded-2xl p-3.5 border transition-colors ${
                isSelected
                  ? 'bg-sp-surface border-sp-accent shadow-sm'
                  : 'bg-sp-surface/60 border-sp-border hover:border-sp-muted'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge tone={isCurrentlyActive ? 'sage' : 'neutral'}>
                  {tpl.daysPerWeek} j / sem • ~{tpl.estimatedSessionMinutes} min
                </Badge>
                {tpl.isArchived && <Badge tone="warning">Archivé</Badge>}
              </div>
              <h3 className="font-bold text-sm text-sp-text">{tpl.nameFr}</h3>
              <p className="text-xs text-sp-muted line-clamp-2 mt-1">
                {tpl.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Détail complet du programme sélectionné */}
      {selectedTemplate && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="sage">
                  {selectedTemplate.daysPerWeek} séances / semaine
                </Badge>
                <Badge tone="neutral">
                  Cycle de {selectedTemplate.durationWeeks} semaines
                </Badge>
                <Badge tone="terracotta">
                  ~{selectedTemplate.estimatedSessionMinutes} min / séance
                </Badge>
              </div>
              <h2 className="text-lg font-bold mt-1.5">
                {selectedTemplate.nameFr}
              </h2>
              <p className="text-xs text-sp-muted mt-1 leading-relaxed">
                <strong>Public visé :</strong> {selectedTemplate.targetAudience}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => void activateProgramTemplate(selectedTemplate.id)}
              >
                <Check className="w-4 h-4" />
                Activer ce programme
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const dup = await duplicateProgramTemplate(
                    selectedTemplate.id,
                    `${selectedTemplate.nameFr} (Perso)`
                  );
                  setSelectedTemplateId(dup.id);
                }}
              >
                <Copy className="w-4 h-4" />
                Dupliquer
              </Button>
              {!selectedTemplate.isBuiltIn && !selectedTemplate.isArchived && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void archiveProgramTemplate(selectedTemplate.id)
                  }
                >
                  <Archive className="w-4 h-4" />
                  Archiver
                </Button>
              )}
            </div>
          </div>

          {/* Périodisation explicite sur 8 semaines si présente */}
          {selectedTemplate.periodization &&
            selectedTemplate.periodization.length > 0 && (
              <div className="bg-sp-elevated rounded-xl p-3.5 space-y-2">
                <h3 className="text-sm font-bold text-sp-accent">
                  Progression explicite du cycle de 8 semaines & Réévaluation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {selectedTemplate.periodization.map((phase, i) => (
                    <div
                      key={i}
                      className="bg-sp-surface rounded-xl p-3 border border-sp-border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sp-text">
                          {phase.weeks}
                        </span>
                        <Badge tone="neutral">{phase.intensityTarget}</Badge>
                      </div>
                      <p className="font-semibold text-sp-accent">
                        {phase.title}
                      </p>
                      <p className="text-sp-muted leading-relaxed">
                        {phase.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Protocole d'échauffement, progression, allègement et limites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-sp-elevated rounded-xl p-3 space-y-1">
              <p className="font-bold text-sp-text">Échauffement inclus</p>
              <ul className="list-disc list-inside text-sp-muted space-y-1">
                {selectedTemplate.warmupProtocol.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="bg-sp-elevated rounded-xl p-3 space-y-1.5">
              <p className="font-bold text-sp-text">
                Règles de progression & Allègement
              </p>
              <p className="text-sp-muted">
                <strong>Progression :</strong>{' '}
                {selectedTemplate.progressionStrategy}
              </p>
              <p className="text-sp-muted">
                <strong>Allègement (Deload) :</strong>{' '}
                {selectedTemplate.deloadConditions}
              </p>
            </div>
          </div>

          <AlertBox tone="info" title="Explication des limites de ce modèle">
            {selectedTemplate.limitationsExplanation}
          </AlertBox>

          {/* Détail des séances du modèle */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold">
              Séances du programme ({selectedTemplate.sessions.length})
            </h3>
            {selectedTemplate.sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-sp-elevated rounded-xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-sp-text">
                    {sess.title}
                  </span>
                  <span className="text-sp-muted">
                    ~{sess.estimatedDurationMinutes} min
                  </span>
                </div>
                <div className="divide-y divide-sp-border/60">
                  {sess.exercises.map((ex, i) => {
                    const catalogEx = allExercises.find(
                      (e) => e.id === ex.exerciseId
                    );
                    const altNames =
                      catalogEx?.alternativeIds
                        .map(
                          (id) => allExercises.find((e) => e.id === id)?.nameFr
                        )
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(', ') ?? '';
                    return (
                      <div
                        key={i}
                        className="py-2 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-sp-text">
                            {catalogEx?.nameFr ?? ex.exerciseId}
                          </p>
                          {altNames && (
                            <p className="text-[11px] text-sp-muted">
                              Alternatives : {altNames}
                            </p>
                          )}
                        </div>
                        <div className="text-right tabular-nums text-sp-muted">
                          <span className="font-semibold text-sp-text">
                            {ex.sets} séries ×{' '}
                            {ex.durationSeconds
                              ? `${ex.durationSeconds} s`
                              : ex.repMin === ex.repMax
                              ? `${ex.repMin} rép.`
                              : `${ex.repMin}–${ex.repMax} rép.`}
                          </span>
                          <span className="block text-[11px]">
                            Repos {ex.restSeconds}s • {ex.targetRpeOrRir}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
