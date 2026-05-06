import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/members/:memberId — public member profile by ERC ID
router.get('/:memberId', async (req: Request, res: Response) => {
    try {
        const memberId = req.params.memberId as string;
        if (!memberId || !memberId.startsWith('ERC') || memberId.length !== 16) {
            return res.status(400).json({ error: 'Invalid member ID' });
        }

        const { rows } = await pool.query(
            `SELECT p.member_id, p.display_name, p.avatar_url, p.city,
                    p.total_distance, p.total_runs, p.current_streak, p.longest_streak,
                    p.created_at,
                    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.user_id) as achievements_count,
                    (SELECT ml.rank FROM (
                        SELECT user_id,
                               ROW_NUMBER() OVER (ORDER BY total_distance DESC) as rank
                        FROM monthly_leaderboard
                        WHERE year = EXTRACT(YEAR FROM NOW())::int
                          AND month = EXTRACT(MONTH FROM NOW())::int
                    ) ml WHERE ml.user_id = p.user_id) as current_rank
             FROM profiles p
             WHERE p.member_id = $1`,
            [memberId.toUpperCase()]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Member not found' });
        }

        return res.json(rows[0]);
    } catch (err) {
        console.error('[members] Lookup error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
