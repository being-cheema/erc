import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/feed — aggregated club activity feed
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
        const offset = parseInt(req.query.offset as string) || 0;

        // Recent activities from all members
        const { rows: activities } = await pool.query(
            `SELECT 'activity' as feed_type,
                    a.id, a.name, a.distance, a.moving_time, a.activity_type,
                    a.elevation_gain, a.start_date as event_date,
                    p.display_name, p.avatar_url, p.member_id, p.user_id
             FROM activities a
             JOIN profiles p ON p.user_id = a.user_id
             WHERE a.activity_type IN ('Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike')
             ORDER BY a.start_date DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        // Recent achievements (last 20)
        const { rows: achievements } = await pool.query(
            `SELECT 'achievement' as feed_type,
                    ua.id, ach.name, ach.description, ach.icon, ua.unlocked_at as event_date,
                    p.display_name, p.avatar_url, p.member_id, p.user_id
             FROM user_achievements ua
             JOIN achievements ach ON ach.id = ua.achievement_id
             JOIN profiles p ON p.user_id = ua.user_id
             ORDER BY ua.unlocked_at DESC
             LIMIT 20`
        );

        // Recent challenge completions
        const { rows: completions } = await pool.query(
            `SELECT 'challenge_complete' as feed_type,
                    cp.id, c.title as name, cp.completed_at as event_date,
                    p.display_name, p.avatar_url, p.member_id, p.user_id
             FROM challenge_participants cp
             JOIN challenges c ON c.id = cp.challenge_id
             JOIN profiles p ON p.user_id = cp.user_id
             WHERE cp.is_completed = true AND cp.completed_at IS NOT NULL
             ORDER BY cp.completed_at DESC
             LIMIT 20`
        );

        // New members (last 10)
        const { rows: newMembers } = await pool.query(
            `SELECT 'new_member' as feed_type,
                    p.user_id as id, p.display_name, p.avatar_url, p.member_id,
                    p.user_id, p.created_at as event_date
             FROM profiles p
             ORDER BY p.created_at DESC
             LIMIT 10`
        );

        // Merge and sort by event_date
        const feed = [...activities, ...achievements, ...completions, ...newMembers]
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .slice(0, limit);

        return res.json(feed);
    } catch (err) {
        console.error('[feed] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
