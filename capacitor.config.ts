import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adgame.app',
  appName: 'StandPower',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    // Si vous souhaitez charger l'application web directement depuis Cloud Run :
    // url: process.env.VITE_API_URL || undefined
  }
};

export default config;
