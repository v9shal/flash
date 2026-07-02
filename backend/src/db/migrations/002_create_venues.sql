-- src/db/migrations/003_create_venues.sql
CREATE TABLE venues (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    address         TEXT,
    total_capacity  INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);