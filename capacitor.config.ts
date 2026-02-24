import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eroderunners.app',
  appName: 'Erode Runners Club',
  webDir: 'dist',
  
  // === OTA MODE (Production) ===
  // The app loads from your self-hosted server.
  // Deploy web updates to your server = instant update for all users.
  // Only rebuild APK when native plugins or this config change.
  server: {
    url: 'https://api.eroderunnersclub.com/', // TODO: Replace with your actual self-hosted domain
    cleartext: false,
  },

  // === DEVELOPMENT MODE ===
  // Uncomment below (and comment out OTA block above) for hot-reload during development:
  // server: {
  //   url: 'http://localhost:5173',
  //   cleartext: true,
  // },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Browser: {
      // Browser plugin for OAuth flows
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'eroderunners',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    useLegacyBridge: false,
  },
};

export default config;
