import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';
import pool from '../db.js';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

// Required auth — rejects if no valid token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        req.user = verifyToken(token);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Optional auth — sets req.user if token present, continues either way
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const token = authHeader.replace('Bearer ', '');
            req.user = verifyToken(token);
        } catch {
            // Invalid token, just continue without user
        }
    }
    next();
}

// DB-backed admin check — use this instead of trusting the JWT role claim
export async function isAdminInDb(userId: string | undefined | null): Promise<boolean> {
    if (!userId) return false;
    const { rows } = await pool.query(
        `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin'`,
        [userId]
    );
    return rows.length > 0;
}

// Admin-only middleware (use after requireAuth) — checks DB for live role
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        if (!(await isAdminInDb(req.user?.user_id))) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
