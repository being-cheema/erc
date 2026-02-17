

## OTA Updates + Self-Hosting Setup

### What OTA Means for Your App

Your APK will be a thin "shell" -- it opens a WebView that loads your self-hosted website. When you deploy updates to your server, every user gets the new version automatically on next app open. A new APK is only needed if you change native plugins.

### Changes Required

#### 1. `capacitor.config.ts` -- Point to Your Domain

Uncomment the production server block and set it to your self-hosted URL. For now we'll use a placeholder you can replace later:

```typescript
server: {
  url: 'https://your-domain.com',
  cleartext: false,
},
```

#### 2. `index.html` -- Fix Viewport and Branding

- Add `viewport-fit=cover` to the viewport meta tag (required for safe areas on notched phones)
- Update title from "Lovable App" to "Erode Runners Club"
- Update all meta description and OG tags to match your app branding

#### 3. `src/App.tsx` -- Add Offline Detection

Since OTA requires network connectivity to load the app, add a simple offline detection wrapper that shows a "No internet connection" screen with a retry button when the device is offline and running inside Capacitor. Web users won't be affected.

#### 4. `src/pages/Login.tsx` -- Fix Native OAuth

Currently uses `window.location.href` to redirect to Strava, which breaks on native because it navigates the WebView away. However, since OTA mode loads from your server URL, `window.location.origin` will return your domain, so OAuth redirects will work correctly as long as your Strava app's redirect URI matches your domain + `/auth/callback`.

No code change needed here for OTA mode -- the redirect flow works because the WebView is loading your website.

#### 5. Self-Hosting Migration Doc Update

Update `docs/SELF_HOSTING_MIGRATION.md` to include OTA-specific instructions:
- How to configure the Capacitor server URL
- How to set up Strava OAuth redirect URIs for the self-hosted domain
- How to rebuild the APK after config changes
- Reminder: only rebuild APK when native config changes

### Files Changed

| File | Change |
|------|--------|
| `capacitor.config.ts` | Set `server.url` to self-hosted domain |
| `index.html` | Add `viewport-fit=cover`, update branding to "Erode Runners Club" |
| `src/App.tsx` | Add offline detection component for native app |
| `docs/SELF_HOSTING_MIGRATION.md` | Add OTA section with deployment instructions |

### After Implementation

Once you migrate to your own server:
1. Replace `https://your-domain.com` in `capacitor.config.ts` with your actual domain
2. Add your domain to the Strava OAuth redirect URI allowlist
3. Run `npx cap sync` and rebuild the APK
4. Deploy your web app to your server
5. Every future web deploy = instant update for all users

