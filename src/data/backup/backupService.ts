import type { StandPowerDatabaseSnapshot } from '../../domain/types';
import {
  BackupSnapshotValidationSchema,
  CURRENT_SCHEMA_VERSION,
  MAX_IMPORT_BYTES,
} from '../../domain/validation/schemas';

export interface ImportValidationResult {
  valid: boolean;
  snapshot?: StandPowerDatabaseSnapshot;
  errorMessage?: string;
}

/**
 * Valide intégralement un JSON d'import avant toute modification de la base.
 * - Vérifie la taille maximale
 * - Vérifie la syntaxe JSON
 * - Vérifie la version du schéma
 * - Vérifie les types, unités et relations internes (exercices/séries de séance)
 */
export function validateBackupJson(rawJsonString: string): ImportValidationResult {
  if (typeof rawJsonString !== 'string' || rawJsonString.trim().length === 0) {
    return {
      valid: false,
      errorMessage: 'Le fichier sélectionné est vide.',
    };
  }

  const byteLength = new TextEncoder().encode(rawJsonString).length;
  if (byteLength > MAX_IMPORT_BYTES) {
    return {
      valid: false,
      errorMessage: `Fichier trop volumineux (${(byteLength / (1024 * 1024)).toFixed(1)} Mo). Limite autorisée : 10 Mo.`,
    };
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(rawJsonString);
  } catch {
    return {
      valid: false,
      errorMessage: 'Format JSON invalide : impossible de lire le fichier de sauvegarde.',
    };
  }

  if (
    typeof parsedUnknown !== 'object' ||
    parsedUnknown === null ||
    !('schemaVersion' in parsedUnknown)
  ) {
    return {
      valid: false,
      errorMessage:
        'Ce fichier ne correspond pas à une sauvegarde StandPower valide (champ schemaVersion manquant).',
    };
  }

  const versionCandidate = (parsedUnknown as { schemaVersion: unknown }).schemaVersion;
  if (typeof versionCandidate !== 'number' || versionCandidate > CURRENT_SCHEMA_VERSION || versionCandidate < 1) {
    return {
      valid: false,
      errorMessage: `Version de schéma incompatible (${String(versionCandidate)}). Version supportée : 1 à ${CURRENT_SCHEMA_VERSION}.`,
    };
  }

  const validation = BackupSnapshotValidationSchema.safeParse(parsedUnknown);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const pathStr = firstIssue ? firstIssue.path.join('.') : 'inconnu';
    return {
      valid: false,
      errorMessage: `Données invalides ou corrompues dans la sauvegarde (${pathStr} : ${firstIssue?.message ?? 'erreur de schéma'}). Aucune donnée locale n’a été modifiée.`,
    };
  }

  const snapshot = validation.data as unknown as StandPowerDatabaseSnapshot;

  // Vérification de cohérence relationnelle et absence de doublons d'identifiants
  const sessionIds = new Set<string>();
  for (const ws of snapshot.workoutSessions) {
    if (sessionIds.has(ws.id)) {
      return {
        valid: false,
        errorMessage: `Identifiant de séance en doublon détecté (${ws.id}). Import rejeté.`,
      };
    }
    sessionIds.add(ws.id);

    for (const ex of ws.exercises) {
      if (ex.workoutSessionId !== ws.id) {
        return {
          valid: false,
          errorMessage: `Relation incohérente entre la séance ${ws.id} et l’exercice ${ex.id}. Import rejeté.`,
        };
      }
      for (const s of ex.sets) {
        if (s.workoutExerciseId !== ex.id) {
          return {
            valid: false,
            errorMessage: `Relation incohérente entre l’exercice ${ex.id} et la série ${s.id}. Import rejeté.`,
          };
        }
      }
    }
  }

  return {
    valid: true,
    snapshot,
  };
}

/**
 * Exporte le snapshot complet en JSON indenté versionné.
 */
export function serializeDatabaseToJson(snapshot: StandPowerDatabaseSnapshot): string {
  const payload: StandPowerDatabaseSnapshot = {
    ...snapshot,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Génère un export CSV (séparateur point-virgule pour compatibilité tableurs français)
 * des séances de musculation, séances de combat et pesées.
 */
export function exportTabularDataToCsv(
  snapshot: StandPowerDatabaseSnapshot,
  table: 'workouts' | 'combat' | 'weights'
): string {
  if (table === 'workouts') {
    const header = [
      'Date',
      'Seance',
      'Statut',
      'Exercice',
      'TypeMesure',
      'OrdreSerie',
      'TypeSerie',
      'ChargeKg',
      'Repetitions',
      'DureeSec',
      'RPE',
      'RIR',
      'Validee',
    ].join(';');

    const rows: string[] = [header];
    for (const ws of snapshot.workoutSessions) {
      for (const ex of ws.exercises) {
        for (const s of ex.sets) {
          rows.push(
            [
              ws.civilDate,
              ws.title,
              ws.status,
              ex.exerciseNameSnapshot,
              ex.measurementTypeSnapshot,
              s.setOrder,
              s.setType,
              s.weightKg ?? '',
              s.reps ?? '',
              s.durationSeconds ?? '',
              s.rpe ?? '',
              s.rir ?? '',
              s.isCompleted ? 'Oui' : 'Non',
            ]
              .map(escapeCsvCell)
              .join(';')
          );
        }
      }
    }
    return rows.join('\n');
  }

  if (table === 'combat') {
    const header = [
      'Date',
      'Discipline',
      'Categorie',
      'Tenue',
      'Contexte',
      'Rounds',
      'DureeTotaleMin',
      'Intensite',
      'SoumissionsTentees',
      'SoumissionsReussies',
      'Notes',
    ].join(';');

    const rows: string[] = [header];
    for (const cs of snapshot.combatSessions) {
      rows.push(
        [
          cs.civilDate,
          cs.discipline,
          cs.category,
          cs.bjjAttire,
          cs.context,
          cs.roundsCount,
          cs.totalDurationMinutes,
          cs.perceivedIntensity,
          cs.submissionsAttempted,
          cs.submissionsSucceeded,
          cs.notes,
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    }
    return rows.join('\n');
  }

  const header = ['Date', 'PoidsKg', 'Notes'].join(';');
  const rows: string[] = [header];
  for (const w of snapshot.weightEntries) {
    rows.push([w.civilDate, w.weightKg, w.notes ?? ''].map(escapeCsvCell).join(';'));
  }
  return rows.join('\n');
}
