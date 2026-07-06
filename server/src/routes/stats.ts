import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/stats/month-comparison — current vs previous month stats
router.get('/month-comparison', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;

        const { rows } = await pool.query(
            `WITH bounds AS (
                SELECT
                    date_trunc('month', now()) AS cur_start,
                    date_trunc('month', now()) - interval '1 month' AS prev_start
            ),
            cur AS (
                SELECT
                    COALESCE(SUM(distance), 0)::float8 AS distance,
                    COUNT(*)::int AS runs,
                    AVG(average_pace)::float8 AS avg_pace
                FROM activities, bounds
                WHERE user_id = $1
                  AND start_date >= bounds.cur_start
                  AND start_date < bounds.cur_start + interval '1 month'
            ),
            prev AS (
                SELECT
                    COALESCE(SUM(distance), 0)::float8 AS distance,
                    COUNT(*)::int AS runs,
                    AVG(average_pace)::float8 AS avg_pace
                FROM activities, bounds
                WHERE user_id = $1
                  AND start_date >= bounds.prev_start
                  AND start_date < bounds.cur_start
            )
            SELECT
                (SELECT row_to_json(cur) FROM cur) AS current,
                (SELECT row_to_json(prev) FROM prev) AS previous`,
            [userId]
        );

        const row = rows[0];
        return res.json({
            current: row.current ?? { distance: 0, runs: 0, avg_pace: null },
            previous: row.previous ?? { distance: 0, runs: 0, avg_pace: null },
        });
    } catch (err) {
        console.error('[stats] Month comparison error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
