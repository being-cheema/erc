
## Fix: CORS Blocking on `sync-strava` for Published Site

The `sync-strava` backend function has the same issue we already fixed on `strava-auth` -- it only allows requests from the preview domain, not the published domain.

### What Will Change

**File: `supabase/functions/sync-strava/index.ts`**

Add the published and preview domains to the allowed origins list (lines 4-8):

```text
Current:
  "https://id-preview--7b78d716-a91e-4441-86b0-b30684e91214.lovable.app"
  "https://7b78d716-a91e-4441-86b0-b30684e91214.lovable.app"

Updated (add two entries):
+ "https://strava-runners-connect.lovable.app"
+ "https://preview--strava-runners-connect.lovable.app"
```

Then redeploy the function. No other files need to change.
