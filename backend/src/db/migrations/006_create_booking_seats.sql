-- src/db/migrations/007_create_booking_seats.sql
CREATE TABLE booking_seats (
    booking_id      BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id         BIGINT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    price_at_booking DECIMAL(10,2) NOT NULL,    -- snapshot of price when booked
    PRIMARY KEY (booking_id, seat_id)
);

CREATE INDEX idx_booking_seats_seat ON booking_seats(seat_id);