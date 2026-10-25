import { describe, expect, it } from 'vitest';
import {
  createInitialTimerState,
  evaluateCombatTimer,
  pauseCombatTimer,
  resumeCombatTimer,
  skipToNextPhase,
  startCombatTimer,
  stopCombatTimerEarly,
} from '../domain/calculations/timerEngine';

describe('Moteur de minuteur de combat basé sur instants de référence', () => {
  const boxingConfig = {
    totalRounds: 3,
    roundDurationSeconds: 180,
    restDurationSeconds: 60,
    prepDurationSeconds: 10,
  };

  it('gère la préparation, le passage au round 1 puis le repos', () => {
    let state = createInitialTimerState(boxingConfig);
    state = startCombatTimer(state, 1000);

    // À t = 5000 ms (4s écoulées) -> Phase préparation (reste 6s)
    const snapPrep = evaluateCombatTimer(state, 5000);
    expect(snapPrep.phase).toBe('preparation');
    expect(snapPrep.remainingSecondsCeil).toBe(6);

    // À t = 11000 ms (10s écoulées) -> Début du Round 1 (180s)
    const snapRound1 = evaluateCombatTimer(state, 11000);
    expect(snapRound1.phase).toBe('round');
    expect(snapRound1.currentRound).toBe(1);
    expect(snapRound1.remainingSecondsCeil).toBe(180);

    // À t = 191000 ms (10s prep + 180s round 1) -> Repos 1 (60s)
    const snapRest1 = evaluateCombatTimer(state, 191000);
    expect(snapRest1.phase).toBe('rest');
    expect(snapRest1.currentRound).toBe(1);
    expect(snapRest1.remainingSecondsCeil).toBe(60);
  });

  it('gère la pause et la reprise sans dérive temporelle', () => {
    let state = createInitialTimerState({
      ...boxingConfig,
      prepDurationSeconds: 0,
    });
    state = startCombatTimer(state, 0);

    // Avance de 30s dans le round 1 puis pause
    state = pauseCombatTimer(state, 30000);
    const pausedSnap = evaluateCombatTimer(state, 90000); // 60s plus tard toujours en pause
    expect(pausedSnap.status).toBe('paused');
    expect(pausedSnap.remainingSecondsCeil).toBe(150);

    // Reprise à t = 90000 ms
    state = resumeCombatTimer(state, 90000);
    const resumedSnap = evaluateCombatTimer(state, 100000); // +10s actives (total 40s actives)
    expect(resumedSnap.status).toBe('running');
    expect(resumedSnap.remainingSecondsCeil).toBe(140);
  });

  it('recalcule exactement l’état au retour après suspension avec plusieurs transitions écoulées', () => {
    let state = createInitialTimerState({
      totalRounds: 3,
      roundDurationSeconds: 60,
      restDurationSeconds: 30,
      prepDurationSeconds: 0,
    });
    state = startCombatTimer(state, 0);

    // Retour au premier plan après 190 secondes (Round 1 [0..60], Repos 1 [60..90], Round 2 [90..150], Repos 2 [150..180], 10s dans Round 3)
    const snap = evaluateCombatTimer(state, 190000);
    expect(snap.phase).toBe('round');
    expect(snap.currentRound).toBe(3);
    expect(snap.remainingSecondsCeil).toBe(50);
  });

  it('ne produit jamais de durée négative et marque completed à la fin', () => {
    let state = createInitialTimerState({
      totalRounds: 2,
      roundDurationSeconds: 60,
      restDurationSeconds: 30,
      prepDurationSeconds: 0,
    });
    state = startCombatTimer(state, 1000);

    // Très longtemps après la fin totale
    const snap = evaluateCombatTimer(state, 9999999);
    expect(snap.status).toBe('completed');
    expect(snap.phase).toBe('completed');
    expect(snap.remainingMs).toBe(0);
    expect(snap.remainingSecondsCeil).toBe(0);
  });

  it('permet de passer au round suivant ou d’arrêter de façon anticipée', () => {
    let state = createInitialTimerState({
      totalRounds: 2,
      roundDurationSeconds: 60,
      restDurationSeconds: 30,
      prepDurationSeconds: 0,
    });
    state = startCombatTimer(state, 0);
    state = skipToNextPhase(state, 15000); // Skip la fin du Round 1 -> arrive au Repos 1
    const snap = evaluateCombatTimer(state, 15000);
    expect(snap.phase).toBe('rest');

    state = stopCombatTimerEarly(state);
    expect(evaluateCombatTimer(state, 20000).status).toBe('completed');
  });
});
