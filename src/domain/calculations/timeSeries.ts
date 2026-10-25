import type { CivilDate } from '../types';
import { addDaysToCivilDate, diffCivilDays } from './units';

export type TimePeriodFilter = '7d' | '30d' | '90d' | 'all';

export interface TimeSeriesPoint {
  civilDate: CivilDate;
  value: number;
  movingAverage7d?: number;
}

/**
 * Filtre une série temporelle triée selon la période choisie par rapport à une date de référence.
 */
export function filterSeriesByPeriod<T extends { civilDate: CivilDate }>(
  items: T[],
  period: TimePeriodFilter,
  referenceDate: CivilDate
): T[] {
  const sorted = [...items].sort((a, b) => a.civilDate.localeCompare(b.civilDate));
  if (period === 'all') return sorted;

  const daysBack = period === '7d' ? 6 : period === '30d' ? 29 : 89;
  const minDate = addDaysToCivilDate(referenceDate, -daysBack);
  return sorted.filter(
    (item) => item.civilDate >= minDate && item.civilDate <= referenceDate
  );
}

/**
 * Calcule une moyenne mobile glissante sur fenêtre de 7 jours civils
 * uniquement lorsque au moins 2 mesures existent dans la fenêtre de 7 jours.
 * N'invente jamais de point à une date sans mesure.
 */
export function computeMovingAverageSeries(
  points: { civilDate: CivilDate; value: number }[],
  windowDays = 7
): TimeSeriesPoint[] {
  const sorted = [...points]
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.civilDate.localeCompare(b.civilDate));

  return sorted.map((current, idx) => {
    const windowValues: number[] = [];
    for (let j = 0; j <= idx; j++) {
      const candidate = sorted[j];
      const deltaDays = diffCivilDays(candidate.civilDate, current.civilDate);
      if (deltaDays >= 0 && deltaDays < windowDays) {
        windowValues.push(candidate.value);
      }
    }

    const movingAverage7d =
      windowValues.length >= 2
        ? Number(
            (windowValues.reduce((acc, v) => acc + v, 0) / windowValues.length).toFixed(2)
          )
        : undefined;

    return {
      civilDate: current.civilDate,
      value: current.value,
      movingAverage7d,
    };
  });
}
