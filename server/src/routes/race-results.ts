import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/race-results/me — current user's race results
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM race_results WHERE user_id = $1 ORDER BY race_date DESC`,
            [req.user!.user_id]
        );
        return res.json(rows);
    } catch (err) {
        console.error('[race-results] Get error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/race-results — log a race result
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.user_id;
        const { race_name, race_date, distance_category, distance_km, finish_time_seconds, bib_number, notes } = req.body;

        if (!race_name || !race_date || !distance_category || !finish_time_seconds) {
            return res.status(400).json({ error: 'race_name, race_date, distance_category, and finish_time_seconds are required' });
        }

        const distKm = distance_km || getDefaultDistance(distance_category);
        const pace = distKm > 0 ? (finish_time_seconds / 60) / distKm : null;

        const { rows } = await pool.query(
            `INSERT INTO race_results (user_id, race_name, race_date, distance_category, distance_km, finish_time_seconds, pace, bib_number, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [userId, race_name, race_date, distance_category, distKm, finish_time_seconds, pace, bib_number || null, notes || null]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[race-results] Create error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/race-results/:id — delete own race result
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'DELETE FROM race_results WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user!.user_id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true });
    } catch (err) {
        console.error('[race-results] Delete error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/race-results/pb-board — club PB board by distance category
router.get('/pb-board', requireAuth, async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT DISTINCT ON (rr.distance_category)
                    rr.distance_category, rr.race_name, rr.race_date, rr.finish_time_seconds, rr.pace,
                    p.display_name, p.avatar_url, p.member_id
             FROM race_results rr
             JOIN profiles p ON p.user_id = rr.user_id
             ORDER BY rr.distance_category, rr.finish_time_seconds ASC`
        );
        return res.json(rows);
    } catch (err) {
        console.error('[race-results] PB board error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

function getDefaultDistance(category: string): number {
    switch (category) {
        case '5k': return 5;
        case '10k': return 10;
        case 'half_marathon': return 21.1;
        case 'marathon': return 42.195;
        default: return 0;
    }
}

export default router;
