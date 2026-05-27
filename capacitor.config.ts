import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.todobelt',
  appName: 'TODO BELT',
  // Angular 17+ application builder outputs to www/browser by default.
  webDir: 'www/browser',
  backgroundColor: '#0A0A0C',
  android: {
    backgroundColor: '#0A0A0C',
  },
  ios: {
    backgroundColor: '#0A0A0C',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0A0A0C',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0C',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
