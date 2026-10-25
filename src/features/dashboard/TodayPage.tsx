import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  HeartPulse,
  Play,
  Scale,
  Utensils,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import { AlertBox, Badge, Button, Card, EmptyState } from '../../components/ui/Primitives';
import {
  addDaysToCivilDate,
  diffCivilDays,
  formatCivilDateFr,
  getLocalCivilDate,
} from '../../domain/calculations/units';
import { evaluateRecoveryCheckIn } from '../../domain/recommendations/recoveryAdjustment';
import type { RecoveryCheckIn } from '../../domain/types';

type Scale5 = 1 | 2 | 3 | 4 | 5;

function startOfWeekMonday(civil: string): string {
  const [y, m, d] = civil.split('-').map(Number);
  const js = new Date(y, m - 1, d, 12).getDay(); // 0 = dimanche
  const offset = js === 0 ? -6 : 1 - js;
  return addDaysToCivilDate(civil, offset);
}

function ScaleSelector({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: Scale5;
  onChange: (v: Scale5) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold mb-1">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label} : ${n} sur 5`}
            onClick={() => onChange(n)}
            className={`touch-target rounded-xl text-sm font-semibold border tabular-nums ${
              value === n
                ? 'bg-sp-accent text-sp-accent-fg border-sp-accent'
                : 'bg-sp-elevated border-sp-border text-sp-text'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-sp-muted mt-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}

export function TodayPage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const startWorkoutFromProgramSession = useAppStore((s) => s.startWorkoutFromProgramSession);
  const postponeScheduledSession = useAppStore((s) => s.postponeScheduledSession);
  const saveRecoveryCheckIn = useAppStore((s) => s.saveRecoveryCheckIn);

  const today = getLocalCivilDate();
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(today));
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [energy, setEnergy] = useState<Scale5>(3);
  const [fatigue, setFatigue] = useState<Scale5>(3);
  const [soreness, setSoreness] = useState<Scale5>(2);
  const [sleepQuality, setSleepQuality] = useState<Scale5>(3);
  const [pain, setPain] = useState(false);
  const [painNote, setPainNote] = useState('');

  const profile = snapshot.userProfile;
  const activeWorkout = snapshot.workoutSessions.find(
    (w) => w.status === 'in_progress' || w.status === 'paused'
  );
  const activeInstance = snapshot.programInstances.find((p) => p.status === 'active');
  const todayCheckIn = snapshot.recoveryCheckIns.find((c) => c.civilDate === today);

  const nextScheduled = useMemo(
    () =>
      [...snapshot.scheduledSessions]
        .filter(
          (s) =>
            (s.status === 'planned' || s.status === 'postponed') && s.scheduledDate >= today
        )
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0],
    [snapshot.scheduledSessions, today]
  );

  const weekStart = startOfWeekMonday(today);
  const weekEnd = addDaysToCivilDate(weekStart, 6);
  const completedThisWeek = snapshot.workoutSessions.filter(
    (w) => w.status === 'completed' && w.civilDate >= weekStart && w.civilDate <= weekEnd
  );
  const combatThisWeek = snapshot.combatSessions.filter(
    (c) => c.civilDate >= weekStart && c.civilDate <= weekEnd
  );
  const combatMinutesWeek = combatThisWeek.reduce((a, c) => a + c.totalDurationMinutes, 0);

  // Messages factuels fondés uniquement sur les données réelles
  const factualMessages = useMemo(() => {
    const msgs: string[] = [];
    const n = completedThisWeek.length;
    if (n > 0) {
      msgs.push(
        `${n === 1 ? 'Une séance' : `${n} séances`} de musculation réalisée${n > 1 ? 's' : ''} cette semaine.`
      );
    }
    if (combatThisWeek.length > 0) {
      msgs.push(
        `${combatThisWeek.length} séance${combatThisWeek.length > 1 ? 's' : ''} de combat cette semaine (${combatMinutesWeek} min).`
      );
    }
    const lastUpper = snapshot.workoutSessions
      .filter((w) => w.status === 'completed' && /haut/i.test(w.title))
      .sort((a, b) => b.civilDate.localeCompare(a.civilDate))[0];
    if (lastUpper) {
      const days = diffCivilDays(lastUpper.civilDate, today);
      if (days >= 2) msgs.push(`Ta dernière séance haut du corps date de ${days} jours.`);
    }
    if (nextScheduled && nextScheduled.scheduledDate === today) {
      const tplSession = activeInstance?.sessions.find(
        (s) => s.id === nextScheduled.sessionTemplateId
      );
      if (tplSession && tplSession.estimatedDurationMinutes <= 30) {
        msgs.push('Une séance courte est prévue aujourd’hui.');
      }
    }
    return msgs;
  }, [completedThisWeek.length, combatThisWeek.length, combatMinutesWeek, snapshot.workoutSessions, nextScheduled, today, activeInstance]);

  const guidance = evaluateRecoveryCheckIn({
    energy,
    fatigue,
    soreness,
    sleepQuality,
    unusualPainOrIllness: pain,
  });

  const savedGuidance = todayCheckIn
    ? evaluateRecoveryCheckIn({
        energy: todayCheckIn.energy,
        fatigue: todayCheckIn.fatigue,
        soreness: todayCheckIn.soreness,
        sleepQuality: todayCheckIn.sleepQuality,
        unusualPainOrIllness: todayCheckIn.unusualPainOrIllness,
      })
    : null;

  const launchScheduled = async (adjustment: 'none' | 'reduced_volume' | 'lighter_session') => {
    if (!nextScheduled || !activeInstance) {
      navigate('/musculation');
      return;
    }
    const sess =
      activeInstance.sessions.find((s) => s.id === nextScheduled.sessionTemplateId) ??
      activeInstance.sessions[0];
    if (sess) await startWorkoutFromProgramSession(sess, activeInstance, adjustment);
    navigate('/musculation');
  };

  const adjustmentFromCheckIn = (a?: RecoveryCheckIn['suggestedAdjustment']) =>
    a === 'reduce_volume' ? 'reduced_volume' : a === 'lighter_session' ? 'lighter_session' : 'none';

  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysToCivilDate(weekAnchor, i));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-sp-muted">
          {greeting}
          {profile?.displayName ? `, ${profile.displayName}` : ''}
        </p>
        <h1 className="text-xl font-bold tracking-tight capitalize">{formatCivilDateFr(today)}</h1>
      </div>

      {!snapshot.userPreferences.onboardingCompleted && (
        <Card className="space-y-3 border-sp-accent">
          <h2 className="text-base font-bold">Configurer ton carnet</h2>
          <p className="text-sm text-sp-muted">
            Réponds à un questionnaire court pour obtenir un programme explicable, adapté à ton
            matériel, ton temps et ta pratique de combat. Tout reste sur ton appareil.
          </p>
          <Button variant="primary" onClick={() => navigate('/onboarding')}>
            Démarrer le questionnaire
          </Button>
        </Card>
      )}

      {/* Reprise de séance */}
      {activeWorkout && (
        <Card className="border-sp-accent flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge tone="sage">Séance en cours</Badge>
            <p className="font-bold mt-1">{activeWorkout.title}</p>
            <p className="text-xs text-sp-muted">Sauvegardée automatiquement après chaque action.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/musculation')}>
            <Play className="w-4 h-4" />
            Reprendre la séance
          </Button>
        </Card>
      )}

      {/* Prochaine séance */}
      {!activeWorkout && snapshot.userPreferences.onboardingCompleted && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Prochaine séance</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate('/programmes')}>
              Programmes
            </Button>
          </div>
          {nextScheduled ? (
            <>
              <div>
                <p className="font-semibold">{nextScheduled.title}</p>
                <p className="text-xs text-sp-muted">
                  {nextScheduled.scheduledDate === today
                    ? "Prévue aujourd'hui"
                    : `Prévue ${formatCivilDateFr(nextScheduled.scheduledDate)}`}
                  {nextScheduled.status === 'postponed' && ' (reportée)'}
                </p>
              </div>
              {savedGuidance && savedGuidance.suggestedAdjustment !== 'keep_session' && (
                <AlertBox tone="warning" title={savedGuidance.titleFr}>
                  {savedGuidance.explanationFr}
                </AlertBox>
              )}
              <div className="flex flex-wrap gap-2">
                {nextScheduled.sessionType === 'strength' ? (
                  <Button
                    variant="primary"
                    onClick={() =>
                      void launchScheduled(adjustmentFromCheckIn(todayCheckIn?.suggestedAdjustment))
                    }
                  >
                    <Play className="w-4 h-4" />
                    Démarrer
                    {todayCheckIn?.suggestedAdjustment === 'reduce_volume'
                      ? ' (volume réduit)'
                      : todayCheckIn?.suggestedAdjustment === 'lighter_session'
                      ? ' (allégée)'
                      : ''}
                  </Button>
                ) : (
                  <Button variant="terracotta" onClick={() => navigate('/combat')}>
                    Noter la séance de combat
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => void postponeScheduledSession(nextScheduled.id, 1)}
                >
                  Reporter à demain
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-sp-muted">
              Aucune séance planifiée à venir. Active un programme ou démarre une séance libre.
            </p>
          )}
        </Card>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-3 gap-2.5">
        <Button variant="secondary" size="lg" onClick={() => navigate('/musculation')} className="flex-col !gap-1 h-20">
          <Dumbbell className="w-5 h-5" />
          <span className="text-xs">Musculation</span>
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/combat?tab=timer')} className="flex-col !gap-1 h-20">
          <Clock className="w-5 h-5" />
          <span className="text-xs">Rounds</span>
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/progression?add=weight')} className="flex-col !gap-1 h-20">
          <Scale className="w-5 h-5" />
          <span className="text-xs">Poids</span>
        </Button>
      </div>

      {/* Check-in récupération facultatif */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-sp-accent" />
            Check-in du jour (facultatif)
          </h2>
          {!showCheckIn && (
            <Button size="sm" variant="secondary" onClick={() => setShowCheckIn(true)}>
              {todayCheckIn ? 'Refaire' : 'Remplir'}
            </Button>
          )}
        </div>
        {todayCheckIn && !showCheckIn && savedGuidance && (
          <p className="text-sm text-sp-muted">
            <strong className="text-sp-text">{savedGuidance.titleFr}.</strong>{' '}
            {savedGuidance.explanationFr}
          </p>
        )}
        {showCheckIn && (
          <div className="space-y-3">
            <ScaleSelector label="Énergie" value={energy} onChange={setEnergy} lowLabel="Très basse" highLabel="Très haute" />
            <ScaleSelector label="Fatigue" value={fatigue} onChange={setFatigue} lowLabel="Aucune" highLabel="Très forte" />
            <ScaleSelector label="Courbatures" value={soreness} onChange={setSoreness} lowLabel="Aucune" highLabel="Très fortes" />
            <ScaleSelector label="Sommeil ressenti" value={sleepQuality} onChange={setSleepQuality} lowLabel="Très mauvais" highLabel="Très bon" />
            <label className="flex items-center gap-2.5 min-h-[44px] text-sm">
              <input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} className="w-5 h-5" />
              Douleur inhabituelle, malaise ou blessure
            </label>
            {pain && (
              <input
                type="text"
                value={painNote}
                onChange={(e) => setPainNote(e.target.value)}
                placeholder="Zone concernée (facultatif)"
                aria-label="Zone de la douleur"
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              />
            )}
            <AlertBox tone={guidance.suggestedAdjustment === 'suspend_and_consult' ? 'warning' : 'info'} title={guidance.titleFr}>
              {guidance.explanationFr}
            </AlertBox>
            <p className="text-[11px] text-sp-muted">
              Ce check-in n’est ni un diagnostic ni une mesure médicale. Aucun score n’est calculé.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={async () => {
                  await saveRecoveryCheckIn({
                    civilDate: today,
                    energy,
                    fatigue,
                    soreness,
                    sleepQuality,
                    unusualPainOrIllness: pain,
                    painAreaNote: painNote.trim() || undefined,
                    suggestedAdjustment: guidance.suggestedAdjustment,
                  });
                  setShowCheckIn(false);
                }}
              >
                Enregistrer
              </Button>
              <Button variant="ghost" onClick={() => setShowCheckIn(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Résumé de la semaine */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sp-accent" />
            Semaine
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Semaine précédente" onClick={() => setWeekAnchor(addDaysToCivilDate(weekAnchor, -7))} className="touch-target rounded-lg text-sp-muted hover:text-sp-text flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" aria-label="Semaine suivante" onClick={() => setWeekAnchor(addDaysToCivilDate(weekAnchor, 7))} className="touch-target rounded-lg text-sp-muted hover:text-sp-text flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const done = snapshot.workoutSessions.some((w) => w.status === 'completed' && w.civilDate === d);
            const combat = snapshot.combatSessions.some((c) => c.civilDate === d);
            const planned = snapshot.scheduledSessions.some(
              (s) => s.scheduledDate === d && (s.status === 'planned' || s.status === 'postponed')
            );
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`rounded-xl p-1.5 text-center border ${isToday ? 'border-sp-accent' : 'border-sp-border'} bg-sp-elevated`}
              >
                <p className="text-[10px] uppercase text-sp-muted">{formatCivilDateFr(d).split(' ')[0]}</p>
                <p className="text-sm font-bold tabular-nums">{Number(d.slice(8))}</p>
                <div className="flex flex-col items-center gap-0.5 mt-1 min-h-[28px] text-[9px] font-semibold">
                  {done && <span className="text-sp-success">Muscu ✓</span>}
                  {combat && <span className="text-sp-terracotta">Combat ✓</span>}
                  {planned && !done && <span className="text-sp-muted">Prévu</span>}
                </div>
              </div>
            );
          })}
        </div>

        {factualMessages.length > 0 ? (
          <ul className="text-sm space-y-1">
            {factualMessages.map((m) => (
              <li key={m} className="text-sp-text">{m}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-sp-muted">Aucune séance enregistrée cette semaine pour l’instant.</p>
        )}
      </Card>

      {/* Repère nutritionnel facultatif */}
      {snapshot.nutritionTarget && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-sp-accent" />
            <div>
              <p className="text-sm font-semibold">Repère nutritionnel</p>
              <p className="text-xs text-sp-muted tabular-nums">
                {snapshot.nutritionTarget.mode === 'educational_only' ||
                snapshot.userPreferences.nutritionGuidanceStyle === 'simple_advice'
                  ? 'Conseils généraux disponibles'
                  : `${snapshot.nutritionTarget.targetKcalMin === snapshot.nutritionTarget.targetKcalMax ? `~${snapshot.nutritionTarget.targetKcalMin}` : `${snapshot.nutritionTarget.targetKcalMin}–${snapshot.nutritionTarget.targetKcalMax}`} kcal/j (estimation)`}
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/nutrition')}>
            Voir
          </Button>
        </Card>
      )}

      {snapshot.userPreferences.onboardingCompleted &&
        snapshot.workoutSessions.length === 0 &&
        snapshot.combatSessions.length === 0 && (
          <EmptyState
            title="Ton historique est vide"
            description="Démarre ta première séance : aucune charge n’est imposée, tu saisis simplement ce que tu fais réellement."
          />
        )}
    </div>
  );
}
