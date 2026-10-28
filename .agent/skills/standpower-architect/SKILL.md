---
name: standpower-architect
description: Règles d'architecture, de sécurité IA Gemini, de formules biomécaniques et de design pour l'application mobile/web StandPower (Musculation, JJB/MMA/Boxe, Coaching IA Gemini et Suivi Métabolique).
---

# StandPower Architect Skill (`standpower-architect`)

Ce skill définit les règles architecturales, techniques et métier strictes du projet **StandPower**.

## 1. Stack Technique Obligatoire
- **Frontend** : React + TypeScript (`strict: true`) + TailwindCSS + Lucide React + Recharts.
- **Backend API & Proxy IA** : Express (`server.ts`) + `@google/genai` + CORS + Dotenv.
- **Mobile Natif** : Capacitor Android (`appId: 'com.standpower.app'`, `appName: 'StandPower'`) + SQLite / IndexedDB.

## 2. Règles d'Intelligence Artificielle (`@google/genai`)
- **Modèle IA obligatoire** : Utiliser exclusivement **`gemini-2.5-flash`** (ne jamais utiliser `gemini-1.5-flash` qui est déprécié).
- **Sorties structurées garanties** : Toujours configurer `responseMimeType: "application/json"` et un `responseSchema` strict utilisant `Type.OBJECT`, `Type.ARRAY`, `Type.STRING` du SDK `@google/genai` afin d'éviter tout crash de `JSON.parse`.
- **Sécurité des clés API** :
  - **Ne jamais exposer `GEMINI_API_KEY` côté client** (aucun `VITE_GEMINI_API_KEY` dans le bundle navigateur/APK).
  - Toutes les requêtes Gemini doivent transiter par le backend Express (`/api/exercise-info`, `/api/coach-chat`) avec un fallback local déterministe lorsque l'application fonctionne hors-ligne sur mobile.

## 3. Formules Biomécaniques et Métaboliques
- **1RM Brzycki** :
  $$\text{1RM} = \frac{\text{weight}}{1.0278 - 0.0278 \times \text{reps}}$$
  - Sécurité mathématique obligatoire : vérifier `reps >= 1 && reps < 37` (et recommander la plage haute précision `1..10` répétitions).
- **Métabolisme Basal (Mifflin-St Jeor)** :
  - Homme : $10 \times \text{poids (kg)} + 6.25 \times \text{taille (cm)} - 5 \times \text{âge} + 5$
  - Femme : $10 \times \text{poids (kg)} + 6.25 \times \text{taille (cm)} - 5 \times \text{âge} - 161$
- **Dépense Énergétique (MET)** :
  - $\text{Calories brûlées (kcal)} = \text{MET} \times 3.5 \times \text{poids (kg)} / 200 \times \text{durée (min)}$

## 4. Système Visuel d'Exercices Hybride à 3 Niveaux
Chaque exercice de musculation et drill JJB/MMA/Boxe doit proposer une démonstration visuelle via `src/services/exerciseMediaService.ts` et `src/components/ExerciseVisualizer.tsx` :
1. **Niveau 1 — Flipbook Animé (`yuhonas/free-exercise-db`)** : alternance toutes les `800ms` entre `0.jpg` et `1.jpg` avec contrôle Play/Pause et sélecteur Position 1 / Position 2.
2. **Niveau 2 — Carte Anatomique SVG (Face / Dos)** : coloration dynamique des muscles primaires (`#10b981` / `emerald-500`) et secondaires (`#d946ef` / `fuchsia-500`).
3. **Niveau 3 — Stickman Cinématique SVG Animé (`StickmanAnimator.tsx`)** : pantin articulé SVG (`#10b981` pour Musculation, `#8b5cf6` pour Combat/JJB/MMA) animé en boucle entre la posture initiale et finale avec flèches directionnelles.

## 5. Système de Design & Accents Visuels
- **Thème sombre** : surfaces sombres (`bg-zinc-950` / `#171A17`, `text-zinc-100` / `#F3F0E8`) à fort contraste.
- **Accents sémantiques** :
  - **Musculation & Muscles primaires** : `emerald-500` (`#10b981`) / sauge.
  - **Combat / JJB / MMA / Boxe** : `violet-500` (`#8b5cf6`).
  - **Coaching IA Gemini & Muscles secondaires** : `fuchsia-500` (`#d946ef`).
