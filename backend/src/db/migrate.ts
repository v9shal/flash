import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function migrate() {
  const client = await pool.connect();
  try {
    // Track which migrations have already been applied
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // relies on numeric prefixes (000_, 001_, ...)

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`apply  ${file}`);

      // Each migration runs in its own transaction: all-or-nothing
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed: ${file}\n${(err as Error).message}`);
      }
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
