import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;

        // Delete activities
        await pool.query('DELETE FROM activities WHERE user_id = $1', [userId]);

        // Delete monthly_leaderboard entries
        await pool.query('DELETE FROM monthly_leaderboard WHERE user_id = $1', [userId]);

        // Delete user_achievements
        await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);

        // Clear Strava tokens from profile but keep the profile
        await pool.query(
            `UPDATE profiles SET
        strava_id = NULL,
        strava_access_token = NULL,
        strava_refresh_token = NULL,
        strava_token_expires_at = NULL,
        total_distance = 0,
        total_runs = 0,
        current_streak = 0,
        longest_streak = 0,
        last_synced_at = NULL
      WHERE user_id = $1`,
            [userId]
        );

        return res.json({ success: true });
    } catch (error: any) {
        console.error('disconnect-strava error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
