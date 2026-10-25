/**
 * Signaux sonores et haptiques locaux pour les minuteurs de repos et de rounds.
 * Respecte strictement le mode silencieux et les préférences utilisateur.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export function triggerTimerCue(params: {
  cueType: 'round_start' | 'round_end' | 'rest_done' | 'countdown_tick';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}): void {
  const { cueType, soundEnabled, vibrationEnabled } = params;

  if (vibrationEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (cueType === 'round_start') navigator.vibrate([180, 80, 180]);
      else if (cueType === 'round_end') navigator.vibrate([350]);
      else if (cueType === 'rest_done') navigator.vibrate([200, 100, 200]);
      else navigator.vibrate(60);
    } catch {
      // Ignorer si non supporté
    }
  }

  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (cueType === 'round_start') {
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (cueType === 'round_end') {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (cueType === 'rest_done') {
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Audio non disponible en mode headless/test
  }
}
