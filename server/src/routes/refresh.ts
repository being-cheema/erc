import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { signToken, verifyToken, generateRefreshToken } from '../utils/jwt.js';

const router = Router();

// POST /api/auth/refresh — Exchange refresh token for new JWT + refresh token
router.post('/', async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'refresh_token is required' });
        }

        // Look up the refresh token in DB
        const { rows } = await pool.query(
            `SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`,
            [refresh_token]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const { user_id, expires_at } = rows[0];

        // Check if expired
        if (new Date(expires_at) < new Date()) {
            // Delete the expired token
            await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refresh_token]);
            return res.status(401).json({ error: 'Refresh token expired, please login again' });
        }

        // Get user's current role from DB
        const roleResult = await pool.query(
            `SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC LIMIT 1`,
            [user_id]
        );
        const role = roleResult.rows[0]?.role || 'member';

        // Get user's email
        const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [user_id]);
        const email = userResult.rows[0]?.email || '';

        // Issue new JWT
        const newToken = signToken({ user_id, email, role });

        // Rotate refresh token — delete old, create new
        await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refresh_token]);
        const newRefreshToken = generateRefreshToken();
        const newExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
            [user_id, newRefreshToken, newExpiresAt.toISOString()]
        );

        // Clean up any old refresh tokens for this user (keep max 5)
        await pool.query(
            `DELETE FROM refresh_tokens WHERE user_id = $1 AND token NOT IN (
                SELECT token FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5
            )`,
            [user_id]
        );

        return res.json({
            token: newToken,
            refresh_token: newRefreshToken,
        });
    } catch (error) {
        console.error('[auth/refresh] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
