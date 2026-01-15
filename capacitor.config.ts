import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eroderunners.app',
  appName: 'Erode Runners Club',
  webDir: 'dist',
  
  // === DEVELOPMENT MODE (OTA Updates) ===
  // Uncomment for hot-reload during development:
  // server: {
  //   url: 'https://7b78d716-a91e-4441-86b0-b30684e91214.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  
  // === PRODUCTION MODE (Bundled) ===
  // For self-hosted deployment, use:
  // server: {
  //   url: 'https://your-domain.com',
  //   cleartext: false,
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
