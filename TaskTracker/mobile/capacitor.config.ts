import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile',
  webDir: 'www',

  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;