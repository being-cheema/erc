import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/streak-calendar?year=2026 — daily run heatmap data for a year
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        const year = parseInt(req.query.year as string) || new Date().getFullYear();

        const { rows } = await pool.query(
            `SELECT DATE(start_date) as run_date,
                    COUNT(*) as run_count,
                    COALESCE(SUM(distance), 0) as total_distance,
                    COALESCE(SUM(moving_time), 0) as total_time
             FROM activities
             WHERE user_id = $1
               AND activity_type IN ('Run', 'TrailRun', 'VirtualRun')
               AND EXTRACT(YEAR FROM start_date) = $2
             GROUP BY DATE(start_date)
             ORDER BY run_date`,
            [userId, year]
        );

        // Summary stats for the year
        const { rows: summary } = await pool.query(
            `SELECT COUNT(DISTINCT DATE(start_date)) as active_days,
                    COUNT(*) as total_runs,
                    COALESCE(SUM(distance), 0) as total_distance
             FROM activities
             WHERE user_id = $1
               AND activity_type IN ('Run', 'TrailRun', 'VirtualRun')
               AND EXTRACT(YEAR FROM start_date) = $2`,
            [userId, year]
        );

        return res.json({
            year,
            days: rows,
            summary: summary[0],
        });
    } catch (err) {
        console.error('[streak-calendar] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
