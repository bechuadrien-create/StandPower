import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import { AlertBox, Button, Card, EmptyState, FieldError } from '../../components/ui/Primitives';
import { LazyMetricsChart } from '../../components/charts/LazyMetricsChart';
import {
  addDaysToCivilDate,
  cmToIn,
  formatCivilDateFr,
  formatLength,
  formatWeight,
  getLocalCivilDate,
  inToCm,
  kgToLb,
  parseFrenchDecimal,
  parseWeightFromInput,
} from '../../domain/calculations/units';
import {
  computeMovingAverageSeries,
  filterSeriesByPeriod,
  type TimePeriodFilter,
} from '../../domain/calculations/timeSeries';
import { calculateExerciseVolume, estimateBrzycki1RM } from '../../domain/calculations/strength';
import {
  BodyMeasurementValidationSchema,
  WeightEntryValidationSchema,
} from '../../domain/validation/schemas';
import type { BodyMeasurement, WeightEntry } from '../../domain/types';

const PERIODS: { id: TimePeriodFilter; label: string }[] = [
  { id: '7d', label: '7 j' },
  { id: '30d', label: '30 j' },
  { id: '90d', label: '90 j' },
  { id: 'all', label: 'Tout' },
];

type MeasurementKey = 'waistCm' | 'hipsCm' | 'chestCm' | 'armCm' | 'thighCm';
const MEASUREMENT_FIELDS: { key: MeasurementKey; label: string }[] = [
  { key: 'waistCm', label: 'Tour de taille' },
  { key: 'hipsCm', label: 'Tour de hanches' },
  { key: 'chestCm', label: 'Tour de poitrine' },
  { key: 'armCm', label: 'Tour de bras' },
  { key: 'thighCm', label: 'Tour de cuisse' },
];

export function ProgressPage() {
  const [searchParams] = useSearchParams();
  const snapshot = useAppStore((s) => s.snapshot);
  const saveWeightEntry = useAppStore((s) => s.saveWeightEntry);
  const deleteWeightEntry = useAppStore((s) => s.deleteWeightEntry);
  const saveBodyMeasurement = useAppStore((s) => s.saveBodyMeasurement);
  const deleteBodyMeasurement = useAppStore((s) => s.deleteBodyMeasurement);

  const weightUnit = snapshot.userPreferences.weightUnit;
  const lengthUnit = snapshot.userPreferences.lengthUnit;
  const today = getLocalCivilDate();

  const [period, setPeriod] = useState<TimePeriodFilter>('30d');
  const [showWeightForm, setShowWeightForm] = useState(searchParams.get('add') === 'weight');
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [weightDate, setWeightDate] = useState(today);
  const [weightInput, setWeightInput] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [showMeasForm, setShowMeasForm] = useState(false);
  const [editingMeas, setEditingMeas] = useState<BodyMeasurement | null>(null);
  const [measDate, setMeasDate] = useState(today);
  const [measInputs, setMeasInputs] = useState<Record<MeasurementKey, string>>({
    waistCm: '', hipsCm: '', chestCm: '', armCm: '', thighCm: '',
  });
  const [measNotes, setMeasNotes] = useState('');
  const [measError, setMeasError] = useState<string | null>(null);
  const [selectedMeasKey, setSelectedMeasKey] = useState<MeasurementKey>('waistCm');

  const completed = snapshot.workoutSessions.filter((w) => w.status === 'completed');
  const exerciseOptions = useMemo(() => {
    const map = new Map<string, string>();
    completed.forEach((w) => w.exercises.forEach((e) => {
      if (e.measurementTypeSnapshot === 'weight_reps') map.set(e.exerciseId, e.exerciseNameSnapshot);
    }));
    return Array.from(map.entries());
  }, [completed]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const exId = selectedExerciseId || exerciseOptions[0]?.[0] || '';

  // Séries de données réelles
  const weightSeries = useMemo(() => {
    const pts = snapshot.weightEntries.map((w) => ({
      civilDate: w.civilDate,
      value: Number((weightUnit === 'lb' ? kgToLb(w.weightKg) : w.weightKg).toFixed(1)),
    }));
    // la moyenne mobile est calculée sur tout l'historique, puis filtrée
    const withMa = computeMovingAverageSeries(pts, 7);
    return filterSeriesByPeriod(withMa, period, today);
  }, [snapshot.weightEntries, weightUnit, period, today]);

  const measSeries = useMemo(() => {
    const pts = snapshot.bodyMeasurements
      .filter((m) => typeof m[selectedMeasKey] === 'number')
      .map((m) => {
        const cm = m[selectedMeasKey] as number;
        return { civilDate: m.civilDate, value: Number((lengthUnit === 'in' ? cmToIn(cm) : cm).toFixed(1)) };
      });
    return filterSeriesByPeriod(pts, period, today);
  }, [snapshot.bodyMeasurements, selectedMeasKey, lengthUnit, period, today]);

  const frequencySeries = useMemo(() => {
    // séances terminées (muscu + combat) par semaine ISO commençant le lundi
    const all = [
      ...completed.map((w) => w.civilDate),
      ...snapshot.combatSessions.map((c) => c.civilDate),
    ];
    const byWeek = new Map<string, number>();
    all.forEach((d) => {
      const [y, m, dd] = d.split('-').map(Number);
      const js = new Date(y, m - 1, dd, 12).getDay();
      const monday = addDaysToCivilDate(d, js === 0 ? -6 : 1 - js);
      byWeek.set(monday, (byWeek.get(monday) ?? 0) + 1);
    });
    const pts = Array.from(byWeek.entries()).map(([civilDate, value]) => ({ civilDate, value }));
    return filterSeriesByPeriod(pts, period, today);
  }, [completed, snapshot.combatSessions, period, today]);

  const exerciseVolumeSeries = useMemo(() => {
    if (!exId) return [];
    const pts = completed
      .map((w) => {
        const exs = w.exercises.filter((e) => e.exerciseId === exId);
        if (exs.length === 0) return null;
        const vol = exs.reduce((a, e) => a + calculateExerciseVolume(e.sets, e.measurementTypeSnapshot).volumeKgReps, 0);
        return vol > 0 ? { civilDate: w.civilDate, value: Number(vol.toFixed(1)) } : null;
      })
      .filter((p): p is { civilDate: string; value: number } => p !== null);
    return filterSeriesByPeriod(pts, period, today);
  }, [completed, exId, period, today]);

  const exercise1RmSeries = useMemo(() => {
    if (!exId) return [];
    const pts = completed
      .map((w) => {
        let best = 0;
        w.exercises.filter((e) => e.exerciseId === exId).forEach((e) =>
          e.sets.forEach((s) => {
            if (!s.isCompleted || s.setType !== 'working' || s.weightKg === undefined || s.reps === undefined) return;
            const r = estimateBrzycki1RM(s.weightKg, s.reps, 'weight_reps');
            if (r.valid && r.estimated1RMKg !== null && r.estimated1RMKg > best) best = r.estimated1RMKg;
          })
        );
        if (best <= 0) return null;
        return { civilDate: w.civilDate, value: Number((weightUnit === 'lb' ? kgToLb(best) : best).toFixed(1)) };
      })
      .filter((p): p is { civilDate: string; value: number } => p !== null);
    return filterSeriesByPeriod(pts, period, today);
  }, [completed, exId, period, today, weightUnit]);

  const combatMinutesSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    snapshot.combatSessions.forEach((c) => byDate.set(c.civilDate, (byDate.get(c.civilDate) ?? 0) + c.totalDurationMinutes));
    const pts = Array.from(byDate.entries()).map(([civilDate, value]) => ({ civilDate, value }));
    return filterSeriesByPeriod(pts, period, today);
  }, [snapshot.combatSessions, period, today]);

  const openWeightForm = (entry?: WeightEntry) => {
    setEditingWeight(entry ?? null);
    setWeightDate(entry?.civilDate ?? today);
    setWeightInput(entry ? String(Number((weightUnit === 'lb' ? kgToLb(entry.weightKg) : entry.weightKg).toFixed(2))).replace('.', ',') : '');
    setWeightNotes(entry?.notes ?? '');
    setWeightError(null);
    setShowWeightForm(true);
  };

  const submitWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingWeight) return;
    const kg = parseWeightFromInput(weightInput, weightUnit);
    if (kg === null) {
      setWeightError('Saisis un poids numérique (la virgule est acceptée).');
      return;
    }
    const parsed = WeightEntryValidationSchema.safeParse({ civilDate: weightDate, weightKg: kg, notes: weightNotes.trim() || undefined });
    if (!parsed.success) {
      setWeightError(parsed.error.issues[0]?.message ?? 'Valeur invalide.');
      return;
    }
    setSavingWeight(true);
    try {
      await saveWeightEntry({ id: editingWeight?.id, ...parsed.data });
      setShowWeightForm(false);
      setEditingWeight(null);
    } finally {
      setSavingWeight(false);
    }
  };

  const openMeasForm = (m?: BodyMeasurement) => {
    setEditingMeas(m ?? null);
    setMeasDate(m?.civilDate ?? today);
    const toInput = (v?: number) => (v === undefined ? '' : String(Number((lengthUnit === 'in' ? cmToIn(v) : v).toFixed(1))).replace('.', ','));
    setMeasInputs({
      waistCm: toInput(m?.waistCm), hipsCm: toInput(m?.hipsCm), chestCm: toInput(m?.chestCm),
      armCm: toInput(m?.armCm), thighCm: toInput(m?.thighCm),
    });
    setMeasNotes(m?.notes ?? '');
    setMeasError(null);
    setShowMeasForm(true);
  };

  const submitMeas = async (e: React.FormEvent) => {
    e.preventDefault();
    const values: Partial<Record<MeasurementKey, number>> = {};
    for (const f of MEASUREMENT_FIELDS) {
      const raw = measInputs[f.key].trim();
      if (raw === '') continue;
      const n = parseFrenchDecimal(raw);
      if (n === null) {
        setMeasError(`${f.label} : valeur non numérique.`);
        return;
      }
      values[f.key] = lengthUnit === 'in' ? inToCm(n) : n;
    }
    if (Object.keys(values).length === 0) {
      setMeasError('Renseigne au moins une mensuration.');
      return;
    }
    const parsed = BodyMeasurementValidationSchema.safeParse({ civilDate: measDate, ...values, notes: measNotes.trim() || undefined });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = MEASUREMENT_FIELDS.find((f) => f.key === issue?.path[0]);
      setMeasError(`${field?.label ?? 'Valeur'} hors plage plausible.`);
      return;
    }
    await saveBodyMeasurement({ id: editingMeas?.id, ...parsed.data });
    setShowMeasForm(false);
  };

  const inputCls = 'w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums';
  const sortedWeights = [...snapshot.weightEntries].sort((a, b) => b.civilDate.localeCompare(a.civilDate));
  const sortedMeas = [...snapshot.bodyMeasurements].sort((a, b) => b.civilDate.localeCompare(a.civilDate));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Progression</h1>
        <p className="text-xs text-sp-muted">Graphiques construits uniquement à partir de tes données réelles.</p>
      </div>

      <div role="group" aria-label="Période" className="grid grid-cols-4 gap-1.5 bg-sp-surface p-1.5 rounded-2xl border border-sp-border">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={`touch-target rounded-xl text-sm font-medium ${period === p.id ? 'bg-sp-accent text-sp-accent-fg font-semibold' : 'text-sp-muted'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* POIDS */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">Poids ({weightUnit})</h2>
          <Button size="sm" variant="primary" onClick={() => openWeightForm()}>
            <Plus className="w-4 h-4" /> Ajouter une pesée
          </Button>
        </div>

        {showWeightForm && (
          <form onSubmit={submitWeight} className="bg-sp-elevated rounded-xl p-3 space-y-2.5" noValidate>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="w-date" className="text-xs text-sp-muted block mb-1">Date</label>
                <input id="w-date" type="date" max={today} value={weightDate} onChange={(e) => setWeightDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="w-val" className="text-xs text-sp-muted block mb-1">Poids ({weightUnit})</label>
                <input
                  id="w-val"
                  type="text"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="75,4"
                  aria-invalid={Boolean(weightError)}
                  aria-describedby={weightError ? 'w-err' : undefined}
                  className={inputCls}
                />
              </div>
            </div>
            <input type="text" value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)} placeholder="Note facultative (ex : à jeun)" aria-label="Note de pesée" className={inputCls} />
            <FieldError id="w-err" message={weightError} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={savingWeight}>{editingWeight ? 'Mettre à jour' : 'Enregistrer'}</Button>
              <Button variant="ghost" onClick={() => setShowWeightForm(false)}>Annuler</Button>
            </div>
          </form>
        )}

        <LazyMetricsChart title="Poids" unitLabel={weightUnit} data={weightSeries} showMovingAverage={weightSeries.some((p) => p.movingAverage7d !== undefined)} />
        {weightSeries.some((p) => p.movingAverage7d !== undefined) && (
          <p className="text-[11px] text-sp-muted">Ligne pointillée : moyenne mobile sur 7 jours (affichée seulement avec au moins 2 pesées dans la fenêtre).</p>
        )}
        <p className="text-[11px] text-sp-muted">
          Une variation de poids ne permet pas à elle seule de conclure à une prise de muscle ou à une perte de graisse (eau, contenu digestif, glycogène…). Observe la tendance sur plusieurs semaines.
        </p>

        {sortedWeights.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {sortedWeights.map((w) => (
              <div key={w.id} className="bg-sp-elevated rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-semibold tabular-nums">{formatWeight(w.weightKg, weightUnit)}</span>
                  <span className="text-xs text-sp-muted ml-2">{formatCivilDateFr(w.civilDate)}</span>
                  {w.notes && <span className="block text-xs text-sp-muted">{w.notes}</span>}
                </div>
                {confirmDeleteId === w.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="danger" onClick={() => { void deleteWeightEntry(w.id); setConfirmDeleteId(null); }}>Confirmer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Non</Button>
                  </div>
                ) : (
                  <div className="flex">
                    <button type="button" aria-label={`Modifier la pesée du ${formatCivilDateFr(w.civilDate)}`} onClick={() => openWeightForm(w)} className="touch-target flex items-center justify-center text-sp-muted hover:text-sp-text"><Edit3 className="w-4 h-4" /></button>
                    <button type="button" aria-label={`Supprimer la pesée du ${formatCivilDateFr(w.civilDate)}`} onClick={() => setConfirmDeleteId(w.id)} className="touch-target flex items-center justify-center text-sp-muted hover:text-sp-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MENSURATIONS */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">Mensurations ({lengthUnit})</h2>
          <Button size="sm" variant="secondary" onClick={() => openMeasForm()}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        {showMeasForm && (
          <form onSubmit={submitMeas} className="bg-sp-elevated rounded-xl p-3 space-y-2.5" noValidate>
            <div>
              <label htmlFor="m-date" className="text-xs text-sp-muted block mb-1">Date</label>
              <input id="m-date" type="date" max={today} value={measDate} onChange={(e) => setMeasDate(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MEASUREMENT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`m-${f.key}`} className="text-xs text-sp-muted block mb-1">{f.label}</label>
                  <input
                    id={`m-${f.key}`}
                    type="text"
                    inputMode="decimal"
                    value={measInputs[f.key]}
                    onChange={(e) => setMeasInputs({ ...measInputs, [f.key]: e.target.value })}
                    placeholder="—"
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <input type="text" value={measNotes} onChange={(e) => setMeasNotes(e.target.value)} placeholder="Note facultative" aria-label="Note de mensuration" className={inputCls} />
            <FieldError id="m-err" message={measError} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary">{editingMeas ? 'Mettre à jour' : 'Enregistrer'}</Button>
              <Button variant="ghost" onClick={() => setShowMeasForm(false)}>Annuler</Button>
            </div>
          </form>
        )}

        <select value={selectedMeasKey} onChange={(e) => setSelectedMeasKey(e.target.value as MeasurementKey)} aria-label="Mensuration affichée" className={inputCls}>
          {MEASUREMENT_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <LazyMetricsChart title={MEASUREMENT_FIELDS.find((f) => f.key === selectedMeasKey)?.label ?? ''} unitLabel={lengthUnit} data={measSeries} />

        {sortedMeas.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {sortedMeas.map((m) => (
              <div key={m.id} className="bg-sp-elevated rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold">{formatCivilDateFr(m.civilDate)}</span>
                  <span className="block text-sp-muted tabular-nums">
                    {MEASUREMENT_FIELDS.filter((f) => m[f.key] !== undefined).map((f) => `${f.label.replace('Tour de ', '')} ${formatLength(m[f.key] as number, lengthUnit)}`).join(' · ')}
                  </span>
                </div>
                {confirmDeleteId === m.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="danger" onClick={() => { void deleteBodyMeasurement(m.id); setConfirmDeleteId(null); }}>Confirmer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Non</Button>
                  </div>
                ) : (
                  <div className="flex">
                    <button type="button" aria-label="Modifier la mensuration" onClick={() => openMeasForm(m)} className="touch-target flex items-center justify-center text-sp-muted hover:text-sp-text"><Edit3 className="w-4 h-4" /></button>
                    <button type="button" aria-label="Supprimer la mensuration" onClick={() => setConfirmDeleteId(m.id)} className="touch-target flex items-center justify-center text-sp-muted hover:text-sp-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ENTRAÎNEMENT */}
      <Card className="space-y-3">
        <h2 className="text-base font-bold">Fréquence d’entraînement (séances / semaine)</h2>
        <LazyMetricsChart title="Séances" unitLabel="séances" data={frequencySeries} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold">Volume et 1RM estimé par exercice</h2>
        {exerciseOptions.length === 0 ? (
          <EmptyState title="Pas encore de données" description="Termine une séance avec un exercice chargé (charge + répétitions) pour voir son évolution." />
        ) : (
          <>
            <select value={exId} onChange={(e) => setSelectedExerciseId(e.target.value)} aria-label="Exercice affiché" className={inputCls}>
              {exerciseOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <p className="text-xs font-semibold">Volume de travail (kg·rép, échauffements exclus)</p>
            <LazyMetricsChart title="Volume" unitLabel="kg·rép" data={exerciseVolumeSeries} />
            <p className="text-xs font-semibold">Meilleur 1RM estimé par séance (Brzycki, 1–10 rép.)</p>
            <LazyMetricsChart title="1RM estimé" unitLabel={weightUnit} data={exercise1RmSeries} />
            <AlertBox tone="info">Le 1RM affiché est une estimation statistique, pas une performance réalisée.</AlertBox>
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold">Minutes de combat</h2>
        <LazyMetricsChart title="Minutes de combat" unitLabel="min" data={combatMinutesSeries} />
      </Card>
    </div>
  );
}
