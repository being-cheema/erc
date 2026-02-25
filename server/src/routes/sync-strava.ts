import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { verifyToken } from '../utils/jwt.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import { recordCalls, canMakeCalls, updateFromHeaders, getUsageStats } from '../rate-limiter.js';

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

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

// ── Token Refresh ──
async function refreshToken(userId: string, refreshTokenValue: string): Promise<string | null> {
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

        if (!response.ok) {
            console.error('Failed to refresh token:', await response.text());
            return null;
        }

        const data = await response.json();

        await pool.query(
            `UPDATE profiles SET strava_access_token = $1, strava_refresh_token = $2, strava_token_expires_at = $3 WHERE user_id = $4`,
            [encryptToken(data.access_token), encryptToken(data.refresh_token), new Date(data.expires_at * 1000).toISOString(), userId]
        );

        return data.access_token;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

// ── Fetch paginated activities ──
async function fetchStravaActivitiesPage(accessToken: string, page = 1, after?: number): Promise<StravaActivity[]> {
    if (!canMakeCalls(1)) throw new Error('Strava rate limit budget exhausted');

    const params = new URLSearchParams({ per_page: '200', page: page.toString() });
    if (after) params.append('after', after.toString());

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    recordCalls(1);
    if (response.headers) updateFromHeaders(response.headers);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Strava API error: ${response.status} - ${errorText}`);
        throw new Error(`Strava API error: ${response.status}`);
    }

    return response.json();
}

// ── Fetch athlete profile ──
async function fetchStravaAthlete(accessToken: string): Promise<StravaAthlete | null> {
    if (!canMakeCalls(1)) return null;
    try {
        const response = await fetch('https://www.strava.com/api/v3/athlete', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        recordCalls(1);
        if (response.headers) updateFromHeaders(response.headers);
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

// ── Fetch detailed activity ──
async function fetchActivityDetails(accessToken: string, activityId: number): Promise<StravaActivity | null> {
    if (!canMakeCalls(1)) return null;
    try {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        recordCalls(1);
        if (response.headers) updateFromHeaders(response.headers);
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

// ── Fetch ALL activities with pagination ──
async function fetchAllStravaActivities(accessToken: string): Promise<StravaActivity[]> {
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
                if (page > 10) break; // Cap at 10 pages (2,000 activities) to protect API budget
            }
        } catch {
            break;
        }
    }

    return allActivities;
}

// ── Fetch recent activity details with rate limiting ──
async function fetchRecentActivityDetails(accessToken: string, activities: StravaActivity[], limit = 5): Promise<Map<number, StravaActivity>> {
    const detailsMap = new Map<number, StravaActivity>();
    const recentActivities = activities.slice(0, limit);

    for (let i = 0; i < recentActivities.length; i += 10) {
        const batch = recentActivities.slice(i, i + 10);
        const promises = batch.map(a => fetchActivityDetails(accessToken, a.id));
        const results = await Promise.all(promises);

        results.forEach((detail, idx) => {
            if (detail) detailsMap.set(batch[idx].id, detail);
        });

        if (i + 10 < recentActivities.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return detailsMap;
}

// ── Calculate streaks ──
function calculateStreaks(runDates: Date[]): { currentStreak: number; longestStreak: number } {
    if (runDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

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
                if (currentStreak > 0) currentStreak = tempStreak;
            } else {
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
}

// ── Check and unlock achievements ──
async function checkAndUnlockAchievements(userId: string, stats: { totalDistance: number; totalRuns: number; currentStreak: number; longestStreak: number }): Promise<string[]> {
    try {
        const { rows: achievements } = await pool.query('SELECT * FROM achievements');
        if (!achievements.length) return [];

        const { rows: existingAchievements } = await pool.query(
            'SELECT achievement_id FROM user_achievements WHERE user_id = $1', [userId]
        );
        const existingIds = new Set(existingAchievements.map(a => a.achievement_id));

        const unlocked: string[] = [];

        for (const ach of achievements) {
            if (existingIds.has(ach.id)) continue;

            let qualified = false;
            switch (ach.requirement_type) {
                case 'total_distance': qualified = stats.totalDistance >= ach.requirement_value; break;
                case 'total_runs':
                case 'runs_count': qualified = stats.totalRuns >= ach.requirement_value; break;
                case 'current_streak':
                case 'streak_days': qualified = stats.currentStreak >= ach.requirement_value; break;
                case 'longest_streak': qualified = stats.longestStreak >= ach.requirement_value; break;
            }

            if (qualified) {
                const { error } = await pool.query(
                    'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [userId, ach.id]
                ).then(r => ({ error: null })).catch(e => ({ error: e }));

                if (!error) unlocked.push(ach.name);
            }
        }

        return unlocked;
    } catch (err) {
        console.error('Achievement check error:', err);
        return [];
    }
}

// ── Main sync handler ──
router.all('/', async (req: Request, res: Response) => {
    try {
        // Check rate limit budget first
        if (!canMakeCalls(5)) {
            return res.status(429).json({
                success: false,
                error: 'Strava API rate limit reached. Try again later.',
                usage: getUsageStats(),
            });
        }

        // Authenticate
        let authenticatedUserId: string | null = null;
        let isAdmin = false;

        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const payload = verifyToken(authHeader.replace('Bearer ', ''));
                authenticatedUserId = payload.user_id;
                isAdmin = payload.role === 'admin';
            } catch { /* invalid token */ }
        }

        // Parse options
        let forceFullSync = false;
        let targetUserId: string | null = null;

        if (req.method === 'POST' && req.body) {
            forceFullSync = req.body.force_full_sync === true;
            targetUserId = req.body.user_id || null;
        }

        // Security: only admins can sync other users
        if (targetUserId && authenticatedUserId && targetUserId !== authenticatedUserId && !isAdmin) {
            return res.status(403).json({ success: false, error: 'forbidden' });
        }

        const userId = targetUserId || authenticatedUserId;

        // Fetch profiles to sync
        let query = `SELECT user_id, strava_access_token, strava_refresh_token, strava_token_expires_at, total_runs, total_distance
                 FROM profiles WHERE strava_id IS NOT NULL`;
        const params: any[] = [];
        if (userId) {
            query += ` AND user_id = $1`;
            params.push(userId);
        }

        const { rows: profiles } = await pool.query(query, params);

        if (!profiles.length) {
            return res.json({ success: true, message: 'No profiles to sync', results: [] });
        }

        const results: any[] = [];

        for (const profile of profiles) {
            try {
                let accessToken = decryptToken(profile.strava_access_token);
                if (!accessToken) {
                    results.push({ userId: profile.user_id, success: false, error: 'No access token' });
                    continue;
                }

                // Check if token is expired
                const expiresAt = new Date(profile.strava_token_expires_at || 0);
                if (expiresAt < new Date()) {
                    if (!profile.strava_refresh_token) {
                        results.push({ userId: profile.user_id, success: false, error: 'No refresh token' });
                        continue;
                    }
                    accessToken = await refreshToken(profile.user_id, decryptToken(profile.strava_refresh_token));
                    if (!accessToken) {
                        results.push({ userId: profile.user_id, success: false, error: 'Token refresh failed' });
                        continue;
                    }
                }

                // Determine sync mode
                const needsFullSync = forceFullSync || !profile.total_runs || !profile.total_distance;

                let allRuns: StravaActivity[];
                let monthlyRuns: StravaActivity[];
                let newActivitiesToStore: StravaActivity[] = [];

                if (needsFullSync) {
                    const allActivities = await fetchAllStravaActivities(accessToken);
                    allRuns = allActivities.filter(a => a.type === 'Run');
                    newActivitiesToStore = allRuns;

                    const startOfMonth = new Date();
                    startOfMonth.setDate(1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    monthlyRuns = allRuns.filter(a => new Date(a.start_date) >= startOfMonth);
                } else {
                    // Incremental sync
                    const lastActivityResult = await pool.query(
                        `SELECT start_date FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1`,
                        [profile.user_id]
                    );

                    const startOfMonth = new Date();
                    startOfMonth.setDate(1);
                    startOfMonth.setHours(0, 0, 0, 0);

                    let afterTimestamp: number;
                    if (lastActivityResult.rows[0]?.start_date) {
                        const lastDate = new Date(lastActivityResult.rows[0].start_date);
                        lastDate.setDate(lastDate.getDate() - 1);
                        afterTimestamp = Math.floor(lastDate.getTime() / 1000);
                    } else {
                        afterTimestamp = Math.floor(startOfMonth.getTime() / 1000);
                    }

                    let newActivities: StravaActivity[] = [];
                    let page = 1;
                    let hasMore = true;
                    while (hasMore) {
                        const activities = await fetchStravaActivitiesPage(accessToken, page, afterTimestamp);
                        if (activities.length === 0) { hasMore = false; }
                        else { newActivities = [...newActivities, ...activities]; page++; if (page > 5) break; }
                    }

                    const newRuns = newActivities.filter(a => a.type === 'Run');
                    newActivitiesToStore = newRuns;
                    monthlyRuns = newRuns.filter(a => new Date(a.start_date) >= startOfMonth);

                    const { rows: storedActivities } = await pool.query(
                        `SELECT distance, start_date, strava_id FROM activities WHERE user_id = $1`,
                        [profile.user_id]
                    );

                    const storedStravaIds = new Set(storedActivities.map(a => a.strava_id));
                    const uniqueNewRuns = newRuns.filter(r => !storedStravaIds.has(r.id));

                    allRuns = [
                        ...uniqueNewRuns,
                        ...storedActivities.map(a => ({
                            id: a.strava_id || 0, name: '', distance: Number(a.distance) || 0,
                            moving_time: 0, elapsed_time: 0, type: 'Run', start_date: a.start_date || '',
                        })),
                    ];
                }

                // Fetch athlete profile
                const athlete = await fetchStravaAthlete(accessToken);

                // Fetch detailed data for only 5 most recent activities (saves API budget)
                const activityDetails = await fetchRecentActivityDetails(accessToken, newActivitiesToStore, 5);

                // Calculate totals
                const totalDistance = allRuns.reduce((sum, a) => sum + a.distance, 0);
                const totalRunsCount = allRuns.length;

                // Store activities in batches
                try {
                    const weight = athlete?.weight || 70;
                    const toInt = (val: number | undefined | null): number | null => {
                        if (val === undefined || val === null) return null;
                        return Math.round(val);
                    };

                    const batchSize = 100;
                    for (let i = 0; i < newActivitiesToStore.length; i += batchSize) {
                        const batch = newActivitiesToStore.slice(i, i + batchSize);

                        for (const run of batch) {
                            const detail = activityDetails.get(run.id);
                            const avgPace = run.distance > 0 ? (run.moving_time / (run.distance / 1000)) : null;
                            const estimatedCalories = detail?.calories || Math.round((run.distance / 1000) * weight * 0.9);

                            await pool.query(
                                `INSERT INTO activities (user_id, strava_id, name, distance, moving_time, elapsed_time, start_date, average_pace, average_speed, max_speed, activity_type, calories, elevation_gain, average_heartrate, max_heartrate, suffer_score, kudos_count, achievement_count, description, workout_type, gear_id)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
                ON CONFLICT (strava_id) DO UPDATE SET
                  name=$3, distance=$4, moving_time=$5, elapsed_time=$6, start_date=$7, average_pace=$8, average_speed=$9, max_speed=$10, calories=$12, elevation_gain=$13, average_heartrate=$14, max_heartrate=$15, suffer_score=$16, kudos_count=$17, achievement_count=$18, description=$19, workout_type=$20, gear_id=$21`,
                                [
                                    profile.user_id, run.id, run.name, run.distance, toInt(run.moving_time),
                                    toInt(run.elapsed_time || detail?.elapsed_time), run.start_date, avgPace,
                                    detail?.average_speed || run.average_speed, detail?.max_speed || run.max_speed,
                                    run.type, toInt(estimatedCalories), detail?.total_elevation_gain || run.total_elevation_gain || 0,
                                    toInt(detail?.average_heartrate || run.average_heartrate),
                                    toInt(detail?.max_heartrate || run.max_heartrate),
                                    toInt(detail?.suffer_score || run.suffer_score),
                                    toInt(detail?.kudos_count || run.kudos_count || 0),
                                    toInt(detail?.achievement_count || run.achievement_count || 0),
                                    detail?.description, toInt(detail?.workout_type), detail?.gear_id,
                                ]
                            );
                        }
                    }
                } catch (err) {
                    console.error('Error storing activities:', err);
                }

                // Calculate streaks
                const runDates = allRuns.map(r => new Date(r.start_date));
                const { currentStreak, longestStreak } = calculateStreaks(runDates);

                // Recalculate monthly leaderboard
                await pool.query('SELECT recalculate_monthly_leaderboard($1)', [profile.user_id]);

                // Update profile
                const currentProfile = await pool.query(
                    'SELECT display_name, avatar_url FROM profiles WHERE user_id = $1', [profile.user_id]
                );

                const profileUpdate: any = {
                    total_distance: totalDistance,
                    total_runs: totalRunsCount,
                    current_streak: currentStreak,
                    longest_streak: longestStreak,
                    last_synced_at: new Date().toISOString(),
                };

                let updateQuery = `UPDATE profiles SET total_distance=$1, total_runs=$2, current_streak=$3, longest_streak=$4, last_synced_at=$5`;
                let updateParams: any[] = [totalDistance, totalRunsCount, currentStreak, longestStreak, new Date().toISOString()];
                let paramIdx = 6;

                if (athlete) {
                    updateQuery += `, display_name=$${paramIdx}, avatar_url=$${paramIdx + 1}, city=$${paramIdx + 2}, country=$${paramIdx + 3}, weight=$${paramIdx + 4}, sex=$${paramIdx + 5}, measurement_preference=$${paramIdx + 6}, follower_count=$${paramIdx + 7}, friend_count=$${paramIdx + 8}, premium=$${paramIdx + 9}`;
                    updateParams.push(
                        currentProfile.rows[0]?.display_name || `${athlete.firstname} ${athlete.lastname}`.trim(),
                        currentProfile.rows[0]?.avatar_url || athlete.profile || athlete.profile_medium,
                        athlete.city, athlete.country, athlete.weight, athlete.sex,
                        athlete.measurement_preference, athlete.follower_count, athlete.friend_count, athlete.premium,
                    );
                    paramIdx += 10;
                }

                updateQuery += ` WHERE user_id=$${paramIdx}`;
                updateParams.push(profile.user_id);

                await pool.query(updateQuery, updateParams);

                // Check achievements
                const newAchievements = await checkAndUnlockAchievements(profile.user_id, {
                    totalDistance, totalRuns: totalRunsCount, currentStreak, longestStreak,
                });

                results.push({
                    userId: profile.user_id,
                    success: true,
                    activities: totalRunsCount,
                    needsFullSync,
                    newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
                });
            } catch (error: any) {
                console.error(`Sync error for user ${profile.user_id}:`, error);
                results.push({ userId: profile.user_id, success: false, error: error.message });
            }
        }

        return res.json({ success: true, results });
    } catch (error) {
        console.error('Sync error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
