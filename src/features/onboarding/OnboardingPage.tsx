import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Info,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import {
  AlertBox,
  Badge,
  Button,
  Card,
  FieldError,
} from '../../components/ui/Primitives';
import { parseFrenchDecimal } from '../../domain/calculations/units';
import type {
  AvoidedAreaOrMovement,
  CombatDiscipline,
  DailyActivityLevel,
  DayOfWeek,
  DietaryPreference,
  EquipmentItem,
  ExperienceLevel,
  FoodExclusion,
  MedicalRestrictionStatus,
  MetabolicParameter,
  NutritionGuidanceStyle,
  PerceivedIntensity,
  PrimaryGoal,
  QuestionnaireAnswers,
  RecommendationResult,
  SessionDurationOption,
  WeightUnit,
} from '../../domain/types';

const DAYS_OPTIONS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mer' },
  { id: 'thu', label: 'Jeu' },
  { id: 'fri', label: 'Ven' },
  { id: 'sat', label: 'Sam' },
  { id: 'sun', label: 'Dim' },
];

const EQUIPMENT_OPTIONS: { id: EquipmentItem; label: string }[] = [
  { id: 'none', label: 'Aucun matériel (Poids du corps)' },
  { id: 'bands', label: 'Élastiques' },
  { id: 'dumbbells', label: 'Haltères' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'bench', label: 'Banc' },
  { id: 'barbell_plates', label: 'Barre et disques' },
  { id: 'rack', label: 'Rack / Barre de traction' },
  { id: 'machines', label: 'Machines / Poulies' },
  { id: 'full_gym', label: 'Salle complète' },
  { id: 'heavy_bag', label: 'Sac de frappe' },
  { id: 'mat', label: 'Tapis / Tatami' },
  { id: 'drill_partner', label: 'Partenaire pour drills' },
];

const AVOID_OPTIONS: { id: AvoidedAreaOrMovement; label: string }[] = [
  { id: 'overhead_press', label: 'Poussée verticale stricte au-dessus de la tête' },
  { id: 'deep_knee_flexion', label: 'Flexion profonde du genou sous forte charge' },
  { id: 'spinal_axial_load', label: 'Charge axiale lourde sur la colonne (barre dos)' },
  { id: 'heavy_hip_hinge', label: 'Tirage lourd depuis le sol (soulevé de terre lourd)' },
  { id: 'high_impact_jumps', label: 'Sauts et impacts répétés' },
  { id: 'wrist_extension', label: 'Extension prononcée des poignets' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const computeRecommendationPreview = useAppStore(
    (s) => s.computeRecommendationPreview
  );
  const saveQuestionnaireAndApplyProgram = useAppStore(
    (s) => s.saveQuestionnaireAndApplyProgram
  );

  const existingQa = snapshot.questionnaireAnswers;
  const hasExistingActiveProgram = snapshot.programInstances.some(
    (p) => p.status === 'active'
  );

  // Étapes : 0 = Intro, 1 = Profil & Objectif, 2 = Disponibilités & Matériel, 3 = Combat & Récupération, 4 = Nutrition, 5 = Résultat
  const [step, setStep] = useState<number>(0);

  // États du formulaire
  const [displayName, setDisplayName] = useState(
    existingQa?.displayName ?? snapshot.userProfile?.displayName ?? ''
  );
  const [ageInput, setAgeInput] = useState(
    String(existingQa?.ageYears ?? snapshot.userProfile?.ageYears ?? 28)
  );
  const [heightInput, setHeightInput] = useState(
    String(existingQa?.heightCm ?? snapshot.userProfile?.heightCm ?? 175)
  );
  const [weightInput, setWeightInput] = useState(
    String(existingQa?.weightKg ?? snapshot.userProfile?.weightKg ?? 74)
  );
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>(
    existingQa?.preferredWeightUnit ?? snapshot.userPreferences.weightUnit
  );
  const [metabolicParameter, setMetabolicParameter] =
    useState<MetabolicParameter>(
      existingQa?.metabolicParameter ??
        snapshot.userProfile?.metabolicParameter ??
        'unspecified'
    );
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    existingQa?.primaryGoal ??
      snapshot.userProfile?.primaryGoal ??
      'combat_complement'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    existingQa?.experienceLevel ??
      snapshot.userProfile?.experienceLevel ??
      'beginner'
  );
  const [recentWeeklyFrequency, setRecentWeeklyFrequency] = useState<number>(
    existingQa?.recentWeeklyFrequency ?? 2
  );
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>(
    existingQa?.availableDays ??
      snapshot.userProfile?.availableDays ?? ['mon', 'wed', 'fri']
  );
  const [desiredSessionsPerWeek, setDesiredSessionsPerWeek] = useState<number>(
    existingQa?.desiredSessionsPerWeek ??
      snapshot.userProfile?.desiredSessionsPerWeek ??
      3
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] =
    useState<SessionDurationOption>(
      existingQa?.sessionDurationMinutes ??
        snapshot.userProfile?.sessionDurationMinutes ??
        45
    );
  const [preferredReminderTime, setPreferredReminderTime] = useState(
    existingQa?.preferredReminderTime ?? '18:30'
  );
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>(
    existingQa?.availableEquipment ??
      snapshot.userProfile?.availableEquipment ?? ['dumbbells', 'bench', 'mat']
  );
  const [combatDiscipline, setCombatDiscipline] = useState<CombatDiscipline>(
    existingQa?.combatDiscipline ??
      snapshot.userProfile?.combatDiscipline ??
      'bjj'
  );
  const [combatSessionsPerWeek, setCombatSessionsPerWeek] = useState<number>(
    existingQa?.combatSessionsPerWeek ??
      snapshot.userProfile?.combatSessionsPerWeek ??
      2
  );
  const [combatDays, setCombatDays] = useState<DayOfWeek[]>(
    existingQa?.combatDays ??
      snapshot.userProfile?.combatDays ?? ['tue', 'thu']
  );
  const [combatIntensity, setCombatIntensity] = useState<PerceivedIntensity>(
    existingQa?.combatIntensity ??
      snapshot.userProfile?.combatIntensity ??
      'moderate'
  );
  const [sleepHoursInput, setSleepHoursInput] = useState(
    existingQa?.averageSleepHours !== undefined
      ? String(existingQa.averageSleepHours)
      : '7,5'
  );
  const [perceivedFatigue, setPerceivedFatigue] = useState<
    'low' | 'moderate' | 'high'
  >(existingQa?.perceivedFatigue ?? 'moderate');
  const [avoidedMovements, setAvoidedMovements] = useState<
    AvoidedAreaOrMovement[]
  >(existingQa?.avoidedMovements ?? []);
  const [medicalRestriction, setMedicalRestriction] =
    useState<MedicalRestrictionStatus>(existingQa?.medicalRestriction ?? 'no');
  const [pregnancyOrBreastfeeding, setPregnancyOrBreastfeeding] = useState(
    existingQa?.specialSafetyFlags?.pregnancyOrBreastfeeding ?? false
  );
  const [eatingDisorderHistory, setEatingDisorderHistory] = useState(
    existingQa?.specialSafetyFlags?.eatingDisorderHistory ?? false
  );
  const [medicalFollowUpRequired, setMedicalFollowUpRequired] = useState(
    existingQa?.specialSafetyFlags?.medicalFollowUpRequired ?? false
  );
  const [dailyActivityLevel, setDailyActivityLevel] =
    useState<DailyActivityLevel>(
      existingQa?.dailyActivityLevel ?? 'moderately_active'
    );
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(
    existingQa?.dietaryPreference ?? 'omnivore'
  );
  const [foodExclusions, setFoodExclusions] = useState<FoodExclusion[]>(
    existingQa?.foodExclusions ?? []
  );
  const [nutritionGuidanceStyle, setNutritionGuidanceStyle] =
    useState<NutritionGuidanceStyle>(
      existingQa?.nutritionGuidanceStyle ?? 'numeric_targets'
    );

  const [stepError, setStepError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<RecommendationResult | null>(null);
  const [overrideTemplateId, setOverrideTemplateId] = useState<string>('');

  const buildAnswersPayload = (): QuestionnaireAnswers | null => {
    const age = parseFrenchDecimal(ageInput);
    const height = parseFrenchDecimal(heightInput);
    const weight = parseFrenchDecimal(weightInput);
    const sleep = parseFrenchDecimal(sleepHoursInput);

    if (age === null || !Number.isInteger(age) || age < 12 || age > 105) {
      setStepError('Veuillez saisir un âge entier valide (entre 12 et 105 ans).');
      return null;
    }
    if (height === null || height < 110 || height > 240) {
      setStepError('Veuillez saisir une taille valide en cm (110 à 240 cm).');
      return null;
    }
    if (weight === null || weight < 30 || weight > 280) {
      setStepError('Veuillez saisir un poids valide en kg (30 à 280 kg).');
      return null;
    }

    const now = new Date().toISOString();
    return {
      id: existingQa?.id ?? 'qa_main',
      version: 1,
      displayName: displayName.trim() || undefined,
      ageYears: age,
      heightCm: height,
      weightKg: weight,
      preferredWeightUnit,
      metabolicParameter,
      primaryGoal,
      experienceLevel,
      recentWeeklyFrequency,
      availableDays:
        availableDays.length > 0 ? availableDays : ['mon', 'wed', 'fri'],
      desiredSessionsPerWeek,
      sessionDurationMinutes,
      preferredReminderTime,
      availableEquipment:
        availableEquipment.length > 0 ? availableEquipment : ['none'],
      combatDiscipline,
      combatSessionsPerWeek:
        combatDiscipline === 'none' ? 0 : combatSessionsPerWeek,
      combatDays: combatDiscipline === 'none' ? [] : combatDays,
      combatIntensity,
      averageSleepHours: sleep !== null && sleep > 0 ? sleep : undefined,
      perceivedFatigue,
      avoidedMovements,
      medicalRestriction,
      specialSafetyFlags: {
        pregnancyOrBreastfeeding,
        eatingDisorderHistory,
        medicalFollowUpRequired,
      },
      dailyActivityLevel,
      dietaryPreference,
      foodExclusions,
      nutritionGuidanceStyle,
      createdAt: existingQa?.createdAt ?? now,
      updatedAt: now,
    };
  };

  const handleComputeResult = () => {
    setStepError(null);
    const payload = buildAnswersPayload();
    if (!payload) return;
    const rec = computeRecommendationPreview(payload);
    setPreviewResult(rec);
    setOverrideTemplateId(rec.recommendedProgramTemplateId);
    setStep(5);
  };

  const handleConfirmAndStart = async () => {
    const payload = buildAnswersPayload();
    if (!payload) return;
    await saveQuestionnaireAndApplyProgram(
      payload,
      overrideTemplateId || undefined
    );
    navigate('/');
  };

  const toggleDay = (
    list: DayOfWeek[],
    setter: React.Dispatch<React.SetStateAction<DayOfWeek[]>>,
    day: DayOfWeek
  ) => {
    setter(
      list.includes(day) ? list.filter((d) => d !== day) : [...list, day]
    );
  };

  const toggleEquipment = (item: EquipmentItem) => {
    if (item === 'none') {
      setAvailableEquipment(['none']);
      return;
    }
    const withoutNone = availableEquipment.filter((e) => e !== 'none');
    if (withoutNone.includes(item)) {
      const next = withoutNone.filter((e) => e !== item);
      setAvailableEquipment(next.length > 0 ? next : ['none']);
    } else {
      setAvailableEquipment([...withoutNone, item]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Questionnaire & Personnalisation
          </h1>
          <p className="text-xs text-sp-muted">
            Moteur de règles local déterministe (v1.0) — Sans IA ni compte requis
          </p>
        </div>
        {step > 0 && step < 5 && (
          <Badge tone="sage">Étape {step} / 4</Badge>
        )}
      </div>

      {stepError && <FieldError id="onboarding-error" message={stepError} />}

      {/* ÉTAPE 0 : PRÉSENTATION & PRINCIPES */}
      {step === 0 && (
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 text-sp-accent">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-bold text-sp-text">
              Bienvenue dans StandPower
            </h2>
          </div>

          <div className="space-y-2.5 text-sm text-sp-muted leading-relaxed">
            <p>
              Avant de configurer ton programme, voici comment fonctionne StandPower :
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sp-text">
              <li>
                <strong>100 % local et sans compte :</strong> tes séances, pesées et notes restent stockées sur ton appareil.
              </li>
              <li>
                <strong>Personnalisation explicable sans IA :</strong> ton programme et ton planning sont construits par un moteur de règles déterministe et transparent, jamais par un modèle génératif.
              </li>
              <li>
                <strong>Cadre éducatif :</strong> les repères d’entraînement et d’énergie ne remplacent jamais l’avis d’un médecin, kinésithérapeute ou diététicien.
              </li>
              <li>
                <strong>Souplesse :</strong> tu peux passer les questions facultatives et modifier tes réponses à tout moment depuis ton profil.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button variant="primary" size="lg" onClick={() => setStep(1)}>
              Configurer mon programme
              <ArrowRight className="w-4 h-4" />
            </Button>
            {snapshot.userPreferences.onboardingCompleted && (
              <Button variant="secondary" onClick={() => navigate('/')}>
                Retour à l’accueil
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ÉTAPE 1 : PROFIL, OBJECTIF & EXPÉRIENCE */}
      {step === 1 && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold">
            A. Profil, Objectif & Expérience
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="qa-name"
                className="text-xs text-sp-muted block mb-1"
              >
                Prénom ou pseudonyme (facultatif)
              </label>
              <input
                id="qa-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Camille"
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="qa-unit"
                className="text-xs text-sp-muted block mb-1"
              >
                Unité de poids préférée
              </label>
              <select
                id="qa-unit"
                value={preferredWeightUnit}
                onChange={(e) =>
                  setPreferredWeightUnit(e.target.value as WeightUnit)
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="kg">Kilogrammes (kg)</option>
                <option value="lb">Livres (lb)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label
                htmlFor="qa-age"
                className="text-xs text-sp-muted block mb-1"
              >
                Âge (ans) *
              </label>
              <input
                id="qa-age"
                type="text"
                inputMode="numeric"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="qa-height"
                className="text-xs text-sp-muted block mb-1"
              >
                Taille (cm) *
              </label>
              <input
                id="qa-height"
                type="text"
                inputMode="decimal"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="qa-weight"
                className="text-xs text-sp-muted block mb-1"
              >
                Poids (kg) *
              </label>
              <input
                id="qa-weight"
                type="text"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="bg-sp-elevated rounded-xl p-3 space-y-2">
            <label
              htmlFor="qa-metabolic"
              className="text-xs font-semibold block"
            >
              Paramètre physiologique pour l’équation métabolique (Mifflin–St Jeor)
            </label>
            <p className="text-xs text-sp-muted leading-relaxed">
              Ce paramètre sert uniquement à sélectionner la constante (+5 ou −161) de l’équation énergétique. Si tu préfères ne pas le renseigner, StandPower ne le devine pas et affiche une plage complète.
            </p>
            <select
              id="qa-metabolic"
              value={metabolicParameter}
              onChange={(e) =>
                setMetabolicParameter(e.target.value as MetabolicParameter)
              }
              className="w-full min-h-[48px] rounded-xl bg-sp-surface border border-sp-border px-3 text-sm"
            >
              <option value="unspecified">
                Ne pas renseigner (afficher la plage complète)
              </option>
              <option value="female_equation">
                Constante Mifflin–St Jeor −161
              </option>
              <option value="male_equation">
                Constante Mifflin–St Jeor +5
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="qa-goal"
              className="text-xs text-sp-muted block mb-1"
            >
              B. Objectif principal
            </label>
            <select
              id="qa-goal"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal)}
              className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
            >
              <option value="combat_complement">
                Compléter une pratique de sports de combat (JJB, Boxe, MMA)
              </option>
              <option value="general_fitness">Se remettre en forme</option>
              <option value="strength">Gagner en force</option>
              <option value="hypertrophy">Développer la masse musculaire</option>
              <option value="fat_loss">
                Réduire progressivement la masse grasse
              </option>
              <option value="conditioning">
                Améliorer la condition physique générale
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="qa-exp"
                className="text-xs text-sp-muted block mb-1"
              >
                C. Expérience en musculation
              </label>
              <select
                id="qa-exp"
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(e.target.value as ExperienceLevel)
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="beginner">
                  Débutant (apprentissage ou reprise)
                </option>
                <option value="intermediate">
                  Intermédiaire (pratique régulière maîtrisée)
                </option>
                <option value="advanced">
                  Avancé (plusieurs années structurées)
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="qa-freq"
                className="text-xs text-sp-muted block mb-1"
              >
                Fréquence récente d’entraînement (séances/sem.)
              </label>
              <input
                id="qa-freq"
                type="number"
                min={0}
                max={10}
                value={recentWeeklyFrequency}
                onChange={(e) =>
                  setRecentWeeklyFrequency(Number(e.target.value) || 0)
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (buildAnswersPayload()) {
                  setStepError(null);
                  setStep(2);
                }
              }}
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ÉTAPE 2 : DISPONIBILITÉS & MATÉRIEL */}
      {step === 2 && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold">
            D. Disponibilités & E. Matériel
          </h2>

          <div>
            <span className="text-xs text-sp-muted block mb-1.5">
              Jours disponibles pour la musculation
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OPTIONS.map((d) => {
                const selected = availableDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      toggleDay(availableDays, setAvailableDays, d.id)
                    }
                    className={`touch-target rounded-xl text-xs font-semibold border ${
                      selected
                        ? 'bg-sp-accent text-sp-accent-fg border-sp-accent'
                        : 'bg-sp-elevated border-sp-border text-sp-muted'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="qa-desired-sessions"
                className="text-xs text-sp-muted block mb-1"
              >
                Nombre de séances musculation souhaitées / sem.
              </label>
              <select
                id="qa-desired-sessions"
                value={desiredSessionsPerWeek}
                onChange={(e) =>
                  setDesiredSessionsPerWeek(Number(e.target.value))
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} séance{n > 1 ? 's' : ''} / semaine
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="qa-duration"
                className="text-xs text-sp-muted block mb-1"
              >
                Durée disponible par séance
              </label>
              <select
                id="qa-duration"
                value={sessionDurationMinutes}
                onChange={(e) =>
                  setSessionDurationMinutes(
                    Number(e.target.value) as SessionDurationOption
                  )
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                {([20, 30, 45, 60, 75, 90] as const).map((min) => (
                  <option key={min} value={min}>
                    {min} minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="qa-reminder-time"
                className="text-xs text-sp-muted block mb-1"
              >
                Horaire préféré pour les rappels
              </label>
              <input
                id="qa-reminder-time"
                type="time"
                value={preferredReminderTime}
                onChange={(e) => setPreferredReminderTime(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-sp-muted block mb-1.5">
              Matériel à ta disposition
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = availableEquipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={`touch-target text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                      active
                        ? 'bg-sp-accent/20 border-sp-accent text-sp-text font-semibold'
                        : 'bg-sp-elevated border-sp-border text-sp-muted'
                    }`}
                  >
                    <span>{eq.label}</span>
                    {active && <Check className="w-4 h-4 text-sp-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ÉTAPE 3 : SPORTS DE COMBAT, RÉCUPÉRATION & LIMITES */}
      {step === 3 && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold">
            F. Sports de combat & G. Récupération / Limites
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="qa-combat-disc"
                className="text-xs text-sp-muted block mb-1"
              >
                Pratique de sports de combat
              </label>
              <select
                id="qa-combat-disc"
                value={combatDiscipline}
                onChange={(e) =>
                  setCombatDiscipline(e.target.value as CombatDiscipline)
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="none">Aucune pratique</option>
                <option value="bjj">JJB / BJJ / Grappling</option>
                <option value="boxing">Boxe / Striking</option>
                <option value="mma">MMA</option>
                <option value="multiple">Plusieurs disciplines</option>
              </select>
            </div>

            {combatDiscipline !== 'none' && (
              <div>
                <label
                  htmlFor="qa-combat-freq"
                  className="text-xs text-sp-muted block mb-1"
                >
                  Séances encadrées de combat / semaine
                </label>
                <select
                  id="qa-combat-freq"
                  value={combatSessionsPerWeek}
                  onChange={(e) =>
                    setCombatSessionsPerWeek(Number(e.target.value))
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} séance{n > 1 ? 's' : ''} / semaine
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {combatDiscipline !== 'none' && (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-sp-muted block mb-1.5">
                  Jours habituels de sports de combat
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OPTIONS.map((d) => {
                    const selected = combatDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          toggleDay(combatDays, setCombatDays, d.id)
                        }
                        className={`touch-target rounded-xl text-xs font-semibold border ${
                          selected
                            ? 'bg-sp-terracotta text-sp-terracotta-fg border-sp-terracotta'
                            : 'bg-sp-elevated border-sp-border text-sp-muted'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="qa-combat-intensity"
                  className="text-xs text-sp-muted block mb-1"
                >
                  Intensité ressentie habituelle en combat
                </label>
                <select
                  id="qa-combat-intensity"
                  value={combatIntensity}
                  onChange={(e) =>
                    setCombatIntensity(e.target.value as PerceivedIntensity)
                  }
                  className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
                >
                  <option value="low">Légère (technique / drills)</option>
                  <option value="moderate">
                    Modérée (technique + rounds contrôlés)
                  </option>
                  <option value="high">
                    Intense (sparring dur / préparation compétition)
                  </option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sp-border">
            <div>
              <label
                htmlFor="qa-fatigue"
                className="text-xs text-sp-muted block mb-1"
              >
                Fatigue générale ressentie actuellement
              </label>
              <select
                id="qa-fatigue"
                value={perceivedFatigue}
                onChange={(e) =>
                  setPerceivedFatigue(
                    e.target.value as 'low' | 'moderate' | 'high'
                  )
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="low">Faible (bonne récupération)</option>
                <option value="moderate">Modérée (normale)</option>
                <option value="high">Élevée (besoin de ménager le volume)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="qa-sleep"
                className="text-xs text-sp-muted block mb-1"
              >
                Sommeil habituel en heures (facultatif)
              </label>
              <input
                id="qa-sleep"
                type="text"
                inputMode="decimal"
                value={sleepHoursInput}
                onChange={(e) => setSleepHoursInput(e.target.value)}
                placeholder="7,5"
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-sp-muted block mb-1.5">
              Mouvements ou contraintes que tu souhaites éviter (facultatif)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVOID_OPTIONS.map((av) => {
                const active = avoidedMovements.includes(av.id);
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() =>
                      setAvoidedMovements(
                        active
                          ? avoidedMovements.filter((x) => x !== av.id)
                          : [...avoidedMovements, av.id]
                      )
                    }
                    className={`touch-target text-left px-3 py-2 rounded-xl text-xs border flex items-center justify-between ${
                      active
                        ? 'bg-sp-terracotta/20 border-sp-terracotta text-sp-text font-semibold'
                        : 'bg-sp-elevated border-sp-border text-sp-muted'
                    }`}
                  >
                    <span>{av.label}</span>
                    {active && <Check className="w-4 h-4 text-sp-terracotta" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="qa-medical"
              className="text-xs text-sp-muted block mb-1"
            >
              Existence d’une restriction médicale actuelle
            </label>
            <select
              id="qa-medical"
              value={medicalRestriction}
              onChange={(e) =>
                setMedicalRestriction(e.target.value as MedicalRestrictionStatus)
              }
              className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
            >
              <option value="no">Non</option>
              <option value="yes">Oui (suivi professionnel recommandé)</option>
              <option value="prefer_not_to_say">Préfère ne pas répondre</option>
            </select>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ÉTAPE 4 : NUTRITION & SÉCURITÉ */}
      {step === 4 && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold">H. Repères Nutritionnels</h2>

          <div>
            <label
              htmlFor="qa-activity"
              className="text-xs text-sp-muted block mb-1"
            >
              Niveau d’activité global (quotidien + sport habituel)
            </label>
            <select
              id="qa-activity"
              value={dailyActivityLevel}
              onChange={(e) =>
                setDailyActivityLevel(e.target.value as DailyActivityLevel)
              }
              className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
            >
              <option value="sedentary">
                Sédentaire (bureau, peu de déplacements)
              </option>
              <option value="lightly_active">
                Légèrement actif (marche ou 1–3 séances/sem.)
              </option>
              <option value="moderately_active">
                Modérément actif (quotidien actif ou 3–5 séances/sem.)
              </option>
              <option value="very_active">
                Très actif (métier physique ou entraînement très fréquent)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="qa-diet"
                className="text-xs text-sp-muted block mb-1"
              >
                Préférence alimentaire (facultatif, pour exemples de repas)
              </label>
              <select
                id="qa-diet"
                value={dietaryPreference}
                onChange={(e) =>
                  setDietaryPreference(e.target.value as DietaryPreference)
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Végétarien</option>
                <option value="vegan">Végétalien</option>
                <option value="unspecified">Non renseigné</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="qa-guidance-style"
                className="text-xs text-sp-muted block mb-1"
              >
                Affichage préféré
              </label>
              <select
                id="qa-guidance-style"
                value={nutritionGuidanceStyle}
                onChange={(e) =>
                  setNutritionGuidanceStyle(
                    e.target.value as NutritionGuidanceStyle
                  )
                }
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                <option value="numeric_targets">
                  Repères chiffrés (plages kcal & protéines) + conseils
                </option>
                <option value="simple_advice">
                  Conseils qualitatifs simples uniquement
                </option>
              </select>
            </div>
          </div>

          <div>
            <span className="text-xs text-sp-muted block mb-1.5">
              Exclusions alimentaires facultatives (filtre les exemples de repas)
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['lactose', 'Sans lactose'],
                  ['gluten', 'Sans gluten'],
                  ['nuts', 'Sans fruits à coque'],
                  ['eggs', 'Sans œufs'],
                  ['soy', 'Sans soja'],
                  ['fish_shellfish', 'Sans poisson/crustacés'],
                ] as const
              ).map(([id, label]) => {
                const active = foodExclusions.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setFoodExclusions(
                        active
                          ? foodExclusions.filter((x) => x !== id)
                          : [...foodExclusions, id]
                      )
                    }
                    className={`min-h-[42px] px-3 rounded-xl text-xs border ${
                      active
                        ? 'bg-sp-accent text-sp-accent-fg border-sp-accent font-semibold'
                        : 'bg-sp-elevated border-sp-border text-sp-muted'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sécurité nutritionnelle */}
          <div className="bg-sp-elevated rounded-xl p-3 space-y-2 text-xs">
            <p className="font-semibold text-sp-text">
              Situations particulières (désactive les cibles caloriques automatiques)
            </p>
            <label className="flex items-center gap-2.5 min-h-[38px]">
              <input
                type="checkbox"
                checked={pregnancyOrBreastfeeding}
                onChange={(e) => setPregnancyOrBreastfeeding(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Grossesse ou allaitement en cours</span>
            </label>
            <label className="flex items-center gap-2.5 min-h-[38px]">
              <input
                type="checkbox"
                checked={eatingDisorderHistory}
                onChange={(e) => setEatingDisorderHistory(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Antécédent ou présence de trouble du comportement alimentaire</span>
            </label>
            <label className="flex items-center gap-2.5 min-h-[38px]">
              <input
                type="checkbox"
                checked={medicalFollowUpRequired}
                onChange={(e) => setMedicalFollowUpRequired(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Situation médicale nécessitant un suivi nutritionnel spécifique</span>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button variant="primary" onClick={handleComputeResult}>
              Calculer ma recommandation
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ÉTAPE 5 : ÉCRAN DE RÉSULTAT EXPLICABLE */}
      {step === 5 && previewResult && (
        <div className="space-y-4">
          {hasExistingActiveProgram && (
            <AlertBox
              tone="warning"
              title="Aperçu avant remplacement du programme actif"
            >
              Un programme est déjà actif. En cliquant sur « Commencer », ce nouveau programme deviendra ton programme actif, mais <strong>tout ton historique de séances et de mesures est intégralement préservé</strong>.
            </AlertBox>
          )}

          <Card className="border-sp-accent space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Badge tone="sage">
                  Recommandation déterministe ({previewResult.ruleEngineVersion})
                </Badge>
                <h2 className="text-xl font-bold mt-1.5">
                  {previewResult.recommendedProgramName}
                </h2>
                <p className="text-xs text-sp-muted">
                  Durée estimée par séance : ~
                  {previewResult.estimatedSessionDurationMinutes} minutes
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStep(1)}
              >
                <Edit3 className="w-4 h-4" />
                Modifier mes réponses
              </Button>
            </div>

            {/* Explication transparente des règles */}
            <div className="bg-sp-elevated rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-sp-accent flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Pourquoi ce choix ? (Règles appliquées)
              </p>
              <ul className="list-disc list-inside text-xs text-sp-text space-y-1.5 leading-relaxed">
                {previewResult.explanations.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>

            {/* Avertissements éventuels */}
            {previewResult.warnings.map((w, i) => (
              <AlertBox key={i} tone="warning">
                {w}
              </AlertBox>
            ))}

            {/* Répartition hebdomadaire */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Répartition hebdomadaire</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {previewResult.weeklySchedule.map((slot) => (
                  <div
                    key={slot.day}
                    className="bg-sp-elevated rounded-xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold uppercase text-sp-muted w-10">
                      {DAYS_OPTIONS.find((d) => d.id === slot.day)?.label}
                    </span>
                    <span className="flex-1 font-medium text-sp-text truncate">
                      {slot.title}
                    </span>
                    <Badge
                      tone={
                        slot.activityType === 'strength'
                          ? 'sage'
                          : slot.activityType === 'combat'
                          ? 'terracotta'
                          : 'neutral'
                      }
                    >
                      {slot.activityType === 'strength'
                        ? 'Muscu'
                        : slot.activityType === 'combat'
                        ? 'Combat'
                        : 'Repos'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Aperçu des séances et exercices */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold">
                Contenu des séances adaptées
              </h3>
              {previewResult.sessionPrescriptions.map((sess) => (
                <div
                  key={sess.sessionKey}
                  className="bg-sp-elevated rounded-xl p-3 space-y-2 text-xs"
                >
                  <p className="font-bold text-sm text-sp-text">{sess.title}</p>
                  <p className="text-sp-muted">
                    <strong>Échauffement :</strong> {sess.warmupNotes}
                  </p>
                  <div className="space-y-1">
                    {sess.exercises.map((ex, i) => (
                      <div
                        key={`${ex.exerciseId}_${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-sp-border/60 last:border-0"
                      >
                        <span className="font-medium text-sp-text">
                          {ex.exerciseName}
                        </span>
                        <span className="tabular-nums text-sp-muted">
                          {ex.sets} ×{' '}
                          {ex.durationSeconds
                            ? `${ex.durationSeconds} s`
                            : `${ex.repRangeMin}–${ex.repRangeMax} rép.`}{' '}
                          • Repos {ex.restSeconds}s • {ex.targetRir}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Consignes de première séance (zéro charge inventée) */}
            <div className="bg-sp-elevated rounded-xl p-3.5 space-y-1.5 text-xs">
              <p className="font-bold text-sp-text flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sp-accent" />
                Comment choisir tes charges à la première séance ?
              </p>
              <ul className="list-disc list-inside text-sp-muted space-y-1">
                {previewResult.firstSessionGuidance.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            {/* Repères nutritionnels */}
            <div className="bg-sp-elevated rounded-xl p-3.5 space-y-1.5 text-xs">
              <p className="font-bold text-sp-text">
                Repères nutritionnels estimatifs (Mifflin–St Jeor)
              </p>
              {previewResult.nutritionSummary.safetyReason ? (
                <p className="text-sp-muted">
                  {previewResult.nutritionSummary.safetyReason}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-sp-surface rounded-lg p-2.5">
                    <span className="text-sp-muted block">
                      Métabolisme de repos (BMR)
                    </span>
                    <span className="font-bold tabular-nums text-sm">
                      {previewResult.nutritionSummary.bmrEstimateKcal.exact
                        ? `${previewResult.nutritionSummary.bmrEstimateKcal.exact} kcal/j`
                        : `${previewResult.nutritionSummary.bmrEstimateKcal.min}–${previewResult.nutritionSummary.bmrEstimateKcal.max} kcal/j`}
                    </span>
                  </div>
                  <div className="bg-sp-surface rounded-lg p-2.5">
                    <span className="text-sp-muted block">
                      Repère quotidien cible
                    </span>
                    <span className="font-bold tabular-nums text-sm">
                      {previewResult.nutritionSummary.targetKcal.exact
                        ? `~${previewResult.nutritionSummary.targetKcal.exact} kcal/j`
                        : `${previewResult.nutritionSummary.targetKcal.min}–${previewResult.nutritionSummary.targetKcal.max} kcal/j`}
                    </span>
                  </div>
                  {previewResult.nutritionSummary.proteinRangeGramsPerDay && (
                    <div className="bg-sp-surface rounded-lg p-2.5">
                      <span className="text-sp-muted block">
                        Plage protéines (1,4–2,0 g/kg)
                      </span>
                      <span className="font-bold tabular-nums text-sm">
                        {
                          previewResult.nutritionSummary.proteinRangeGramsPerDay
                            .min
                        }
                        –
                        {
                          previewResult.nutritionSummary.proteinRangeGramsPerDay
                            .max
                        }{' '}
                        g/j
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Possibilité de choisir un autre programme */}
            <div className="pt-1">
              <label
                htmlFor="qa-override-prog"
                className="text-xs text-sp-muted block mb-1"
              >
                Tu préfères démarrer avec un autre programme prédéfini ?
              </label>
              <select
                id="qa-override-prog"
                value={overrideTemplateId}
                onChange={(e) => setOverrideTemplateId(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm"
              >
                {snapshot.programTemplates
                  .filter((p) => !p.isArchived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameFr}{' '}
                      {p.id === previewResult.recommendedProgramTemplateId
                        ? '(Recommandé)'
                        : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Modifier mes réponses
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => void handleConfirmAndStart()}
              >
                <Check className="w-5 h-5" />
                Commencer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
