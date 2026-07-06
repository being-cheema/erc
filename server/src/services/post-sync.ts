import pool from '../db.js';
import { recalculateAllChallenges } from '../routes/challenges.js';
import { scanUserPRs } from '../routes/personal-records.js';

// ── Calculate current/longest daily run streaks from activity dates ──
export function calculateStreaks(runDates: Date[]): { currentStreak: number; longestStreak: number } {
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
// NOTE: profiles.total_distance and stats.totalDistance are in METERS;
// total_distance achievement seeds are in KILOMETERS (5, 10, 50, ... 1000).
export async function checkAndUnlockAchievements(
    userId: string,
    stats: { totalDistance: number; totalRuns: number; currentStreak: number; longestStreak: number }
): Promise<string[]> {
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
                case 'total_distance':
                    // stats are meters, requirement is km
                    qualified = stats.totalDistance / 1000 >= ach.requirement_value;
                    break;
                case 'total_runs':
                case 'runs_count':
                    qualified = stats.totalRuns >= ach.requirement_value;
                    break;
                case 'current_streak':
                case 'streak_days':
                    qualified = stats.currentStreak >= ach.requirement_value;
                    break;
                case 'longest_streak':
                    qualified = stats.longestStreak >= ach.requirement_value;
                    break;
                case 'leaderboard_position':
                    // Evaluated monthly by the scheduler, not per-sync
                    break;
                default:
                    console.warn(`[achievements] Unknown requirement_type "${ach.requirement_type}" on achievement "${ach.name}" — skipping`);
                    break;
            }

            if (qualified) {
                try {
                    await pool.query(
                        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [userId, ach.id]
                    );
                    unlocked.push(ach.name);
                } catch (insertErr) {
                    console.error(`[achievements] Failed to unlock "${ach.name}" for ${userId}:`, insertErr);
                }
            }
        }

        return unlocked;
    } catch (err) {
        console.error('Achievement check error:', err);
        return [];
    }
}

export interface PostSyncResult {
    totalDistance: number;
    totalRuns: number;
    currentStreak: number;
    longestStreak: number;
    newAchievements: string[];
}

/**
 * Unified post-sync pipeline. Call after any change to a user's activities
 * (manual sync, webhook create/update/delete, scheduler sync).
 *
 * Recomputes profile totals (SQL SUM/COUNT), streaks, monthly leaderboard,
 * achievements, challenge progress, and personal records.
 */
export async function runPostSyncPipeline(userId: string): Promise<PostSyncResult> {
    // Profile totals via SQL aggregation
    const { rows: totalRows } = await pool.query(
        `SELECT COALESCE(SUM(distance), 0)::float8 AS total_distance, COUNT(*)::int AS total_runs
         FROM activities WHERE user_id = $1`,
        [userId]
    );
    const totalDistance = Number(totalRows[0].total_distance);
    const totalRuns = Number(totalRows[0].total_runs);

    // Streaks from stored activity dates
    const { rows: dateRows } = await pool.query(
        `SELECT start_date FROM activities WHERE user_id = $1 AND start_date IS NOT NULL`,
        [userId]
    );
    const { currentStreak, longestStreak } = calculateStreaks(dateRows.map(r => new Date(r.start_date)));

    await pool.query(
        `UPDATE profiles SET total_distance = $1, total_runs = $2, current_streak = $3, longest_streak = $4 WHERE user_id = $5`,
        [totalDistance, totalRuns, currentStreak, longestStreak, userId]
    );

    await pool.query('SELECT recalculate_monthly_leaderboard($1)', [userId]);

    const newAchievements = await checkAndUnlockAchievements(userId, {
        totalDistance, totalRuns, currentStreak, longestStreak,
    });

    await recalculateAllChallenges(userId);
    await scanUserPRs(userId);

    return { totalDistance, totalRuns, currentStreak, longestStreak, newAchievements };
}
