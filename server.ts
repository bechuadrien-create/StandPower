import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

function sanitizeUserText(raw: unknown, maxLen = 600): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>{}]/g, '')
    .trim()
    .slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  const appUrl = process.env.APP_URL;
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          !appUrl ||
          appUrl === '*' ||
          origin === appUrl ||
          origin.startsWith('https://localhost') ||
          origin.startsWith('http://localhost') ||
          origin.startsWith('capacitor://')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      model: 'gemini-2.5-flash',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Route principale enrichie : POST /api/exercise-info (et alias /api/generate-guide)
  const handleExerciseInfo: express.RequestHandler = async (req, res) => {
    const sanitizedExercise = sanitizeUserText(req.body?.exerciseName, 150);

    if (!sanitizedExercise) {
      res.status(400).json({
        error: "Le nom de l'exercice est requis (1 à 150 caractères).",
      });
      return;
    }

    const fallbackPayload = {
      englishMatchKey: 'Barbell_Full_Squat',
      movementPattern: 'squat' as const,
      primaryMuscles: ['Quadriceps', 'Fessiers'],
      secondaryMuscles: ['Ischios', 'Abdos'],
      formCues: [
        `Installez une posture stable et gainée pour exécuter "${sanitizedExercise}".`,
        'Contrôlez la phase excentrique sur 2 à 3 secondes sans perte de tension.',
        'Expirez lors de la phase concentrique en conservant un alignement articulaire neutre.',
      ],
      properForm: [
        `Installez une posture stable et gainée pour exécuter "${sanitizedExercise}".`,
        'Contrôlez la phase excentrique sur 2 à 3 secondes sans perte de tension.',
        'Expirez lors de la phase concentrique en conservant un alignement articulaire neutre.',
      ],
      safetyTips: [
        "Effectuez 1 à 2 séries d'échauffement progressif avant vos charges de travail.",
        'Stoppez la série si la technique se dégrade ou en cas de douleur articulaire.',
      ],
      targetMuscles: ['Quadriceps', 'Fessiers'],
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json(fallbackPayload);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Génère une fiche technique biomécanique complète en FRANÇAIS pour l'exercice ou drill sportif suivant : "${sanitizedExercise}".
Règles strictes :
- englishMatchKey : Identifiant anglais exact de la base yuhonas/free-exercise-db si c'est un exercice de musculation connu (ex: "Barbell_Bench_Press_-_Medium_Grip", "Barbell_Full_Squat", "Barbell_Deadlift", "Pullups", "Barbell_Curl", "Standing_Military_Press"), ou chaîne vide "" si c'est un drill JJB/MMA spécifique.
- movementPattern : obligatoirement l'une des valeurs suivantes : "push", "pull", "squat", "hinge", "core", "combat_ground", "combat_striking".
- primaryMuscles : 1 à 3 muscles parmi ["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos", "Quadriceps", "Ischios", "Mollets", "Fessiers"].
- secondaryMuscles : 1 à 3 muscles secondaires parmi la même liste.
- formCues : 3 à 4 étapes biomécaniques précises d'exécution.
- safetyTips : 2 à 3 consignes de sécurité articulaire.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              englishMatchKey: {
                type: Type.STRING,
                description:
                  'Identifiant anglais free-exercise-db (ex: Barbell_Bench_Press_-_Medium_Grip) ou chaîne vide.',
              },
              movementPattern: {
                type: Type.STRING,
                enum: [
                  'push',
                  'pull',
                  'squat',
                  'hinge',
                  'core',
                  'combat_ground',
                  'combat_striking',
                ],
                description: 'Schéma moteur principal pour piloter le Stickman SVG.',
              },
              primaryMuscles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Muscles primaires normalisés.',
              },
              secondaryMuscles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Muscles secondaires normalisés.',
              },
              formCues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Consignes d'exécution biomécaniques (3 à 4).",
              },
              safetyTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Consignes de sécurité (2 à 3).',
              },
            },
            required: [
              'englishMatchKey',
              'movementPattern',
              'primaryMuscles',
              'secondaryMuscles',
              'formCues',
              'safetyTips',
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim()) as {
          englishMatchKey: string;
          movementPattern: string;
          primaryMuscles: string[];
          secondaryMuscles: string[];
          formCues: string[];
          safetyTips: string[];
        };
        res.json({
          ...parsed,
          properForm: parsed.formCues,
          targetMuscles: parsed.primaryMuscles,
        });
        return;
      }
      res.json(fallbackPayload);
    } catch (error) {
      console.error('Gemini /api/exercise-info error:', error);
      res.json(fallbackPayload);
    }
  };

  app.post('/api/exercise-info', handleExerciseInfo);
  app.post('/api/generate-guide', handleExerciseInfo);

  // Route Assistant IA Coach en temps réel : POST /api/coach-chat
  app.post('/api/coach-chat', async (req, res) => {
    const userMessage = sanitizeUserText(req.body?.message, 800);
    if (!userMessage) {
      res.status(400).json({ error: 'Le message est requis.' });
      return;
    }

    const fallbackCoach = {
      reply:
        "En combinant musculation et sports de combat (JJB, Boxe, MMA), privilégie la qualité technique, conserve 1 à 2 répétitions en réserve (RPE 8) sur tes exercices polyarticulaires et espace tes séances lourdes des sparrings intenses.",
      actionableTips: [
        'Applique la double progression sur tes mouvements principaux.',
        'Échauffe tes hanches, épaules et poignets avec 5 minutes de drills solo.',
        'Assure un apport de 1,6 à 2,0 g de protéines par kg de poids de corps.',
      ],
      suggestedDrillsOrExercises: [
        'Sortie de bassin (Shrimp / Hip Escape)',
        'Squat barre (Back Squat)',
        'Face pull à la poulie haute',
      ],
      recoveryWarning:
        'Réduis le volume de 25 % si ton score de fatigue dépasse 4/5.',
      source: 'local-rule-engine',
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json(fallbackCoach);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contextStr = req.body?.context
        ? JSON.stringify(req.body.context).slice(0, 600)
        : 'Non spécifié';

      const prompt = `Tu es le Coach Sportif Expert de StandPower (Musculation, JJB/BJJ, Boxe, MMA et Nutrition).
Contexte athlète : ${contextStr}
Question de l'athlète : "${userMessage}"

Réponds en FRANÇAIS de façon précise, structurée, sécuritaire et directement applicable.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Réponse principale claire et synthétique du coach.',
              },
              actionableTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 à 4 conseils concrets immédiatement applicables.',
              },
              suggestedDrillsOrExercises: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exercices de musculation ou drills JJB/MMA recommandés.',
              },
              recoveryWarning: {
                type: Type.STRING,
                description: 'Consigne de gestion de la fatigue ou prévention des blessures.',
              },
            },
            required: [
              'reply',
              'actionableTips',
              'suggestedDrillsOrExercises',
              'recoveryWarning',
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        res.json({
          ...parsed,
          source: 'gemini-2.5-flash',
        });
        return;
      }
      res.json(fallbackCoach);
    } catch (error) {
      console.error('Gemini /api/coach-chat error:', error);
      res.json(fallbackCoach);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StandPower Server running on http://localhost:${PORT}`);
  });
}

void startServer();
