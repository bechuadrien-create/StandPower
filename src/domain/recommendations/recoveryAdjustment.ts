import type { RecoveryCheckIn } from '../types';

export interface RecoveryGuidance {
  suggestedAdjustment: RecoveryCheckIn['suggestedAdjustment'];
  titleFr: string;
  explanationFr: string;
  optionsFr: {
    id: RecoveryCheckIn['suggestedAdjustment'];
    label: string;
    description: string;
  }[];
}

/**
 * Évalue un check-in de récupération sans créer de faux score médical ou pseudo-scientifique.
 * - En cas de douleur inhabituelle, malaise ou blessure signalée : suspendre l'exercice concerné et consulter si besoin.
 * - Aucun discours culpabilisant.
 */
export function evaluateRecoveryCheckIn(input: {
  energy: 1 | 2 | 3 | 4 | 5;
  fatigue: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  unusualPainOrIllness: boolean;
  painAreaNote?: string;
}): RecoveryGuidance {
  const baseOptions: RecoveryGuidance['optionsFr'] = [
    {
      id: 'keep_session',
      label: 'Conserver la séance prévue',
      description: 'Démarrer normalement en restant à l’écoute des sensations à l’échauffement.',
    },
    {
      id: 'reduce_volume',
      label: 'Réduire légèrement le volume (-1 série)',
      description: 'Conserver les exercices prévus mais retirer 1 série par mouvement et garder 3 RIR.',
    },
    {
      id: 'lighter_session',
      label: 'Choisir une séance légère / mobilité',
      description: 'Privilégier le travail technique ou les drills de mobilité sans charge lourde.',
    },
    {
      id: 'postpone',
      label: 'Reporter la séance à demain',
      description: 'Décaler la séance d’un jour sur le planning sans aucune pénalité.',
    },
  ];

  if (input.unusualPainOrIllness) {
    return {
      suggestedAdjustment: 'suspend_and_consult',
      titleFr: 'Prudence recommandée — Douleur inhabituelle ou malaise signalé',
      explanationFr:
        'Une douleur articulaire/musculaire inhabituelle ou un état de malaise ne relève pas de la motivation. Il est recommandé de suspendre le mouvement ou la séance concernée, de ne pas forcer sur la zone sensible et de consulter un professionnel de santé (médecin, kinésithérapeute) si la gêne persiste.',
      optionsFr: [
        {
          id: 'suspend_and_consult',
          label: 'Suspendre la séance ou remplacer l’exercice sensible',
          description: 'Ne jamais forcer sur une douleur inhabituelle.',
        },
        ...baseOptions.filter((o) => o.id !== 'keep_session'),
      ],
    };
  }

  const highFatigueOrSoreness = input.fatigue >= 4 || input.soreness >= 4;
  const veryLowEnergyOrSleep = input.energy <= 2 && input.sleepQuality <= 2;

  if (highFatigueOrSoreness && veryLowEnergyOrSleep) {
    return {
      suggestedAdjustment: 'lighter_session',
      titleFr: 'Fatigue marquée aujourd’hui',
      explanationFr:
        'Ton niveau d’énergie et de sommeil déclaré est bas avec une fatigue élevée. Une séance allégée, un circuit de mobilité ou un report simple permettent de mieux récupérer pour la suite de la semaine.',
      optionsFr: baseOptions,
    };
  }

  if (highFatigueOrSoreness || input.energy <= 2) {
    return {
      suggestedAdjustment: 'reduce_volume',
      titleFr: 'Ajustement modéré suggéré',
      explanationFr:
        'Avec des courbatures ou une fatigue modérée à élevée, tu peux conserver ta séance en retirant 1 série de travail par exercice et en gardant 3 répétitions en réserve.',
      optionsFr: baseOptions,
    };
  }

  return {
    suggestedAdjustment: 'keep_session',
    titleFr: 'Disponibilité habituelle',
    explanationFr:
      'Tes repères du jour permettent d’aborder la séance prévue normalement après un échauffement progressif.',
    optionsFr: baseOptions,
  };
}
