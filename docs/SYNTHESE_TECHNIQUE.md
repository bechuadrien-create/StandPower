# StandPower — Synthèse technique (reprise de contexte)

## Décisions clés
- Projet neuf : `standpower-app/` (ancien code `exemple anncien code/` intact, non réutilisé).
- Stack : React 18 + TS strict + Vite 5 + Tailwind 3 (tokens CSS `--sp-*`) + Zustand 5 + Capacitor 6 + Recharts (lazy) + Zod + Vitest + Playwright.
- Persistance : `src/data/database/storageEngine.ts` — snapshot versionné écrit de façon atomique dans SQLite natif (`@capacitor-community/sqlite`, tables + index dans `migrations/001_initial_schema.ts`) sur Android, et IndexedDB sur web/tests. Pas de localStorage métier (le minuteur utilise sessionStorage uniquement pour son état temporaire).
- Store unique : `src/app/providers/useAppStore.ts` (toutes les mutations persistent immédiatement → reprise de séance garantie).
- Domaine pur : `src/domain/calculations/*` (Brzycki, volume, records, Mifflin, TDEE, MET, unités, minuteur à instants de référence, stats combat, séries temporelles), `domain/recommendations/ruleEngine.ts` (moteur v1.0.0-deterministic), `domain/progression/doubleProgression.ts`.
- Seeds : 66 exercices, 32 drills, 8 programmes.
- Snapshots : `WorkoutExercise.exerciseNameSnapshot`, `programNameSnapshot`, `drillNameSnapshot` → l'historique survit aux renommages/archivages.
- Dates : jour civil `YYYY-MM-DD` local (pas de conversion UTC naïve), instants ISO.

## Écrans
- `features/dashboard/TodayPage.tsx`, `strength/StrengthPage.tsx`, `programs/ProgramsPage.tsx`, `combat/CombatPage.tsx`, `progress/ProgressPage.tsx`, `profile/ProfilePage.tsx` (+ nutrition, rappels, sauvegarde, confidentialité, méthodes, licences), `onboarding/OnboardingPage.tsx`.
