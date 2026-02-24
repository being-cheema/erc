const crypto = require('crypto');
const { Pool } = require('pg');

const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');

function encrypt(text) {
    if (!text || text.includes(':')) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    return iv.toString('hex') + ':' + cipher.getAuthTag().toString('hex') + ':' + enc;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT user_id, strava_access_token, strava_refresh_token FROM profiles WHERE strava_access_token IS NOT NULL')
    .then(({ rows }) => {
        let count = 0;
        const promises = rows.map(row => {
            if (row.strava_access_token && !row.strava_access_token.includes(':')) {
                count++;
                return pool.query('UPDATE profiles SET strava_access_token = $1, strava_refresh_token = $2 WHERE user_id = $3',
                    [encrypt(row.strava_access_token), row.strava_refresh_token ? encrypt(row.strava_refresh_token) : null, row.user_id]);
            }
        });
        return Promise.all(promises).then(() => count);
    })
    .then(count => {
        console.log('Encrypted tokens for ' + count + ' users');
        return pool.end();
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
