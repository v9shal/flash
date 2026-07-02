CREATE TYPE seat_status AS ENUM ('available', 'held', 'booked', 'blocked');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled', 'expired');
CREATE TYPE payment_status AS ENUM ('initiated', 'success', 'failed', 'refunded');