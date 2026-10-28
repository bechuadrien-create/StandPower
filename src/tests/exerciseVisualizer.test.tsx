import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  resolveExerciseVisuals,
} from '../services/exerciseMediaService';
import { ExerciseVisualizer } from '../components/ExerciseVisualizer';

describe('Système Visuel Hybride 3 Niveaux (Flipbook + Anatomie SVG + Stickman)', () => {
  it('résout correctement les exercices de musculation vers free-exercise-db', () => {
    const bench = resolveExerciseVisuals('Développé couché');
    expect(bench.englishMatchKey).toBe('Barbell_Bench_Press_-_Medium_Grip');
    expect(bench.imageUrls?.[0]).toContain(
      'Barbell_Bench_Press_-_Medium_Grip/0.jpg'
    );
    expect(bench.imageUrls?.[1]).toContain(
      'Barbell_Bench_Press_-_Medium_Grip/1.jpg'
    );
    expect(bench.movementPattern).toBe('push');
    expect(bench.primaryMuscles).toContain('Pectoraux');
  });

  it('résout les drills JJB vers le Stickman Cinématique avec le bon sous-type', () => {
    const shrimp = resolveExerciseVisuals('Sortie de bassin (Shrimp / Hip Escape)');
    expect(shrimp.movementPattern).toBe('combat_ground');
    expect(shrimp.combatSubType).toBe('shrimp');
    expect(shrimp.imageUrls).toBeNull();
  });

  it('affiche le Flipbook, le Stickman 2D et la Carte Anatomique SVG dans ExerciseVisualizer', async () => {
    const user = userEvent.setup();
    render(<ExerciseVisualizer exerciseName="Squat barre (Back Squat)" />);

    expect(screen.getByText(/Flipbook Photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Stickman 2D/i)).toBeInTheDocument();
    expect(screen.getByText(/Anatomie SVG/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Stickman 2D/i }));
    expect(screen.getByText(/Cinématique Stickman 2D/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Anatomie SVG/i }));
    expect(
      screen.getByText(/Carte Anatomique des Muscles Ciblés/i)
    ).toBeInTheDocument();
  });
});
