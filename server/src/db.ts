import pg from 'pg';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://erode_runner:erode_runner_pass@postgres:5432/erode_runners',
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export default pool;
