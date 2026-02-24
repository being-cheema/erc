import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/training — published training plans
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const query = isAdmin
            ? 'SELECT * FROM training_plans ORDER BY created_at DESC'
            : 'SELECT * FROM training_plans WHERE is_published = true ORDER BY created_at DESC';

        const { rows } = await pool.query(query);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/training/:id — single training plan with weeks and workouts
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { rows: plans } = await pool.query('SELECT * FROM training_plans WHERE id = $1', [req.params.id]);
        if (!plans.length) return res.status(404).json({ error: 'Plan not found' });

        const { rows: weeks } = await pool.query(
            'SELECT * FROM training_weeks WHERE plan_id = $1 ORDER BY week_number',
            [req.params.id]
        );

        for (const week of weeks) {
            const { rows: workouts } = await pool.query(
                'SELECT * FROM training_workouts WHERE week_id = $1 ORDER BY day_of_week',
                [week.id]
            );
            week.workouts = workouts;
        }

        const plan = plans[0];
        plan.weeks = weeks;

        // Get user progress if authenticated
        if (req.user) {
            const { rows: progress } = await pool.query(
                'SELECT workout_id, completed_at FROM user_training_progress WHERE user_id = $1 AND plan_id = $2',
                [req.user.user_id, req.params.id]
            );
            plan.userProgress = progress;
        }

        return res.json(plan);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/training/:planId/progress/:workoutId — mark workout as complete
router.post('/:planId/progress/:workoutId', requireAuth, async (req: Request, res: Response) => {
    try {
        await pool.query(
            `INSERT INTO user_training_progress (user_id, plan_id, workout_id)
       VALUES ($1, $2, $3) ON CONFLICT (user_id, workout_id) DO NOTHING`,
            [req.user!.user_id, req.params.planId, req.params.workoutId]
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/training/:planId/progress/:workoutId — unmark workout
router.delete('/:planId/progress/:workoutId', requireAuth, async (req: Request, res: Response) => {
    try {
        await pool.query(
            'DELETE FROM user_training_progress WHERE user_id = $1 AND workout_id = $2',
            [req.user!.user_id, req.params.workoutId]
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
