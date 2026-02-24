import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

export interface JWTPayload {
    user_id: string;
    email: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Generate a long-lived refresh token (opaque, stored in DB).
 * 90-day validity, checked against DB on each use.
 */
export function generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
}
