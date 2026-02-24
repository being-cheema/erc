import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({
    connectionString: DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export default pool;
