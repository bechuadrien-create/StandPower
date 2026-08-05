# 🦾 StandPower – Feature Scan de Repas (Android Kotlin Jetpack Compose)

Bienvenue dans l'implémentation de la fonctionnalité **Scan de Repas IA** pour l'application Android **StandPower** (Sport de combat + Musculation).

Cette implémentation utilise **Google ML Kit Image Labeling** pour la détection locale d'aliments (sans clé API payante) combiné avec **Room Database** pour un cache de calories ultra-rapide et **Firebase Firestore** pour stocker l'historique de l'athlète de manière RGPD-conforme (sans stocker de photos).

Le design est entièrement thématisé en **Néon Cyberpunk** (violet `#9C27B0`, cyan `#00FFFF`, rose `#E91E63`) avec des effets de balayage laser animés et des indicateurs lumineux HUD.

---

## 📂 Structure des fichiers générés

Les fichiers de cette fonctionnalité sont structurés comme suit dans le dossier `android/` :

```text
android/
├── app/
│   ├── build.gradle                               # Dépendances configurées (ML Kit, Firebase, Room, CameraX)
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml                # Permissions CAMERA & INTERNET
│           └── java/com/tondaproject/standpower/
│               ├── StandPowerApplication.kt        # Init Firebase & Room DB
│               ├── data/
│               │   └── Meal.kt                    # Modèles d'entité pour Firestore
│               ├── repository/
│               │   └── MealRepository.kt          # Lien de persistance (Firebase + Room)
│               ├── utils/
│               │   ├── CalorieDatabase.kt         # Room DB pré-remplie (Pizza, Poulet, etc.)
│               │   └── ImageUtils.kt              # Traitement d'images CameraX -> Bitmap
│               ├── viewmodel/
│               │   └── MealViewModel.kt           # Logique d'analyse ML Kit et de calcul calorique
│               └── ui/
│                   ├── MealScannerScreen.kt       # Interface Scan Néon Cyberpunk (CameraX + HUD)
│                   └── MealHistoryScreen.kt       # Interface Historique + Graphique de calories dynamique
└── README.md                                      # Guide de configuration complet
```

---

## ⚙️ Guide d'intégration étape par étape

### 1. Configurer Firebase (Firestore et Authentication)
1. Allez sur la [Console Firebase](https://console.firebase.google.com/).
2. Créez un nouveau projet ou sélectionnez votre projet existant **StandPower**.
3. Ajoutez une application Android avec l'ID de package : `com.tondaproject.standpower`.
4. Téléchargez le fichier `google-services.json` et déposez-le dans le dossier `android/app/` de votre projet Android.
5. Dans l'onglet **Firestore Database**, créez une nouvelle base de données en mode production ou test, et ajoutez une collection nommée `meals`.
6. Configurez les règles de sécurité Firestore pour autoriser l'accès uniquement aux utilisateurs authentifiés :
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /meals/{mealId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```
7. Dans **Authentication**, activez la méthode de connexion anonyme ou par email pour récupérer un `userId` valide à passer à l'UI.

### 2. Configurer et Initialiser ML Kit & Room
Le code s'en charge de façon autonome !
- L'initialisation de Firebase est déclarée dans `StandPowerApplication.kt`.
- Lors du tout premier lancement de l'application, Room pré-remplit la table locale `calorie_items` avec une quarantaine d'aliments courants (et leurs versions françaises comme frites, pizza, poulet, brocolis, avocat, etc.) pour permettre un cache instantané et hors-ligne.

### 3. Tester la Détection d'Aliments
- **Sur un appareil réel :** Lancez l'application, acceptez la permission Caméra, visez une pizza, une pomme ou une salade, et cliquez sur **Déclencher le capteur** puis **Analyser les calories**.
- **Sur un Émulateur (sans caméra réelle) :** Nous avons intégré un bouton spécial **SIMULER IMAGE (EMULATEUR)**. Ce bouton dessine directement sur un Canvas virtuel des formes et lignes simulant un burger et des frites. ML Kit analysera cette image de test et vous affichera instantanément la détection du burger et des frites avec le total calorique calculé !

### 4. Personnaliser le Style Néon Cyberpunk
Les couleurs sont centralisées en tant que constantes au sommet du fichier `MealScannerScreen.kt`. Vous pouvez modifier les valeurs pour correspondre à d'autres variantes de néon :
```kotlin
val CyberNeonCyan = Color(0xFF00FFFF)    // Pour les textes principaux et bordures technologiques
val CyberNeonPurple = Color(0xFF9C27B0)  // Pour le fond des cartes cyberpunk
val CyberNeonPink = Color(0xFFE91E63)    // Pour l'animation laser de scan et les boutons de tir
```

---

## ⚡ Conseils de Performance & Optimisations

1. **Améliorer la précision des calories :** Vous pouvez enrichir la base de données Room locale en insérant de nouvelles correspondances d'aliments dans la fonction `populateDatabase` de `CalorieDatabase.kt` ou en implémentant un écran d'administration pour laisser l'utilisateur ajouter ses propres équivalences.
2. **Gestion des photos floues / Mauvaise luminosité :** ML Kit renvoie une liste vide de labels si l'image n'est pas nette ou si le seuil de 70% de confiance n'est pas atteint. Le ViewModel attrape cela et affiche un message d'erreur de diagnostic élégant à l'utilisateur : *"La détection n'a pas pu identifier d'aliments connus. Essayez une photo plus claire."*
3. **Estimation intelligente :** Si un aliment est identifié par l'œil de ML Kit mais absent de Room, le ViewModel utilise un système d'analyse lexicale intelligente (dans `estimateUnknownFoodCalories`) pour catégoriser et attribuer un nombre de calories cohérent (ex : sucreries → 350 kcal, fruits → 70 kcal) au lieu d'un simple "0 kcal".
