import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { decryptToken } from '../utils/crypto.js';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;

        const { rows: profiles } = await pool.query(
            'SELECT strava_access_token FROM profiles WHERE user_id = $1',
            [userId]
        );
        const accessToken = profiles[0]?.strava_access_token
            ? decryptToken(profiles[0].strava_access_token)
            : null;

        if (accessToken) {
            try {
                const deauthResponse = await fetch('https://www.strava.com/oauth/deauthorize', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!deauthResponse.ok) {
                    console.warn(`[disconnect] Strava deauthorize returned ${deauthResponse.status} for user ${userId}`);
                } else {
                    console.log(`[disconnect] Strava deauthorized for user ${userId}`);
                }
            } catch (deauthErr) {
                console.warn(`[disconnect] Strava deauthorize failed for user ${userId}:`, deauthErr);
            }
        }

        await pool.query('DELETE FROM activities WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM monthly_leaderboard WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);

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

        console.log(`[disconnect] Strava data wiped for user ${userId}, profile kept`);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('disconnect-strava error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
