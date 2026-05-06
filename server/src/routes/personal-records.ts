import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PR_CATEGORIES = [
    { key: '5k', minDist: 4800, maxDist: 5200 },
    { key: '10k', minDist: 9800, maxDist: 10200 },
    { key: 'half_marathon', minDist: 20900, maxDist: 21400 },
    { key: 'marathon', minDist: 42000, maxDist: 42500 },
];

// GET /api/personal-records/me — current user's PRs
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT pr.*, a.name as activity_name
             FROM personal_records pr
             LEFT JOIN activities a ON a.id = pr.activity_id
             WHERE pr.user_id = $1
             ORDER BY pr.category`,
            [req.user!.user_id]
        );
        return res.json(rows);
    } catch (err) {
        console.error('[prs] Get my PRs error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/personal-records/club — club-wide PR board (best per category)
router.get('/club', requireAuth, async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT DISTINCT ON (pr.category)
                    pr.category, pr.distance, pr.time_seconds, pr.pace, pr.achieved_at,
                    p.display_name, p.avatar_url, p.member_id
             FROM personal_records pr
             JOIN profiles p ON p.user_id = pr.user_id
             WHERE pr.time_seconds IS NOT NULL
             ORDER BY pr.category, pr.time_seconds ASC`
        );
        return res.json(rows);
    } catch (err) {
        console.error('[prs] Club PRs error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/personal-records/scan — recalculate PRs from activities
router.post('/scan', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        await scanUserPRs(userId);
        const { rows } = await pool.query(
            'SELECT * FROM personal_records WHERE user_id = $1 ORDER BY category',
            [userId]
        );
        return res.json(rows);
    } catch (err) {
        console.error('[prs] Scan error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export async function scanUserPRs(userId: string) {
    // Longest run
    const { rows: longestRows } = await pool.query(
        `SELECT id, distance, moving_time, start_date
         FROM activities
         WHERE user_id = $1 AND activity_type IN ('Run', 'TrailRun', 'VirtualRun')
         ORDER BY distance DESC LIMIT 1`,
        [userId]
    );

    if (longestRows.length) {
        const a = longestRows[0];
        await pool.query(
            `INSERT INTO personal_records (user_id, category, distance, time_seconds, pace, activity_id, achieved_at)
             VALUES ($1, 'longest_run', $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, category) DO UPDATE SET
                distance = EXCLUDED.distance, time_seconds = EXCLUDED.time_seconds,
                pace = EXCLUDED.pace, activity_id = EXCLUDED.activity_id, achieved_at = EXCLUDED.achieved_at
             WHERE EXCLUDED.distance > personal_records.distance`,
            [userId, a.distance, a.moving_time,
             a.moving_time && a.distance > 0 ? (a.moving_time / 60) / (a.distance / 1000) : null,
             a.id, a.start_date]
        );
    }

    // Standard distance PRs (fastest time for approximate distance)
    for (const cat of PR_CATEGORIES) {
        const { rows } = await pool.query(
            `SELECT id, distance, moving_time, start_date
             FROM activities
             WHERE user_id = $1
               AND activity_type IN ('Run', 'TrailRun', 'VirtualRun')
               AND distance >= $2 AND distance <= $3
               AND moving_time > 0
             ORDER BY moving_time ASC LIMIT 1`,
            [userId, cat.minDist, cat.maxDist]
        );

        if (rows.length) {
            const a = rows[0];
            await pool.query(
                `INSERT INTO personal_records (user_id, category, distance, time_seconds, pace, activity_id, achieved_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (user_id, category) DO UPDATE SET
                    distance = EXCLUDED.distance, time_seconds = EXCLUDED.time_seconds,
                    pace = EXCLUDED.pace, activity_id = EXCLUDED.activity_id, achieved_at = EXCLUDED.achieved_at
                 WHERE EXCLUDED.time_seconds < personal_records.time_seconds`,
                [userId, cat.key, a.distance, a.moving_time,
                 (a.moving_time / 60) / (a.distance / 1000),
                 a.id, a.start_date]
            );
        }
    }
}

export default router;
