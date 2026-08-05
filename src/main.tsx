import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration globale pour les tests sans serveur
window.__STANDPOWER_CONFIG__ = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  isDemoMode: import.meta.env.VITE_APP_ENV === 'development',
  geminiKey: import.meta.env.GEMINI_API_KEY || 'demo_key_testing_only'
}

console.log('🚀 StandPower démarrée en mode:', window.__STANDPOWER_CONFIG__.isDemoMode ? 'DÉVELOPPEMENT' : 'PRODUCTION')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
