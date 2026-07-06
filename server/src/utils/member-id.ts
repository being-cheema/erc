import crypto from 'crypto';

// 16-char member ID: ERC + 13 random alphanumeric (no ambiguous chars)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateMemberId(): string {
    let id = 'ERC';
    const bytes = crypto.randomBytes(13);
    for (let i = 0; i < 13; i++) {
        id += CHARSET[bytes[i] % CHARSET.length];
    }
    return id;
}
