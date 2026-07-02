-- src/db/migrations/008_create_payments.sql
CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    razorpay_order_id   VARCHAR(255) UNIQUE,    -- created when payment initiated
    razorpay_payment_id VARCHAR(255) UNIQUE,    -- filled on success
    status              payment_status NOT NULL DEFAULT 'initiated',
    amount              DECIMAL(10,2) NOT NULL,
    idempotency_key     UUID NOT NULL UNIQUE,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);