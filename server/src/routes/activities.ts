import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/activities — current user's activities
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
        const after = req.query.after as string; // ISO date string for filtering

        let query = 'SELECT * FROM activities WHERE user_id = $1';
        const params: any[] = [req.user!.user_id];
        let paramIdx = 2;

        if (after) {
            query += ` AND start_date >= $${paramIdx}`;
            params.push(after);
            paramIdx++;
        }

        query += ' ORDER BY start_date DESC';

        if (limit) {
            query += ` LIMIT $${paramIdx}`;
            params.push(limit);
        }

        const { rows } = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/activities/weekly — last 8 weeks grouped by week
router.get('/weekly', requireAuth, async (req: Request, res: Response) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 56);

        const { rows } = await pool.query(
            `SELECT distance, start_date FROM activities
       WHERE user_id = $1 AND start_date >= $2
       ORDER BY start_date ASC`,
            [req.user!.user_id, startDate.toISOString()]
        );

        // Group by week
        const weeks = new Map<string, { distance: number; runs: number }>();
        rows.forEach((activity: any) => {
            const date = new Date(activity.start_date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeks.has(weekKey)) weeks.set(weekKey, { distance: 0, runs: 0 });
            const week = weeks.get(weekKey)!;
            week.distance += Number(activity.distance);
            week.runs += 1;
        });

        const weeklyData = Array.from(weeks.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)
            .map(([weekKey, stats]) => {
                const date = new Date(weekKey);
                return {
                    week: `${date.getMonth() + 1}/${date.getDate()}`,
                    distance: Math.round(stats.distance / 1000 * 10) / 10,
                    runs: stats.runs,
                };
            });

        return res.json(weeklyData);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
