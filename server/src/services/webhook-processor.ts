import pool from '../db.js';
import { recordCalls, canMakeCalls, updateFromHeaders } from '../rate-limiter.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import { runPostSyncPipeline } from './post-sync.js';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

export interface WebhookEvent {
    object_type: string;
    aspect_type: string;
    object_id: number;
    owner_id: number;
    subscription_id?: number;
    updates?: Record<string, unknown>;
}

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

async function fetchActivity(accessToken: string, activityId: number): Promise<Record<string, unknown> | null> {
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

async function storeActivity(userId: string, run: Record<string, unknown>) {
    const distance = Number(run.distance || 0);
    const movingTime = Number(run.moving_time || 0);
    const avgPace = distance > 0 ? (movingTime / (distance / 1000)) : null;
    const weight = 70;
    const estimatedCalories = Number(run.calories) || Math.round((distance / 1000) * weight * 0.9);

    await pool.query(
        `INSERT INTO activities (user_id, strava_id, name, distance, moving_time, elapsed_time, start_date, average_pace, average_speed, max_speed, activity_type, calories, elevation_gain, average_heartrate, max_heartrate, kudos_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (strava_id) DO UPDATE SET
           name=$3, distance=$4, moving_time=$5, elapsed_time=$6, start_date=$7, average_pace=$8, average_speed=$9, max_speed=$10, calories=$12, elevation_gain=$13, average_heartrate=$14, max_heartrate=$15, kudos_count=$16`,
        [
            userId, run.id, run.name, distance,
            Math.round(movingTime), Math.round(Number(run.elapsed_time || 0)),
            run.start_date, avgPace,
            run.average_speed, run.max_speed, run.type,
            Math.round(estimatedCalories), run.total_elevation_gain || 0,
            run.average_heartrate ? Math.round(Number(run.average_heartrate)) : null,
            run.max_heartrate ? Math.round(Number(run.max_heartrate)) : null,
            run.kudos_count || 0,
        ]
    );
}

export async function queueWebhookBacklog(ownerId: number, objectId: number, aspectType: string): Promise<void> {
    await pool.query(
        `INSERT INTO webhook_backlog (owner_id, object_id, aspect_type) VALUES ($1, $2, $3)`,
        [ownerId, objectId, aspectType]
    );
    console.log(`[webhook] Queued backlog event owner=${ownerId} object=${objectId} aspect=${aspectType}`);
}

/**
 * Process a Strava webhook event. Returns false if rate-limited (caller should queue).
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<boolean> {
    const { object_type, aspect_type, object_id, owner_id } = event;

    console.log(`[webhook] Event: ${String(object_type).replace(/[\n\r\t]/g, '')}.${String(aspect_type).replace(/[\n\r\t]/g, '')} id=${Number(object_id)} owner=${Number(owner_id)}`);

    const { rows: profiles } = await pool.query(
        `SELECT user_id, strava_access_token, strava_refresh_token, strava_token_expires_at
         FROM profiles WHERE strava_id = $1`,
        [String(owner_id)]
    );

    if (profiles.length === 0) {
        console.log(`[webhook] No user found for strava_id ${owner_id}, ignoring`);
        return true;
    }

    const profile = profiles[0];

    if (object_type === 'athlete' && aspect_type === 'update') {
        if (event.updates?.authorized === 'false') {
            console.log(`[webhook] Athlete ${owner_id} revoked access, cleaning up`);
            await pool.query(
                `UPDATE profiles SET strava_access_token = NULL, strava_refresh_token = NULL WHERE user_id = $1`,
                [profile.user_id]
            );
        }
        return true;
    }

    if (object_type !== 'activity') return true;

    if (aspect_type === 'delete') {
        console.log(`[webhook] Deleting activity ${object_id}`);
        await pool.query(
            `DELETE FROM activities WHERE strava_id = $1 AND user_id = $2`,
            [object_id, profile.user_id]
        );
        await pool.query(
            `UPDATE profiles SET last_webhook_at = $1 WHERE user_id = $2`,
            [new Date().toISOString(), profile.user_id]
        );
        await runPostSyncPipeline(profile.user_id);
        return true;
    }

    if (aspect_type === 'create' || aspect_type === 'update') {
        let accessToken: string | null = decryptToken(profile.strava_access_token);
        if (!accessToken) return true;

        const expiresAt = new Date(profile.strava_token_expires_at || 0);
        if (expiresAt < new Date()) {
            if (!profile.strava_refresh_token) return true;
            accessToken = await refreshToken(profile.user_id, decryptToken(profile.strava_refresh_token));
            if (!accessToken) {
                console.error(`[webhook] Token refresh failed for user ${profile.user_id}`);
                return true;
            }
        }

        if (!canMakeCalls(1)) {
            return false;
        }

        const activity = await fetchActivity(accessToken, object_id);
        if (!activity) return true;

        if (activity.type !== 'Run') {
            console.log(`[webhook] Activity ${object_id} is ${String(activity.type)}, not a Run — skipping`);
            return true;
        }

        await storeActivity(profile.user_id, activity);
        await pool.query(
            `UPDATE profiles SET last_webhook_at = $1 WHERE user_id = $2`,
            [new Date().toISOString(), profile.user_id]
        );
        await runPostSyncPipeline(profile.user_id);

        console.log(`[webhook] ${aspect_type === 'create' ? 'Stored' : 'Updated'} activity "${activity.name}" for user ${String(profile.user_id).slice(0, 8)}...`);
    }

    return true;
}

export async function drainWebhookBacklog(): Promise<number> {
    const { rows: backlog } = await pool.query(
        `SELECT id, owner_id, object_id, aspect_type
         FROM webhook_backlog
         WHERE processed_at IS NULL
         ORDER BY created_at ASC`
    );

    if (backlog.length === 0) return 0;

    let processed = 0;

    for (const row of backlog) {
        if (!canMakeCalls(1)) {
            console.log(`[webhook] Backlog drain paused — rate limit budget exhausted`);
            break;
        }

        const ok = await processWebhookEvent({
            object_type: 'activity',
            aspect_type: row.aspect_type,
            object_id: Number(row.object_id),
            owner_id: Number(row.owner_id),
        });

        if (!ok) break;

        await pool.query(
            `UPDATE webhook_backlog SET processed_at = now() WHERE id = $1`,
            [row.id]
        );
        processed++;
    }

    if (processed > 0) {
        console.log(`[webhook] Drained ${processed} backlog event(s)`);
    }

    return processed;
}

export async function evaluateMonthlyLeaderboardAchievements(): Promise<void> {
    const now = new Date();
    if (now.getDate() !== 1) return;

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    const { rows: leaderboard } = await pool.query(
        `SELECT user_id, total_distance
         FROM monthly_leaderboard
         WHERE year = $1 AND month = $2 AND total_distance > 0
         ORDER BY total_distance DESC`,
        [year, month]
    );

    if (leaderboard.length === 0) {
        console.log(`[achievements] No leaderboard entries for ${year}-${month}, skipping monthly evaluation`);
        return;
    }

    const { rows: achievements } = await pool.query(
        `SELECT id, requirement_value FROM achievements WHERE requirement_type = 'leaderboard_position'`
    );

    let unlockCount = 0;

    for (let i = 0; i < leaderboard.length; i++) {
        const rank = i + 1;
        const userId = leaderboard[i].user_id;

        for (const ach of achievements) {
            if (rank <= Number(ach.requirement_value)) {
                const result = await pool.query(
                    `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [userId, ach.id]
                );
                if (result.rowCount && result.rowCount > 0) unlockCount++;
            }
        }
    }

    console.log(`[achievements] Monthly leaderboard evaluation for ${year}-${month}: ${unlockCount} new unlock(s)`);
}
