import pool from '../db.js';
import { recordCalls, canMakeCalls, updateFromHeaders } from '../rate-limiter.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

export interface StravaTokenProfile {
    user_id: string;
    strava_access_token: string | null;
    strava_refresh_token: string | null;
    strava_token_expires_at: string | Date | null;
}

// ── Refresh an expired Strava access token and persist the new pair ──
export async function refreshStravaToken(userId: string, refreshTokenValue: string): Promise<string | null> {
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

        if (!response.ok) {
            console.error(`[strava] Token refresh failed for user ${userId}: ${response.status}`);
            return null;
        }
        const data = await response.json();

        await pool.query(
            `UPDATE profiles SET strava_access_token = $1, strava_refresh_token = $2, strava_token_expires_at = $3 WHERE user_id = $4`,
            [encryptToken(data.access_token), encryptToken(data.refresh_token), new Date(data.expires_at * 1000).toISOString(), userId]
        );

        return data.access_token;
    } catch (error) {
        console.error('[strava] Token refresh error:', error);
        return null;
    }
}

// ── Get a usable access token for a profile, refreshing if expired ──
export async function getValidAccessToken(profile: StravaTokenProfile): Promise<string | null> {
    if (!profile.strava_access_token) return null;

    const accessToken = decryptToken(profile.strava_access_token);
    if (!accessToken) return null;

    const expiresAt = new Date(profile.strava_token_expires_at || 0);
    if (expiresAt >= new Date()) return accessToken;

    if (!profile.strava_refresh_token) return null;
    return refreshStravaToken(profile.user_id, decryptToken(profile.strava_refresh_token));
}

// ── Fetch a single activity from Strava ──
export async function fetchStravaActivity(accessToken: string, activityId: number): Promise<any | null> {
    try {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        recordCalls(1);
        if (response.headers) updateFromHeaders(response.headers);

        if (!response.ok) {
            console.error(`[strava] Failed to fetch activity ${activityId}: ${response.status}`);
            return null;
        }

        return response.json();
    } catch (err) {
        console.error(`[strava] Error fetching activity ${activityId}:`, err);
        return null;
    }
}

// ── Upsert a single activity row from a Strava activity payload ──
export async function storeActivity(userId: string, run: any): Promise<void> {
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
