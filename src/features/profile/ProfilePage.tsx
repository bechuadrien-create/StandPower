import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Check,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Sliders,
  Trash2,
  Upload,
  User,
  Utensils,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import {
  AlertBox,
  Button,
  Card,
} from '../../components/ui/Primitives';
import {
  exportTabularDataToCsv,
  serializeDatabaseToJson,
} from '../../data/backup/backupService';
import { exportAndShareTextFile } from '../../platform/sharing/shareService';
import {
  checkNotificationPermissionStatus,
  requestNotificationPermissionIfNeeded,
} from '../../platform/notifications/notificationService';
import { parseFrenchDecimal } from '../../domain/calculations/units';
import { CalculationMethodContent } from '../nutrition/NutritionPage';
import type {
  DayOfWeek,
  ExperienceLevel,
  LengthUnit,
  PrimaryGoal,
  ThemeMode,
  WeightUnit,
} from '../../domain/types';

const DAY_LABELS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mer' },
  { id: 'thu', label: 'Jeu' },
  { id: 'fri', label: 'Ven' },
  { id: 'sat', label: 'Sam' },
  { id: 'sun', label: 'Dim' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const saveReminder = useAppStore((s) => s.saveReminder);
  const deleteReminder = useAppStore((s) => s.deleteReminder);
  const importDatabaseFromJson = useAppStore((s) => s.importDatabaseFromJson);
  const activateDemoDataset = useAppStore((s) => s.activateDemoDataset);
  const resetAllLocalData = useAppStore((s) => s.resetAllLocalData);

  const profile = snapshot.userProfile;
  const prefs = snapshot.userPreferences;

  const [activeSection, setActiveSection] = useState<
    'profile' | 'reminders' | 'backup' | 'privacy'
  >('profile');

  // États édition profil
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [ageInput, setAgeInput] = useState(String(profile?.ageYears ?? 28));
  const [heightInput, setHeightInput] = useState(
    String(profile?.heightCm ?? 175)
  );
  const [weightInput, setWeightInput] = useState(
    String(profile?.weightKg ?? 75)
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experienceLevel ?? 'beginner'
  );
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    profile?.primaryGoal ?? 'combat_complement'
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // États rappels
  const [reminderType, setReminderType] = useState<'workout' | 'measurement'>(
    'workout'
  );
  const [reminderTitle, setReminderTitle] = useState(
    'Séance StandPower prévue aujourd’hui'
  );
  const [reminderTime, setReminderTime] = useState('18:30');
  const [reminderDays, setReminderDays] = useState<DayOfWeek[]>([
    'mon',
    'wed',
    'fri',
  ]);
  const [showPermissionPromptInfo, setShowPermissionPromptInfo] =
    useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // États sauvegarde / import / reset
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(
    null
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseFrenchDecimal(ageInput);
    const height = parseFrenchDecimal(heightInput);
    const weight = parseFrenchDecimal(weightInput);

    if (
      age === null ||
      age < 12 ||
      age > 105 ||
      height === null ||
      height < 110 ||
      height > 240 ||
      weight === null ||
      weight < 25 ||
      weight > 300
    ) {
      setProfileSavedMsg(
        'Vérifie que l’âge (12–105), la taille (110–240 cm) et le poids (25–300 kg) sont valides.'
      );
      return;
    }

    await updateUserProfile({
      displayName: displayName.trim(),
      ageYears: Math.round(age),
      heightCm: height,
      weightKg: weight,
      experienceLevel,
      primaryGoal,
    });
    setProfileSavedMsg('Profil mis à jour localement.');
    setTimeout(() => setProfileSavedMsg(null), 3000);
  };

  const handleCreateReminder = async () => {
    const status = await checkNotificationPermissionStatus();
    if (status === 'prompt' && !showPermissionPromptInfo) {
      setShowPermissionPromptInfo(true);
      return;
    }

    const granted = await requestNotificationPermissionIfNeeded();
    setShowPermissionPromptInfo(false);

    await saveReminder({
      type: reminderType,
      title:
        reminderTitle.trim() ||
        (reminderType === 'workout'
          ? 'Rappel d’entraînement'
          : 'Rappel de pesée / suivi'),
      daysOfWeek: reminderDays.length > 0 ? reminderDays : ['mon'],
      localTime: reminderTime,
      enabled: true,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
    });

    if (!granted) {
      setPermissionNotice(
        'Rappel enregistré dans l’application. Les notifications système sont actuellement refusées par le navigateur ou Android : l’application continue de fonctionner normalement.'
      );
    } else {
      setPermissionNotice('Rappel local programmé.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPendingImportJson(text);
    setImportStatus(null);
    e.target.value = '';
  };

  const confirmImportReplace = async () => {
    if (!pendingImportJson) return;
    const res = await importDatabaseFromJson(pendingImportJson);
    if (!res.ok) {
      setImportStatus({
        type: 'error',
        message:
          res.error ??
          'Import annulé : schéma incompatible. Tes données existantes sont intactes.',
      });
    } else {
      setImportStatus({
        type: 'success',
        message: 'Sauvegarde restaurée avec succès.',
      });
    }
    setPendingImportJson(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Profil & Paramètres
          </h1>
          <p className="text-xs text-sp-muted">
            Préférences, rappels locaux, sauvegarde JSON/CSV et confidentialité
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/nutrition')}
          >
            <Utensils className="w-4 h-4" />
            Nutrition
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/onboarding')}
          >
            <Sliders className="w-4 h-4" />
            Questionnaire
          </Button>
        </div>
      </div>

      {/* Sous-navigation Profil */}
      <div
        role="tablist"
        aria-label="Sections Profil"
        className="grid grid-cols-4 gap-1 bg-sp-surface p-1.5 rounded-2xl border border-sp-border"
      >
        {(
          [
            ['profile', 'Profil', User],
            ['reminders', 'Rappels', Bell],
            ['backup', 'Données', Download],
            ['privacy', 'Infos & Calculs', Lock],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={activeSection === id}
            onClick={() => setActiveSection(id)}
            className={`touch-target rounded-xl text-xs font-medium transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === id
                ? 'bg-sp-accent text-sp-accent-fg font-semibold'
                : 'text-sp-muted hover:text-sp-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ==================== SECTION 1 : PROFIL & PRÉFÉRENCES ==================== */}
      {activeSection === 'profile' && (
        <div className="space-y-4">
          <Card className="space-y-3.5">
            <h2 className="text-base font-bold">Informations du profil</h2>
            {profileSavedMsg && (
              <AlertBox tone="success">{profileSavedMsg}</AlertBox>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Pseudonyme
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Alex"
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Niveau d’expérience
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) =>
                      setExperienceLevel(e.target.value as ExperienceLevel)
                    }
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Âge (ans)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Taille (cm)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs text-sp-muted block mb-1">
                    Poids (kg)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Objectif principal
                </label>
                <select
                  value={primaryGoal}
                  onChange={(e) =>
                    setPrimaryGoal(e.target.value as PrimaryGoal)
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  <option value="combat_complement">
                    Compléter une pratique de sports de combat
                  </option>
                  <option value="general_fitness">Se remettre en forme</option>
                  <option value="strength">Gagner en force</option>
                  <option value="hypertrophy">
                    Développer la masse musculaire
                  </option>
                  <option value="fat_loss">
                    Réduire progressivement la masse grasse
                  </option>
                  <option value="conditioning">
                    Améliorer la condition physique
                  </option>
                </select>
              </div>

              <Button type="submit" variant="primary">
                <Check className="w-4 h-4" />
                Enregistrer le profil
              </Button>
            </form>
          </Card>

          {/* Unités et Thème */}
          <Card className="space-y-3">
            <h2 className="text-base font-bold">
              Unités, Apparence & Ergonomie
            </h2>
            <p className="text-xs text-sp-muted">
              Le stockage interne reste canonique (kg et cm) pour éviter toute dérive lors des changements d’unité.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Unité de poids
                </label>
                <select
                  value={prefs.weightUnit}
                  onChange={(e) =>
                    void updatePreferences({
                      weightUnit: e.target.value as WeightUnit,
                    })
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  <option value="kg">Kilogrammes (kg)</option>
                  <option value="lb">Livres (lb)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Unité de mensuration
                </label>
                <select
                  value={prefs.lengthUnit}
                  onChange={(e) =>
                    void updatePreferences({
                      lengthUnit: e.target.value as LengthUnit,
                    })
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  <option value="cm">Centimètres (cm)</option>
                  <option value="in">Pouces (in)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Thème visuel
                </label>
                <select
                  value={prefs.theme}
                  onChange={(e) =>
                    void updatePreferences({
                      theme: e.target.value as ThemeMode,
                    })
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  <option value="dark">Sombre (Charbon & Sauge)</option>
                  <option value="light">Clair (Sable & Olive)</option>
                  <option value="system">Système Android</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-sm">
              <label className="flex items-center justify-between gap-2 min-h-[44px]">
                <span>Sons des minuteurs (repos & rounds)</span>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={(e) =>
                    void updatePreferences({ soundEnabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between gap-2 min-h-[44px]">
                <span>Vibrations haptiques en fin de repos/round</span>
                <input
                  type="checkbox"
                  checked={prefs.vibrationEnabled}
                  onChange={(e) =>
                    void updatePreferences({
                      vibrationEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between gap-2 min-h-[44px]">
                <span>Garder l’écran allumé pendant le minuteur de rounds</span>
                <input
                  type="checkbox"
                  checked={prefs.keepScreenAwakeDuringTimers}
                  onChange={(e) =>
                    void updatePreferences({
                      keepScreenAwakeDuringTimers: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== SECTION 2 : RAPPELS LOCAUX ANDROID ==================== */}
      {activeSection === 'reminders' && (
        <div className="space-y-4">
          <Card className="space-y-3.5">
            <h2 className="text-base font-bold">
              Notifications locales (Sans serveur)
            </h2>
            <p className="text-xs text-sp-muted">
              Aucune notification promotionnelle ni spam. Les rappels tombant pendant tes créneaux silencieux sont automatiquement ignorés.
            </p>

            {permissionNotice && (
              <AlertBox tone="info">{permissionNotice}</AlertBox>
            )}

            {/* Explication avant demande de permission */}
            {showPermissionPromptInfo && (
              <Card className="border-sp-accent space-y-2.5 bg-sp-elevated">
                <p className="text-sm font-bold">
                  Autoriser les notifications locales ?
                </p>
                <p className="text-xs text-sp-muted leading-relaxed">
                  StandPower demande l’autorisation de notification uniquement pour afficher les rappels d’entraînement ou de mesure que tu programmes toi-même. Si tu refuses, l’application continue de fonctionner normalement.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => void handleCreateReminder()}
                  >
                    Continuer et demander la permission
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPermissionPromptInfo(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </Card>
            )}

            {/* Créneaux silencieux */}
            <div className="grid grid-cols-2 gap-3 bg-sp-elevated rounded-xl p-3">
              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Début créneau silencieux
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) =>
                    void updatePreferences({ quietHoursStart: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-sp-muted block mb-1">
                  Fin créneau silencieux
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) =>
                    void updatePreferences({ quietHoursEnd: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-lg bg-sp-surface border border-sp-border px-2.5 text-sm tabular-nums"
                />
              </div>
            </div>

            {/* Nouveau rappel */}
            <div className="space-y-3 pt-2 border-t border-sp-border">
              <h3 className="text-sm font-bold">Ajouter un rappel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={reminderType}
                  onChange={(e) =>
                    setReminderType(
                      e.target.value as 'workout' | 'measurement'
                    )
                  }
                  aria-label="Type de rappel"
                  className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
                >
                  <option value="workout">Rappel d’entraînement</option>
                  <option value="measurement">Rappel de mesure / pesée</option>
                </select>

                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="Message du rappel"
                  aria-label="Intitulé du rappel"
                  className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs"
                />

                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  aria-label="Heure du rappel"
                  className="min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-xs tabular-nums"
                />
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map((d) => {
                  const active = reminderDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setReminderDays(
                          active
                            ? reminderDays.filter((x) => x !== d.id)
                            : [...reminderDays, d.id]
                        )
                      }
                      className={`touch-target rounded-xl text-xs font-semibold border ${
                        active
                          ? 'bg-sp-accent text-sp-accent-fg border-sp-accent'
                          : 'bg-sp-elevated border-sp-border text-sp-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="primary"
                onClick={() => void handleCreateReminder()}
              >
                <Plus className="w-4 h-4" />
                Enregistrer ce rappel
              </Button>
            </div>

            {/* Liste des rappels */}
            {snapshot.reminders.length > 0 && (
              <div className="space-y-2 pt-2">
                {snapshot.reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="bg-sp-elevated rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-sp-text">
                        {rem.localTime} — {rem.title}
                      </span>
                      <span className="block text-sp-muted">
                        Jours : {rem.daysOfWeek.join(', ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rem.enabled}
                        aria-label={`Activer ou désactiver ${rem.title}`}
                        onChange={(e) =>
                          void saveReminder({
                            ...rem,
                            enabled: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                      <button
                        type="button"
                        onClick={() => void deleteReminder(rem.id)}
                        aria-label={`Supprimer le rappel ${rem.title}`}
                        className="touch-target p-2 text-sp-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ==================== SECTION 3 : SAUVEGARDE, IMPORT, CSV & RESET ==================== */}
      {activeSection === 'backup' && (
        <div className="space-y-4">
          <AlertBox
            tone="warning"
            title="Avertissement sur les fichiers exportés"
          >
            Un fichier d’export JSON ou CSV n’est pas chiffré et contient tes données personnelles (poids, mensurations, notes, séances). Conserve-le dans un emplacement sûr.
          </AlertBox>

          {importStatus && (
            <AlertBox
              tone={importStatus.type === 'error' ? 'error' : 'success'}
            >
              {importStatus.message}
            </AlertBox>
          )}

          {/* Export / Import JSON */}
          <Card className="space-y-3">
            <h2 className="text-base font-bold">
              Sauvegarde complète JSON (Versionnée v1)
            </h2>
            <p className="text-xs text-sp-muted">
              L’import valide intégralement le schéma et les relations avant toute écriture. En cas de fichier corrompu ou incompatible, la base existante reste intacte.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="primary"
                onClick={async () => {
                  const json = serializeDatabaseToJson(snapshot);
                  await exportAndShareTextFile({
                    filename: `standpower-backup-${new Date()
                      .toISOString()
                      .slice(0, 10)}.json`,
                    content: json,
                    mimeType: 'application/json',
                    dialogTitle: 'Exporter la sauvegarde StandPower',
                  });
                }}
              >
                <Download className="w-4 h-4" />
                Exporter JSON complet
              </Button>

              <label className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sp-elevated border border-sp-border text-sm font-medium cursor-pointer hover:bg-sp-border/60">
                <Upload className="w-4 h-4" />
                <span>Importer un fichier JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </div>

            {pendingImportJson && (
              <div className="bg-sp-elevated border border-sp-warning rounded-xl p-3.5 space-y-2.5">
                <p className="text-sm font-bold">
                  Confirmer le remplacement des données locales ?
                </p>
                <p className="text-xs text-sp-muted">
                  Si le fichier est valide, il remplacera les données actuelles de manière atomique.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => void confirmImportReplace()}
                  >
                    Valider et importer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingImportJson(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Exports CSV tabulaires */}
          <Card className="space-y-3">
            <h2 className="text-base font-bold">Exports tabulaires CSV</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void exportAndShareTextFile({
                    filename: 'standpower-seances-musculation.csv',
                    content: exportTabularDataToCsv(snapshot, 'workouts'),
                    mimeType: 'text/csv',
                    dialogTitle: 'Export CSV Musculation',
                  })
                }
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV Musculation
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void exportAndShareTextFile({
                    filename: 'standpower-journal-combat.csv',
                    content: exportTabularDataToCsv(snapshot, 'combat'),
                    mimeType: 'text/csv',
                    dialogTitle: 'Export CSV Combat',
                  })
                }
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV Combat
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void exportAndShareTextFile({
                    filename: 'standpower-poids.csv',
                    content: exportTabularDataToCsv(snapshot, 'weights'),
                    mimeType: 'text/csv',
                    dialogTitle: 'Export CSV Poids',
                  })
                }
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV Pesées
              </Button>
            </div>
          </Card>

          {/* Mode Démonstration explicite et Suppression totale */}
          <Card className="space-y-3">
            <h2 className="text-base font-bold">
              Mode démonstration & Suppression totale des données
            </h2>
            <p className="text-xs text-sp-muted">
              Le mode démonstration charge un jeu de données d’exemple clairement identifié et réinitialisable à tout moment.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void activateDemoDataset()}
              >
                <RefreshCw className="w-4 h-4" />
                Charger le mode démonstration
              </Button>

              {!confirmReset ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirmReset(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer toutes les données locales
                </Button>
              ) : (
                <div className="w-full bg-sp-danger/10 border border-sp-danger rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-sp-danger">
                    Confirmer la suppression totale et irréversible des données locales ?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await resetAllLocalData();
                        setConfirmReset(false);
                      }}
                    >
                      Oui, tout effacer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmReset(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== SECTION 4 : CONFIDENTIALITÉ, MÉTHODE & LICENCES ==================== */}
      {activeSection === 'privacy' && (
        <div className="space-y-4">
          <Card className="space-y-2.5 text-sm">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-sp-accent" />
              Confidentialité et sécurité réelle des données
            </h2>
            <ul className="list-disc list-inside text-xs text-sp-muted space-y-1.5 leading-relaxed">
              <li>
                <strong>Architecture Local-First :</strong> toutes tes données (profil, poids, mensurations, séances, notes) sont stockées uniquement dans l’espace privé de l’application sur ton appareil (SQLite natif sur Android / IndexedDB sur navigateur).
              </li>
              <li>
                <strong>Zéro télémétrie et zéro IA distante :</strong> aucun serveur tiers, aucun traqueur publicitaire et aucune API d’intelligence artificielle ne reçoivent tes données.
              </li>
              <li>
                <strong>Permissions minimales :</strong> aucun accès aux contacts, au microphone, à la caméra ou à la localisation.
              </li>
              <li>
                <strong>Protection matérielle et sauvegarde système :</strong> la base locale n’applique pas de chiffrement applicatif par mot de passe séparé ; sa confidentialité repose sur le verrouillage et le chiffrement matériel de ton téléphone Android. Sur Android, la sauvegarde cloud automatique du système (<code>allowBackup=&quot;false&quot;</code>) est explicitement désactivée afin qu’aucune copie implicite de ta base de santé ne parte à ton insu.
              </li>
            </ul>
          </Card>

          <Card className="space-y-2.5">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-sp-accent" />
              Méthode de calcul et formules utilisées
            </h2>
            <CalculationMethodContent />
          </Card>

          <Card className="space-y-2 text-xs text-sp-muted">
            <h2 className="text-base font-bold text-sp-text flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sp-accent" />
              Version & Licences Open Source
            </h2>
            <p>
              <strong>StandPower</strong> — Version 1.0.0 (Schéma DB v1 • Moteur de règles v1.0.0-deterministic)
            </p>
            <p>
              Composants logiciels open-source inclus : React &amp; React Router (MIT), Zustand (MIT), React Hook Form &amp; Zod (MIT), Recharts (MIT), Lucide Icons (ISC), TailwindCSS (MIT), Capacitor &amp; @capacitor-community/sqlite (MIT).
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
