
# Strava Disconnect with Full Data Wipe

## What the feature does

A "Disconnect Strava" button appears below the Force Full Sync button in the Strava Connection card. Tapping it opens an AlertDialog warning the user that this will permanently delete all their activity data, leaderboard entries, achievements, and race registrations. On confirmation, the app:

1. Calls a new edge function (`disconnect-strava`) using the service role key to delete all rows the user cannot delete via RLS policies
2. Deletes the rows the user CAN delete client-side (race registrations, training progress, push tokens)
3. Clears the Strava credentials and resets stats on the profile row client-side
4. Invalidates all relevant query cache keys
5. Shows a success toast and signs the user out so they land on the login screen fresh

---

## Root Cause Analysis: Why an Edge Function is Needed

Three tables have **no DELETE RLS policy**, meaning the logged-in user cannot delete their own rows using the client SDK:

| Table | Can user delete? | Reason |
|---|---|---|
| `activities` | No | No DELETE policy exists |
| `monthly_leaderboard` | No | No DELETE policy exists |
| `user_achievements` | No | No DELETE policy exists |
| `race_participants` | Yes | Policy: `auth.uid() = user_id` |
| `user_training_progress` | Yes | Policy: `auth.uid() = user_id` |
| `push_tokens` | Yes | Policy: `auth.uid() = user_id` |

The edge function uses the **service role key** (already configured as `SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS and hard-delete from those three tables.

---

## Technical Plan

### Step 1 — New Edge Function: `disconnect-strava`

**File:** `supabase/functions/disconnect-strava/index.ts`

The function:
- Validates the user's JWT from the `Authorization` header
- Uses `supabaseAdmin` (service role) to delete from:
  - `activities` where `user_id = caller`
  - `monthly_leaderboard` where `user_id = caller`
  - `user_achievements` where `user_id = caller`
- Returns `{ success: true }` or error

It does NOT touch `profiles` — the profile Strava fields are cleared client-side (user has UPDATE permission on their own profile).

### Step 2 — `Settings.tsx` Changes

**Add imports:**
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Unlink } from "lucide-react";
```

**Add state:**
```tsx
const [isDisconnecting, setIsDisconnecting] = useState(false);
```

**Add handler `handleDisconnectStrava`:**
```ts
const handleDisconnectStrava = async () => {
  setIsDisconnecting(true);
  mediumImpact();

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    // Step 1: Call edge function to delete rows the user can't delete via RLS
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disconnect-strava`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to delete data");
    }

    // Step 2: Delete rows the user CAN delete client-side
    if (user?.id) {
      await supabase.from("race_participants").delete().eq("user_id", user.id);
      await supabase.from("user_training_progress").delete().eq("user_id", user.id);
      await supabase.from("push_tokens").delete().eq("user_id", user.id);
    }

    // Step 3: Clear Strava credentials + reset stats on profile
    await supabase
      .from("profiles")
      .update({
        strava_id: null,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        total_distance: 0,
        total_runs: 0,
        current_streak: 0,
        longest_streak: 0,
        last_synced_at: null,
      })
      .eq("user_id", user!.id);

    // Step 4: Invalidate all queries
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["activities"] });
    await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    await queryClient.invalidateQueries({ queryKey: ["userRank"] });
    await queryClient.invalidateQueries({ queryKey: ["monthlyDistance"] });
    await queryClient.invalidateQueries({ queryKey: ["userAchievements"] });

    notificationSuccess();
    toast.success("Strava disconnected and all data removed");

    // Step 5: Sign out
    await supabase.auth.signOut();
    navigate("/login");
  } catch (error: any) {
    console.error("Disconnect error:", error);
    toast.error(error.message || "Failed to disconnect Strava");
    setIsDisconnecting(false);
  }
};
```

**Add AlertDialog + Disconnect button** inside the Strava Connection card, below the Force Full Sync button and its description paragraph:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      variant="outline"
      disabled={isDisconnecting}
      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
    >
      {isDisconnecting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Unlink className="w-4 h-4 mr-2" />
      )}
      {isDisconnecting ? "Disconnecting..." : "Disconnect Strava"}
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Disconnect Strava?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete all your activity data, leaderboard entries, achievements, and race registrations from this app. Your Strava account itself will not be affected. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDisconnectStrava}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Yes, disconnect and delete data
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/disconnect-strava/index.ts` | New edge function — deletes `activities`, `monthly_leaderboard`, `user_achievements` using service role |
| `src/pages/Settings.tsx` | Add AlertDialog + Disconnect Strava button + handler |

No database schema changes needed. No new secrets needed — `SUPABASE_SERVICE_ROLE_KEY` is already configured. Edge function deploys automatically.
