# Suivi d'Avancement — StandPower (`standpower-app`)

## Terminé
- [x] **Vérification de l'environnement** :
  - Ancien projet identifié dans `d:\appli\PROJRCTAPLLI\standpower\exemple anncien code` et **intégralement préservé sans modification ni suppression**.
  - Outils vérifiés : Node.js `v24.17.0`, npm `11.13.0`, Java `17.0.12 LTS` (`C:\Program Files\Java\jdk-17`), Android SDK (`C:\Users\clone ad\AppData\Local\Android\Sdk`, platforms `android-34` & `android-36`, build-tools `34.0.0` & `36.0.0`).
- [x] **Initialisation et Architecture (`standpower-app/`)** :
  - Configuration stricte TypeScript (`tsconfig.json`), Vite (`vite.config.ts` avec découpage de chunks), TailwindCSS (`tailwind.config.js` avec tokens organiques chauds en thème sombre `#171A17` et clair `#FAF8F5`), ESLint (`eslint.config.js`), Vitest et Playwright.
  - Aucune dépendance d'IA (zéro Gemini, OpenAI, GenAI, chatbot ou clé API).
- [x] **Domaine Métier, Calculs & Validation (`src/domain/`)** :
  - Types explicites et immuables (`src/domain/types.ts`) couvrant les 22+ entités métier.
  - Calculs purs et bornés :
    - Conversions d'unités SI et parseur décimal français (`src/domain/calculations/units.ts`).
    - 1RM Brzycki borné à `1..10` répétitions, volume de travail en `kg·rép` excluant l'échauffement et les répétitions assistées, conventions unilatérales explicites (`src/domain/calculations/strength.ts`).
    - BMR Mifflin–St Jeor (Homme `+5`, Femme `-161`, Non spécifié en plage complète), TDEE sans double comptage, dépense MET brute et nette, garde-fous mineurs `< 18 ans` et médicaux/grossesse/TCA (`src/domain/calculations/metabolism.ts`).
    - Statistiques techniques de combat avec dénominateur explicite, `Non disponible (0 tentative)` si `0` tentative, et alerte d'échantillon faible `< 5` (`src/domain/calculations/combatStats.ts`).
    - Séries temporelles et moyenne mobile 7 jours (`src/domain/calculations/timeSeries.ts`).
    - Moteur de minuteur de rounds par horodatage de référence `Epoch ms` (`src/domain/calculations/timerEngine.ts`).
  - Double progression déterministe sans invention de charge sur le poids du corps (`src/domain/progression/doubleProgression.ts`).
  - Moteur de recommandation déterministe et explicable `v1.0.0-deterministic` + ajustement quotidien de récupération non médical (`src/domain/recommendations/`).
  - Schémas de validation Zod (`src/domain/validation/schemas.ts`).
- [x] **Données Embarquées & Persistance Locale (`src/data/`)** :
  - **54 exercices de musculation** complets en français (`src/data/seeds/exercisesSeed.ts`).
  - **32 drills JJB / Boxe / MMA** complets en français, sans pont sur la tête (`src/data/seeds/drillsSeed.ts`).
  - **8 programmes complets** en français incluant le *Programme Périodisé 8 Semaines* et le *Force 5×5 Équilibré* (`src/data/seeds/programsSeed.ts`).
  - Schéma SQLite DDL versionné (`src/data/migrations/001_initial_schema.ts`).
  - Adaptateur transactionnel SQLite natif (`@capacitor-community/sqlite`) + IndexedDB navigateur (`src/data/database/storageEngine.ts`).
  - Sauvegarde/restauration JSON validée atomiquement et export CSV tabulaire (`src/data/backup/backupService.ts`).
- [x] **Écrans & Fonctionnalités (`src/features/`)** :
  - Onboarding progressif en 4 étapes + recommandation explicable (`OnboardingPage.tsx`).
  - Aujourd'hui (`TodayPage.tsx`), Musculation (`StrengthPage.tsx`), Programmes (`ProgramsPage.tsx`), Combat (`CombatPage.tsx`), Progression (`ProgressPage.tsx`), Nutrition (`NutritionPage.tsx`), Profil & Sauvegarde (`ProfilePage.tsx`).
- [x] **Qualité, Tests, Build Web & Compilation APK Android** :
  - `npm run typecheck` : 0 erreur.
  - `npm run lint` : 0 erreur, 0 warning.
  - `npm test` : **31 tests passés sur 31** (5 suites couvrant calculs, recommandations, minuteur, persistance et parcours d'intégration complet).
  - `npm run build` : bundle Web de production compilé avec succès dans `dist/`.
  - `.\gradlew.bat assembleDebug` : **APK Android compilé avec succès** (`11 887 621 octets`, disponible dans `android/app/build/outputs/apk/debug/app-debug.apk` et `StandPower-v1.0.0-debug.apk`).
- [x] **Documentation (`README.md`, `docs/SYNTHESE_TECHNIQUE.md`, `SUIVI.md`)**.

## En cours
- Aucun élément en cours.

## Bloqué / Limites d'environnement
- Aucun appareil Android physique ni AVD n'est connecté (`adb devices` vide, `emulator -list-avds` vide). L'exécution interactive sur émulateur/téléphone physique ne peut pas être lancée sur cette machine, mais la compilation réelle de l'APK Android via Gradle (`assembleDebug`) et l'ensemble des tests automatisés ont été exécutés et validés localement.
