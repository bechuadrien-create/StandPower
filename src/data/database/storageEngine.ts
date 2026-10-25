import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { INITIAL_SQLITE_MIGRATION_V1 } from '../migrations/001_initial_schema';
import { CURRENT_SCHEMA_VERSION } from '../../domain/validation/schemas';
import type { StandPowerDatabaseSnapshot, UserPreferences } from '../../domain/types';
import { BUILTIN_PROGRAMS } from '../seeds/programsSeed';

const IDB_NAME = 'standpower_idb_v1';
const IDB_VERSION = 1;
const STORE_SNAPSHOT = 'database_snapshot';
const SNAPSHOT_KEY = 'primary_state';
const SQLITE_DB_NAME = 'standpower_sqlite_v1';

export function createDefaultPreferences(): UserPreferences {
  return {
    id: 'prefs_default',
    weightUnit: 'kg',
    lengthUnit: 'cm',
    theme: 'dark',
    soundEnabled: true,
    vibrationEnabled: true,
    keepScreenAwakeDuringTimers: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:30',
    nutritionGuidanceStyle: 'numeric_targets',
    onboardingCompleted: false,
    demoModeActive: false,
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyDatabaseSnapshot(): StandPowerDatabaseSnapshot {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    userProfile: null,
    userPreferences: createDefaultPreferences(),
    questionnaireAnswers: null,
    recommendationResult: null,
    customExercises: [],
    favoriteExerciseIds: [],
    programTemplates: BUILTIN_PROGRAMS.map((p) => ({ ...p })),
    programInstances: [],
    scheduledSessions: [],
    workoutSessions: [],
    combatSessions: [],
    drillCircuits: [],
    weightEntries: [],
    bodyMeasurements: [],
    nutritionTarget: null,
    reminders: [],
    recoveryCheckIns: [],
  };
}

class DualPlatformStorageEngine {
  private sqliteConnection: SQLiteConnection | null = null;
  private sqliteDb: SQLiteDBConnection | null = null;
  private idbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: StandPowerDatabaseSnapshot | null = null;
  private initialized = false;

  private openIndexedDB(): Promise<IDBDatabase> {
    if (this.idbPromise) return this.idbPromise;

    this.idbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB non disponible dans cet environnement'));
        return;
      }

      const request = indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SNAPSHOT)) {
          db.createObjectStore(STORE_SNAPSHOT);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Erreur ouverture IndexedDB'));
    });

    return this.idbPromise;
  }

  private async initNativeSQLiteIfAvailable(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      const ret = await this.sqliteConnection.checkConnectionsConsistency();
      const isConn = (await this.sqliteConnection.isConnection(SQLITE_DB_NAME, false)).result;
      if (ret.result && isConn) {
        this.sqliteDb = await this.sqliteConnection.retrieveConnection(SQLITE_DB_NAME, false);
      } else {
        this.sqliteDb = await this.sqliteConnection.createConnection(
          SQLITE_DB_NAME,
          false,
          'no-encryption',
          CURRENT_SCHEMA_VERSION,
          false
        );
      }
      await this.sqliteDb.open();
      await this.sqliteDb.execute(INITIAL_SQLITE_MIGRATION_V1);
    } catch {
      // En cas de restriction d'environnement émulé, bascule transparente sur IndexedDB
      this.sqliteDb = null;
    }
  }

  public async initialize(): Promise<StandPowerDatabaseSnapshot> {
    if (!this.initialized) {
      await this.initNativeSQLiteIfAvailable();
      this.initialized = true;
    }
    return this.loadSnapshot();
  }

  public async loadSnapshot(): Promise<StandPowerDatabaseSnapshot> {
    // 1. Priorité SQLite natif sur Android
    if (this.sqliteDb) {
      try {
        const res = await this.sqliteDb.query(
          'SELECT value FROM app_metadata WHERE key = ?;',
          [SNAPSHOT_KEY]
        );
        if (res.values && res.values.length > 0 && typeof res.values[0].value === 'string') {
          const parsed = JSON.parse(res.values[0].value) as StandPowerDatabaseSnapshot;
          return this.migrateSnapshotIfNeeded(parsed);
        }
      } catch {
        // Continue vers IndexedDB
      }
    }

    // 2. Adaptateur IndexedDB (Navigateur / WebView / Vitest fake-indexeddb)
    try {
      const db = await this.openIndexedDB();
      const stored = await new Promise<StandPowerDatabaseSnapshot | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_SNAPSHOT, 'readonly');
        const store = tx.objectStore(STORE_SNAPSHOT);
        const req = store.get(SNAPSHOT_KEY);
        req.onsuccess = () => resolve(req.result as StandPowerDatabaseSnapshot | undefined);
        req.onerror = () => reject(req.error);
      });

      if (stored) {
        const migrated = this.migrateSnapshotIfNeeded(stored);
        return migrated;
      }
    } catch {
      if (this.memoryFallback) {
        return this.memoryFallback;
      }
    }

    const initial = createEmptyDatabaseSnapshot();
    await this.saveSnapshotAtomically(initial);
    return initial;
  }

  public migrateSnapshotIfNeeded(raw: StandPowerDatabaseSnapshot): StandPowerDatabaseSnapshot {
    const mergedTemplates = [...BUILTIN_PROGRAMS];
    if (Array.isArray(raw.programTemplates)) {
      for (const tpl of raw.programTemplates) {
        const idx = mergedTemplates.findIndex((b) => b.id === tpl.id);
        if (idx >= 0) {
          mergedTemplates[idx] = tpl;
        } else {
          mergedTemplates.push(tpl);
        }
      }
    }

    return {
      ...createEmptyDatabaseSnapshot(),
      ...raw,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      programTemplates: mergedTemplates,
      userPreferences: {
        ...createDefaultPreferences(),
        ...(raw.userPreferences ?? {}),
      },
    };
  }

  /**
   * Sauvegarde transactionnelle atomique dans SQLite natif (si Android) et IndexedDB.
   */
  public async saveSnapshotAtomically(snapshot: StandPowerDatabaseSnapshot): Promise<void> {
    const now = new Date().toISOString();
    const payload: StandPowerDatabaseSnapshot = {
      ...snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: now,
    };

    this.memoryFallback = payload;
    const serialized = JSON.stringify(payload);

    // 1. Écriture transactionnelle SQLite sur Android
    if (this.sqliteDb) {
      try {
        const statements: { statement: string; values: unknown[] }[] = [
          {
            statement:
              'INSERT OR REPLACE INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?);',
            values: [SNAPSHOT_KEY, serialized, now],
          },
          {
            statement:
              'INSERT OR REPLACE INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?);',
            values: ['schema_version', String(CURRENT_SCHEMA_VERSION), now],
          },
        ];

        if (payload.userProfile) {
          statements.push({
            statement:
              'INSERT OR REPLACE INTO user_profile (id, payload_json, updated_at) VALUES (?, ?, ?);',
            values: [
              payload.userProfile.id,
              JSON.stringify(payload.userProfile),
              payload.userProfile.updatedAt,
            ],
          });
        }

        for (const ws of payload.workoutSessions) {
          statements.push({
            statement:
              'INSERT OR REPLACE INTO workout_sessions (id, civil_date, status, duration_seconds, payload_json, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
            values: [
              ws.id,
              ws.civilDate,
              ws.status,
              ws.durationSeconds,
              JSON.stringify(ws),
              ws.updatedAt,
            ],
          });
        }

        for (const cs of payload.combatSessions) {
          statements.push({
            statement:
              'INSERT OR REPLACE INTO combat_sessions (id, civil_date, discipline, category, total_duration_minutes, payload_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
            values: [
              cs.id,
              cs.civilDate,
              cs.discipline,
              cs.category,
              cs.totalDurationMinutes,
              JSON.stringify(cs),
              cs.updatedAt,
            ],
          });
        }

        for (const we of payload.weightEntries) {
          statements.push({
            statement:
              'INSERT OR REPLACE INTO weight_entries (id, civil_date, weight_kg, payload_json, updated_at) VALUES (?, ?, ?, ?, ?);',
            values: [
              we.id,
              we.civilDate,
              we.weightKg,
              JSON.stringify(we),
              we.updatedAt,
            ],
          });
        }

        await this.sqliteDb.executeSet(statements, true);
      } catch {
        // Fallback IndexedDB assuré ci-dessous
      }
    }

    // 2. Écriture transactionnelle IndexedDB
    try {
      const db = await this.openIndexedDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SNAPSHOT, 'readwrite');
        const store = tx.objectStore(STORE_SNAPSHOT);
        store.put(payload, SNAPSHOT_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Transaction IndexedDB échouée'));
        tx.onabort = () => reject(tx.error ?? new Error('Transaction IndexedDB annulée'));
      });
    } catch {
      // Conservé dans memoryFallback pour les environnements de test sans IDB
    }
  }

  public async clearAllData(): Promise<StandPowerDatabaseSnapshot> {
    const fresh = createEmptyDatabaseSnapshot();
    await this.saveSnapshotAtomically(fresh);
    return fresh;
  }
}

export const storageEngine = new DualPlatformStorageEngine();
