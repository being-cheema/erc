import pool from './db.js';
import { recordCalls, canMakeCalls, getUserSyncBudget, getUsageStats, updateFromHeaders } from './rate-limiter.js';
import { encryptToken, decryptToken } from './utils/crypto.js';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

// Safety net sync: once per day to catch any missed webhook events.
// Primary sync is now done via webhooks (see routes/webhook.ts).
const BATCH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CALLS_PER_USER = 3; // token refresh + 1-2 activity pages

async function refreshToken(userId: string, refreshTokenValue: string): Promise<string | null> {
    if (!canMakeCalls(1)) return null;

    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: refreshTokenValue,
                grant_type: 'refresh_token',
            }),
        });

        recordCalls(1); // token endpoint counts against write limit, not read, but track anyway

        if (!response.ok) return null;
        const data = await response.json();

        await pool.query(
            `UPDATE profiles SET strava_access_token = $1, strava_refresh_token = $2, strava_token_expires_at = $3 WHERE user_id = $4`,
            [encryptToken(data.access_token), encryptToken(data.refresh_token), new Date(data.expires_at * 1000).toISOString(), userId]
        );

        return data.access_token;
    } catch {
        return null;
    }
}

async function fetchActivitiesPage(accessToken: string, page: number, after?: number) {
    if (!canMakeCalls(1)) throw new Error('Rate limit would be exceeded');

    const params = new URLSearchParams({ per_page: '200', page: page.toString() });
    if (after) params.append('after', after.toString());

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    recordCalls(1);

    // Update our tracker from actual Strava headers
    if (response.headers) {
        updateFromHeaders(response.headers);
    }

    if (!response.ok) throw new Error(`Strava API error: ${response.status}`);
    return response.json();
}

async function syncUser(profile: any): Promise<{ userId: string; success: boolean; newActivities?: number; error?: string }> {
    try {
        if (!canMakeCalls(CALLS_PER_USER)) {
            return { userId: profile.user_id, success: false, error: 'Rate limit budget exhausted' };
        }

        let accessToken = decryptToken(profile.strava_access_token);
        if (!accessToken) return { userId: profile.user_id, success: false, error: 'No access token' };

        // Refresh expired token
        const expiresAt = new Date(profile.strava_token_expires_at || 0);
        if (expiresAt < new Date()) {
            if (!profile.strava_refresh_token) return { userId: profile.user_id, success: false, error: 'No refresh token' };
            accessToken = await refreshToken(profile.user_id, decryptToken(profile.strava_refresh_token));
            if (!accessToken) return { userId: profile.user_id, success: false, error: 'Token refresh failed' };
        }

        // Incremental sync: only since the last activity we have
        const lastActivityResult = await pool.query(
            `SELECT start_date FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1`,
            [profile.user_id]
        );

        let afterTimestamp: number;
        if (lastActivityResult.rows[0]?.start_date) {
            const lastDate = new Date(lastActivityResult.rows[0].start_date);
            lastDate.setDate(lastDate.getDate() - 1);
            afterTimestamp = Math.floor(lastDate.getTime() / 1000);
        } else {
            afterTimestamp = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        }

        // Fetch ONLY 1 page of recent activities (max 200) — no pagination to save calls
        let newActivities: any[];
        try {
            newActivities = await fetchActivitiesPage(accessToken, 1, afterTimestamp);
        } catch (err: any) {
            if (err.message.includes('Rate limit')) return { userId: profile.user_id, success: false, error: 'Rate limit' };
            throw err;
        }

        const newRuns = newActivities.filter((a: any) => a.type === 'Run');
        if (newRuns.length === 0) {
            return { userId: profile.user_id, success: true, newActivities: 0 };
        }

        // Store activities — use list data only, NO detailed fetches
        const weight = 70;
        for (const run of newRuns) {
            const avgPace = run.distance > 0 ? (run.moving_time / (run.distance / 1000)) : null;
            const estimatedCalories = run.calories || Math.round((run.distance / 1000) * weight * 0.9);

            await pool.query(
                `INSERT INTO activities (user_id, strava_id, name, distance, moving_time, elapsed_time, start_date, average_pace, average_speed, max_speed, activity_type, calories, elevation_gain, average_heartrate, max_heartrate, kudos_count)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                 ON CONFLICT (strava_id) DO UPDATE SET
                   name=$3, distance=$4, moving_time=$5, elapsed_time=$6, start_date=$7, average_pace=$8, average_speed=$9, max_speed=$10, calories=$12, elevation_gain=$13, average_heartrate=$14, max_heartrate=$15, kudos_count=$16`,
                [
                    profile.user_id, run.id, run.name, run.distance,
                    Math.round(run.moving_time), Math.round(run.elapsed_time || 0),
                    run.start_date, avgPace,
                    run.average_speed, run.max_speed, run.type,
                    Math.round(estimatedCalories), run.total_elevation_gain || 0,
                    run.average_heartrate ? Math.round(run.average_heartrate) : null,
                    run.max_heartrate ? Math.round(run.max_heartrate) : null,
                    run.kudos_count || 0,
                ]
            );
        }

        // Recalculate stats
        const { rows: allActivities } = await pool.query(
            `SELECT distance FROM activities WHERE user_id = $1`, [profile.user_id]
        );

        const totalDistance = allActivities.reduce((sum: number, a: any) => sum + Number(a.distance || 0), 0);
        const totalRuns = allActivities.length;

        await pool.query(
            `UPDATE profiles SET total_distance=$1, total_runs=$2, last_synced_at=$3 WHERE user_id=$4`,
            [totalDistance, totalRuns, new Date().toISOString(), profile.user_id]
        );

        await pool.query('SELECT recalculate_monthly_leaderboard($1)', [profile.user_id]);

        return { userId: profile.user_id, success: true, newActivities: newRuns.length };
    } catch (error: any) {
        return { userId: profile.user_id, success: false, error: error.message };
    }
}

/**
 * Run a single batch of syncs.
 * Picks the users who were synced LEAST RECENTLY,
 * limited by the current rate limit budget.
 */
export async function runScheduledSync() {
    const budget = getUserSyncBudget(CALLS_PER_USER);
    if (budget <= 0) {
        console.log(`⏰ [${new Date().toISOString()}] Skipping sync — rate limit budget exhausted (${getUsageStats()})`);
        return;
    }

    try {
        // Pick users who haven't been synced recently, limited by budget
        const { rows: profiles } = await pool.query(
            `SELECT user_id, strava_access_token, strava_refresh_token, strava_token_expires_at, total_runs, total_distance
             FROM profiles
             WHERE strava_id IS NOT NULL
               AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '24 hours')
               AND (last_webhook_at IS NULL OR last_webhook_at < NOW() - INTERVAL '48 hours')
             ORDER BY last_synced_at ASC NULLS FIRST
             LIMIT $1`,
            [Math.min(budget, 999)]
        );

        if (profiles.length === 0) {
            return;
        }

        console.log(`⏰ [${new Date().toISOString()}] Syncing batch of ${profiles.length} users (${getUsageStats()})`);

        let successCount = 0;
        let failCount = 0;
        let newActivityCount = 0;

        for (const profile of profiles) {
            // Check budget before each user
            if (!canMakeCalls(CALLS_PER_USER)) {
                console.log(`  ⚠️  Rate limit reached mid-batch, stopping. (${getUsageStats()})`);
                break;
            }

            const result = await syncUser(profile);
            if (result.success) {
                successCount++;
                newActivityCount += result.newActivities || 0;
            } else {
                failCount++;
                if (result.error !== 'Rate limit') {
                    console.log(`  ❌ ${result.userId.slice(0, 8)}...: ${result.error}`);
                }
            }

            // 1.5s delay between users — respects 300/15min ≈ 20/min ≈ 1 every 3s
            // With 2-3 calls per user, 1.5s keeps us well under
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log(`⏰ Batch done: ${successCount} ok, ${failCount} fail, ${newActivityCount} new activities (${getUsageStats()})`);
    } catch (error) {
        console.error('⏰ Scheduled sync error:', error);
    }
}

export function startScheduledSync() {
    const batchesPerDay = (24 * 60 * 60 * 1000) / BATCH_INTERVAL_MS;
    console.log(`⏰ Safety net sync: every ${BATCH_INTERVAL_MS / (60 * 60 * 1000)}h (primary sync via webhooks)`);
    console.log(`⏰ Budget: 2,800 reads/day usable, ~${CALLS_PER_USER} calls/user`);

    // First sync 30 seconds after startup
    setTimeout(() => runScheduledSync(), 30_000);

    // Then every 30 minutes
    setInterval(() => runScheduledSync(), BATCH_INTERVAL_MS);
}
