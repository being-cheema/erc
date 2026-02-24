import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/leaderboard — monthly or all-time leaderboard
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const period = req.query.period as string || 'monthly';
        const now = new Date();

        if (period === 'alltime') {
            // All-time: use profiles_public sorted by total_distance
            const { rows } = await pool.query(
                `SELECT pp.*, ROW_NUMBER() OVER (ORDER BY pp.total_distance DESC) as rank
         FROM profiles_public pp
         WHERE pp.total_distance > 0
         ORDER BY pp.total_distance DESC`
            );
            return res.json(rows);
        }

        // Monthly leaderboard with profile info
        const { rows } = await pool.query(
            `SELECT ml.*, pp.display_name, pp.avatar_url, pp.city
       FROM monthly_leaderboard ml
       JOIN profiles_public pp ON pp.user_id = ml.user_id
       WHERE ml.year = $1 AND ml.month = $2
       ORDER BY ml.total_distance DESC`,
            [now.getFullYear(), now.getMonth() + 1]
        );

        // Add rank based on order
        const ranked = rows.map((row: any, idx: number) => ({
            ...row,
            rank: idx + 1,
        }));

        return res.json(ranked);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leaderboard/me — current user's rank
router.get('/me', optionalAuth, async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.json(null);

        const now = new Date();
        const { rows } = await pool.query(
            `SELECT ml.*, 
                    (SELECT COUNT(*) + 1 FROM monthly_leaderboard ml2 
                     WHERE ml2.year = ml.year AND ml2.month = ml.month 
                     AND ml2.total_distance > ml.total_distance) AS rank
             FROM monthly_leaderboard ml
             WHERE ml.user_id = $1 AND ml.year = $2 AND ml.month = $3`,
            [req.user.user_id, now.getFullYear(), now.getMonth() + 1]
        );

        return res.json(rows[0] || null);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
