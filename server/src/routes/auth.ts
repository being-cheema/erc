import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { signToken, generateRefreshToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;

// ─── SMTP transporter ───
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const APP_URL = process.env.APP_URL || 'https://eroderunnersclub.com';
const SMTP_FROM = process.env.SMTP_FROM || 'Erode Runners Club <noreply@eroderunnersclub.com>';

// ─── POST /api/auth/signup ───
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, password, display_name, phone } = req.body;

        if (!email || !password || !display_name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const trimmedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [trimmedEmail]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Create user + profile + role in a transaction
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userResult = await client.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
                [trimmedEmail, passwordHash]
            );
            const userId = userResult.rows[0].id;

            await client.query(
                `INSERT INTO profiles (user_id, display_name)
                 VALUES ($1, $2)`,
                [userId, display_name.trim()]
            );

            await client.query(
                'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
                [userId, 'member']
            );

            await client.query('COMMIT');

            // Auto-login: generate tokens
            const token = signToken({ user_id: userId, email: trimmedEmail, role: 'member' });
            const refreshToken = generateRefreshToken();
            const refreshExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

            await pool.query(
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [userId, refreshToken, refreshExpiresAt.toISOString()]
            );

            console.log(`[auth] New user signed up: ${trimmedEmail}`);

            return res.status(201).json({
                success: true,
                token,
                refresh_token: refreshToken,
                user_id: userId,
                strava_connected: false,
            });
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('[auth] Signup error:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/auth/login ───
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { rows } = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        if (!rows.length) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // Check if password_hash is a bcrypt hash (starts with $2)
        // If not, the user hasn't set a password yet — tell them to use forgot password
        if (!user.password_hash.startsWith('$2')) {
            return res.status(401).json({
                error: 'no_password_set',
                message: 'You haven\'t set a password yet. Please use "Forgot Password" to create one.',
            });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user role
        const roleResult = await pool.query(
            'SELECT role FROM user_roles WHERE user_id = $1',
            [user.id]
        );
        const role = roleResult.rows[0]?.role || 'member';

        // Generate tokens
        const token = signToken({ user_id: user.id, email: user.email, role });
        const refreshToken = generateRefreshToken();
        const refreshExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, refreshExpiresAt.toISOString()]
        );

        // Check if Strava is connected
        const profileResult = await pool.query(
            'SELECT strava_id FROM profiles WHERE user_id = $1',
            [user.id]
        );
        const stravaConnected = !!profileResult.rows[0]?.strava_id;

        return res.json({
            success: true,
            token,
            refresh_token: refreshToken,
            user_id: user.id,
            strava_connected: stravaConnected,
        });
    } catch (error) {
        console.error('[auth] Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/auth/change-password ───
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.user_id]);
        if (!rows.length) return res.status(404).json({ error: 'User not found' });

        // Verify current password (skip if user hasn't set one yet)
        if (rows[0].password_hash.startsWith('$2')) {
            const valid = await bcrypt.compare(current_password, rows[0].password_hash);
            if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.user_id]);

        return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('[auth] Change password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/auth/forgot-password ───
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Always return success (don't leak whether email exists)
        const { rows } = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        if (rows.length > 0) {
            const userId = rows[0].id;

            // Per-user rate limit: max 1 reset every 2 minutes
            const recentToken = await pool.query(
                'SELECT created_at FROM password_reset_tokens WHERE user_id = $1 AND used = false ORDER BY created_at DESC LIMIT 1',
                [userId]
            );
            if (recentToken.rows.length > 0) {
                const lastRequested = new Date(recentToken.rows[0].created_at);
                if (Date.now() - lastRequested.getTime() < 2 * 60 * 1000) {
                    // Silently succeed — don't reveal rate limit to attacker
                    return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
                }
            }

            // Invalidate any existing tokens for this user
            await pool.query(
                'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
                [userId]
            );

            // Generate reset token (URL-safe, 48 bytes)
            const resetToken = crypto.randomBytes(48).toString('base64url');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await pool.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [userId, resetToken, expiresAt.toISOString()]
            );

            // Send email
            const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

            try {
                await transporter.sendMail({
                    from: SMTP_FROM,
                    to: email.trim(),
                    subject: 'Reset your Erode Runners Club password',
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 0;">
                            <div style="background: #111; padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: #fff; font-size: 18px; font-weight: 800; letter-spacing: 0.05em; margin: 0; text-transform: uppercase;">Erode Runners Club</h1>
                            </div>
                            <div style="background: #fff; padding: 36px 32px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
                                <h2 style="color: #111; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Reset your password</h2>
                                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">We received a request to reset your password. Tap the button below to choose a new one.</p>
                                <div style="text-align: center; margin: 0 0 28px;">
                                    <a href="${resetUrl}" style="background: #FC4C02; color: #fff; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Reset Password</a>
                                </div>
                                <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                            </div>
                            <div style="padding: 16px 32px; text-align: center; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; background: #fafafa;">
                                <p style="color: #aaa; font-size: 11px; margin: 0;">Erode Runners Club &middot; eroderunnersclub.com</p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[auth] Password reset email sent to ${email.trim()}`);
            } catch (emailError) {
                console.error('[auth] Failed to send reset email:', emailError);
                // Don't fail the request — token is still valid if they have the URL
            }
        }

        // Always return success (security: don't reveal if email exists)
        return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('[auth] Forgot password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/auth/reset-password ───
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Find valid token
        const { rows } = await pool.query(
            'SELECT id, user_id FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
            [token]
        );

        if (!rows.length) {
            return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
        }

        const resetRecord = rows[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Update user password
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetRecord.user_id]);

        // Mark token as used
        await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetRecord.id]);

        console.log(`[auth] Password reset completed for user ${resetRecord.user_id}`);

        return res.json({ success: true, message: 'Password has been reset. You can now log in.' });
    } catch (error) {
        console.error('[auth] Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
