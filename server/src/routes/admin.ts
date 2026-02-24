import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ── RACES CRUD ──
router.post('/races', async (req: Request, res: Response) => {
    try {
        const { name, description, location, race_date, distance_type, registration_url, image_url, is_published } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO races (name, description, location, race_date, distance_type, registration_url, image_url, is_published, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [name, description, location, race_date, distance_type, registration_url, image_url, is_published || false, req.user!.user_id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/races/:id', async (req: Request, res: Response) => {
    try {
        const { name, description, location, race_date, distance_type, registration_url, image_url, is_published } = req.body;
        const { rows } = await pool.query(
            `UPDATE races SET name=$1, description=$2, location=$3, race_date=$4, distance_type=$5, registration_url=$6, image_url=$7, is_published=$8
       WHERE id=$9 RETURNING *`,
            [name, description, location, race_date, distance_type, registration_url, image_url, is_published, req.params.id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/races/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM races WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ── BLOG CRUD ──
router.post('/blog', async (req: Request, res: Response) => {
    try {
        const { title, slug, content, excerpt, category, image_url, is_published } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO blog_posts (title, slug, content, excerpt, category, image_url, is_published, author_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [title, slug, content, excerpt, category, image_url, is_published || false, req.user!.user_id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/blog/:id', async (req: Request, res: Response) => {
    try {
        const { title, slug, content, excerpt, category, image_url, is_published } = req.body;
        const { rows } = await pool.query(
            `UPDATE blog_posts SET title=$1, slug=$2, content=$3, excerpt=$4, category=$5, image_url=$6, is_published=$7
       WHERE id=$8 RETURNING *`,
            [title, slug, content, excerpt, category, image_url, is_published, req.params.id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/blog/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ── TRAINING PLANS CRUD ──
router.post('/training', async (req: Request, res: Response) => {
    try {
        const { name, description, level, goal_distance, duration_weeks, is_published } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO training_plans (name, description, level, goal_distance, duration_weeks, is_published, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [name, description, level, goal_distance, duration_weeks, is_published || false, req.user!.user_id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/training/:id', async (req: Request, res: Response) => {
    try {
        const { name, description, level, goal_distance, duration_weeks, is_published } = req.body;
        const { rows } = await pool.query(
            `UPDATE training_plans SET name=$1, description=$2, level=$3, goal_distance=$4, duration_weeks=$5, is_published=$6
       WHERE id=$7 RETURNING *`,
            [name, description, level, goal_distance, duration_weeks, is_published, req.params.id]
        );
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/training/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM training_plans WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ── USER ROLE MANAGEMENT ──
router.get('/users', async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.email, p.display_name, p.avatar_url, ur.role
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       ORDER BY p.display_name`
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/users/:id/role', async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        await pool.query(
            `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
       ON CONFLICT (user_id, role) DO UPDATE SET role = $2`,
            [req.params.id, role]
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
