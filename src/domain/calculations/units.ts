import type { CivilDate, LengthUnit, WeightUnit } from '../types';

const KG_TO_LB_FACTOR = 2.20462262185;
const CM_TO_IN_FACTOR = 0.3937007874;

/**
 * Convertit des kilogrammes en livres (stockage canonique en kg).
 */
export function kgToLb(kg: number): number {
  if (!Number.isFinite(kg)) {
    throw new Error('Poids en kg invalide');
  }
  return kg * KG_TO_LB_FACTOR;
}

/**
 * Convertit des livres en kilogrammes (stockage canonique en kg).
 */
export function lbToKg(lb: number): number {
  if (!Number.isFinite(lb)) {
    throw new Error('Poids en lb invalide');
  }
  return lb / KG_TO_LB_FACTOR;
}

/**
 * Convertit des centimètres en pouces.
 */
export function cmToIn(cm: number): number {
  if (!Number.isFinite(cm)) {
    throw new Error('Longueur en cm invalide');
  }
  return cm * CM_TO_IN_FACTOR;
}

/**
 * Convertit des pouces en centimètres.
 */
export function inToCm(inches: number): number {
  if (!Number.isFinite(inches)) {
    throw new Error('Longueur en in invalide');
  }
  return inches / CM_TO_IN_FACTOR;
}

/**
 * Formate un poids stocké en kg vers l'unité d'affichage choisie.
 * L'arrondi est réservé à l'affichage uniquement.
 */
export function formatWeight(weightKg: number, unit: WeightUnit, decimals = 1): string {
  if (!Number.isFinite(weightKg)) return '—';
  const converted = unit === 'lb' ? kgToLb(weightKg) : weightKg;
  const rounded = Number(converted.toFixed(decimals));
  return `${rounded.toString().replace('.', ',')} ${unit}`;
}

export function convertWeightForInput(weightKg: number | undefined, unit: WeightUnit): string {
  if (weightKg === undefined || !Number.isFinite(weightKg)) return '';
  const val = unit === 'lb' ? kgToLb(weightKg) : weightKg;
  return Number(val.toFixed(2)).toString().replace('.', ',');
}

export function parseWeightFromInput(rawInput: string, unit: WeightUnit): number | null {
  const parsed = parseFrenchDecimal(rawInput);
  if (parsed === null) return null;
  return unit === 'lb' ? lbToKg(parsed) : parsed;
}

export function formatLength(lengthCm: number, unit: LengthUnit, decimals = 1): string {
  if (!Number.isFinite(lengthCm)) return '—';
  const converted = unit === 'in' ? cmToIn(lengthCm) : lengthCm;
  const rounded = Number(converted.toFixed(decimals));
  return `${rounded.toString().replace('.', ',')} ${unit}`;
}

/**
 * Analyse une saisie numérique pouvant contenir une virgule française ou un point.
 * Retourne null si la chaîne est vide ou invalide (n'utilise jamais 0 silencieusement).
 */
export function parseFrenchDecimal(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  const trimmed = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (trimmed === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/**
 * Retourne la date civile locale YYYY-MM-DD sans décalage UTC.
 */
export function getLocalCivilDate(date: Date = new Date()): CivilDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ajoute un nombre de jours à une date civile YYYY-MM-DD sans décalage horaire.
 */
export function addDaysToCivilDate(civilDate: CivilDate, daysToAdd: number): CivilDate {
  const [y, m, d] = civilDate.split('-').map(Number);
  const localNoon = new Date(y, m - 1, d, 12, 0, 0);
  localNoon.setDate(localNoon.getDate() + daysToAdd);
  return getLocalCivilDate(localNoon);
}

/**
 * Différence en jours civils (b - a).
 */
export function diffCivilDays(a: CivilDate, b: CivilDate): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  const utcA = Date.UTC(ya, ma - 1, da);
  const utcB = Date.UTC(yb, mb - 1, db);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export function formatCivilDateFr(civilDate: CivilDate): string {
  const parts = civilDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return civilDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
