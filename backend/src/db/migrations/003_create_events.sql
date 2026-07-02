-- src/db/migrations/004_create_events.sql
CREATE TABLE events (
    id              BIGSERIAL PRIMARY KEY,
    venue_id        BIGINT NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),
    event_start     TIMESTAMPTZ NOT NULL,
    event_end       TIMESTAMPTZ,
    sale_starts_at  TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_sale_starts ON events(sale_starts_at);
CREATE INDEX idx_events_venue ON events(venue_id);