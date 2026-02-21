
# Fix: "Failed to create user account" after Strava Disconnect

## Root Cause (Confirmed by DB + Logs)

The disconnect flow correctly clears `strava_id` from the `profiles` table and signs the user out — but it does NOT delete the auth account (the row in `auth.users` with email `strava_101181627@eroderunners.local`).

When that user tries to reconnect Strava:

1. `strava-auth` callback checks `profiles` for `strava_id = athlete.id` → finds nothing (cleared by disconnect)
2. Falls into the "new user" branch
3. Calls `supabase.auth.admin.createUser({ email: "strava_101181627@eroderunners.local" })`
4. Crashes with `422 email_exists` → returns 500 "Failed to create user account"

The DB confirms exactly this:
- `auth.users` has `strava_101181627@eroderunners.local` (auth account still alive)
- `profiles` has `strava_id = null` for that user (cleared by disconnect)

## Two-Part Fix

### Fix 1 — `strava-auth/index.ts`: Handle the "reconnecting user" case

In the "new user" branch (line 155), before calling `createUser`, first check if an auth user with that email already exists using `getUserByEmail`. If found, treat it as an existing user (update tokens, upsert profile) rather than trying to create a new one.

```ts
// NEW: Check if auth user already exists with this Strava email
const stravaEmail = `strava_${athlete.id}@eroderunners.local`;
const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
// More efficient: use getUserByEmail via admin API
```

The precise fix replaces the `else` block logic:

```ts
} else {
  // New user OR reconnecting user (disconnected previously)
  isNewUser = true;
  const email = `strava_${athlete.id}@eroderunners.local`;
  const password = crypto.randomUUID();

  // First, check if an auth user with this email already exists
  // (happens when user disconnected Strava — profile cleared but auth user remains)
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

  if (existingAuthUser) {
    // Auth user exists but profile was cleared (reconnect after disconnect)
    userId = existingAuthUser.id;
    isNewUser = false;

    // Upsert the profile (re-link strava_id and update tokens)
    await supabase.from("profiles").upsert({
      user_id: userId,
      strava_id: athlete.id.toString(),
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
      display_name: `${athlete.firstname} ${athlete.lastname}`,
      avatar_url: athlete.profile,
      city: athlete.city || null,
    }, { onConflict: "user_id" });

    // Ensure member role exists
    await supabase.from("user_roles").upsert({
      user_id: userId,
      role: "member",
    }, { onConflict: "user_id,role" });

    // Ensure notification preferences exist
    await supabase.from("notification_preferences").upsert({
      user_id: userId,
    }, { onConflict: "user_id" });

  } else {
    // Truly new user — create auth account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        strava_id: athlete.id,
        display_name: `${athlete.firstname} ${athlete.lastname}`,
        avatar_url: athlete.profile,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    userId = authData.user.id;

    await supabase.from("profiles").insert({ ... });
    await supabase.from("user_roles").insert({ ... });
    await supabase.from("notification_preferences").insert({ ... });
  }
}
```

Note: `listUsers` with no filter returns all users. Since this is a closed club app with a small user base this is fine. Alternatively, a faster approach is to use the admin `getUserByEmail` equivalent — but Supabase JS admin API exposes `listUsers` with email filter via pagination. We'll use the `filter` param: `listUsers({ page: 1, perPage: 1000 })` then find by email client-side, which is reliable for a small community.

### Fix 2 — Also fix the `existingProfile` branch: don't overwrite user-set display_name/avatar

Currently line 149-151 always overwrites `display_name` and `avatar_url` with Strava data even when the user changed them. The previous bugfix session addressed this in `sync-strava` but the same issue exists here in `strava-auth`. Fix: only set these if the profile doesn't already have values.

```ts
// Fetch current profile first
const { data: currentProfileData } = await supabase
  .from("profiles")
  .select("display_name, avatar_url")
  .eq("user_id", userId)
  .single();

await supabase.from("profiles").update({
  strava_access_token: access_token,
  strava_refresh_token: refresh_token,
  strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
  display_name: currentProfileData?.display_name || `${athlete.firstname} ${athlete.lastname}`,
  avatar_url: currentProfileData?.avatar_url || athlete.profile,
  city: athlete.city || null,
}).eq("user_id", userId);
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/strava-auth/index.ts` | Add reconnecting-user recovery logic in the new-user branch; also protect display_name/avatar from being overwritten in the existing-user branch |

No database changes needed. The edge function redeploys automatically.

## Why this is the complete fix

After this change, the full lifecycle works correctly:
- First time connecting Strava: creates auth user + profile (same as before)
- Disconnecting Strava: clears profile strava_id + data (same as before), auth user persists
- Reconnecting Strava: finds existing auth user by email, upserts profile with new strava_id + tokens, generates magic link — no crash
