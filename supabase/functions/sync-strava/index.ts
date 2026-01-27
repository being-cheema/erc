import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURITY: Explicit origin allowlist to prevent CORS attacks
const ALLOWED_ORIGINS = [
  "https://id-preview--7b78d716-a91e-4441-86b0-b30684e91214.lovable.app",
  "https://7b78d716-a91e-4441-86b0-b30684e91214.lovable.app",
  // Add production domain when deployed
];

// Add development origins
if (Deno.env.get("ENVIRONMENT") === "development") {
  ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:3000");
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  type: string;
  start_date: string;
  total_elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  suffer_score?: number;
  kudos_count?: number;
  achievement_count?: number;
  description?: string;
  workout_type?: number;
  gear_id?: string;
}

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string;
  country: string;
  sex: string;
  weight: number;
  measurement_preference: string;
  follower_count: number;
  friend_count: number;
  premium: boolean;
}

async function refreshToken(
  supabaseAdmin: any,
  userId: string,
  refreshTokenValue: string
): Promise<string | null> {
  try {
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
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
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
    const errorText = await response.text();
    console.error(`Strava API error: ${response.status} - ${errorText}`);
    throw new Error(`Strava API error: ${response.status}`);
  }

  return response.json();
}

// Fetch athlete profile data
async function fetchStravaAthlete(accessToken: string): Promise<StravaAthlete | null> {
  try {
    const response = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error(`Failed to fetch athlete: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching athlete:", error);
    return null;
  }
}

// Fetch detailed activity data (includes heart rate, etc.)
async function fetchActivityDetails(
  accessToken: string,
  activityId: number
): Promise<StravaActivity | null> {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      // Don't error on individual activity failures
      return null;
    }

    return response.json();
  } catch (error) {
    return null;
  }
}

// Fetch ALL activities with pagination for full historical sync
async function fetchAllStravaActivities(
  accessToken: string
): Promise<StravaActivity[]> {
  let allActivities: StravaActivity[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const activities = await fetchStravaActivitiesPage(accessToken, page);
      
      if (activities.length === 0) {
        hasMore = false;
      } else {
        allActivities = [...allActivities, ...activities];
        console.log(`Fetched page ${page}: ${activities.length} activities (total: ${allActivities.length})`);
        page++;
        
        // Safety limit to prevent infinite loops (max ~10000 activities)
        if (page > 50) {
          console.log("Reached page limit, stopping pagination");
          break;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      // Return what we have so far instead of failing completely
      break;
    }
  }

  return allActivities;
}

// Fetch detailed data for recent activities (with rate limiting)
async function fetchRecentActivityDetails(
  accessToken: string,
  activities: StravaActivity[],
  limit: number = 30
): Promise<Map<number, StravaActivity>> {
  const detailsMap = new Map<number, StravaActivity>();
  const recentActivities = activities.slice(0, limit);

  console.log(`Fetching detailed data for ${recentActivities.length} recent activities...`);

  // Batch in groups of 10 with small delays to avoid rate limits
  for (let i = 0; i < recentActivities.length; i += 10) {
    const batch = recentActivities.slice(i, i + 10);
    const promises = batch.map((a) => fetchActivityDetails(accessToken, a.id));
    const results = await Promise.all(promises);

    results.forEach((detail, idx) => {
      if (detail) {
        detailsMap.set(batch[idx].id, detail);
      }
    });

    // Small delay between batches to respect rate limits
    if (i + 10 < recentActivities.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`Got detailed data for ${detailsMap.size} activities`);
  return detailsMap;
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
  try {
    const unlockedAchievements: string[] = [];

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseAdmin
      .from("achievements")
      .select("*");

    if (achievementsError || !achievements || achievements.length === 0) {
      console.log("No achievements found or error:", achievementsError);
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
  } catch (error) {
    console.error("Achievement check error:", error);
    return [];
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Always validate the Authorization token first
    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;
    let isAdmin = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        authenticatedUserId = data.user.id;
        
        // Check if user is admin for cross-user sync capability
        const { data: adminCheck } = await supabaseAdmin
          .rpc('has_role', { _user_id: authenticatedUserId, _role: 'admin' });
        isAdmin = adminCheck === true;
      }
    }

    // Parse request body for options
    let forceFullSync = false;
    let targetUserId: string | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        forceFullSync = body.force_full_sync === true;
        targetUserId = body.user_id || null;
      } catch {
        // No body, continue with defaults
      }
    }

    // SECURITY: Verify authorization for cross-user sync
    // Only admins can sync other users' data
    if (targetUserId && authenticatedUserId && targetUserId !== authenticatedUserId) {
      if (!isAdmin) {
        console.warn(`Unauthorized cross-user sync attempt: ${authenticatedUserId} tried to sync ${targetUserId}`);
        return new Response(
          JSON.stringify({ success: false, error: "forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Admin ${authenticatedUserId} syncing user ${targetUserId}`);
    }

    // Determine final user ID to sync
    // - If targetUserId is set (and authorized), use it
    // - Otherwise use the authenticated user's ID
    // - If neither, sync all users (admin bulk sync for scheduled jobs)
    let userId: string | null = targetUserId || authenticatedUserId;

    // If no specific user, sync all users with Strava connected
    const query = supabaseAdmin
      .from("profiles")
      .select("user_id, strava_access_token, strava_refresh_token, strava_token_expires_at, total_runs, total_distance")
      .not("strava_id", "is", null);

    if (userId) {
      query.eq("user_id", userId);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Profile fetch error:", profilesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No profiles to sync", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { 
      userId: string; 
      success: boolean; 
      activities?: number; 
      error?: string;
      newAchievements?: string[];
      needsFullSync?: boolean;
    }[] = [];

    for (const profile of profiles) {
      try {
        let accessToken = profile.strava_access_token;

        if (!accessToken) {
          results.push({ userId: profile.user_id, success: false, error: "No access token" });
          continue;
        }

        // Check if token is expired
        const expiresAt = new Date(profile.strava_token_expires_at || 0);
        if (expiresAt < new Date()) {
          if (!profile.strava_refresh_token) {
            results.push({ userId: profile.user_id, success: false, error: "No refresh token" });
            continue;
          }
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

        // Determine if we need full sync: if user has no data OR force_full_sync is true
        const needsFullSync = forceFullSync || 
          (profile.total_runs === null || profile.total_runs === 0) ||
          (profile.total_distance === null || profile.total_distance === 0);

        let allRuns: StravaActivity[];
        let monthlyRuns: StravaActivity[];
        let newActivitiesToStore: StravaActivity[] = [];

        if (needsFullSync) {
          // Full historical sync - fetch ALL activities
          console.log(`Full sync for user ${profile.user_id} - fetching all activities`);
          const allActivities = await fetchAllStravaActivities(accessToken);
          allRuns = allActivities.filter((a) => a.type === "Run");
          newActivitiesToStore = allRuns;
          
          // Filter for current month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          monthlyRuns = allRuns.filter(
            (a) => new Date(a.start_date) >= startOfMonth
          );
          
          console.log(`Found ${allRuns.length} total runs, ${monthlyRuns.length} this month`);
        } else {
          // Incremental sync - fetch activities since last stored activity
          console.log(`Incremental sync for user ${profile.user_id}`);
          
          // Get the most recent activity from database to know where to sync from
          const { data: lastActivity } = await supabaseAdmin
            .from("activities")
            .select("start_date")
            .eq("user_id", profile.user_id)
            .order("start_date", { ascending: false })
            .limit(1)
            .single();
          
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          // If we have a last activity, sync from there; otherwise sync from start of month
          let afterTimestamp: number;
          if (lastActivity?.start_date) {
            // Sync from last activity date (subtract 1 day to catch any edge cases)
            const lastDate = new Date(lastActivity.start_date);
            lastDate.setDate(lastDate.getDate() - 1);
            afterTimestamp = Math.floor(lastDate.getTime() / 1000);
            console.log(`Syncing activities after ${lastDate.toISOString()}`);
          } else {
            // No stored activities, sync from start of month
            afterTimestamp = Math.floor(startOfMonth.getTime() / 1000);
            console.log(`No stored activities, syncing from ${startOfMonth.toISOString()}`);
          }
          
          // Fetch ALL activities since the after timestamp (paginated)
          let newActivities: StravaActivity[] = [];
          let page = 1;
          let hasMore = true;
          
          while (hasMore) {
            const activities = await fetchStravaActivitiesPage(accessToken, page, afterTimestamp);
            if (activities.length === 0) {
              hasMore = false;
            } else {
              newActivities = [...newActivities, ...activities];
              page++;
              // Safety limit
              if (page > 20) break;
            }
          }
          
          const newRuns = newActivities.filter((a) => a.type === "Run");
          newActivitiesToStore = newRuns;
          console.log(`Found ${newRuns.length} new runs since last sync`);
          
          // Filter for current month stats
          monthlyRuns = newRuns.filter(
            (a) => new Date(a.start_date) >= startOfMonth
          );
          
          // For total stats, we need to get ALL stored activities + new ones
          const { data: storedActivities } = await supabaseAdmin
            .from("activities")
            .select("distance, start_date, strava_id")
            .eq("user_id", profile.user_id);
          
          // Combine stored with new (avoiding duplicates)
          const storedStravaIds = new Set(storedActivities?.map(a => a.strava_id) || []);
          const uniqueNewRuns = newRuns.filter(r => !storedStravaIds.has(r.id));
          
          // Create combined list for stats calculation
          const storedRunData = storedActivities || [];
          allRuns = [
            ...uniqueNewRuns,
            ...storedRunData.map(a => ({
              id: a.strava_id || 0,
              name: '',
              distance: Number(a.distance) || 0,
              moving_time: 0,
              elapsed_time: 0,
              type: 'Run',
              start_date: a.start_date || '',
            }))
          ];
          
          // Update monthly runs to include stored ones too
          const storedMonthlyRuns = storedRunData.filter(
            a => a.start_date && new Date(a.start_date) >= startOfMonth
          );
          monthlyRuns = [
            ...monthlyRuns,
            ...storedMonthlyRuns.map(a => ({
              id: 0,
              name: '',
              distance: Number(a.distance) || 0,
              moving_time: 0,
              elapsed_time: 0,
              type: 'Run',
              start_date: a.start_date || '',
            }))
          ];
          
          console.log(`Total runs (stored + new): ${allRuns.length}, Monthly: ${monthlyRuns.length}`);
        }

        // Fetch athlete profile data
        let athlete: StravaAthlete | null = null;
        try {
          athlete = await fetchStravaAthlete(accessToken);
          console.log(`Fetched athlete profile for user ${profile.user_id}`);
        } catch (athleteError) {
          console.error("Error fetching athlete:", athleteError);
        }

        // Fetch detailed data for activities we're storing (heart rate, elevation, etc.)
        const activityDetails = await fetchRecentActivityDetails(accessToken, newActivitiesToStore, 50);

        // Calculate totals
        const monthlyDistance = monthlyRuns.reduce((sum, a) => sum + a.distance, 0);
        const monthlyRunsCount = monthlyRuns.length;
        const totalDistance = allRuns.reduce((sum, a) => sum + a.distance, 0);
        const totalRunsCount = allRuns.length;

        // Calculate total elevation from detailed activities
        let totalElevation = 0;
        activityDetails.forEach((detail) => {
          totalElevation += detail.total_elevation_gain || 0;
        });

        // Store activities in batches for efficiency
        try {
          const weight = athlete?.weight || 70; // Default 70kg if not available
          
          // Helper to safely convert to integer
          const toInt = (val: number | undefined | null): number | null => {
            if (val === undefined || val === null) return null;
            return Math.round(val);
          };
          
          // Prepare all activities for batch upsert
          const activitiesToUpsert = newActivitiesToStore.map(run => {
            const detail = activityDetails.get(run.id);
            const avgPace = run.distance > 0 ? (run.moving_time / (run.distance / 1000)) : null;
            const estimatedCalories = detail?.calories || Math.round((run.distance / 1000) * weight * 0.9);
            
            return {
              user_id: profile.user_id,
              strava_id: run.id,
              name: run.name,
              distance: run.distance,
              moving_time: toInt(run.moving_time),
              elapsed_time: toInt(run.elapsed_time || detail?.elapsed_time),
              start_date: run.start_date,
              average_pace: avgPace,
              average_speed: detail?.average_speed || run.average_speed,
              max_speed: detail?.max_speed || run.max_speed,
              activity_type: run.type,
              calories: toInt(estimatedCalories),
              elevation_gain: detail?.total_elevation_gain || run.total_elevation_gain || 0,
              average_heartrate: toInt(detail?.average_heartrate || run.average_heartrate),
              max_heartrate: toInt(detail?.max_heartrate || run.max_heartrate),
              suffer_score: toInt(detail?.suffer_score || run.suffer_score),
              kudos_count: toInt(detail?.kudos_count || run.kudos_count || 0),
              achievement_count: toInt(detail?.achievement_count || run.achievement_count || 0),
              description: detail?.description,
              workout_type: toInt(detail?.workout_type),
              gear_id: detail?.gear_id,
            };
          });
          
          // Batch upsert in chunks of 100 to avoid payload limits
          const batchSize = 100;
          for (let i = 0; i < activitiesToUpsert.length; i += batchSize) {
            const batch = activitiesToUpsert.slice(i, i + batchSize);
            const { error: batchError } = await supabaseAdmin
              .from("activities")
              .upsert(batch, { onConflict: 'strava_id' });
            
            if (batchError) {
              console.error(`Error upserting batch ${i / batchSize + 1}:`, batchError);
            } else {
              console.log(`Upserted batch ${i / batchSize + 1}: ${batch.length} activities`);
            }
          }
          
          console.log(`Stored ${activitiesToUpsert.length} activities with detailed data for user ${profile.user_id}`);
        } catch (activityError) {
          console.error("Error storing activities:", activityError);
          // Don't fail the sync if activity storage fails
        }

        // Calculate streak from run dates
        const runDates = allRuns.map((r) => new Date(r.start_date));
        const { currentStreak, longestStreak } = calculateStreaks(runDates);

        // Update profile with athlete data
        const profileUpdate: any = {
          total_distance: totalDistance,
          total_runs: totalRunsCount,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        };

        // Add athlete data if available
        if (athlete) {
          profileUpdate.display_name = profileUpdate.display_name || `${athlete.firstname} ${athlete.lastname}`.trim();
          profileUpdate.avatar_url = profileUpdate.avatar_url || athlete.profile || athlete.profile_medium;
          profileUpdate.city = athlete.city;
          profileUpdate.country = athlete.country;
          profileUpdate.weight = athlete.weight;
          profileUpdate.sex = athlete.sex;
          profileUpdate.measurement_preference = athlete.measurement_preference;
          profileUpdate.follower_count = athlete.follower_count;
          profileUpdate.friend_count = athlete.friend_count;
          profileUpdate.premium = athlete.premium;
        }

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error("Profile update error:", updateError);
        }

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
          needsFullSync,
          newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
        });
      } catch (error) {
        // Log detailed error server-side for debugging
        console.error(`Sync error for user ${profile.user_id}:`, error);
        // Return generic error message to client to prevent information leakage
        results.push({
          userId: profile.user_id,
          success: false,
          error: "sync_failed",
        });
      }
    }

    // Update ranks after syncing
    try {
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
    } catch (rankError) {
      console.error("Rank update error:", rankError);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Sync error:", error);
    // Return generic error message to client to prevent information leakage
    return new Response(
      JSON.stringify({ success: false, error: "sync_failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
