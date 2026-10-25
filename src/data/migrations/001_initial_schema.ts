/**
 * Migration SQLite initiale (Schéma v1) pour Android (@capacitor-community/sqlite).
 * Contient l'intégralité des tables métier, contraintes et index pour les requêtes fréquentes.
 */

export const INITIAL_SQLITE_MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id TEXT PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_results (
  id TEXT PRIMARY KEY NOT NULL,
  questionnaire_id TEXT NOT NULL,
  rule_engine_version TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name_fr TEXT NOT NULL,
  movement_pattern TEXT NOT NULL,
  measurement_type TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_custom INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name_fr);
CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(movement_pattern);

CREATE TABLE IF NOT EXISTS exercise_alternatives (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_id TEXT NOT NULL,
  alternative_exercise_id TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ex_alt_parent ON exercise_alternatives(exercise_id);

CREATE TABLE IF NOT EXISTS program_templates (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_instances (
  id TEXT PRIMARY KEY NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_program_instances_status ON program_instances(status);

CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL,
  session_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON scheduled_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_status ON scheduled_sessions(status);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  civil_date TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(civil_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  workout_session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workout_ex_session ON workout_exercises(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_workout_ex_exercise ON workout_exercises(exercise_id);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY NOT NULL,
  workout_exercise_id TEXT NOT NULL,
  set_order INTEGER NOT NULL,
  set_type TEXT NOT NULL,
  weight_kg REAL,
  reps INTEGER,
  is_completed INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workout_sets_ex ON workout_sets(workout_exercise_id);

CREATE TABLE IF NOT EXISTS combat_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  civil_date TEXT NOT NULL,
  discipline TEXT NOT NULL,
  category TEXT NOT NULL,
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_date ON combat_sessions(civil_date);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_discipline ON combat_sessions(discipline);

CREATE TABLE IF NOT EXISTS combat_rounds (
  id TEXT PRIMARY KEY NOT NULL,
  combat_session_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_combat_rounds_session ON combat_rounds(combat_session_id);

CREATE TABLE IF NOT EXISTS technique_events (
  id TEXT PRIMARY KEY NOT NULL,
  combat_session_id TEXT NOT NULL,
  technique_name TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_technique_events_session ON technique_events(combat_session_id);

CREATE TABLE IF NOT EXISTS drills (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drill_circuits (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY NOT NULL,
  civil_date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weight_entries_date ON weight_entries(civil_date);

CREATE TABLE IF NOT EXISTS body_measurements (
  id TEXT PRIMARY KEY NOT NULL,
  civil_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(civil_date);

CREATE TABLE IF NOT EXISTS nutrition_targets (
  id TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recovery_checkins (
  id TEXT PRIMARY KEY NOT NULL,
  civil_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recovery_checkins_date ON recovery_checkins(civil_date);
`;
