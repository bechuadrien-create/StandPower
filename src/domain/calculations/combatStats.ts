import type { CombatSession } from '../types';

export interface TechniqueSuccessRate {
  techniqueName: string;
  attempts: number;
  successes: number;
  available: boolean;
  ratePercent: number | null;
  denominatorLabel: string;
  lowSampleWarning: boolean;
}

/**
 * Calcule le taux de réussite déclaré d'une technique avec affichage explicite du dénominateur.
 * - Zéro tentative donne available = false ("Non disponible (0 tentative)"), jamais 0 % de réussite.
 * - Signale un faible échantillon lorsque attempts < 5.
 */
export function computeTechniqueSuccessRate(
  techniqueName: string,
  attempts: number,
  successes: number
): TechniqueSuccessRate {
  const safeAttempts = Math.max(0, Math.floor(attempts));
  const safeSuccesses = Math.min(safeAttempts, Math.max(0, Math.floor(successes)));

  if (safeAttempts === 0) {
    return {
      techniqueName,
      attempts: 0,
      successes: 0,
      available: false,
      ratePercent: null,
      denominatorLabel: 'Non disponible (0 tentative)',
      lowSampleWarning: true,
    };
  }

  const ratePercent = Math.round((safeSuccesses / safeAttempts) * 100);
  return {
    techniqueName,
    attempts: safeAttempts,
    successes: safeSuccesses,
    available: true,
    ratePercent,
    denominatorLabel: `${safeSuccesses}/${safeAttempts} (${ratePercent} %)`,
    lowSampleWarning: safeAttempts < 5,
  };
}

export interface CombatStatisticsSummary {
  totalSessions: number;
  totalMinutes: number;
  totalRounds: number;
  bjjSessionsCount: number;
  giCount: number;
  noGiCount: number;
  totalSubmissionsAttempted: number;
  totalSubmissionsSucceeded: number;
  submissionSuccessSummary: TechniqueSuccessRate;
  topTechniques: TechniqueSuccessRate[];
}

export function aggregateCombatStatistics(sessions: CombatSession[]): CombatStatisticsSummary {
  let totalMinutes = 0;
  let totalRounds = 0;
  let bjjSessionsCount = 0;
  let giCount = 0;
  let noGiCount = 0;
  let totalSubmissionsAttempted = 0;
  let totalSubmissionsSucceeded = 0;

  const techMap = new Map<string, { attempts: number; successes: number }>();

  for (const s of sessions) {
    totalMinutes += Math.max(0, s.totalDurationMinutes || 0);
    totalRounds += Math.max(0, s.roundsCount || 0);

    if (s.discipline === 'bjj') {
      bjjSessionsCount += 1;
      if (s.bjjAttire === 'gi') giCount += 1;
      if (s.bjjAttire === 'no_gi') noGiCount += 1;
    }

    totalSubmissionsAttempted += Math.max(0, s.submissionsAttempted || 0);
    totalSubmissionsSucceeded += Math.max(0, s.submissionsSucceeded || 0);

    for (const ev of s.techniqueEvents) {
      const key = ev.techniqueName.trim();
      if (!key) continue;
      const existing = techMap.get(key) ?? { attempts: 0, successes: 0 };
      existing.attempts += Math.max(0, ev.attempts);
      existing.successes += Math.max(0, ev.successes);
      techMap.set(key, existing);
    }
  }

  const topTechniques: TechniqueSuccessRate[] = Array.from(techMap.entries())
    .map(([name, counts]) =>
      computeTechniqueSuccessRate(name, counts.attempts, counts.successes)
    )
    .sort((a, b) => b.attempts - a.attempts);

  return {
    totalSessions: sessions.length,
    totalMinutes,
    totalRounds,
    bjjSessionsCount,
    giCount,
    noGiCount,
    totalSubmissionsAttempted,
    totalSubmissionsSucceeded,
    submissionSuccessSummary: computeTechniqueSuccessRate(
      'Soumissions globales',
      totalSubmissionsAttempted,
      totalSubmissionsSucceeded
    ),
    topTechniques,
  };
}
