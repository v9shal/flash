// The repository is the ONLY layer that talks to Postgres.
// Rules: parameterized queries only ($1, $2 ...) — never string concatenation
// (prevents SQL injection). No business logic here, just data in/out.
import pool from '../../db/pool.js';

// Full row as stored in the DB. `password_hash` is included because the service
// needs it for login comparison — it must NEVER be sent to the client.
export interface UserRow {
  id: string; // pg returns BIGINT/BIGSERIAL as a string
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// The safe shape we return to the outside world (no password hash).
export type SafeUser = Omit<UserRow, 'password_hash'>;

const SAFE_COLUMNS =
  'id, full_name, email, phone, role, created_at, updated_at';

interface CreateUserParams {
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
}

export const authRepository = {
  // Returns the FULL row (incl. password_hash) or null. Used by login.
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] ?? null;
  },

  // Inserts a user and returns only the safe columns (no password hash).
  async create(params: CreateUserParams): Promise<SafeUser> {
    const { rows } = await pool.query<SafeUser>(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SAFE_COLUMNS}`,
      [params.full_name, params.email, params.phone, params.password_hash]
    );
    // rows[0] is guaranteed to exist after a successful INSERT ... RETURNING.
    return rows[0] as SafeUser;
  },
};
