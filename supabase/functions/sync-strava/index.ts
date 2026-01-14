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

async function fetchStravaActivitiesPage(
  accessToken: string,
  page: number = 1,
  after?: number
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: "200",
    page: page.toString(),
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

// Fetch ALL activities with pagination for full historical sync
async function fetchAllStravaActivities(
  accessToken: string,
  onProgress?: (count: number) => void
): Promise<StravaActivity[]> {
  let allActivities: StravaActivity[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const activities = await fetchStravaActivitiesPage(accessToken, page);
    
    if (activities.length === 0) {
      hasMore = false;
    } else {
      allActivities = [...allActivities, ...activities];
      if (onProgress) {
        onProgress(allActivities.length);
      }
      page++;
      
      // Safety limit to prevent infinite loops (max ~10000 activities)
      if (page > 50) {
        console.log("Reached page limit, stopping pagination");
        break;
      }
    }
  }

  return allActivities;
}

// Calculate streaks from run dates
function calculateStreaks(runDates: Date[]): { currentStreak: number; longestStreak: number } {
  if (runDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates and sort descending (most recent first)
  const uniqueDates = [...new Set(runDates.map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }))].sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateTime = uniqueDates[i];

    if (i === 0) {
      // Check if the most recent run was today or yesterday
      const daysDiff = Math.floor((todayTime - dateTime) / oneDayMs);
      if (daysDiff <= 1) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        tempStreak = 1;
      }
    } else {
      const prevDateTime = uniqueDates[i - 1];
      const daysDiff = Math.floor((prevDateTime - dateTime) / oneDayMs);
      
      if (daysDiff === 1) {
        tempStreak++;
        // Only count towards current streak if connected to today/yesterday
        if (i < uniqueDates.length && currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
}

// Check and unlock achievements for a user
async function checkAndUnlockAchievements(
  supabaseAdmin: any,
  userId: string,
  stats: {
    totalDistance: number;
    totalRuns: number;
    currentStreak: number;
    longestStreak: number;
  }
): Promise<string[]> {
  const unlockedAchievements: string[] = [];

  // Get all achievements
  const { data: achievements } = await supabaseAdmin
    .from("achievements")
    .select("*");

  if (!achievements || achievements.length === 0) {
    return [];
  }

  // Get user's existing achievements
  const { data: existingAchievements } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const existingIds = new Set(existingAchievements?.map((a: any) => a.achievement_id) || []);

  for (const achievement of achievements) {
    if (existingIds.has(achievement.id)) {
      continue; // Already unlocked
    }

    let qualified = false;
    const reqType = achievement.requirement_type;
    const reqValue = achievement.requirement_value;

    switch (reqType) {
      case "total_distance":
        qualified = stats.totalDistance >= reqValue;
        break;
      case "total_runs":
        qualified = stats.totalRuns >= reqValue;
        break;
      case "current_streak":
        qualified = stats.currentStreak >= reqValue;
        break;
      case "longest_streak":
        qualified = stats.longestStreak >= reqValue;
        break;
      case "single_run_distance":
        // This would need to be checked against individual runs
        break;
      default:
        break;
    }

    if (qualified) {
      const { error } = await supabaseAdmin
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

      if (!error) {
        unlockedAchievements.push(achievement.name);
      }
    }
  }

  return unlockedAchievements;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let isInitialSync = false;
    let targetUserId: string | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        isInitialSync = body.initial_sync === true;
        targetUserId = body.user_id || null;
      } catch {
        // No body, continue with defaults
      }
    }

    // Check for authorization
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = targetUserId;

    if (!userId && authHeader?.startsWith("Bearer ")) {
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

    const results: { 
      userId: string; 
      success: boolean; 
      activities?: number; 
      error?: string;
      newAchievements?: string[];
    }[] = [];

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

        let allRuns: StravaActivity[];
        let monthlyRuns: StravaActivity[];

        if (isInitialSync) {
          // Full historical sync - fetch ALL activities
          console.log(`Initial sync for user ${profile.user_id} - fetching all activities`);
          const allActivities = await fetchAllStravaActivities(accessToken);
          allRuns = allActivities.filter((a) => a.type === "Run");
          
          // Filter for current month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          monthlyRuns = allRuns.filter(
            (a) => new Date(a.start_date) >= startOfMonth
          );
          
          console.log(`Found ${allRuns.length} total runs, ${monthlyRuns.length} this month`);
        } else {
          // Regular sync - only current month activities
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const activities = await fetchStravaActivitiesPage(
            accessToken,
            1,
            Math.floor(startOfMonth.getTime() / 1000)
          );
          monthlyRuns = activities.filter((a) => a.type === "Run");

          // Get more activities for all-time stats (limited to 200 for regular sync)
          const allActivities = await fetchStravaActivitiesPage(accessToken, 1);
          allRuns = allActivities.filter((a) => a.type === "Run");
        }

        // Calculate totals
        const monthlyDistance = monthlyRuns.reduce((sum, a) => sum + a.distance, 0);
        const monthlyRunsCount = monthlyRuns.length;
        const totalDistance = allRuns.reduce((sum, a) => sum + a.distance, 0);
        const totalRunsCount = allRuns.length;

        // Calculate streak from run dates
        const runDates = allRuns.map((r) => new Date(r.start_date));
        const { currentStreak, longestStreak } = calculateStreaks(runDates);

        // Update profile
        await supabaseAdmin
          .from("profiles")
          .update({
            total_distance: totalDistance,
            total_runs: totalRunsCount,
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
              total_runs: monthlyRunsCount,
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
              total_runs: monthlyRunsCount,
            });
        }

        // Check for new achievements
        const newAchievements = await checkAndUnlockAchievements(
          supabaseAdmin,
          profile.user_id,
          {
            totalDistance,
            totalRuns: totalRunsCount,
            currentStreak,
            longestStreak,
          }
        );

        results.push({ 
          userId: profile.user_id, 
          success: true, 
          activities: totalRunsCount,
          newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
        });
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
