# StandPower — Carnet Sportif Hors-Ligne (Musculation & Sports de Combat)

**StandPower** est une application mobile Android et Web progressive **100 % hors-ligne** (*offline-first*), conçue pour les pratiquants de **musculation**, **Jiu-Jitsu Brésilien (JJB/BJJ)**, **boxe** et **MMA**, ainsi que les athlètes hybrides combinant préparation physique et sports de combat.

L'application fonctionne intégralement **sans compte**, **sans serveur distant** et **sans intelligence artificielle générative**. La personnalisation repose sur un **moteur de règles local déterministe, explicable et versionné** (`v1.0.0-deterministic`).

---

## 1. Principes Directeurs & Identité Visuelle

1. **Simplicité pendant l'entraînement** : validation de série en 1 touche, répétition rapide des valeurs précédentes, incréments rapides (`-2,5`, `-1`, `+1`, `+2,5`, `+5`), minuteurs basés sur des horodatages de référence (`Epoch ms`) insensibles à la mise en veille.
2. **Fiabilité des données et des calculs** :
   - Stockage canonique interne en unités SI (`kg`, `cm`, `g`, `ml`, `kcal`, secondes).
   - Séparation stricte entre dates civiles locales (`YYYY-MM-DD`, sans décalage UTC) et horodatages exacts (`ISO-8601 UTC`).
   - Snapshots immuables des noms et conventions d'exercices dans les séances terminées pour préserver l'historique en cas de renommage ou d'archivage.
3. **Personnalisation transparente sans IA** :
   - Aucun SDK Gemini, OpenAI, chatbot ou clé API externe.
   - Chaque recommandation affiche explicitement les critères retenus (disciplines, niveau, matériel, jours disponibles, durée de séance, gestion de la fatigue croisée Musculation/Combat).
4. **Design Organique, Calme et Haut de Gamme** :
   - **Thème sombre** : Charbon chaud (`#171A17`), Graphite (`#222722`), Ivoire (`#F3F0E8`), Sauge (`#A8B89A`), Terre cuite (`#C88D74`).
   - **Thème clair** : Blanc cassé (`#FAF8F5`), Sable clair (`#F2EFE9`), Charbon (`#1A1D1A`), Olive sombre (`#3F5436`).
   - Chiffres tabulaires (`font-variant-numeric: tabular-nums`), cibles tactiles $\ge 48\text{ dp}$, contraste conforme **WCAG AA**.

---

## 2. Architecture du Projet (`standpower-app/`)

```text
src/
  app/
    layouts/          # Navigation principale (5 onglets, safe-areas, bandeau hors-ligne)
    navigation/       # Routeur React Router v6 + garde d'onboarding
    providers/        # Store Zustand synchronisé avec la persistance transactionnelle
  components/
    ui/               # Primitives accessibles (Button >= 48dp, Card, Badge, AlertBox, EmptyState)
    charts/           # Graphiques Recharts chargés à la demande (React.lazy + Suspense)
  domain/
    types.ts          # Modèle de données typé strictement (22+ entités et types)
    calculations/     # Formules pures et déterministes (1RM Brzycki, BMR, TDEE, MET, stats combat, timer)
    progression/      # Règles de double progression explicables
    recommendations/  # Moteur de règles déterministe (questionnaire + ajustement récupération)
    validation/       # Schémas Zod pour les formulaires et l'import de sauvegarde JSON
  data/
    migrations/       # Schéma SQLite DDL versionné (001_initial_schema.ts)
    database/         # Adaptateur dual SQLite natif (@capacitor-community/sqlite) + IndexedDB Web
    seeds/            # 54 exercices FR, 32 drills JJB/Combat FR, 8 programmes complets FR
    backup/           # Export/Import JSON transactionnel et export tabulaire CSV
  platform/
    notifications/    # Notifications locales Android/Web (@capacitor/local-notifications)
    sharing/          # Export fichier et feuille de partage native (@capacitor/filesystem & share)
    lifecycle/        # Bips synthétiques Web Audio API et haptique (@capacitor/haptics)
  features/
    onboarding/       # Questionnaire initial progressif en 4 étapes + recommandation
    dashboard/        # Écran « Aujourd'hui » (séance du jour, check-in récupération, accès rapides)
    strength/         # Séance active, historique, bibliothèque d'exercices (54+ exercices + perso)
    programs/         # Catalogue des 8 programmes, éditeur complet et duplication
    combat/           # Minuteur de rounds multi-préréglages, journal JJB/Boxe/MMA, stats techniques, drills
    progress/         # Courbes d'évolution (7j/30j/90j/Tout) avec moyenne mobile 7j, records, bilans
    nutrition/        # Repères BMR/TDEE/MET, garde-fous sécurité, journal quotidien souple
    profile/          # Profil, préférences (unités, thème, son), confidentialité, sauvegarde JSON/CSV
  tests/              # Tests unitaires (Vitest) et tests d'intégration React Testing Library
e2e/                  # Parcours E2E Playwright
android/              # Projet natif Capacitor Android (com.standpower.app)
```

---

## 3. Moteur de Recommandation Déterministe (`v1.0.0-deterministic`)

Le moteur (`src/domain/recommendations/ruleEngine.ts`) évalue le profil utilisateur selon 6 règles transparentes :
1. **Compatibilité matérielle stricte** : élimine tout programme requérant du matériel absent (ex. salle complète vs poids du corps ou haltères seuls).
2. **Adéquation au volume hebdomadaire** : pénalise les programmes dont le nombre de séances dépasse la disponibilité déclarée, en réservant des créneaux de récupération si l'utilisateur pratique un sport de combat $\ge 2\text{ fois/semaine}$.
3. **Alignement disciplinaire** :
   - **Hybride (Musculation + JJB/Boxe/MMA)** : privilégie le programme *Préparation Physique JJB / MMA (2j)* ou *Full Body Débutant (3j)* pour limiter les courbatures parasites sur le tatami ou le ring.
   - **Poids du corps / Domicile** : oriente vers *Poids du Corps & Mobilité* ou *Haltères à la Maison*.
   - **Force athlétique** : oriente vers *Force 5×5 Équilibré*.
   - **Hypertrophie / Structuré** : oriente vers *Upper / Lower (4j)*, *Push / Pull / Legs (6j)* ou *Programme Périodisé 8 Semaines*.
4. **Adéquation au niveau d'expérience** : évite de prescrire un volume 6 jours/semaine à un débutant.
5. **Respect de la durée de séance cible** : favorise les formats compatibles avec le temps disponible (30, 45, 60 ou 75+ minutes).
6. **Garde-fou d'interférence Musculation / Combat** : affiche un avertissement explicite lorsque le volume cumulé risque d'altérer la récupération articulaire et nerveuse.

---

## 4. Formules Mathématiques, Conventions & Garde-fous

### 4.1 Estimation du 1RM (Formule de Brzycki)
$$\text{1RM} = \frac{\text{poids (kg)}}{1,0278 - 0,0278 \times \text{répétitions}}$$
- **Domaine de validité strict** : uniquement calculé pour $1 \le \text{répétitions} \le 10$ et $\text{poids} > 0\text{ kg}$ sur des séries de travail (`working`, `top_set`, `backoff`, `dropset`, `failure`).
- Au-delà de 10 répétitions, sur les séries d'échauffement (`warmup`) ou sur les exercices au poids du corps pur / maintien isométrique, la fonction renvoie `null` avec une raison explicite.

### 4.2 Volume de Travail et Exercices Unilatéraux
- Seules les séries complétées hors échauffement sont comptabilisées.
- Unité explicite : **`kg·rép`** ($\text{poids} \times \text{répétitions}$).
- Si un exercice unilatéral est configuré en convention `per_hand_per_side` (charge saisie par main et répétitions par côté), le volume total multiplie par $2$ la charge ou les répétitions selon la convention documentée.
- Les exercices en `reps_only` (poids du corps sans lest) n'inventent jamais un tonnage artificiel à partir du poids corporel : ils sont comptabilisés en **répétitions totales** séparées.

### 4.3 Double Progression
- Sur un exercice avec cible `[minReps, maxReps]` (ex. `8–12 rép`) :
  - Si toutes les séries de travail atteignent `maxReps` avec un $\text{RPE} \le 8,5$ sur $\ge 2$ séances consécutives $\rightarrow$ suggère d'augmenter la charge ($+2,5\text{ kg}$ barre / $+1\text{ à } 2\text{ kg}$ haltères) et de repartir à `minReps`.
  - Si des séries restent sous `minReps` ou à $\text{RPE} \ge 9,5$ $\rightarrow$ suggère de consolider ou d'alléger de $5\text{ à } 10\text{ \%}$.

### 4.4 Métabolisme (Mifflin–St Jeor), TDEE et Dépense MET
- **BMR Homme** : $10 \times \text{poids (kg)} + 6,25 \times \text{taille (cm)} - 5 \times \text{âge} + 5$
- **BMR Femme** : $10 \times \text{poids (kg)} + 6,25 \times \text{taille (cm)} - 5 \times \text{âge} - 161$
- **Non spécifié** : affiche la **plage complète** `[formule -161, formule +5]` ainsi que la valeur médiane.
- **Dépense de séance (MET)** :
  - $\text{Brut (kcal)} = \text{MET} \times 3,5 \times \text{poids (kg)} / 200 \times \text{durée (min)}$
  - $\text{Net (kcal)} = (\text{MET} - 1) \times 3,5 \times \text{poids (kg)} / 200 \times \text{durée (min)}$ (hors métabolisme de repos déjà inclus dans le TDEE, évitant tout double comptage).
- **Garde-fous de sécurité** :
  - Désactivation automatique des objectifs de déficit calorique pour les utilisateurs **mineurs ($< 18\text{ ans}$)** ou signalant une **grossesse, un trouble du comportement alimentaire (TCA) ou une pathologie médicale**.
  - Plancher calorique de sécurité jamais inférieur à $\max(\text{BMR}, 1\,400\text{ kcal})$.

### 4.5 Statistiques Techniques de Combat
- $\text{Taux de réussite} = \frac{\text{réussites}}{\text{tentatives}} \times 100$
- Si $\text{tentatives} = 0$, renvoie explicitement **`Non disponible (0 tentative)`** (et jamais `0 %`).
- Affiche toujours le ratio sous-jacent (`ex. 3/4`) et signale un **échantillon faible** lorsque $\text{tentatives} < 5$.

---

## 5. Sauvegarde, Restauration & Confidentialité

- **100 % Local** : aucune télémétrie, aucun SDK publicitaire, aucun compte cloud.
- **Android Auto-Backup désactivé par défaut** (`android:allowBackup="false"` et `android:fullBackupContent="false"` dans `AndroidManifest.xml`) afin qu'aucune donnée de santé ou de poids ne soit envoyée dans le cloud Google Drive à l'insu de l'utilisateur.
- **Export JSON complet** : génère un fichier `.json` horodaté contenant l'intégralité de la base locale avec numéro de schéma (`schemaVersion: 1`).
- **Import JSON atomique** : valide d'abord l'intégralité du fichier via Zod (`BackupPayloadSchema`) **avant** de remplacer les données locales dans une transaction atomique. En cas de fichier corrompu, les données existantes restent intactes.
- **Export CSV tabulaire** : exporte les séances de musculation, le journal de combat, l'historique de poids et le journal de nutrition.

---

## 6. Commandes de Développement, Tests et Compilation

Toutes les commandes ci-dessous s'exécutent depuis le dossier **`standpower-app/`** :

```bash
cd standpower-app
```

### Installation des dépendances
```bash
npm install
```

### Vérification du typage TypeScript et du linter ESLint
```bash
npm run typecheck
npm run lint
```

### Exécution des tests unitaires et d'intégration (Vitest + React Testing Library)
```bash
npm test
```

### Exécution des tests End-to-End (Playwright)
```bash
npm run test:e2e
```

### Compilation du bundle Web de production
```bash
npm run build
```

### Synchronisation Capacitor & Compilation de l'APK Android Debug
Prérequis : **Java 17** (`JDK 17`) et **Android SDK** (`platforms;android-34` ou `36`, `build-tools;34.0.0` ou `36.0.0`).

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```
L'APK compilé est généré dans :
`standpower-app/android/app/build/outputs/apk/debug/app-debug.apk`

### Installation sur un appareil Android physique ou un émulateur connecté
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. Limites Connues de la Version 1.0

- **APK Debug vs Release** : l'APK généré (`app-debug.apk`) est signé avec la clé de debug locale pour installation directe et test. Une publication sur le Google Play Store nécessitera la création d'un keystore de production (`upload-keystore.jks`) et la tâche `./gradlew bundleRelease` ou `assembleRelease`.
- **Notifications en arrière-plan profond Android** : le minuteur recalcule toujours le temps exact par différence d'horodatage (`Epoch ms`) au retour au premier plan et programme une notification locale via `@capacitor/local-notifications`. Sur certaines surcouches constructeurs très agressives (Xiaomi MIUI, Huawei EMUI), l'utilisateur peut devoir autoriser l'exécution non restreinte en batterie pour recevoir l'alerte à la seconde exacte.
