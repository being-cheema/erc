import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { signToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || '';

// HMAC sign state to prevent tampering
function signState(userId: string, nativeState?: string): string {
    const payload = nativeState ? `${userId}:${nativeState}` : userId;
    const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex').slice(0, 16);
    return `${payload}.${hmac}`;
}

function verifyState(state: string): { userId: string; nativeState: string | null } | null {
    const dotIdx = state.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const payload = state.slice(0, dotIdx);
    const sig = state.slice(dotIdx + 1);
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex').slice(0, 16);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const colonIdx = payload.indexOf(':');
    return colonIdx === -1
        ? { userId: payload, nativeState: null }
        : { userId: payload.slice(0, colonIdx), nativeState: payload.slice(colonIdx + 1) };
}

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

const ALLOWED_REDIRECT_URIS = [
    'https://api.eroderunnersclub.com/auth/callback',
    'https://api.eroderunnersclub.com/auth/strava/callback',
    'https://eroderunnersclub.com/auth/callback',
    'http://localhost:5173/auth/callback',
];

// ─── PENDING TOKENS STORE (for polling-based native auth) ───
// The native app generates a session_id, passes it as `state` to Strava.
// After callback, the JWT is stored here. The app polls /poll?state=<id> to retrieve it.
const pendingTokens = new Map<string, { token: string; refresh_token: string; is_new_user: boolean; athlete_name: string; created: number }>();

// Clean up expired tokens every 5 minutes (tokens expire after 5 min)
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingTokens) {
        if (now - val.created > 5 * 60 * 1000) pendingTokens.delete(key);
    }
}, 5 * 60 * 1000);

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
                console.error('Invalid redirect_uri attempted:', String(redirectUri).replace(/[\n\r\t]/g, ''));
                return res.status(400).json({ error: 'Invalid redirect_uri' });
            }

            // Require authenticated user — Strava connect is post-login only
            const authHeader = req.headers.authorization;
            let authenticatedUserId: string | null = null;
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const payload = verifyToken(authHeader.replace('Bearer ', ''));
                    authenticatedUserId = payload.user_id;
                } catch { /* invalid token */ }
            }

            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'Authentication required. Please log in first.' });
            }

            const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
            stravaAuthUrl.searchParams.set('client_id', STRAVA_CLIENT_ID);
            stravaAuthUrl.searchParams.set('response_type', 'code');
            stravaAuthUrl.searchParams.set('redirect_uri', redirectUri);
            stravaAuthUrl.searchParams.set('approval_prompt', 'auto');
            stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all,profile:read_all');

            // Encode user_id (and optional native poll state) in the state param with HMAC
            const nativeState = req.query.state as string;
            const statePayload = signState(authenticatedUserId, nativeState || undefined);
            stravaAuthUrl.searchParams.set('state', statePayload);

            return res.json({ url: stravaAuthUrl.toString() });
        }

        // ─── CALLBACK: Exchange code for tokens, LINK to existing user ───
        if (action === 'callback') {
            const code = req.query.code as string;
            const stateParam = req.query.state as string;

            if (!code) {
                return res.status(400).json({ error: 'code is required' });
            }

            // Extract and verify user_id from HMAC-signed state
            if (!stateParam) {
                return res.status(400).json({ error: 'Invalid state — no user context. Please log in and try again.' });
            }

            const stateResult = verifyState(stateParam);
            if (!stateResult) {
                return res.status(400).json({ error: 'Invalid state signature. Please try connecting again.' });
            }

            const { userId, nativeState } = stateResult;

            // Verify user exists
            const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
            if (!userCheck.rows.length) {
                return res.status(400).json({ error: 'User not found. Please log in again.' });
            }
            const userEmail = userCheck.rows[0].email;

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
                console.error('[strava-auth] Token exchange FAILED:', errorText);
                return res.status(400).json({ error: 'Failed to exchange code for tokens' });
            }

            const tokenData = await tokenResponse.json();
            const { access_token, refresh_token, expires_at, athlete } = tokenData;

            // Check if this Strava account is already linked to ANOTHER user
            const existingLink = await pool.query(
                'SELECT user_id FROM profiles WHERE strava_id = $1 AND user_id != $2',
                [athlete.id.toString(), userId]
            );
            if (existingLink.rows.length > 0) {
                return res.status(409).json({ error: 'This Strava account is already linked to another user.' });
            }

            // Link Strava to the existing user's profile (upsert)
            // User-set name/avatar/city always win — Strava only fills blanks
            const currentProfile = await pool.query(
                'SELECT display_name, avatar_url, city FROM profiles WHERE user_id = $1',
                [userId]
            );

            const fallbackName = currentProfile.rows[0]?.display_name || `${athlete.firstname} ${athlete.lastname}`;
            const fallbackAvatar = currentProfile.rows[0]?.avatar_url || athlete.profile;
            const fallbackCity = currentProfile.rows[0]?.city || athlete.city || null;

            await pool.query(
                `INSERT INTO profiles (user_id, strava_id, strava_access_token, strava_refresh_token, strava_token_expires_at, display_name, avatar_url, city)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) DO UPDATE SET
                    strava_id = $2,
                    strava_access_token = $3,
                    strava_refresh_token = $4,
                    strava_token_expires_at = $5,
                    display_name = COALESCE(NULLIF(profiles.display_name, ''), $6),
                    avatar_url = COALESCE(NULLIF(profiles.avatar_url, ''), $7),
                    city = COALESCE(NULLIF(profiles.city, ''), $8)`,
                [
                    userId,
                    athlete.id.toString(),
                    encryptToken(access_token),
                    encryptToken(refresh_token),
                    new Date(expires_at * 1000).toISOString(),
                    fallbackName,
                    fallbackAvatar,
                    fallbackCity,
                ]
            );

            // Ensure member role and notification prefs exist
            await pool.query(
                `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member') ON CONFLICT (user_id, role) DO NOTHING`,
                [userId]
            );
            await pool.query(
                `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            );

            console.log(`[strava-auth] Linked Strava athlete ${athlete.id} to user ${userId}`);

            // Get user's role for JWT
            const roleResult = await pool.query(
                `SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC LIMIT 1`,
                [userId]
            );
            const role = roleResult.rows[0]?.role || 'member';

            // Generate fresh JWT with user's real email
            const token = signToken({ user_id: userId, email: userEmail, role });

            // Generate refresh token
            const refreshToken = generateRefreshToken();
            const refreshExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            await pool.query(
                `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
                [userId, refreshToken, refreshExpiresAt.toISOString()]
            );

            // If native poll state, store token for polling
            if (nativeState) {
                pendingTokens.set(nativeState, {
                    token,
                    refresh_token: refreshToken,
                    is_new_user: false,
                    athlete_name: `${athlete.firstname} ${athlete.lastname}`,
                    created: Date.now(),
                });
            }

            return res.json({
                success: true,
                user_id: userId,
                token,
                refresh_token: refreshToken,
                is_new_user: false,
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
                    refresh_token: decryptToken(profile.rows[0].strava_refresh_token),
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
                [encryptToken(access_token), encryptToken(new_refresh_token), new Date(new_expires_at * 1000).toISOString(), jwtPayload.user_id]
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
                    encryptToken(access_token), encryptToken(refresh_token),
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
                    [userId, athlete.id.toString(), encryptToken(access_token), encryptToken(refresh_token),
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
                    [userId, athlete.id.toString(), encryptToken(access_token), encryptToken(refresh_token),
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

        // Generate refresh token
        const refreshToken = generateRefreshToken();
        const refreshExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
            [userId, refreshToken, refreshExpiresAt.toISOString()]
        );

        // Store token for polling — the app will retrieve it via GET /poll?state=<id>
        const state = (req.query.state as string) || '';
        if (state) {
            pendingTokens.set(state, {
                token,
                refresh_token: refreshToken,
                is_new_user: isNewUser,
                athlete_name: athlete.firstname || 'Runner',
                created: Date.now(),
            });
        }

        // Show a simple page telling the user to return to the app
        res.setHeader('Content-Type', 'text/html');
        return res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Success</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center;
         justify-content: center; min-height: 100vh; margin: 0; background: #111; color: #fff; }
  .card { text-align: center; padding: 2rem; }
  .check { font-size: 48px; margin-bottom: 1rem; }
</style>
</head><body>
<div class="card">
  <div class="check">✅</div>
  <p>Authentication successful!</p>
  <p style="color:#999;font-size:14px">Returning to the app...</p>
</div>
</body></html>`);
    } catch (error) {
        console.error('[strava-auth] Native callback error:', error);
        return res.status(500).send('Authentication failed. Please try again.');
    }
});

// ─── POLL: Native app polls for the token after Strava auth ───
router.get('/poll', (req: Request, res: Response) => {
    const state = req.query.state as string;
    if (!state) {
        return res.status(400).json({ error: 'state is required' });
    }

    const pending = pendingTokens.get(state);
    if (!pending) {
        // Not ready yet — app should keep polling
        return res.json({ ready: false });
    }

    // Token is ready — return it and delete from store (one-time use)
    pendingTokens.delete(state);
    return res.json({
        ready: true,
        token: pending.token,
        refresh_token: pending.refresh_token,
        is_new_user: pending.is_new_user,
        athlete_name: pending.athlete_name,
    });
});

export default router;
