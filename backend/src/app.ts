import 'dotenv/config';

import pool from './db/pool';

async function main() {
  const result = await pool.query("SELECT NOW()");
  console.log(result.rows[0]);

  await pool.end();
}

main();