-- src/db/migrations/005_create_seats.sql
CREATE TABLE seats (
    id              BIGSERIAL PRIMARY KEY,
    event_id        BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    seat_number     VARCHAR(20) NOT NULL,
    row_name        VARCHAR(10),
    section         VARCHAR(50),
    tier            VARCHAR(50) NOT NULL,       -- 'GA', 'VIP', 'Floor'
    price           DECIMAL(10,2) NOT NULL,
    status          seat_status NOT NULL DEFAULT 'available',
    held_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ,
    version         INT NOT NULL DEFAULT 1,
    CONSTRAINT unique_seat_per_event UNIQUE (event_id, seat_number)
);

CREATE INDEX idx_seats_event ON seats(event_id);
CREATE INDEX idx_seats_expiry ON seats(status, expires_at)
    WHERE status = 'held';                      -- partial index, only held seats