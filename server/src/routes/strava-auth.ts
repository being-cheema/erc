import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { signToken } from '../utils/jwt.js';
import crypto from 'crypto';

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

const ALLOWED_REDIRECT_URIS = [
    'https://api.eroderunnersclub.com/auth/callback',
    'https://api.eroderunnersclub.com/auth/strava/callback',
    'https://eroderunnersclub.com/auth/callback',
    'http://localhost:5173/auth/callback',
];

router.get('/', async (req: Request, res: Response) => {
    try {
        const action = req.query.action as string;

        // ─── AUTHORIZE: Generate Strava OAuth URL ───
        if (action === 'authorize') {
            const redirectUri = req.query.redirect_uri as string;
            if (!redirectUri) {
                return res.status(400).json({ error: 'redirect_uri is required' });
            }

            if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
                console.error('Invalid redirect_uri attempted:', redirectUri);
                return res.status(400).json({ error: 'Invalid redirect_uri' });
            }

            const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
            stravaAuthUrl.searchParams.set('client_id', STRAVA_CLIENT_ID);
            stravaAuthUrl.searchParams.set('response_type', 'code');
            stravaAuthUrl.searchParams.set('redirect_uri', redirectUri);
            stravaAuthUrl.searchParams.set('approval_prompt', 'auto');
            stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all,profile:read_all');

            return res.json({ url: stravaAuthUrl.toString() });
        }

        // ─── CALLBACK: Exchange code for tokens, create/find user ───
        if (action === 'callback') {
            const code = req.query.code as string;
            console.log(`[strava-auth] Callback received, code: ${code ? code.slice(0, 8) + '...' : 'MISSING'}`);
            if (!code) {
                return res.status(400).json({ error: 'code is required' });
            }

            // Exchange code for tokens with Strava
            const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                }),
            });

            console.log(`[strava-auth] Token exchange response: ${tokenResponse.status}`);

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('[strava-auth] Token exchange FAILED:', errorText);
                return res.status(400).json({ error: 'Failed to exchange code for tokens' });
            }

            const tokenData = await tokenResponse.json();
            const { access_token, refresh_token, expires_at, athlete } = tokenData;
            console.log(`[strava-auth] Token exchange OK, athlete: ${athlete?.firstname} ${athlete?.lastname}, id: ${athlete?.id}`);

            // Check if user exists with this Strava ID
            const existingProfile = await pool.query(
                'SELECT user_id FROM profiles WHERE strava_id = $1',
                [athlete.id.toString()]
            );

            let userId: string;
            let isNewUser = false;

            if (existingProfile.rows.length > 0) {
                // Existing user — update tokens, preserve user-set display_name/avatar
                userId = existingProfile.rows[0].user_id;

                const currentProfile = await pool.query(
                    'SELECT display_name, avatar_url FROM profiles WHERE user_id = $1',
                    [userId]
                );

                await pool.query(
                    `UPDATE profiles SET
            strava_access_token = $1,
            strava_refresh_token = $2,
            strava_token_expires_at = $3,
            display_name = $4,
            avatar_url = $5,
            city = $6
          WHERE user_id = $7`,
                    [
                        access_token,
                        refresh_token,
                        new Date(expires_at * 1000).toISOString(),
                        currentProfile.rows[0]?.display_name || `${athlete.firstname} ${athlete.lastname}`,
                        currentProfile.rows[0]?.avatar_url || athlete.profile,
                        athlete.city || null,
                        userId,
                    ]
                );
            } else {
                // New user OR reconnecting user
                isNewUser = true;
                const email = `strava_${athlete.id}@eroderunners.local`;

                // Check if auth user exists (reconnect after disconnect)
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE email = $1',
                    [email]
                );

                if (existingUser.rows.length > 0) {
                    // Auth user exists but profile was cleared (reconnect)
                    userId = existingUser.rows[0].id;
                    isNewUser = false;

                    await pool.query(
                        `INSERT INTO profiles (user_id, strava_id, strava_access_token, strava_refresh_token, strava_token_expires_at, display_name, avatar_url, city)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE SET
              strava_id = $2,
              strava_access_token = $3,
              strava_refresh_token = $4,
              strava_token_expires_at = $5,
              display_name = $6,
              avatar_url = $7,
              city = $8`,
                        [
                            userId,
                            athlete.id.toString(),
                            access_token,
                            refresh_token,
                            new Date(expires_at * 1000).toISOString(),
                            `${athlete.firstname} ${athlete.lastname}`,
                            athlete.profile,
                            athlete.city || null,
                        ]
                    );

                    // Ensure member role exists
                    await pool.query(
                        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member') ON CONFLICT (user_id, role) DO NOTHING`,
                        [userId]
                    );

                    // Ensure notification preferences exist
                    await pool.query(
                        `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
                        [userId]
                    );
                } else {
                    // Truly new user — create auth account
                    const passwordHash = crypto.randomUUID(); // Random, user won't use password login

                    const newUser = await pool.query(
                        `INSERT INTO users (email, password_hash, user_metadata)
            VALUES ($1, $2, $3) RETURNING id`,
                        [
                            email,
                            passwordHash,
                            JSON.stringify({
                                strava_id: athlete.id,
                                display_name: `${athlete.firstname} ${athlete.lastname}`,
                                avatar_url: athlete.profile,
                            }),
                        ]
                    );

                    userId = newUser.rows[0].id;

                    // Create profile
                    await pool.query(
                        `INSERT INTO profiles (user_id, strava_id, strava_access_token, strava_refresh_token, strava_token_expires_at, display_name, avatar_url, city)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            userId,
                            athlete.id.toString(),
                            access_token,
                            refresh_token,
                            new Date(expires_at * 1000).toISOString(),
                            `${athlete.firstname} ${athlete.lastname}`,
                            athlete.profile,
                            athlete.city || null,
                        ]
                    );

                    // Assign member role
                    await pool.query(
                        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member')`,
                        [userId]
                    );

                    // Create default notification preferences
                    await pool.query(
                        `INSERT INTO notification_preferences (user_id) VALUES ($1)`,
                        [userId]
                    );
                }
            }

            // Get user's role for JWT
            const roleResult = await pool.query(
                `SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC LIMIT 1`,
                [userId]
            );
            const role = roleResult.rows[0]?.role || 'member';

            // Generate JWT (replaces Supabase magic link)
            const token = signToken({
                user_id: userId,
                email: `strava_${athlete.id}@eroderunners.local`,
                role,
            });

            console.log(`[strava-auth] Sending success response with JWT for user ${userId}, isNew: ${isNewUser}`);
            return res.json({
                success: true,
                user_id: userId,
                token,
                is_new_user: isNewUser,
                athlete: {
                    id: athlete.id,
                    firstname: athlete.firstname,
                    lastname: athlete.lastname,
                    profile: athlete.profile,
                    city: athlete.city,
                },
            });
        }

        // ─── REFRESH: Refresh Strava access token ───
        if (action === 'refresh') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Authorization required' });
            }

            // Get user from JWT
            const { verifyToken } = await import('../utils/jwt.js');
            const tokenStr = authHeader.replace('Bearer ', '');
            let jwtPayload;
            try {
                jwtPayload = verifyToken(tokenStr);
            } catch {
                return res.status(401).json({ error: 'Invalid token' });
            }

            const profile = await pool.query(
                'SELECT strava_refresh_token FROM profiles WHERE user_id = $1',
                [jwtPayload.user_id]
            );

            if (!profile.rows[0]?.strava_refresh_token) {
                return res.status(400).json({ error: 'No refresh token found' });
            }

            const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    refresh_token: profile.rows[0].strava_refresh_token,
                    grant_type: 'refresh_token',
                }),
            });

            if (!tokenResponse.ok) {
                return res.status(400).json({ error: 'Failed to refresh token' });
            }

            const { access_token, refresh_token: new_refresh_token, expires_at: new_expires_at } = await tokenResponse.json();

            await pool.query(
                `UPDATE profiles SET
          strava_access_token = $1,
          strava_refresh_token = $2,
          strava_token_expires_at = $3
        WHERE user_id = $4`,
                [access_token, new_refresh_token, new Date(new_expires_at * 1000).toISOString(), jwtPayload.user_id]
            );

            return res.json({ success: true });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('Strava auth error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── SERVER-SIDE NATIVE CALLBACK ───
// Strava redirects here directly. We exchange the code, create/update user,
// generate JWT, and redirect to the native app via deep link.
// No client-side JavaScript needed — the Chrome Custom Tab gets a 302.
router.get('/callback', async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        console.log(`[strava-auth] Native callback received, code: ${code ? code.slice(0, 8) + '...' : 'MISSING'}`);

        if (!code) {
            return res.status(400).send('Authorization code missing. Please try again.');
        }

        // Exchange code for tokens with Strava
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[strava-auth] Native callback token exchange FAILED:', errorText);
            return res.status(400).send('Failed to exchange code with Strava. Please try again.');
        }

        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token, expires_at, athlete } = tokenData;
        console.log(`[strava-auth] Native callback OK, athlete: ${athlete?.firstname} ${athlete?.lastname}`);

        // Check if user exists with this Strava ID
        const existingProfile = await pool.query(
            'SELECT user_id FROM profiles WHERE strava_id = $1',
            [athlete.id.toString()]
        );

        let userId: string;
        let isNewUser = false;

        if (existingProfile.rows.length > 0) {
            userId = existingProfile.rows[0].user_id;
            const currentProfile = await pool.query(
                'SELECT display_name, avatar_url FROM profiles WHERE user_id = $1',
                [userId]
            );
            await pool.query(
                `UPDATE profiles SET
                    strava_access_token = $1,
                    strava_refresh_token = $2,
                    strava_token_expires_at = $3,
                    display_name = $4,
                    avatar_url = $5,
                    city = $6
                WHERE user_id = $7`,
                [
                    access_token, refresh_token,
                    new Date(expires_at * 1000).toISOString(),
                    currentProfile.rows[0]?.display_name || `${athlete.firstname} ${athlete.lastname}`,
                    currentProfile.rows[0]?.avatar_url || athlete.profile,
                    athlete.city || null,
                    userId,
                ]
            );
        } else {
            isNewUser = true;
            const email = `strava_${athlete.id}@eroderunners.local`;
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                isNewUser = false;
                await pool.query(
                    `INSERT INTO profiles (user_id, strava_id, strava_access_token, strava_refresh_token, strava_token_expires_at, display_name, avatar_url, city)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (user_id) DO UPDATE SET
                        strava_id = $2, strava_access_token = $3, strava_refresh_token = $4,
                        strava_token_expires_at = $5, display_name = $6, avatar_url = $7, city = $8`,
                    [userId, athlete.id.toString(), access_token, refresh_token,
                        new Date(expires_at * 1000).toISOString(),
                        `${athlete.firstname} ${athlete.lastname}`, athlete.profile, athlete.city || null]
                );
                await pool.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'member') ON CONFLICT (user_id, role) DO NOTHING`, [userId]);
                await pool.query(`INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
            } else {
                const passwordHash = crypto.randomUUID();
                const newUser = await pool.query(
                    `INSERT INTO users (email, password_hash, user_metadata) VALUES ($1, $2, $3) RETURNING id`,
                    [email, passwordHash, JSON.stringify({ strava_id: athlete.id, display_name: `${athlete.firstname} ${athlete.lastname}`, avatar_url: athlete.profile })]
                );
                userId = newUser.rows[0].id;
                await pool.query(
                    `INSERT INTO profiles (user_id, strava_id, strava_access_token, strava_refresh_token, strava_token_expires_at, display_name, avatar_url, city)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [userId, athlete.id.toString(), access_token, refresh_token,
                        new Date(expires_at * 1000).toISOString(),
                        `${athlete.firstname} ${athlete.lastname}`, athlete.profile, athlete.city || null]
                );
                await pool.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'member')`, [userId]);
                await pool.query(`INSERT INTO notification_preferences (user_id) VALUES ($1)`, [userId]);
            }
        }

        // Get role and generate JWT
        const roleResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC LIMIT 1', [userId]);
        const role = roleResult.rows[0]?.role || 'member';
        const token = signToken({ user_id: userId, email: `strava_${athlete.id}@eroderunners.local`, role });

        console.log(`[strava-auth] Native callback: redirecting to deep link for user ${userId}`);

        // Build the deep link URL
        const deepLink = `eroderunners://auth/callback?token=${encodeURIComponent(token)}&is_new_user=${isNewUser}&athlete_name=${encodeURIComponent(athlete.firstname || 'Runner')}`;

        // Build an Android intent:// URL — Chrome has native support for these
        // and won't block them like custom schemes (eroderunners://)
        const intentUrl = `intent://auth/callback?token=${encodeURIComponent(token)}&is_new_user=${isNewUser}&athlete_name=${encodeURIComponent(athlete.firstname || 'Runner')}#Intent;scheme=eroderunners;package=com.eroderunners.app;end`;

        // Serve an HTML page that auto-redirects via intent:// scheme.
        // Chrome Custom Tabs block both 302 redirects AND JS redirects to custom schemes,
        // but intent:// is handled natively by Chrome.
        res.setHeader('Content-Type', 'text/html');
        return res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting...</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center;
         justify-content: center; min-height: 100vh; margin: 0; background: #111; color: #fff; }
  .card { text-align: center; padding: 2rem; }
  .btn { display: inline-block; margin-top: 1.5rem; padding: 14px 32px; background: #fc4c02;
         color: #fff; font-size: 16px; font-weight: 600; border: none; border-radius: 12px;
         text-decoration: none; cursor: pointer; }
  .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2);
             border-top-color: #fc4c02; border-radius: 50%; animation: spin 0.8s linear infinite;
             margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
<script>
  // Use intent:// scheme — Chrome handles this natively unlike custom schemes
  window.location.href = ${JSON.stringify(intentUrl)};
  // Fallback: show the button after a short delay
  setTimeout(function() {
    document.getElementById('fallback').style.display = 'block';
    document.getElementById('spinner').style.display = 'none';
  }, 2000);
</script>
</head><body>
<div class="card">
  <div class="spinner" id="spinner"></div>
  <p>Returning to Erode Runners...</p>
  <div id="fallback" style="display:none">
    <p style="color:#999;font-size:14px">If the app didn't open automatically:</p>
    <a class="btn" href="${deepLink}">Open App</a>
  </div>
</div>
</body></html>`);
    } catch (error) {
        console.error('[strava-auth] Native callback error:', error);
        return res.status(500).send('Authentication failed. Please try again.');
    }
});

export default router;
