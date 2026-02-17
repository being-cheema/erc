

## Fix: Strava Login Broken on Published Site

Two issues are preventing login from the published domain (`strava-runners-connect.lovable.app`):

### Problem 1: CORS Blocking
The backend function only allows requests from the preview domain. The published domain is not in the allowed list, so the browser blocks the request entirely.

### Problem 2: Invalid Redirect URI
The login page sends users back to `/auth/callback` after Strava authorization, but the backend only accepts `/strava-callback` as a valid callback path. This mismatch causes the function to reject the request.

---

### What Will Change

**File: `supabase/functions/strava-auth/index.ts`**

1. Add the published domain to the CORS allowed origins list:
   - `https://strava-runners-connect.lovable.app`

2. Add the correct callback paths for all domains to the allowed redirect URIs:
   - `https://strava-runners-connect.lovable.app/auth/callback`
   - `https://id-preview--7b78d716-a91e-4441-86b0-b30684e91214.lovable.app/auth/callback`
   - (Keep existing `/strava-callback` entries for backward compatibility)

3. Redeploy the backend function.

No frontend changes are needed -- the login page is already sending the correct `/auth/callback` path, which matches the route defined in the app.

