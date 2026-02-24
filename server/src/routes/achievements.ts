import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/achievements — all achievements + user's unlocked
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { rows: achievements } = await pool.query('SELECT * FROM achievements ORDER BY category, requirement_value');

        let userAchievements: any[] = [];
        if (req.user) {
            const result = await pool.query(
                'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
                [req.user.user_id]
            );
            userAchievements = result.rows;
        }

        return res.json({ achievements, userAchievements });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
