import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { signToken, generateRefreshToken } from '../utils/jwt.js';

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
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #111; border-radius: 16px;">
                            <h2 style="color: #fff; text-align: center; font-size: 24px; margin-bottom: 8px;">🏃 Erode Runners Club</h2>
                            <p style="color: #999; text-align: center; margin-bottom: 32px;">Password Reset</p>
                            <p style="color: #ccc; line-height: 1.6;">Hi there! Click the button below to set your password:</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${resetUrl}" style="background: #FC4C02; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Set Password</a>
                            </div>
                            <p style="color: #666; font-size: 13px; line-height: 1.5;">This link expires in 1 hour. If you didn't request this, just ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
                            <p style="color: #444; font-size: 11px; text-align: center;">Erode Runners Club</p>
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
