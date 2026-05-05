import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/challenges — list published challenges
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;

        const { rows: challenges } = await pool.query(
            `SELECT c.*,
                    (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) as participant_count,
                    (SELECT cp.id FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.user_id = $1) as my_participation_id,
                    (SELECT cp.current_progress FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.user_id = $1) as my_progress,
                    (SELECT cp.is_completed FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.user_id = $1) as my_completed
             FROM challenges c
             WHERE c.is_published = true
             ORDER BY c.start_date DESC`,
            [userId]
        );

        return res.json(challenges);
    } catch (err) {
        console.error('[challenges] List error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/challenges/:id — challenge detail + leaderboard
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        const { id } = req.params;

        // Challenge info
        const { rows: challengeRows } = await pool.query(
            `SELECT c.*,
                    (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) as participant_count
             FROM challenges c WHERE c.id = $1`,
            [id]
        );

        if (!challengeRows.length) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const challenge = challengeRows[0];

        // User's participation
        const { rows: myRows } = await pool.query(
            `SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2`,
            [id, userId]
        );

        // Leaderboard (top 50)
        const { rows: leaderboard } = await pool.query(
            `SELECT cp.current_progress, cp.is_completed, cp.completed_at, cp.joined_at,
                    p.display_name, p.avatar_url, p.user_id
             FROM challenge_participants cp
             JOIN profiles p ON p.user_id = cp.user_id
             WHERE cp.challenge_id = $1
             ORDER BY cp.current_progress DESC, cp.joined_at ASC
             LIMIT 50`,
            [id]
        );

        return res.json({
            ...challenge,
            my_participation: myRows[0] || null,
            leaderboard,
        });
    } catch (err) {
        console.error('[challenges] Detail error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/challenges/:id/join — join a challenge
router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        const { id } = req.params;

        // Verify challenge exists and is published
        const { rows: challengeRows } = await pool.query(
            `SELECT * FROM challenges WHERE id = $1 AND is_published = true`,
            [id]
        );

        if (!challengeRows.length) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const challenge = challengeRows[0];

        // Check if already ended
        if (challenge.end_date && new Date(challenge.end_date) < new Date()) {
            return res.status(400).json({ error: 'This challenge has already ended' });
        }

        // Insert participation (unique constraint prevents duplicates)
        await pool.query(
            `INSERT INTO challenge_participants (challenge_id, user_id)
             VALUES ($1, $2) ON CONFLICT (challenge_id, user_id) DO NOTHING`,
            [id, userId]
        );

        // Calculate initial progress
        await calculateUserChallengeProgress(userId, String(id));

        console.log(`[challenges] User ${userId} joined challenge ${id}`);
        return res.json({ success: true });
    } catch (err) {
        console.error('[challenges] Join error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/challenges/:id/leave — leave a challenge
router.delete('/:id/leave', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        const { id } = req.params;

        await pool.query(
            `DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2`,
            [id, userId]
        );

        console.log(`[challenges] User ${userId} left challenge ${id}`);
        return res.json({ success: true });
    } catch (err) {
        console.error('[challenges] Leave error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Progress calculation ───

export async function calculateUserChallengeProgress(userId: string, challengeId: string) {
    const { rows: challengeRows } = await pool.query(
        `SELECT c.*, cp.joined_at
         FROM challenges c
         JOIN challenge_participants cp ON cp.challenge_id = c.id
         WHERE c.id = $1 AND cp.user_id = $2`,
        [challengeId, userId]
    );

    if (!challengeRows.length) return;

    const challenge = challengeRows[0];
    const startDate = challenge.count_from === 'join_date'
        ? challenge.joined_at
        : challenge.start_date;
    const endDate = challenge.end_date || new Date('2099-12-31');

    let progress = 0;

    switch (challenge.challenge_type) {
        case 'distance': {
            const { rows } = await pool.query(
                `SELECT COALESCE(SUM(distance), 0) as total
                 FROM activities a
                 JOIN profiles p ON p.strava_id = a.strava_athlete_id::text
                 WHERE p.user_id = $1
                   AND a.start_date >= $2
                   AND a.start_date <= $3
                   AND a.type IN ('Run', 'TrailRun', 'VirtualRun')`,
                [userId, startDate, endDate]
            );
            progress = Number(rows[0].total);
            break;
        }
        case 'runs': {
            const { rows } = await pool.query(
                `SELECT COUNT(*) as total
                 FROM activities a
                 JOIN profiles p ON p.strava_id = a.strava_athlete_id::text
                 WHERE p.user_id = $1
                   AND a.start_date >= $2
                   AND a.start_date <= $3
                   AND a.type IN ('Run', 'TrailRun', 'VirtualRun')`,
                [userId, startDate, endDate]
            );
            progress = Number(rows[0].total);
            break;
        }
        case 'single_run': {
            const { rows } = await pool.query(
                `SELECT COALESCE(MAX(distance), 0) as max_dist
                 FROM activities a
                 JOIN profiles p ON p.strava_id = a.strava_athlete_id::text
                 WHERE p.user_id = $1
                   AND a.start_date >= $2
                   AND a.start_date <= $3
                   AND a.type IN ('Run', 'TrailRun', 'VirtualRun')`,
                [userId, startDate, endDate]
            );
            progress = Number(rows[0].max_dist);
            break;
        }
        case 'elevation': {
            const { rows } = await pool.query(
                `SELECT COALESCE(SUM(total_elevation_gain), 0) as total
                 FROM activities a
                 JOIN profiles p ON p.strava_id = a.strava_athlete_id::text
                 WHERE p.user_id = $1
                   AND a.start_date >= $2
                   AND a.start_date <= $3
                   AND a.type IN ('Run', 'TrailRun', 'VirtualRun')`,
                [userId, startDate, endDate]
            );
            progress = Number(rows[0].total);
            break;
        }
        case 'streak': {
            const { rows } = await pool.query(
                `SELECT DISTINCT DATE(a.start_date) as run_date
                 FROM activities a
                 JOIN profiles p ON p.strava_id = a.strava_athlete_id::text
                 WHERE p.user_id = $1
                   AND a.start_date >= $2
                   AND a.start_date <= $3
                   AND a.type IN ('Run', 'TrailRun', 'VirtualRun')
                 ORDER BY run_date`,
                [userId, startDate, endDate]
            );

            // Calculate longest consecutive streak
            let maxStreak = 0;
            let currentStreak = 0;
            let lastDate: Date | null = null;

            for (const row of rows) {
                const d = new Date(row.run_date);
                if (lastDate) {
                    const diff = (d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                lastDate = d;
            }
            progress = maxStreak;
            break;
        }
    }

    const isCompleted = progress >= Number(challenge.target_value);

    await pool.query(
        `UPDATE challenge_participants
         SET current_progress = $1,
             is_completed = $2,
             completed_at = CASE WHEN $2 = true AND completed_at IS NULL THEN now() ELSE completed_at END
         WHERE challenge_id = $3 AND user_id = $4`,
        [progress, isCompleted, challengeId, userId]
    );
}

// Recalculate all active challenge progress for a user (called after Strava sync)
export async function recalculateAllChallenges(userId: string) {
    try {
        const { rows } = await pool.query(
            `SELECT cp.challenge_id
             FROM challenge_participants cp
             JOIN challenges c ON c.id = cp.challenge_id
             WHERE cp.user_id = $1
               AND c.is_published = true
               AND (c.end_date IS NULL OR c.end_date >= now())`,
            [userId]
        );

        for (const row of rows) {
            await calculateUserChallengeProgress(userId, row.challenge_id);
        }
    } catch (err) {
        console.error('[challenges] Recalculate error:', err);
    }
}

export default router;
