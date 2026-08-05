/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExerciseDefinition {
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultLoadKg: number;
}

// 80+ Classic Exercises broken down by main muscle groups (Pectoraux, Dos, Jambes, Épaules, Bras, Abdos)
export const CLASSIC_EXERCISES: ExerciseDefinition[] = [
  // PECTORAUX (15 exercises)
  { name: "Développé Couché (Barre)", category: "Pectoraux", defaultSets: 4, defaultReps: 8, defaultLoadKg: 60 },
  { name: "Développé Couché (Haltères)", category: "Pectoraux", defaultSets: 4, defaultReps: 10, defaultLoadKg: 22 },
  { name: "Développé Incliné (Barre)", category: "Pectoraux", defaultSets: 4, defaultReps: 8, defaultLoadKg: 50 },
  { name: "Développé Incliné (Haltères)", category: "Pectoraux", defaultSets: 4, defaultReps: 10, defaultLoadKg: 20 },
  { name: "Développé Décliné (Barre)", category: "Pectoraux", defaultSets: 3, defaultReps: 10, defaultLoadKg: 55 },
  { name: "Écarté Couché (Haltères)", category: "Pectoraux", defaultSets: 3, defaultReps: 12, defaultLoadKg: 12 },
  { name: "Écarté à la Poulie Haute", category: "Pectoraux", defaultSets: 4, defaultReps: 15, defaultLoadKg: 15 },
  { name: "Écarté à la Poulie Basse", category: "Pectoraux", defaultSets: 3, defaultReps: 12, defaultLoadKg: 10 },
  { name: "Dips (Pectoraux - buste penché)", category: "Pectoraux", defaultSets: 4, defaultReps: 10, defaultLoadKg: 0 },
  { name: "Pull-Over (Haltère)", category: "Pectoraux", defaultSets: 3, defaultReps: 12, defaultLoadKg: 16 },
  { name: "Chest Press (Machine)", category: "Pectoraux", defaultSets: 4, defaultReps: 10, defaultLoadKg: 45 },
  { name: "Pec Deck (Papillon)", category: "Pectoraux", defaultSets: 3, defaultReps: 12, defaultLoadKg: 35 },
  { name: "Pompes classiques (Push-ups)", category: "Pectoraux", defaultSets: 3, defaultReps: 20, defaultLoadKg: 0 },
  { name: "Pompes déclinées", category: "Pectoraux", defaultSets: 3, defaultReps: 15, defaultLoadKg: 0 },
  { name: "Pompes diamant", category: "Pectoraux", defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 },

  // DOS (15 exercises)
  { name: "Soulevé de Terre (Barre)", category: "Dos", defaultSets: 4, defaultReps: 5, defaultLoadKg: 100 },
  { name: "Tractions Pronation", category: "Dos", defaultSets: 4, defaultReps: 8, defaultLoadKg: 0 },
  { name: "Tractions Supination", category: "Dos", defaultSets: 3, defaultReps: 8, defaultLoadKg: 0 },
  { name: "Tirage Poitrine Vertical (Poulie)", category: "Dos", defaultSets: 4, defaultReps: 10, defaultLoadKg: 50 },
  { name: "Tirage Nuque (Poulie)", category: "Dos", defaultSets: 3, defaultReps: 12, defaultLoadKg: 40 },
  { name: "Tirage Horizontal poulie basse (Rowing)", category: "Dos", defaultSets: 4, defaultReps: 10, defaultLoadKg: 45 },
  { name: "Rowing Barre Buste Penché", category: "Dos", defaultSets: 4, defaultReps: 8, defaultLoadKg: 50 },
  { name: "Rowing Haltère unilatéral (Bûcheron)", category: "Dos", defaultSets: 3, defaultReps: 10, defaultLoadKg: 22 },
  { name: "Rowing Barre en T (T-Bar)", category: "Dos", defaultSets: 4, defaultReps: 10, defaultLoadKg: 40 },
  { name: "Pull-over poulie haute bras tendus", category: "Dos", defaultSets: 3, defaultReps: 12, defaultLoadKg: 20 },
  { name: "Extensions Lombaires (Banc à lombaires)", category: "Dos", defaultSets: 3, defaultReps: 15, defaultLoadKg: 5 },
  { name: "Soulevé de terre jambes tendues", category: "Dos", defaultSets: 3, defaultReps: 10, defaultLoadKg: 60 },
  { name: "Tirage horizontal à un bras à la poulie", category: "Dos", defaultSets: 3, defaultReps: 12, defaultLoadKg: 15 },
  { name: "Shrugs (Haussements d'épaules)", category: "Dos", defaultSets: 4, defaultReps: 12, defaultLoadKg: 24 },
  { name: "Good Mornings", category: "Dos", defaultSets: 3, defaultReps: 10, defaultLoadKg: 30 },

  // ÉPAULES (15 exercises)
  { name: "Développé Militaire (Barre)", category: "Épaules", defaultSets: 4, defaultReps: 8, defaultLoadKg: 40 },
  { name: "Développé Épaules (Haltères)", category: "Épaules", defaultSets: 4, defaultReps: 10, defaultLoadKg: 16 },
  { name: "Élévations Latérales (Haltères)", category: "Épaules", defaultSets: 4, defaultReps: 12, defaultLoadKg: 8 },
  { name: "Élévations Latérales à la Poulie", category: "Épaules", defaultSets: 3, defaultReps: 15, defaultLoadKg: 7 },
  { name: "Oiseau de buste (Arrière d'épaules)", category: "Épaules", defaultSets: 4, defaultReps: 12, defaultLoadKg: 8 },
  { name: "Face Pull (Poulie)", category: "Épaules", defaultSets: 4, defaultReps: 15, defaultLoadKg: 15 },
  { name: "Élévations Frontales (Haltères)", category: "Épaules", defaultSets: 3, defaultReps: 12, defaultLoadKg: 10 },
  { name: "Développé Arnold", category: "Épaules", defaultSets: 3, defaultReps: 10, defaultLoadKg: 14 },
  { name: "Tirage Menton (Barre)", category: "Épaules", defaultSets: 3, defaultReps: 10, defaultLoadKg: 30 },
  { name: "Développé Épaules à la Machine", category: "Épaules", defaultSets: 4, defaultReps: 10, defaultLoadKg: 35 },
  { name: "W press pour coiffe rotateurs", category: "Épaules", defaultSets: 3, defaultReps: 12, defaultLoadKg: 6 },
  { name: "Élévations Latérales incliné sur banc", category: "Épaules", defaultSets: 3, defaultReps: 12, defaultLoadKg: 6 },
  { name: "Y-Raises sur banc incliné", category: "Épaules", defaultSets: 3, defaultReps: 12, defaultLoadKg: 4 },
  { name: "L-Flyes (Cochin) pour rotateurs", category: "Épaules", defaultSets: 3, defaultReps: 15, defaultLoadKg: 5 },
  { name: "Rotations externes à la poulie", category: "Épaules", defaultSets: 3, defaultReps: 15, defaultLoadKg: 5 },

  // JAMBES / BAS DU CORPS (18 exercises)
  { name: "Squats Arrière (Barre)", category: "Jambes", defaultSets: 4, defaultReps: 8, defaultLoadKg: 80 },
  { name: "Squats Avant (Front Squat)", category: "Jambes", defaultSets: 4, defaultReps: 8, defaultLoadKg: 60 },
  { name: "Presse à Cuisses (Leg Press)", category: "Jambes", defaultSets: 4, defaultReps: 10, defaultLoadKg: 120 },
  { name: "Fentes Bulgares (Haltères)", category: "Jambes", defaultSets: 3, defaultReps: 10, defaultLoadKg: 12 },
  { name: "Fentes Marchées (Haltères)", category: "Jambes", defaultSets: 3, defaultReps: 20, defaultLoadKg: 12 },
  { name: "Leg Extension (Quadriceps)", category: "Jambes", defaultSets: 4, defaultReps: 12, defaultLoadKg: 40 },
  { name: "Leg Curl Couché (Ischio-Jambiers)", category: "Jambes", defaultSets: 4, defaultReps: 10, defaultLoadKg: 30 },
  { name: "Leg Curl Assis (Ischio-Jambiers)", category: "Jambes", defaultSets: 3, defaultReps: 12, defaultLoadKg: 35 },
  { name: "Soulevé de terre roumain (RDL)", category: "Jambes", defaultSets: 4, defaultReps: 10, defaultLoadKg: 65 },
  { name: "Hip Thrust (Barre rembourrée)", category: "Jambes", defaultSets: 4, defaultReps: 10, defaultLoadKg: 80 },
  { name: "Gobelet Squat (Haltère)", category: "Jambes", defaultSets: 3, defaultReps: 12, defaultLoadKg: 20 },
  { name: "Mollets debout (Calf Raises)", category: "Jambes", defaultSets: 4, defaultReps: 15, defaultLoadKg: 40 },
  { name: "Mollets assis (Machine)", category: "Jambes", defaultSets: 4, defaultReps: 15, defaultLoadKg: 30 },
  { name: "Adducteurs assis (Machine)", category: "Jambes", defaultSets: 3, defaultReps: 15, defaultLoadKg: 40 },
  { name: "Abducteurs assis (Machine)", category: "Jambes", defaultSets: 3, defaultReps: 15, defaultLoadKg: 45 },
  { name: "Squat Hack (Hack Squat)", category: "Jambes", defaultSets: 4, defaultReps: 10, defaultLoadKg: 70 },
  { name: "Step-ups sur boîte / banc", category: "Jambes", defaultSets: 3, defaultReps: 10, defaultLoadKg: 10 },
  { name: "Sissy Squat au poids du corps", category: "Jambes", defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 },

  // BRAS (15 exercises)
  { name: "Curl Barre (Biceps)", category: "Bras", defaultSets: 4, defaultReps: 10, defaultLoadKg: 30 },
  { name: "Curl Pupitre (Barre EZ)", category: "Bras", defaultSets: 3, defaultReps: 10, defaultLoadKg: 25 },
  { name: "Curl Haltères Incliné", category: "Bras", defaultSets: 4, defaultReps: 12, defaultLoadKg: 12 },
  { name: "Curl Marteau (Hammer Curl)", category: "Bras", defaultSets: 3, defaultReps: 10, defaultLoadKg: 14 },
  { name: "Curl Concentration (Haltère)", category: "Bras", defaultSets: 3, defaultReps: 12, defaultLoadKg: 10 },
  { name: "Barre au Front (EZ Bar Triceps)", category: "Bras", defaultSets: 4, defaultReps: 10, defaultLoadKg: 25 },
  { name: "Extensions Triceps Poulie (Corde)", category: "Bras", defaultSets: 4, defaultReps: 12, defaultLoadKg: 20 },
  { name: "Extensions Triceps Poulie (Barre V)", category: "Bras", defaultSets: 4, defaultReps: 12, defaultLoadKg: 25 },
  { name: "Dips entre deux bancs", category: "Bras", defaultSets: 3, defaultReps: 15, defaultLoadKg: 0 },
  { name: "Extension nuque haltère unilatéral", category: "Bras", defaultSets: 3, defaultReps: 12, defaultLoadKg: 10 },
  { name: "Kickback Triceps à l'haltère", category: "Bras", defaultSets: 3, defaultReps: 12, defaultLoadKg: 8 },
  { name: "Curl inversé (Prise pronation)", category: "Bras", defaultSets: 3, defaultReps: 12, defaultLoadKg: 20 },
  { name: "Curl araignée (Spider Curl sur banc)", category: "Bras", defaultSets: 3, defaultReps: 10, defaultLoadKg: 10 },
  { name: "Extensions triceps au-dessus de la tête à la poulie", category: "Bras", defaultSets: 3, defaultReps: 12, defaultLoadKg: 15 },
  { name: "Extensions d'avant-bras poignet", category: "Bras", defaultSets: 3, defaultReps: 15, defaultLoadKg: 10 },

  // ABDOS / GAINAGE (12 exercises)
  { name: "Crunchs au sol", category: "Abdos", defaultSets: 3, defaultReps: 25, defaultLoadKg: 0 },
  { name: "Gainage Planche (Front Plank)", category: "Abdos", defaultSets: 3, defaultReps: 60, defaultLoadKg: 0 }, // 60s
  { name: "Gainage Latéral Planks (Side Planks)", category: "Abdos", defaultSets: 3, defaultReps: 45, defaultLoadKg: 0 }, 
  { name: "Relevé de jambes suspendu", category: "Abdos", defaultSets: 4, defaultReps: 12, defaultLoadKg: 0 },
  { name: "Enroulement de vertèbres (Crunch à la poulie)", category: "Abdos", defaultSets: 4, defaultReps: 15, defaultLoadKg: 25 },
  { name: "Ab Wheel rollouts (Roulette abdominale)", category: "Abdos", defaultSets: 3, defaultReps: 10, defaultLoadKg: 0 },
  { name: "Russian Twists avec poids", category: "Abdos", defaultSets: 3, defaultReps: 30, defaultLoadKg: 8 },
  { name: "Hollow Body Hold", category: "Abdos", defaultSets: 3, defaultReps: 45, defaultLoadKg: 0 },
  { name: "Relevé de bassin sur banc incliné", category: "Abdos", defaultSets: 3, defaultReps: 15, defaultLoadKg: 0 },
  { name: "Flutter Kicks (Battements de jambes)", category: "Abdos", defaultSets: 3, defaultReps: 40, defaultLoadKg: 0 },
  { name: "Windshield Wipers suspendu (Essuie-glace)", category: "Abdos", defaultSets: 3, defaultReps: 10, defaultLoadKg: 0 },
  { name: "Planche militaire alternée (Commando Planks)", category: "Abdos", defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 }
];

// 30 Specific Brazilian Jiu-Jitsu (JJB) Prep, Drills and strength routines
export const JJB_EXERCISES: ExerciseDefinition[] = [
  { name: "Tractions avec Serviette (Grip Training)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 8, defaultLoadKg: 0 },
  { name: "Hip Thrusts Explosifs (Pontages de Garde)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 12, defaultLoadKg: 60 },
  { name: "Turkish Get-Up (Relevé technique lourd)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 5, defaultLoadKg: 16 },
  { name: "Kettlebell Swings (Charnière de hanche fluide)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 15, defaultLoadKg: 20 },
  { name: "Shrimping (Sorties de hanches au sol)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 30, defaultLoadKg: 0 },
  { name: "Sprawls Explosifs (Anti-takedown)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 15, defaultLoadKg: 0 },
  { name: "Sit-outs alternés", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 20, defaultLoadKg: 0 },
  { name: "Tirage vertical prise neutre (Gi Grip Pull-up)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 8, defaultLoadKg: 0 },
  { name: "Rowing lourd à un bras avec poignée de kimono", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 24 },
  { name: "Kettlebell Goblet Squat", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 12, defaultLoadKg: 24 },
  { name: "Kettlebell Clean and Press", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 16 },
  { name: "Fentes sautées explosives", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 20, defaultLoadKg: 0 },
  { name: "Pontages complets (Bridge to neck roll)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 0 },
  { name: "Rotations de poings / Kettlebell halo", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 12, defaultLoadKg: 12 },
  { name: "Bear Crawls (Marche de l'ours)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 45, defaultLoadKg: 0 }, // 45s
  { name: "Grip Roller forearm strengthening", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 3, defaultLoadKg: 10 },
  { name: "Pompes Hindu (Chien tête en bas à tête en haut)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 },
  { name: "Tirage menton serré lourd (Upright Row)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 28 },
  { name: "Traction lente sur kimono suspendu", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 6, defaultLoadKg: 0 },
  { name: "Zercher Squat (Portage lourd de buste)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 8, defaultLoadKg: 50 },
  { name: "Good Mornings athlétiques pour ischio-jambiers", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 30 },
  { name: "Relevé de bassin suspendu (Leg raises pour T-Triangle)", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 12, defaultLoadKg: 0 },
  { name: "Plan incliné isométrique (S-Mount posture)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 45, defaultLoadKg: 0 },
  { name: "Dead Hang (Amélioration du grip passif)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 60, defaultLoadKg: 0 }, // 60s
  { name: "Fente Cossette lourde (Side lateral lunge)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 16 },
  { name: "Kettlebell Snatch", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 10, defaultLoadKg: 16 },
  { name: "Medball Slams au sol explosifs", category: "JJB / Prép physique", defaultSets: 4, defaultReps: 12, defaultLoadKg: 10 },
  { name: "Gainage planche rotation de hanches", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 20, defaultLoadKg: 0 },
  { name: "Sorties de hanche inversées", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 30, defaultLoadKg: 0 },
  { name: "Pompes sur les phalanges (Fists push-ups)", category: "JJB / Prép physique", defaultSets: 3, defaultReps: 15, defaultLoadKg: 0 }
];
