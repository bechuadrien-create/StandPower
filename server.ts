import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Middleware configured for process.env.APP_URL and Capacitor mobile origins
  const appUrl = process.env.APP_URL;
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile app, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (!appUrl || appUrl === "*" || origin === appUrl || origin.startsWith("https://localhost") || origin.startsWith("http://localhost") || origin.startsWith("capacitor://")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  }));

  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Dynamic AI Exercise Technical Sheet Generation
  app.post("/api/generate-guide", async (req, res) => {
    const { exerciseName } = req.body;

    // Strict input validation & XSS / Injection sanitization
    if (!exerciseName || typeof exerciseName !== "string") {
      return res.status(400).json({ error: "Le nom de l'exercice est requis et doit être une chaîne." });
    }

    // Strip HTML/script tags and limit length to 150 chars max
    const sanitizedExercise = exerciseName
      .replace(/<[^>]*>?/gm, "")
      .replace(/[<>{}]/g, "")
      .trim();

    if (sanitizedExercise.length === 0 || sanitizedExercise.length > 150) {
      return res.status(400).json({ error: "Nom d'exercice invalide ou trop long (max 150 caractères)." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Returning a generic fallback guide.");
      return res.json({
        properForm: [
          `Positionnez-vous confortablement pour réaliser "${sanitizedExercise}".`,
          `Effectuez le mouvement de contraction de manière contrôlée avec une bonne posture.`,
          `Soufflez à l'effort pendant la contraction concentrique.`
        ],
        safetyTips: [
          `Commencez par une charge d'échauffement légère pour lubrifier les articulations.`,
          `Contrôlez toujours la phase excentrique (descente) sans relâcher brusquement la tension.`
        ],
        targetMuscles: ["Muscles sollicités par l'exercice"]
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Génère une fiche technique d'entraînement de musculation approfondie en FRANÇAIS pour l'exercice suivant : "${sanitizedExercise}".
La réponse doit être structurée sous forme de JSON valide contenant :
- targetMuscles: Un tableau de 1 à 3 chaînes en français, ex: ["Pectoraux", "Triceps"].
- properForm: Un tableau de 3 à 4 étapes claires décrivant le mouvement mécanique idéal.
- safetyTips: Un tableau de 2 consignes de sécurité pour éviter les blessures graves.

Sois précis, professionnel et concis sur l'anatomie et la mécanique athlétique. Ne renvoie rien d'autre que le JSON brut.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              targetMuscles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Les muscles sollicités principalement (1 à 3)."
              },
              properForm: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Les consignes de placement et d'exécution mécanique (3 à 4)."
              },
              safetyTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Conseils incontournables pour limiter les risques de blessure."
              }
            },
            required: ["targetMuscles", "properForm", "safetyTips"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text.trim());
        return res.json(data);
      } else {
        throw new Error("No text generated from Gemini");
      }
    } catch (error) {
      console.error("Gemini instruction generator error:", error);
      return res.json({
        properForm: [
          `Exécutez le mouvement de ${sanitizedExercise} avec contrôle.`,
          "Inspirez lors de la phase excentrique, expirez lors de la phase concentrique.",
          "Maintenez une posture stable et sécuritaire."
        ],
        safetyTips: [
          "Ne forcez pas de manière saccadée.",
          "Assurez-vous d'avoir une prise solide."
        ],
        targetMuscles: ["Groupe musculaire concerné"]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
