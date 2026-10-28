import React, { useState } from 'react';
import { Calculator, MessageSquare, Send, Sparkles } from 'lucide-react';
import {
  sendCoachChatMessage,
  type CoachChatResponse,
} from '../services/exerciseMediaService';
import { Button, Card } from './ui/Primitives';

export interface AiCoachPanelProps {
  defaultOpenCalculator?: boolean;
  context?: {
    disciplines?: string[];
    recentWorkoutsCount?: number;
    recentCombatCount?: number;
    weightKg?: number;
  };
}

export const AiCoachPanel: React.FC<AiCoachPanelProps> = ({
  defaultOpenCalculator = false,
  context,
}) => {
  const [mode, setMode] = useState<'none' | 'calculator' | 'coach'>(
    defaultOpenCalculator ? 'calculator' : 'none'
  );

  // Calculateur 1RM Brzycki : weight / (1.0278 - 0.0278 * reps) avec sécurité reps < 37
  const [weightInput, setWeightInput] = useState<string>('80');
  const [repsInput, setRepsInput] = useState<string>('5');

  // Coach IA Gemini 2.5 Flash
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatResult, setChatResult] = useState<CoachChatResponse | null>(null);

  const parsedWeight = Number(weightInput.replace(',', '.'));
  const parsedReps = Number(repsInput);
  const isBrzyckiValid =
    Number.isFinite(parsedWeight) &&
    parsedWeight > 0 &&
    Number.isInteger(parsedReps) &&
    parsedReps >= 1 &&
    parsedReps < 37;

  const estimated1RM = isBrzyckiValid
    ? parsedReps === 1
      ? parsedWeight
      : Math.round((parsedWeight / (1.0278 - 0.0278 * parsedReps)) * 10) / 10
    : null;

  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    setChatLoading(true);
    try {
      const response = await sendCoachChatMessage(chatPrompt.trim(), context);
      setChatResult(response);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setMode((prev) => (prev === 'calculator' ? 'none' : 'calculator'))
          }
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mode === 'calculator'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-sp-surface text-sp-muted border-sp-border hover:text-sp-text'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Calculateur 1RM Brzycki
        </button>

        <button
          type="button"
          onClick={() => setMode((prev) => (prev === 'coach' ? 'none' : 'coach'))}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mode === 'coach'
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50'
              : 'bg-sp-surface text-sp-muted border-sp-border hover:text-sp-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Coach IA Gemini 2.5
        </button>
      </div>

      {mode === 'calculator' && (
        <Card className="border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-400">
                Calculateur 1RM Brzycki & Table de Charges
              </h3>
              <p className="text-xs text-sp-muted">
                Formule : Charge / (1,0278 − 0,0278 × répétitions) • Précision maximale entre 1 et 10 rép.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sp-muted mb-1">
                Charge soulevée (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                aria-label="Charge soulevée en kg pour calcul 1RM"
                className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-sp-muted mb-1">
                Répétitions (1 à 36)
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={repsInput}
                onChange={(e) => setRepsInput(e.target.value)}
                aria-label="Nombre de répétitions pour calcul 1RM"
                className="w-full min-h-[44px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          {estimated1RM !== null ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-300 font-medium">
                    1RM Théorique Estimé (Brzycki)
                  </span>
                  {parsedReps > 10 && (
                    <p className="text-[11px] text-amber-300">
                      Attention : au-delà de 10 répétitions, l’estimation comporte une marge d’erreur accrue.
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold text-emerald-300 tabular-nums">
                  {estimated1RM.toString().replace('.', ',')} kg
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {[95, 90, 85, 80, 75, 70].map((pct) => {
                  const val = Math.round(((estimated1RM * pct) / 100) * 2) / 2;
                  return (
                    <div
                      key={pct}
                      className="p-2 rounded-lg bg-sp-elevated border border-sp-border"
                    >
                      <span className="block text-sp-muted font-medium">
                        {pct} %
                      </span>
                      <span className="font-bold tabular-nums text-sp-text">
                        {val.toString().replace('.', ',')} kg
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-400">
              Saisis une charge positive et un nombre entier de répétitions compris entre 1 et 36.
            </p>
          )}
        </Card>
      )}

      {mode === 'coach' && (
        <Card className="border-fuchsia-500/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-fuchsia-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                Assistant Coach IA (Gemini 2.5 Flash + Règles Locales)
              </h3>
              <p className="text-xs text-sp-muted">
                Pose une question sur ta technique, ton programme ou ta récupération Musculation / Combat.
              </p>
            </div>
          </div>

          <form onSubmit={handleAskCoach} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Ex: Comment placer mon Squat dans la semaine avec 3 cours de JJB ?"
              aria-label="Question pour le coach IA"
              className="flex-1 min-h-[46px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
            />
            <Button type="submit" variant="primary" disabled={chatLoading}>
              <Send className="w-4 h-4" />
              {chatLoading ? 'Analyse...' : 'Demander'}
            </Button>
          </form>

          {chatResult && (
            <div className="p-3 rounded-xl bg-sp-elevated border border-fuchsia-500/30 space-y-2.5 text-xs">
              <p className="text-sp-text leading-relaxed font-medium">
                {chatResult.reply}
              </p>

              {chatResult.actionableTips.length > 0 && (
                <div>
                  <p className="font-semibold text-fuchsia-300 mb-1">
                    Conseils applicables :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sp-muted">
                    {chatResult.actionableTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {chatResult.suggestedDrillsOrExercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {chatResult.suggestedDrillsOrExercises.map((item, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {chatResult.recoveryWarning && (
                <p className="text-amber-300 font-medium pt-1">
                  Récupération : {chatResult.recoveryWarning}
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
