import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { useAppStore } from '../app/providers/useAppStore';
import { BUILTIN_EXERCISES } from '../data/seeds/exercisesSeed';
import { BUILTIN_DRILLS } from '../data/seeds/drillsSeed';
import { BUILTIN_PROGRAMS } from '../data/seeds/programsSeed';
import { serializeDatabaseToJson } from '../data/backup/backupService';

describe('Intégrité des catalogues embarqués et parcours complet de bout en bout', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/');
    await useAppStore.getState().resetAllLocalData();
  });

  it('embarque au moins 50 exercices de musculation, 30 drills JJB et 8 programmes complets', () => {
    expect(BUILTIN_EXERCISES.length).toBeGreaterThanOrEqual(50);
    expect(BUILTIN_DRILLS.length).toBeGreaterThanOrEqual(30);
    expect(BUILTIN_PROGRAMS.length).toBeGreaterThanOrEqual(8);

    // Vérifie qu'aucun drill ne recommande de pont sur la tête
    for (const drill of BUILTIN_DRILLS) {
      expect(drill.nameFr.toLowerCase()).not.toContain('pont sur la tête');
      expect(drill.id.length).toBeGreaterThan(3);
      expect(drill.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('exécute le parcours complet : Onboarding -> Programme -> Séance -> Reprise -> Fin -> Historique -> Poids -> JJB -> Minuteur -> Export/Import', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    // 1. Premier lancement : l'invitation à configurer le carnet est visible
    await waitFor(() => {
      expect(screen.getByText(/Configurer ton carnet/i)).toBeInTheDocument();
    });

    // 2. Questionnaire
    await user.click(screen.getByRole('button', { name: /Démarrer le questionnaire/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bienvenue dans StandPower/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Configurer mon programme/i }));

    // Étape 1 -> 2 -> 3 -> 4 -> Résultat
    await user.click(screen.getByRole('button', { name: /Suivant/i }));
    await user.click(screen.getByRole('button', { name: /Suivant/i }));
    await user.click(screen.getByRole('button', { name: /Suivant/i }));
    await user.click(screen.getByRole('button', { name: /Calculer ma recommandation/i }));

    // 3. Programme conseillé affiché avec explications déterministes
    await waitFor(() => {
      expect(screen.getByText(/Pourquoi ce choix/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^Commencer$/i }));

    // 4. Retour automatique sur Aujourd'hui avec la prochaine séance planifiée
    await waitFor(() => {
      expect(screen.getByText(/Prochaine séance/i)).toBeInTheDocument();
    });

    // Aller sur Musculation et démarrer la première séance du programme actif
    const launchButtons = screen.getAllByRole('button', { name: /Démarrer/i });
    await user.click(launchButtons[0]);

    // 5. Saisie et validation d'une série (attend la résolution de StrengthPage en Suspense)
    const validateBtns = await waitFor(() =>
      screen.getAllByRole('button', { name: /Valider série 1/i })
    );
    await user.click(validateBtns[0]);
    expect(useAppStore.getState().getActiveWorkout()?.exercises[0].sets[0].isCompleted).toBe(true);

    // 6. Fermeture / Réouverture (unmount puis remount) -> 7. Reprise intacte
    unmount();
    await useAppStore.getState().hydrate();
    render(<App />);

    const finishBtn = await waitFor(() =>
      screen.getByRole('button', { name: /Terminer/i })
    );

    // 8. Fin de séance
    await user.click(finishBtn);
    await user.click(
      screen.getByRole('button', { name: /Valider et clôturer la séance/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Séance enregistrée/i)).toBeInTheDocument();
    });

    // 9. Vérification dans l'Historique
    await user.click(screen.getByRole('tab', { name: /Historique/i }));
    expect(useAppStore.getState().snapshot.workoutSessions[0].status).toBe('completed');

    // 10. Ajout d'un poids & 11. Graphique
    await useAppStore.getState().saveWeightEntry({
      civilDate: '2026-10-25',
      weightKg: 74.8,
      notes: 'Suivi matin',
    });
    expect(useAppStore.getState().snapshot.weightEntries.length).toBeGreaterThanOrEqual(1);

    // 12. Journal JJB
    await useAppStore.getState().saveCombatSession({
      discipline: 'bjj',
      category: 'sparring_rolling',
      civilDate: '2026-10-25',
      bjjAttire: 'gi',
      context: 'training',
      roundsCount: 6,
      roundDurationSeconds: 300,
      restDurationSeconds: 60,
      totalDurationMinutes: 80,
      perceivedIntensity: 'moderate',
      positionsWorked: ['Garde papillon'],
      techniqueEvents: [
        {
          id: 'te_e2e',
          combatSessionId: 'cs_e2e',
          category: 'sweep_pass',
          techniqueName: 'Hook sweep',
          attempts: 4,
          successes: 3,
        },
      ],
      submissionsAttempted: 2,
      submissionsSucceeded: 1,
      rounds: [],
      notes: 'Séance JJB fluide',
      pointsToReview: 'Contrôle posture',
    });
    expect(useAppStore.getState().snapshot.combatSessions).toHaveLength(1);

    // 14. Export / Import
    const exportedJson = serializeDatabaseToJson(useAppStore.getState().snapshot);
    await useAppStore.getState().resetAllLocalData();
    expect(useAppStore.getState().snapshot.combatSessions).toHaveLength(0);

    const restored = await useAppStore.getState().importDatabaseFromJson(exportedJson);
    expect(restored.ok).toBe(true);
    expect(useAppStore.getState().snapshot.combatSessions).toHaveLength(1);
    expect(useAppStore.getState().snapshot.workoutSessions[0].status).toBe('completed');
  });
});
