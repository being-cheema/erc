import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { recordCalls, canMakeCalls, updateFromHeaders } from '../rate-limiter.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'eroderunners_webhook_2025';

// ─── GET /webhook — Subscription validation (one-time setup) ───
// Strava sends this to verify your callback URL when creating a subscription.
router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[webhook] Subscription validated');
        return res.json({ 'hub.challenge': challenge });
    }

    return res.sendStatus(403);
});

// ─── POST /webhook — Receive events from Strava ───
// Must respond 200 within 2 seconds. Heavy work is done async.
router.post('/', (req: Request, res: Response) => {
    const event = req.body;

    // Respond immediately — Strava requires 200 within 2 seconds
    res.status(200).send('EVENT_RECEIVED');

    // Process asynchronously
    processWebhookEvent(event).catch(err => {
        console.error('[webhook] Async processing error:', err);
    });
});

// ─── Async event processor ───
async function processWebhookEvent(event: {
    object_type: string;
    aspect_type: string;
    object_id: number;
    owner_id: number;
    subscription_id: number;
    updates: Record<string, any>;
}) {
    const { object_type, aspect_type, object_id, owner_id } = event;

    console.log(`[webhook] Event: ${object_type}.${aspect_type} id=${object_id} owner=${owner_id}`);

    // Look up user by Strava athlete ID (owner_id)
    const { rows: profiles } = await pool.query(
        `SELECT user_id, strava_access_token, strava_refresh_token, strava_token_expires_at
         FROM profiles WHERE strava_id = $1`,
        [String(owner_id)]
    );

    if (profiles.length === 0) {
        console.log(`[webhook] No user found for strava_id ${owner_id}, ignoring`);
        return;
    }

    const profile = profiles[0];

    // ── Athlete deauthorized ──
    if (object_type === 'athlete' && aspect_type === 'update') {
        if (event.updates?.authorized === 'false') {
            console.log(`[webhook] Athlete ${owner_id} revoked access, cleaning up`);
            await pool.query(
                `UPDATE profiles SET strava_access_token = NULL, strava_refresh_token = NULL WHERE user_id = $1`,
                [profile.user_id]
            );
        }
        return;
    }

    // Only process activity events from here
    if (object_type !== 'activity') return;

    // ── Activity deleted ──
    if (aspect_type === 'delete') {
        console.log(`[webhook] Deleting activity ${object_id}`);
        await pool.query(`DELETE FROM activities WHERE strava_id = $1`, [object_id]);
        await recalculateUserStats(profile.user_id);
        return;
    }

    // ── Activity created or updated — fetch it from Strava ──
    if (aspect_type === 'create' || aspect_type === 'update') {
        let accessToken = decryptToken(profile.strava_access_token);
        if (!accessToken) return;

        // Refresh token if expired
        const expiresAt = new Date(profile.strava_token_expires_at || 0);
        if (expiresAt < new Date()) {
            if (!profile.strava_refresh_token) return;
            accessToken = await refreshToken(profile.user_id, decryptToken(profile.strava_refresh_token));
            if (!accessToken) {
                console.error(`[webhook] Token refresh failed for user ${profile.user_id}`);
                return;
            }
        }

        // Fetch the specific activity
        if (!canMakeCalls(1)) {
            console.log(`[webhook] Rate limit would be exceeded, skipping activity ${object_id}`);
            return;
        }

        const activity = await fetchActivity(accessToken, object_id);
        if (!activity) return;

        // Only store runs
        if (activity.type !== 'Run') {
            console.log(`[webhook] Activity ${object_id} is ${activity.type}, not a Run — skipping`);
            return;
        }

        // Store/update the activity
        await storeActivity(profile.user_id, activity);
        await recalculateUserStats(profile.user_id);

        console.log(`[webhook] ${aspect_type === 'create' ? 'Stored' : 'Updated'} activity "${activity.name}" for user ${profile.user_id.slice(0, 8)}...`);
    }
}

// ─── Helper: Refresh expired token ───
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

        recordCalls(1);

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

// ─── Helper: Fetch a single activity from Strava ───
async function fetchActivity(accessToken: string, activityId: number): Promise<any | null> {
    try {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        recordCalls(1);
        if (response.headers) updateFromHeaders(response.headers);

        if (!response.ok) {
            console.error(`[webhook] Failed to fetch activity ${activityId}: ${response.status}`);
            return null;
        }

        return response.json();
    } catch (err) {
        console.error(`[webhook] Error fetching activity ${activityId}:`, err);
        return null;
    }
}

// ─── Helper: Store/upsert a single activity ───
async function storeActivity(userId: string, run: any) {
    const avgPace = run.distance > 0 ? (run.moving_time / (run.distance / 1000)) : null;
    const weight = 70;
    const estimatedCalories = run.calories || Math.round((run.distance / 1000) * weight * 0.9);

    await pool.query(
        `INSERT INTO activities (user_id, strava_id, name, distance, moving_time, elapsed_time, start_date, average_pace, average_speed, max_speed, activity_type, calories, elevation_gain, average_heartrate, max_heartrate, kudos_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (strava_id) DO UPDATE SET
           name=$3, distance=$4, moving_time=$5, elapsed_time=$6, start_date=$7, average_pace=$8, average_speed=$9, max_speed=$10, calories=$12, elevation_gain=$13, average_heartrate=$14, max_heartrate=$15, kudos_count=$16`,
        [
            userId, run.id, run.name, run.distance,
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

// ─── Helper: Recalculate user's total stats + leaderboard ───
async function recalculateUserStats(userId: string) {
    const { rows: allActivities } = await pool.query(
        `SELECT distance FROM activities WHERE user_id = $1`, [userId]
    );

    const totalDistance = allActivities.reduce((sum: number, a: any) => sum + Number(a.distance || 0), 0);
    const totalRuns = allActivities.length;

    await pool.query(
        `UPDATE profiles SET total_distance=$1, total_runs=$2, last_synced_at=$3, last_webhook_at=$3 WHERE user_id=$4`,
        [totalDistance, totalRuns, new Date().toISOString(), userId]
    );

    await pool.query('SELECT recalculate_monthly_leaderboard($1)', [userId]);
}

export default router;
