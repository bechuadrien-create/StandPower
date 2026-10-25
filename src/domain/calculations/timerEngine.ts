/**
 * Moteur de minuteur déterministe fondé sur des instants de référence (Epoch ms).
 * Ne dépend jamais de l'accumulation d'un setInterval pour calculer le temps écoulé.
 * Supporte :
 * - Préparation avant départ
 * - Alternance Round / Repos sur N rounds
 * - Pause / Reprise sans dérive
 * - Retour au premier plan après suspension de plusieurs minutes (plusieurs transitions écoulées)
 * - Passage manuel au round suivant ou fin anticipée
 * - Absence garantie de durée négative
 */

export type CombatTimerPhase = 'idle' | 'preparation' | 'round' | 'rest' | 'completed';

export interface CombatTimerConfig {
  totalRounds: number;
  roundDurationSeconds: number;
  restDurationSeconds: number;
  prepDurationSeconds: number;
}

export interface CombatTimerPersistedState {
  config: CombatTimerConfig;
  status: 'idle' | 'running' | 'paused' | 'completed';
  startedAtEpochMs: number | null;
  pausedAtEpochMs: number | null;
  accumulatedPausedMs: number;
  manualSkipOffsetMs: number;
}

export interface CombatTimerSnapshot {
  status: 'idle' | 'running' | 'paused' | 'completed';
  phase: CombatTimerPhase;
  currentRound: number;
  totalRounds: number;
  remainingMs: number;
  remainingSecondsCeil: number;
  elapsedPhaseMs: number;
  phaseDurationMs: number;
  totalElapsedEffectiveMs: number;
  transitionsCount: number;
}

interface PhaseSegment {
  phase: 'preparation' | 'round' | 'rest';
  roundNumber: number;
  startOffsetMs: number;
  endOffsetMs: number;
  durationMs: number;
}

export function buildTimerTimeline(config: CombatTimerConfig): PhaseSegment[] {
  const segments: PhaseSegment[] = [];
  let cursorMs = 0;

  const prepMs = Math.max(0, Math.round(config.prepDurationSeconds * 1000));
  const roundMs = Math.max(1000, Math.round(config.roundDurationSeconds * 1000));
  const restMs = Math.max(0, Math.round(config.restDurationSeconds * 1000));
  const rounds = Math.max(1, Math.floor(config.totalRounds));

  if (prepMs > 0) {
    segments.push({
      phase: 'preparation',
      roundNumber: 1,
      startOffsetMs: cursorMs,
      endOffsetMs: cursorMs + prepMs,
      durationMs: prepMs,
    });
    cursorMs += prepMs;
  }

  for (let r = 1; r <= rounds; r++) {
    segments.push({
      phase: 'round',
      roundNumber: r,
      startOffsetMs: cursorMs,
      endOffsetMs: cursorMs + roundMs,
      durationMs: roundMs,
    });
    cursorMs += roundMs;

    if (r < rounds && restMs > 0) {
      segments.push({
        phase: 'rest',
        roundNumber: r,
        startOffsetMs: cursorMs,
        endOffsetMs: cursorMs + restMs,
        durationMs: restMs,
      });
      cursorMs += restMs;
    }
  }

  return segments;
}

export function createInitialTimerState(config: CombatTimerConfig): CombatTimerPersistedState {
  return {
    config,
    status: 'idle',
    startedAtEpochMs: null,
    pausedAtEpochMs: null,
    accumulatedPausedMs: 0,
    manualSkipOffsetMs: 0,
  };
}

export function startCombatTimer(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): CombatTimerPersistedState {
  return {
    ...state,
    status: 'running',
    startedAtEpochMs: nowEpochMs,
    pausedAtEpochMs: null,
    accumulatedPausedMs: 0,
    manualSkipOffsetMs: 0,
  };
}

export function pauseCombatTimer(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): CombatTimerPersistedState {
  if (state.status !== 'running') return state;
  return {
    ...state,
    status: 'paused',
    pausedAtEpochMs: nowEpochMs,
  };
}

export function resumeCombatTimer(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): CombatTimerPersistedState {
  if (state.status !== 'paused' || state.pausedAtEpochMs === null) return state;
  const pauseDelta = Math.max(0, nowEpochMs - state.pausedAtEpochMs);
  return {
    ...state,
    status: 'running',
    pausedAtEpochMs: null,
    accumulatedPausedMs: state.accumulatedPausedMs + pauseDelta,
  };
}

export function computeEffectiveElapsedMs(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): number {
  if (state.status === 'idle' || state.startedAtEpochMs === null) return 0;
  const referenceNow =
    state.status === 'paused' && state.pausedAtEpochMs !== null
      ? state.pausedAtEpochMs
      : nowEpochMs;

  const rawElapsed = referenceNow - state.startedAtEpochMs - state.accumulatedPausedMs + state.manualSkipOffsetMs;
  return Math.max(0, rawElapsed);
}

export function evaluateCombatTimer(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): CombatTimerSnapshot {
  const segments = buildTimerTimeline(state.config);
  const totalRounds = Math.max(1, Math.floor(state.config.totalRounds));

  if (state.status === 'idle' || state.startedAtEpochMs === null) {
    const first = segments[0];
    return {
      status: 'idle',
      phase: 'idle',
      currentRound: 1,
      totalRounds,
      remainingMs: first ? first.durationMs : 0,
      remainingSecondsCeil: first ? Math.ceil(first.durationMs / 1000) : 0,
      elapsedPhaseMs: 0,
      phaseDurationMs: first ? first.durationMs : 0,
      totalElapsedEffectiveMs: 0,
      transitionsCount: 0,
    };
  }

  const effectiveElapsedMs = computeEffectiveElapsedMs(state, nowEpochMs);
  const totalTimelineMs = segments.length > 0 ? segments[segments.length - 1].endOffsetMs : 0;

  if (state.status === 'completed' || effectiveElapsedMs >= totalTimelineMs) {
    return {
      status: 'completed',
      phase: 'completed',
      currentRound: totalRounds,
      totalRounds,
      remainingMs: 0,
      remainingSecondsCeil: 0,
      elapsedPhaseMs: 0,
      phaseDurationMs: 0,
      totalElapsedEffectiveMs: Math.min(effectiveElapsedMs, totalTimelineMs),
      transitionsCount: segments.length,
    };
  }

  let currentSegmentIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    if (
      effectiveElapsedMs >= segments[i].startOffsetMs &&
      effectiveElapsedMs < segments[i].endOffsetMs
    ) {
      currentSegmentIndex = i;
      break;
    }
  }

  const segment = segments[currentSegmentIndex];
  const elapsedPhaseMs = Math.max(0, effectiveElapsedMs - segment.startOffsetMs);
  const remainingMs = Math.max(0, segment.endOffsetMs - effectiveElapsedMs);

  return {
    status: state.status,
    phase: segment.phase,
    currentRound: segment.roundNumber,
    totalRounds,
    remainingMs,
    remainingSecondsCeil: Math.max(0, Math.ceil(remainingMs / 1000)),
    elapsedPhaseMs,
    phaseDurationMs: segment.durationMs,
    totalElapsedEffectiveMs: effectiveElapsedMs,
    transitionsCount: currentSegmentIndex,
  };
}

/**
 * Avance immédiatement à la phase ou au round suivant sans perdre la cohérence temporelle.
 */
export function skipToNextPhase(
  state: CombatTimerPersistedState,
  nowEpochMs: number
): CombatTimerPersistedState {
  if (state.status === 'idle' || state.startedAtEpochMs === null) return state;
  const segments = buildTimerTimeline(state.config);
  const effectiveElapsedMs = computeEffectiveElapsedMs(state, nowEpochMs);

  const currentSegment = segments.find(
    (s) => effectiveElapsedMs >= s.startOffsetMs && effectiveElapsedMs < s.endOffsetMs
  );

  if (!currentSegment) {
    return { ...state, status: 'completed' };
  }

  const deltaToJump = Math.max(0, currentSegment.endOffsetMs - effectiveElapsedMs);
  const nextSkipOffset = state.manualSkipOffsetMs + deltaToJump;
  const totalTimelineMs = segments[segments.length - 1].endOffsetMs;

  if (effectiveElapsedMs + deltaToJump >= totalTimelineMs) {
    return {
      ...state,
      manualSkipOffsetMs: nextSkipOffset,
      status: 'completed',
    };
  }

  return {
    ...state,
    manualSkipOffsetMs: nextSkipOffset,
  };
}

export function stopCombatTimerEarly(
  state: CombatTimerPersistedState
): CombatTimerPersistedState {
  return {
    ...state,
    status: 'completed',
    pausedAtEpochMs: null,
  };
}
