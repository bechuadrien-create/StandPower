import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.standpower.app',
  appName: 'StandPower',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#171A17',
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_standpower',
      iconColor: '#A8B89A',
    },
  },
};

export default config;
