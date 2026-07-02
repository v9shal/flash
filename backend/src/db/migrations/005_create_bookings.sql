-- src/db/migrations/006_create_bookings.sql
CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id        BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    status          booking_status NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    idempotency_key UUID NOT NULL UNIQUE,       -- prevents double booking on retry
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_expiry ON bookings(status, expires_at)
    WHERE status = 'pending';   