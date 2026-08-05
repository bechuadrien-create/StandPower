import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.standpower.app',
  appName: 'StandPower',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  }
};

export default config;
