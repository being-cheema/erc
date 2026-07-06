const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function assertProductionSecrets(): void {
    if (!IS_PRODUCTION) return;

    const missing: string[] = [];

    const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 64) {
        missing.push('TOKEN_ENCRYPTION_KEY (64-char hex)');
    }

    if (!process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
        missing.push('STRAVA_WEBHOOK_VERIFY_TOKEN');
    }

    const pathSecret = process.env.STRAVA_WEBHOOK_PATH_SECRET;
    if (!pathSecret || pathSecret.length < 32) {
        missing.push('STRAVA_WEBHOOK_PATH_SECRET (32+ chars)');
    }

    if (missing.length > 0) {
        console.error('[boot] Production startup blocked — missing or invalid env vars:');
        for (const name of missing) {
            console.error(`  - ${name}`);
        }
        process.exit(1);
    }
}
