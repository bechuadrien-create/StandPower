import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Info } from 'lucide-react';
import { useAppStore } from '../../app/providers/useAppStore';
import { AlertBox, Badge, Button, Card } from '../../components/ui/Primitives';
import {
  ACTIVITY_FACTORS,
  MET_REFERENCE_VALUES,
  calculateMetSessionExpenditure,
  computeSafeNutritionTargets,
} from '../../domain/calculations/metabolism';
import type { DietaryPreference, FoodExclusion } from '../../domain/types';

interface MealExample {
  id: string;
  title: string;
  description: string;
  diet: Exclude<DietaryPreference, 'unspecified'>[];
  contains: FoodExclusion[];
}

/** Assemblages simples, sans prétention de valeur nutritionnelle exacte. */
const MEAL_EXAMPLES: MealExample[] = [
  { id: 'm1', title: 'Bol riz, poulet et légumes', description: 'Riz, blanc de poulet, brocolis, filet d’huile d’olive, fruit.', diet: ['omnivore'], contains: [] },
  { id: 'm2', title: 'Omelette, pain complet et crudités', description: 'Œufs, pain complet, tomates, salade verte, yaourt.', diet: ['omnivore', 'vegetarian'], contains: ['eggs', 'gluten', 'lactose'] },
  { id: 'm3', title: 'Dahl de lentilles et riz', description: 'Lentilles corail, lait de coco, épices, riz basmati, épinards.', diet: ['omnivore', 'vegetarian', 'vegan'], contains: [] },
  { id: 'm4', title: 'Saumon, pommes de terre et haricots verts', description: 'Pavé de saumon, pommes de terre vapeur, haricots verts, citron.', diet: ['omnivore'], contains: ['fish_shellfish'] },
  { id: 'm5', title: 'Tofu sauté, nouilles et légumes', description: 'Tofu ferme, nouilles de blé, poivrons, carottes, sauce soja.', diet: ['omnivore', 'vegetarian', 'vegan'], contains: ['soy', 'gluten'] },
  { id: 'm6', title: 'Fromage blanc, flocons d’avoine et fruits', description: 'Fromage blanc, flocons d’avoine, banane, quelques noix.', diet: ['omnivore', 'vegetarian'], contains: ['lactose', 'nuts', 'gluten'] },
  { id: 'm7', title: 'Chili sin carne', description: 'Haricots rouges, maïs, tomates, oignons, riz ou tortillas de maïs.', diet: ['omnivore', 'vegetarian', 'vegan'], contains: [] },
  { id: 'm8', title: 'Dinde, quinoa et courgettes', description: 'Escalope de dinde, quinoa, courgettes rôties, fruit de saison.', diet: ['omnivore'], contains: [] },
  { id: 'm9', title: 'Pois chiches rôtis, boulgour et légumes', description: 'Pois chiches, boulgour, concombre, tomates, sauce tahini.', diet: ['omnivore', 'vegetarian', 'vegan'], contains: ['gluten'] },
];

const MODE_LABELS = {
  maintenance: 'Maintien',
  moderate_deficit: 'Déficit modéré (~300 kcal)',
  moderate_surplus: 'Surplus modéré (~200 kcal)',
  educational_only: 'Repères éducatifs uniquement',
} as const;

function range(min: number, max: number, exact?: number) {
  if (exact !== undefined) return `~${exact}`;
  return min === max ? `~${min}` : `${min}–${max}`;
}

export function NutritionPage() {
  const navigate = useNavigate();
  const snapshot = useAppStore((s) => s.snapshot);
  const qa = snapshot.questionnaireAnswers;
  const profile = snapshot.userProfile;

  const [metKey, setMetKey] = useState<string>('strength_moderate');
  const [metDuration, setMetDuration] = useState(60);
  const [showMethod, setShowMethod] = useState(false);

  const result = useMemo(() => {
    if (!profile || !qa) return null;
    try {
      return computeSafeNutritionTargets({
        ageYears: profile.ageYears,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        metabolicParameter: profile.metabolicParameter,
        activityLevel: qa.dailyActivityLevel,
        primaryGoal: profile.primaryGoal,
        specialSafetyFlags: qa.specialSafetyFlags,
      });
    } catch {
      return null;
    }
  }, [profile, qa]);

  const metEstimate = useMemo(() => {
    if (!profile) return null;
    const ref = MET_REFERENCE_VALUES[metKey];
    try {
      return calculateMetSessionExpenditure({ metValue: ref.met, weightKg: profile.weightKg, durationMinutes: Math.max(1, metDuration), activityLabel: ref.labelFr });
    } catch {
      return null;
    }
  }, [profile, metKey, metDuration]);

  const meals = useMemo(() => {
    const diet = qa?.dietaryPreference ?? 'unspecified';
    const excl = qa?.foodExclusions ?? [];
    return MEAL_EXAMPLES.filter((m) => (diet === 'unspecified' || m.diet.includes(diet)) && !m.contains.some((c) => excl.includes(c)));
  }, [qa]);

  if (!profile || !qa || !result) {
    return (
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Nutrition</h1>
        <p className="text-sm text-sp-muted">Complète le questionnaire pour obtenir des repères énergétiques estimatifs.</p>
        <Button variant="primary" onClick={() => navigate('/onboarding')}>Ouvrir le questionnaire</Button>
      </Card>
    );
  }

  const numeric = snapshot.userPreferences.nutritionGuidanceStyle === 'numeric_targets' && result.eligibleForDeficitOrSurplus;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Nutrition</h1>
        <p className="text-xs text-sp-muted">Repères éducatifs estimés, pas une prescription médicale.</p>
      </div>

      {result.safetyReason && <AlertBox tone="warning" title="Objectifs chiffrés désactivés">{result.safetyReason}</AlertBox>}

      {numeric && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Tes repères</h2>
            <Badge tone="sage">{MODE_LABELS[result.recommendedMode]}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">1. Métabolisme de repos estimé</p>
              <p className="text-lg font-bold tabular-nums">{range(result.bmr.min, result.bmr.max, result.bmr.exact)} kcal/j</p>
            </div>
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">2. Dépense quotidienne totale estimée (×{result.tdee.factor})</p>
              <p className="text-lg font-bold tabular-nums">{range(result.tdee.min, result.tdee.max, result.tdee.exact)} kcal/j</p>
            </div>
            <div className="bg-sp-elevated rounded-xl p-3">
              <p className="text-xs text-sp-muted">Repère quotidien</p>
              <p className="text-lg font-bold tabular-nums">{range(result.targetKcal.min, result.targetKcal.max, result.targetKcal.exact)} kcal/j</p>
            </div>
            {result.proteinRangeGramsPerDay && (
              <div className="bg-sp-elevated rounded-xl p-3">
                <p className="text-xs text-sp-muted">Plage de protéines (1,4–2,0 g/kg/j)</p>
                <p className="text-lg font-bold tabular-nums">{result.proteinRangeGramsPerDay.min}–{result.proteinRangeGramsPerDay.max} g/j</p>
              </div>
            )}
          </div>
          <p className="text-xs text-sp-muted">{result.tdee.antiDoubleCountingNotice}</p>
          <p className="text-xs text-sp-muted">
            Suis la tendance du poids sur plusieurs semaines : StandPower ne modifie jamais ta cible automatiquement à partir d’une seule pesée. Toute modification passe par le questionnaire et reste confirmée par toi.
          </p>
        </Card>
      )}

      <Card className="space-y-2 text-sm">
        <h2 className="text-base font-bold">Conseils généraux</h2>
        <ul className="list-disc list-inside text-sp-muted space-y-1">
          <li>Des repas réguliers, adaptés à ton emploi du temps et à tes séances.</li>
          <li>Des sources de protéines variées (animales ou végétales) réparties sur la journée.</li>
          <li>Des fruits et légumes à chaque repas autant que possible.</li>
          <li>Des glucides en quantité adaptée à l’activité : plus les jours de séances longues ou intenses.</li>
          <li>Des lipides variés (huiles végétales, oléagineux, poissons gras si consommés).</li>
          <li>Boire régulièrement, davantage par temps chaud ou lors de séances longues, sans excès.</li>
        </ul>
        <p className="text-xs text-sp-muted">Aucun plan de déshydratation ou de « weight cut » n’est proposé.</p>
      </Card>

      {/* 3. MET */}
      <Card className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-sp-accent" />3. Dépense estimée d’une séance (MET)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select value={metKey} onChange={(e) => setMetKey(e.target.value)} aria-label="Type d'activité" className="sm:col-span-2 min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm">
            {Object.entries(MET_REFERENCE_VALUES).map(([k, v]) => <option key={k} value={k}>{v.labelFr} (MET {String(v.met).replace('.', ',')})</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="number" min={5} max={300} value={metDuration} onChange={(e) => setMetDuration(Math.max(1, Number(e.target.value) || 1))} aria-label="Durée en minutes" className="w-full min-h-[48px] rounded-xl bg-sp-elevated border border-sp-border px-3 text-sm tabular-nums" />
            <span className="text-xs text-sp-muted">min</span>
          </div>
        </div>
        {metEstimate && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-sp-elevated rounded-xl p-3"><p className="text-xs text-sp-muted">Brute</p><p className="text-lg font-bold tabular-nums">~{metEstimate.grossKcal} kcal</p></div>
            <div className="bg-sp-elevated rounded-xl p-3"><p className="text-xs text-sp-muted">Nette (au-dessus du repos)</p><p className="text-lg font-bold tabular-nums">~{metEstimate.netKcal} kcal</p></div>
          </div>
        )}
        <p className="text-xs text-sp-muted">{MET_REFERENCE_VALUES[metKey].notesFr} {metEstimate?.uncertaintyWarning}</p>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-bold">Exemples de repas</h2>
        <p className="text-xs text-sp-muted">Filtrés selon tes préférences et exclusions déclarées. Ces exemples ne garantissent pas l’absence d’allergènes : vérifie toujours les étiquettes. Aucune valeur nutritionnelle exacte n’est affichée faute de base de données vérifiée intégrée.</p>
        {meals.length === 0 ? <p className="text-sm text-sp-muted">Aucun exemple compatible avec toutes tes exclusions.</p> : (
          <div className="space-y-1.5">
            {meals.map((m) => (
              <div key={m.id} className="bg-sp-elevated rounded-xl p-3 text-sm">
                <p className="font-semibold">{m.title}</p>
                <p className="text-xs text-sp-muted">{m.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <button type="button" onClick={() => setShowMethod((v) => !v)} aria-expanded={showMethod} className="w-full touch-target flex items-center justify-between text-left">
          <span className="text-base font-bold flex items-center gap-2"><Info className="w-5 h-5 text-sp-accent" />Comment sont calculés mes repères ?</span>
          <span className="text-sp-muted text-sm">{showMethod ? 'Masquer' : 'Afficher'}</span>
        </button>
        {showMethod && <CalculationMethodContent />}
      </Card>
    </div>
  );
}

export function CalculationMethodContent() {
  return (
    <div className="space-y-3 text-sm text-sp-muted leading-relaxed">
      <div>
        <p className="font-semibold text-sp-text">1. Métabolisme de repos — Mifflin–St Jeor</p>
        <p>10 × poids (kg) + 6,25 × taille (cm) − 5 × âge, puis +5 (constante « masculine ») ou −161 (constante « féminine »). Ce paramètre est un choix d’équation physiologique, pas une identité. S’il n’est pas renseigné, StandPower affiche la plage entre les deux constantes au lieu de deviner. L’équation est une estimation statistique sur population ; l’écart individuel peut atteindre environ ±10 %.</p>
      </div>
      <div>
        <p className="font-semibold text-sp-text">2. Dépense quotidienne totale — facteur d’activité</p>
        <ul className="list-disc list-inside">
          {Object.values(ACTIVITY_FACTORS).map((a) => <li key={a.labelFr}>{a.labelFr} : ×{String(a.factor).replace('.', ',')}</li>)}
        </ul>
        <p>Ce facteur global inclut déjà une partie de l’entraînement : les calories des séances ne sont jamais rajoutées automatiquement (pas de double comptage).</p>
      </div>
      <div>
        <p className="font-semibold text-sp-text">3. Dépense d’une séance — MET</p>
        <p>Brute = MET × 3,5 × poids (kg) / 200 × durée (min). Nette = (MET − 1) × 3,5 × poids / 200 × durée. Les valeurs MET sont des moyennes indicatives inspirées du Compendium of Physical Activities ; l’incertitude est forte en musculation et en sports intermittents (temps de repos, intensité variable). Ce n’est pas une mesure de capteur.</p>
      </div>
      <div>
        <p className="font-semibold text-sp-text">Objectifs</p>
        <p>Maintien par défaut ; déficit modéré (~300 kcal) ou surplus modéré (~200 kcal) uniquement pour les adultes éligibles, sans jamais descendre sous le métabolisme de repos estimé. Aucune cible de déficit pour les moins de 18 ans, en cas de grossesse/allaitement, de trouble alimentaire signalé ou de suivi médical spécifique.</p>
      </div>
      <div>
        <p className="font-semibold text-sp-text">Protéines</p>
        <p>Plage de 1,4 à 2,0 g/kg/j, couramment citée pour les adultes pratiquant la musculation (par ex. dans la prise de position de l’International Society of Sports Nutrition, 2017). C’est une fourchette générale, non adaptée aux situations médicales particulières (notamment rénales), et calculée sur le poids total faute de mesure de la masse maigre.</p>
      </div>
      <div>
        <p className="font-semibold text-sp-text">Force</p>
        <p>1RM estimé (Brzycki) = charge × 36 / (37 − répétitions), affiché uniquement pour 1 à 10 répétitions et pour les exercices avec charge externe. Volume = Σ charge × répétitions des séries de travail validées (kg·rép), échauffements et assistance exclus.</p>
      </div>
      <p className="text-xs">Références citées de mémoire, sans lien : Mifflin MD, St Jeor ST et al., Am J Clin Nutr, 1990 ; Brzycki M., JOPERD, 1993 ; Ainsworth BE et al., Compendium of Physical Activities ; Jäger R et al., ISSN Position Stand: protein and exercise, 2017. Vérifie-les auprès des sources originales.</p>
    </div>
  );
}
