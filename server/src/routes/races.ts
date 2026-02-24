import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/races — published races
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const query = isAdmin
            ? 'SELECT * FROM races ORDER BY race_date ASC'
            : 'SELECT * FROM races WHERE is_published = true ORDER BY race_date ASC';

        const { rows } = await pool.query(query);

        // Get participant counts
        for (const race of rows) {
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM race_participants WHERE race_id = $1',
                [race.id]
            );
            race.participant_count = parseInt(countResult.rows[0].count);
        }

        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/races/my-registrations — user's race registrations
router.get('/my-registrations', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            'SELECT race_id FROM race_participants WHERE user_id = $1',
            [req.user!.user_id]
        );
        return res.json(rows.map(r => r.race_id));
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/races/:id/register — register for a race
router.post('/:id/register', requireAuth, async (req: Request, res: Response) => {
    try {
        await pool.query(
            'INSERT INTO race_participants (race_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.params.id, req.user!.user_id]
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/races/:id/register — unregister from a race
router.delete('/:id/register', requireAuth, async (req: Request, res: Response) => {
    try {
        await pool.query(
            'DELETE FROM race_participants WHERE race_id = $1 AND user_id = $2',
            [req.params.id, req.user!.user_id]
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
