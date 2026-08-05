/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import CryptoJS from 'crypto-js';

const SECRET_KEY = "StandPower_Athletic_Secret_Key_2026";

/**
 * Encrypts and saves data to localStorage securely
 */
export function secureSave(key: string, data: any): void {
  try {
    const stringData = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(stringData, SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error(`Failed to securely save data for key: ${key}`, error);
    localStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Loads and decrypts data from localStorage securely, with automatic migration
 */
export function secureLoad<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    // Auto-detect and migrate unencrypted legacy data
    if (stored.trim().startsWith('{') || stored.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(stored) as T;
        secureSave(key, parsed); // Encrypt on next read
        return parsed;
      } catch {
        // Continue to decryption if parse fails
      }
    }
    
    const bytes = CryptoJS.AES.decrypt(stored, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return defaultValue;
    
    return JSON.parse(decryptedText) as T;
  } catch (error) {
    console.error(`Failed to securely load data for key: ${key}`, error);
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
    return defaultValue;
  }
}

/**
 * Formats a duration in seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculates calories burned using standard MET formula for weightlifting
 * adjusted dynamically by the relative load intensity (load / bodyWeight).
 * 
 * Formula: Calories = MET * 3.5 * weightKg * durationMinutes / 200
 * Heavy resistance training baseline MET = 6.0.
 * Dynamic scaling up to 8.5 for high loads relative to the user's body weight.
 */
export function calculateWorkoutCalories(
  weightKg: number,
  durationSeconds: number,
  averageLoadKg: number
): {
  calories: number;
  dynamicMet: number;
  relativeIntensity: number; // factor between 0 and 1
} {
  const minutes = durationSeconds / 60;
  
  // Calculate relative intensity based on load divided by body weight
  // For example, lifting 60kg when you weigh 80kg is a 0.75 ratio.
  const loadToBodyweightRatio = averageLoadKg > 0 && weightKg > 0 ? averageLoadKg / weightKg : 0.3;
  
  // MET values:
  // Light weight lifting: 3.5
  // Moderate: 5.0
  // Heavy, vigorous weight lifting: 6.0
  // Powerlifting / Intense bodybuilding: 6.0 - 8.5
  let dynamicMet = 5.0; // Baseline moderate lifting
  
  if (loadToBodyweightRatio < 0.25) {
    dynamicMet = 4.0; // Light load intensity
  } else if (loadToBodyweightRatio < 0.5) {
    dynamicMet = 6.0; // Standard heavy bodybuilding effort
  } else if (loadToBodyweightRatio < 0.8) {
    dynamicMet = 7.0; // Vigorous high-intensity bodybuilding
  } else {
    dynamicMet = 8.0; // Extreme/powerlifting relative intensity
  }
  
  // Standard clinical formula for calories based on MET
  const calories = (dynamicMet * 3.5 * weightKg * minutes) / 200;
  
  return {
    calories: Math.round(calories * 10) / 10,
    dynamicMet: Math.round(dynamicMet * 10) / 10,
    relativeIntensity: Math.min(Math.round(loadToBodyweightRatio * 100), 150)
  };
}

/**
 * Generates an athletic beep tone using Web Audio API to alert the user that rest is over!
 */
export function playAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Play double athletic high-pitch beep
    const playBeep = (delayMs: number, freq: number, durationMs: number) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Quick volume envelope to avoid audio clicks
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
        
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
      }, delayMs);
    };

    // Athletic modern notification chimes
    playBeep(0, 880, 200);   // Standard athletic buzzer-beeps
    playBeep(250, 1200, 350); // High pitch confirm
  } catch (e) {
    console.error('Failed to play sound:', e);
  }
}
