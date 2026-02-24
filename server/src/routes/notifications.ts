import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications/preferences — get user's notification preferences
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM notification_preferences WHERE user_id = $1',
            [req.user!.user_id]
        );
        if (!rows.length) {
            // Create defaults
            const { rows: created } = await pool.query(
                'INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *',
                [req.user!.user_id]
            );
            return res.json(created[0]);
        }
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notifications/preferences — update notification preferences
router.put('/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
        const { new_races, leaderboard_changes, new_blog_posts, achievements, training_reminders } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO notification_preferences (user_id, new_races, leaderboard_changes, new_blog_posts, achievements, training_reminders)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         new_races = $2, leaderboard_changes = $3, new_blog_posts = $4, achievements = $5, training_reminders = $6
       RETURNING *`,
            [req.user!.user_id, new_races, leaderboard_changes, new_blog_posts, achievements, training_reminders]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notifications/role — get user's highest role
router.get('/role', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            "SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'",
            [req.user!.user_id]
        );
        return res.json({ role: rows.length > 0 ? 'admin' : 'member' });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
