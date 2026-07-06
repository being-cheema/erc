// Minimal SQL migration runner. Applies server/db/migrations/*.sql in
// filename order, once each, recording applied versions in schema_migrations.
// Usage: npm run migrate (requires DATABASE_URL).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../db/migrations'
);

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            version text PRIMARY KEY,
            applied_at timestamptz DEFAULT now()
        )`);

        const files = (await readdir(MIGRATIONS_DIR))
            .filter((f) => f.endsWith('.sql'))
            .sort();
        const { rows } = await client.query('SELECT version FROM schema_migrations');
        const applied = new Set(rows.map((r) => r.version));

        for (const file of files) {
            if (applied.has(file)) continue;
            const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
            console.log(`Applying ${file}...`);
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
            }
            console.log(`Applied ${file}`);
        }
        console.log('Migrations up to date.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
