Flash Sale Ticketing System — Complete Build Roadmap

Phase 0: Project Setup ✅

 Requirements and constraints
 Capacity estimation
 System design and architecture
 Database schema
 API design
 Project structure
 Tech stack decision
 tsconfig.json


Phase 1: Foundation (Start Here)
1.1 Environment Config

src/config/env.ts — Zod validation of all env vars
.env and .env.example
Security: never expose secrets, fail fast on missing vars

1.2 Database Setup

src/db/pool.ts — pg Pool with connection limits
src/db/migrations/ — all 7 migration files in order
Security: parameterized queries only, never string concatenation

1.3 Redis Setup

src/redis/client.ts — ioredis connection with error handling
Connection retry strategy

1.4 Logger Setup

src/utils/logger.ts — pino logger
Never log passwords, tokens, or card data

1.5 Error Handling Infrastructure

src/utils/AppError.ts — custom error class
src/utils/asyncHandler.ts — async wrapper
src/middleware/errorHandler.ts — global error handler


Phase 2: Auth Module
2.1 Registration

Hash password with bcrypt (cost factor 12)
Validate email format, password strength with Zod
Security: never store plain text passwords

2.2 Login

Compare bcrypt hash
Issue JWT access token (15 min expiry)
Issue refresh token (7 days expiry, stored in httpOnly cookie)
Security: short-lived access tokens, httpOnly cookie for refresh

2.3 JWT Middleware

src/middleware/authenticate.ts
Verify signature, check expiry
Attach user to request object
Security: validate algorithm explicitly (prevent algorithm confusion attack)

2.4 Refresh Token Flow

POST /auth/refresh — issue new access token using refresh token
Security: rotate refresh token on every use


Phase 3: Events Module
3.1 Create Event (Admin)

POST /events — admin only
Validate all fields with Zod
Insert into events + auto-generate seats

3.2 List Events

GET /events — paginated, filterable by city/category
Cache-aside with Redis
Singleflight pattern on cache miss

3.3 Get Event Details

GET /events/:eventId
Serve from Redis first, fallback to Postgres


Phase 4: Seats Module
4.1 List Seats

GET /seats/:eventId — all seats with status, price, tier
Serve entirely from Redis
Prewarm job triggered on event creation

4.2 Redis Prewarm

src/jobs/prewarm.ts
Scheduled 20 min before sale_starts_at
Loads all seats into Redis Hash
Sets up hold: key namespace


Phase 5: Bookings Module (The Hard Part)
5.1 Lua Script

src/redis/scripts/holdSeat.lua
Atomic check: seat available + user has no existing hold
Sets hold:{eventId}:{seatNo} with TTL 600s
Returns specific error codes for each failure case

5.2 Create Booking

POST /bookings
JWT → extract userId
Run Lua script for each requested seat
Write hold to Postgres inside transaction
Push payment job to BullMQ
Return bookingId to client
Security: idempotency key on request to prevent double booking

5.3 Get Bookings

GET /bookings/me — user's booking history
GET /bookings/:bookingId — single booking details

5.4 Cancel Booking

POST /bookings/:bookingId/cancel
Release seats in Postgres
Delete hold keys in Redis
Trigger refund if payment already made


Phase 6: Payments Module
6.1 Initiate Payment

POST /payments/initiate/:bookingId
Create Razorpay order
Store idempotency key in Postgres
Return order details to client

6.2 BullMQ Payment Worker

src/queues/payment.worker.ts
Process payment job
Call Razorpay API
On success: mark booking confirmed, seat sold in both Postgres and Redis
On failure: retry with exponential backoff (3 retries)
After max retries: move to DLQ, release seat, notify user

6.3 Webhook Handler

POST /payments/webhook
Verify Razorpay signature (HMAC-SHA256)
Update booking and seat status
Push notification job
Security: reject any request with invalid signature immediately

6.4 Dead Letter Queue

Failed jobs land here after max retries
Log for manual inspection
Auto-release seat and notify user


Phase 7: Background Jobs
7.1 Seat Expiry Cron

src/jobs/seat-expiry.cron.ts
Runs every 60 seconds
Query: WHERE status = 'held' AND expires_at < NOW()
Release seats in Postgres
Delete hold keys in Redis
Mark bookings as expired

7.2 Notification Worker

src/queues/notification.worker.ts
Send confirmation email with e-ticket
Send failure notification
Send expiry notification


Phase 8: Security Hardening

 Rate limiting — src/middleware/rateLimiter.ts

Global: 100 req/min per IP
Booking endpoint: 5 req/min per user (prevent seat hoarding bots)
Auth endpoints: 10 attempts/hour per IP (prevent brute force)


 Helmet.js — sets secure HTTP headers
 CORS configuration — whitelist only your frontend domain
 Request size limiting — prevent large payload attacks
 SQL injection audit — verify every query uses parameterized inputs
 JWT algorithm pinning — explicitly specify { algorithms: ['HS256'] }
 Refresh token rotation — invalidate old token on every refresh
 Webhook signature verification — every single webhook call


Phase 9: Observability

 Structured logging with Pino — every request logged with requestId
 Request ID middleware — trace a single request across all logs
 Error logging — stack traces in development, clean messages in production
 BullMQ job logging — log every job start, success, failure
 Health check endpoint — GET /health — checks Postgres + Redis connectivity


Phase 10: Load Testing

 Install k6
 Write scenario: 10,000 concurrent users booking same event
 Assert: exactly N successful bookings (N = seat count)
 Assert: zero overselling
 Assert: p95 response time under 200ms for booking endpoint
 Document results — this goes in your README and resume


Phase 11: Docker + Deployment

 Dockerfile for Node.js app
 docker-compose.yml — app + Postgres + Redis
 Environment variable management
 Deploy to Railway or Render (simplest for solo projects)
 Production Postgres on Supabase or Railway
 Production Redis on Upstash


README (Do This Last, It Matters)
Your README should have:

Architecture diagram
Why each technology was chosen
The three hard problems and how you solved them
Load test results with screenshots
How to run locally


Interview Talking Points (Know These Cold)
By the time you finish this project you should be able to answer all of these without thinking:

How do you prevent overselling?
What happens if Redis crashes during a booking?
Why is payment async? What happens if the worker crashes mid-payment?
How do you handle the 10-minute seat hold expiry?
What's the write order between Redis and Postgres and why?
What does your Lua script do and why is atomicity important?
How do you prevent a user from hoarding seats?
What indexes did you add and why?
How does your webhook handler verify the request is legitimate?
What happens under a cache stampede and how do you prevent it?
Why a monolith over microservices?
How would you scale this if traffic 10x'd?