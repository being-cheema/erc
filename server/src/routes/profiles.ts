import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/profiles/me — current user's full profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user!.user_id]);
        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/profiles/me — update current user's profile
router.put('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const { display_name, avatar_url, city, monthly_distance_goal } = req.body;
        const { rows } = await pool.query(
            `UPDATE profiles SET
        display_name = COALESCE($1, display_name),
        avatar_url = COALESCE($2, avatar_url),
        city = COALESCE($3, city),
        monthly_distance_goal = COALESCE($4, monthly_distance_goal)
      WHERE user_id = $5 RETURNING *`,
            [display_name, avatar_url, city, monthly_distance_goal, req.user!.user_id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/profiles/public — public profiles for leaderboard
router.get('/public', async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query('SELECT * FROM profiles_public ORDER BY total_distance DESC');
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
