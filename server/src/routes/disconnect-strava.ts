import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;

        // Delete everything — full account nuke
        await pool.query('DELETE FROM activities WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM monthly_leaderboard WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM notification_preferences WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        return res.json({ success: true });
    } catch (error: any) {
        console.error('disconnect-strava error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
