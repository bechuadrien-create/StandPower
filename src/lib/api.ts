/**
 * Couche API centralisée avec support du mode démo
 */

const API_URL = window.__STANDPOWER_CONFIG__?.apiUrl || 'http://localhost:3000'
const IS_DEMO_MODE = window.__STANDPOWER_CONFIG__?.isDemoMode || true

// ✅ Données mock pour les tests sans serveur
const MOCK_EXERCISE_GUIDES: Record<string, any> = {
  'squat': {
    properForm: [
      'Position des pieds à la largeur des épaules',
      'Descendre en contrôlant le mouvement jusqu\'à 90°',
      'Remonter en poussant par les talons'
    ],
    safetyTips: [
      'Maintenir le dos droit pendant toute la descente',
      'Ne pas dépasser les genoux avec les pointes des pieds'
    ],
    targetMuscles: ['Quadriceps', 'Fessiers', 'Ischios-jambiers']
  },
  'développé couché': {
    properForm: [
      'Allongé sur le banc, pieds au sol',
      'Barre au niveau de la poitrine',
      'Pousser la barre vers le haut en contrôlant'
    ],
    safetyTips: [
      'Garder les pieds fermement ancrés',
      'Contrôler la phase de descente (excentrique)'
    ],
    targetMuscles: ['Pectoraux', 'Triceps', 'Épaules']
  },
  'tirage horizontal': {
    properForm: [
      'Assis, dos droit, poignées à la hauteur de la poitrine',
      'Tirer les poignées vers vous en rapprochant les omoplates',
      'Retour contrôlé à la position initiale'
    ],
    safetyTips: [
      'Ne pas arrondir le dos',
      'Mobiliser les dorsaux, pas seulement les bras'
    ],
    targetMuscles: ['Dos', 'Dorsaux', 'Biceps']
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Générer une fiche technique d'exercice
 */
export async function generateExerciseGuide(exerciseName: string) {
  console.log(`📋 Générer guide pour: ${exerciseName}`)

  // ✅ Mode démo : retourner les données mock
  if (IS_DEMO_MODE) {
    console.log('🎭 Mode DÉMO activé - retour des données mock')
    const mockGuide = MOCK_EXERCISE_GUIDES[exerciseName.toLowerCase()] || {
      properForm: [
        `Position de départ pour ${exerciseName}`,
        `Effectuer le mouvement de manière contrôlée`,
        `Retour à la position initiale`
      ],
      safetyTips: [
        `Échauffement obligatoire avant ${exerciseName}`,
        `Ne pas négliger la phase excentrique`
      ],
      targetMuscles: ['Muscles principales']
    }
    return mockGuide
  }

  // ❌ Mode production : appel API réel
  try {
    const response = await fetch(`${API_URL}/api/generate-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exerciseName })
    })

    if (!response.ok) {
      throw new Error(`API erreur: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('❌ Erreur API:', error)
    // Fallback sur les données mock
    return MOCK_EXERCISE_GUIDES[exerciseName.toLowerCase()] || {
      properForm: ['Erreur de connexion au serveur'],
      safetyTips: ['Vérifiez votre connexion Internet'],
      targetMuscles: ['N/A']
    }
  }
}

/**
 * Health check du serveur API
 */
export async function checkApiHealth(): Promise<boolean> {
  if (IS_DEMO_MODE) {
    console.log('🎭 Mode DÉMO - API considérée comme OK')
    return true
  }

  try {
    const response = await fetch(`${API_URL}/api/health`)
    return response.ok
  } catch {
    console.warn('⚠️ Serveur API indisponible')
    return false
  }
}

/**
 * Enregistrer un entraînement (stockage local pour l'instant)
 */
export async function saveWorkout(workoutData: any): Promise<ApiResponse<any>> {
  console.log('💾 Enregistrement entraînement:', workoutData)

  // Stockage local (localStorage) en attendant le backend
  try {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]')
    workouts.push({
      ...workoutData,
      id: Date.now(),
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('workouts', JSON.stringify(workouts))
    
    return {
      success: true,
      data: { id: workouts[workouts.length - 1].id }
    }
  } catch (error) {
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * Récupérer tous les entraînements
 */
export async function getWorkouts(): Promise<any[]> {
  try {
    return JSON.parse(localStorage.getItem('workouts') || '[]')
  } catch {
    return []
  }
}
