-- src/db/migrations/002_create_users.sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20) UNIQUE,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);