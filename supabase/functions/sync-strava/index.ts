import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  type: string;
  start_date: string;
}

async function refreshToken(
  supabaseAdmin: any,
  userId: string,
  refreshTokenValue: string
): Promise<string | null> {
  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenValue,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    return null;
  }

  const data = await response.json();

  // Update tokens in database
  await supabaseAdmin
    .from("profiles")
    .update({
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_token_expires_at: new Date(data.expires_at * 1000).toISOString(),
    })
    .eq("user_id", userId);

  return data.access_token;
}

async function fetchStravaActivities(
  accessToken: string,
  after?: number
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: "200",
  });

  if (after) {
    params.append("after", after.toString());
  }

  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.status}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check for authorization
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
      }
    }

    // If no specific user, sync all users with Strava connected
    const query = supabaseAdmin
      .from("profiles")
      .select("user_id, strava_access_token, strava_refresh_token, strava_token_expires_at")
      .not("strava_id", "is", null);

    if (userId) {
      query.eq("user_id", userId);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      throw profilesError;
    }

    const results: { userId: string; success: boolean; activities?: number; error?: string }[] = [];

    for (const profile of profiles || []) {
      try {
        let accessToken = profile.strava_access_token;

        // Check if token is expired
        const expiresAt = new Date(profile.strava_token_expires_at || 0);
        if (expiresAt < new Date()) {
          accessToken = await refreshToken(
            supabaseAdmin,
            profile.user_id,
            profile.strava_refresh_token
          );
          if (!accessToken) {
            results.push({ userId: profile.user_id, success: false, error: "Token refresh failed" });
            continue;
          }
        }

        // Fetch activities from start of current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const activities = await fetchStravaActivities(
          accessToken,
          Math.floor(startOfMonth.getTime() / 1000)
        );

        // Filter only Run activities
        const runs = activities.filter((a) => a.type === "Run");

        // Calculate totals
        const monthlyDistance = runs.reduce((sum, a) => sum + a.distance, 0);
        const monthlyRuns = runs.length;

        // Get all-time stats (fetch more activities)
        const allActivities = await fetchStravaActivities(accessToken);
        const allRuns = allActivities.filter((a) => a.type === "Run");
        const totalDistance = allRuns.reduce((sum, a) => sum + a.distance, 0);
        const totalRuns = allRuns.length;

        // Calculate streak
        const sortedRuns = allRuns
          .map((r) => new Date(r.start_date).toDateString())
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedRuns.length; i++) {
          const runDate = new Date(sortedRuns[i]);
          runDate.setHours(0, 0, 0, 0);

          if (i === 0) {
            const daysDiff = Math.floor((today.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff <= 1) {
              tempStreak = 1;
              currentStreak = 1;
            }
          } else {
            const prevDate = new Date(sortedRuns[i - 1]);
            prevDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((prevDate.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              tempStreak++;
              if (i < 7) currentStreak = tempStreak;
            } else {
              tempStreak = 1;
            }
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        }

        // Update profile
        await supabaseAdmin
          .from("profiles")
          .update({
            total_distance: totalDistance,
            total_runs: totalRuns,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.user_id);

        // Update monthly leaderboard
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const { data: existing } = await supabaseAdmin
          .from("monthly_leaderboard")
          .select("id")
          .eq("user_id", profile.user_id)
          .eq("year", year)
          .eq("month", month)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .from("monthly_leaderboard")
            .update({
              total_distance: monthlyDistance,
              total_runs: monthlyRuns,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin
            .from("monthly_leaderboard")
            .insert({
              user_id: profile.user_id,
              year,
              month,
              total_distance: monthlyDistance,
              total_runs: monthlyRuns,
            });
        }

        results.push({ userId: profile.user_id, success: true, activities: totalRuns });
      } catch (error) {
        results.push({
          userId: profile.user_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update ranks after syncing
    const { data: leaderboard } = await supabaseAdmin
      .from("monthly_leaderboard")
      .select("id, total_distance, rank")
      .eq("year", new Date().getFullYear())
      .eq("month", new Date().getMonth() + 1)
      .order("total_distance", { ascending: false });

    if (leaderboard) {
      for (let i = 0; i < leaderboard.length; i++) {
        const newRank = i + 1;
        const rankChange = leaderboard[i].rank ? leaderboard[i].rank! - newRank : 0;
        await supabaseAdmin
          .from("monthly_leaderboard")
          .update({ rank: newRank, rank_change: rankChange })
          .eq("id", leaderboard[i].id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
