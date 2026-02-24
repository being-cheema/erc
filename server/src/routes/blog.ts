import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/blog — published blog posts
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const query = isAdmin
            ? 'SELECT * FROM blog_posts ORDER BY created_at DESC'
            : 'SELECT * FROM blog_posts WHERE is_published = true ORDER BY created_at DESC';

        const { rows } = await pool.query(query);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/blog/:slug — single blog post
router.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const query = isAdmin
            ? 'SELECT * FROM blog_posts WHERE slug = $1'
            : 'SELECT * FROM blog_posts WHERE slug = $1 AND is_published = true';

        const { rows } = await pool.query(query, [req.params.slug]);
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
