// ─── Imports ─────────────────────────────────────────────────────────────────
// The web framework itself. `express` is the default export → a factory function
// you call to create an app. Example: `const app = express()`.
import express from 'express'
// Parses the `Cookie:` request header into a JS object on `req.cookies`.
// Example: browser sends `Cookie: token=abc` → `req.cookies.token === 'abc'`.
import cookieParser from 'cookie-parser'
// Sets a bundle of security-related HTTP response headers automatically.
// Example: adds `X-Content-Type-Options: nosniff` to every response.
import helmet from 'helmet'
// Enables/controls Cross-Origin Resource Sharing (which websites may call this API).
// Example: lets `http://localhost:5173` (your React app) call this backend.
import cors from 'cors'
// HTTP request logger built on pino. Logs one line per request with method/status/time.
// Named export, so we use `{ pinoHttp }`. Example log: `GET / 200 3ms`.
import { pinoHttp } from 'pino-http'
// Your validated environment variables (typed & parsed by zod in config/env.ts).
// Example: `env.PORT` is a number like 4000, guaranteed to exist.
// NOTE: `.js` extension is required by your NodeNext tsconfig for `npm run build`.
import { env } from './config/env.js'
// The shared pino logger instance (default export). Redacts secrets like passwords.
// Example: `logger.info('hello')` prints a structured JSON/pretty log line.
import logger from './utils/logger.js'
// Your centralized error-handling middleware (named export).
// Example: when a route throws `new NotFoundError()`, this turns it into a 404 JSON.
import { errorHandler } from './middleware/errorHandler.js'

// ─── Create the application ──────────────────────────────────────────────────
// `express()` returns an app object. Everything below configures THIS object.
// Middleware/routes run top-to-bottom in the order they are registered.
const app = express()

// ─── Trust the proxy ─────────────────────────────────────────────────────────
// In production you sit behind Nginx/Heroku/etc. Those forward the real client IP
// in the `X-Forwarded-For` header. `trust proxy = 1` tells Express to trust the
// first proxy, so `req.ip` is the REAL user IP (not the proxy's) and `secure`
// cookies work over the proxy's HTTPS. Example: user 203.0.113.5 → Nginx → app;
// `req.ip` becomes 203.0.113.5 instead of 127.0.0.1.
app.set('trust proxy', 1)

// ─── Hide the framework ──────────────────────────────────────────────────────
// By default Express sends `X-Powered-By: Express`, telling attackers what you run.
// Disabling it removes that header. Example: response headers no longer leak "Express".
app.disable('x-powered-by')

// ─── Security headers ────────────────────────────────────────────────────────
// `helmet()` returns a middleware; `app.use(...)` runs it on EVERY request.
// It sets ~15 protective headers (CSP, HSTS, frameguard, nosniff…).
// Example: `X-Frame-Options: SAMEORIGIN` stops other sites iframing you (clickjacking).
app.use(helmet())

// ─── CORS (Cross-Origin Resource Sharing) ────────────────────────────────────
// Read the allowed origins from env (a comma-separated string) and turn it into an
// array, trimming spaces. Example: "http://a.com, http://b.com"
//   → ['http://a.com', 'http://b.com'].
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim())
app.use(
  cors({
    // `origin` is called for each request with the caller's Origin header.
    // We decide yes/no via the `callback(error, allowed)` pattern.
    origin(origin, callback) {
      // No Origin header = not a browser cross-origin call (e.g. curl, Postman,
      // a mobile app, or same-origin). We allow those. `includes` = is it whitelisted?
      // Example: origin 'http://localhost:5173' in the list → allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        // First arg null = "no error", second arg true = "yes, allow this origin".
        callback(null, true)
        return
      }
      // Origin present but NOT in the allow-list → reject with an error.
      // Example: 'http://evil.com' → browser blocks the response.
      callback(new Error('Not allowed by CORS'))
    },
    // Allow cookies/Authorization headers to be sent cross-origin.
    // Required because you use cookie-based auth. Note: with credentials=true you
    // must use a specific origin (never '*'), which is exactly what we do above.
    credentials: true,
  })
)

// ─── Body parsers ────────────────────────────────────────────────────────────
// Parse JSON request bodies into `req.body`. Without this, `req.body` is undefined.
// `limit: '10kb'` rejects bodies larger than 10 KB with 413, blunting DoS via huge
// payloads. Example: `POST /login {"email":"a@b.com"}` → `req.body.email === 'a@b.com'`.
app.use(express.json({ limit: '10kb' }))
// Parse HTML form submissions (`application/x-www-form-urlencoded`). `extended: true`
// allows rich nested objects. Example: form field `user[name]=Vishal`
//   → `req.body.user.name === 'Vishal'`.
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ─── Cookie parser ───────────────────────────────────────────────────────────
// Populates `req.cookies` from the incoming `Cookie` header (runs after helmet/cors
// so those apply first). Example: `Cookie: refreshToken=xyz` → `req.cookies.refreshToken`.
app.use(cookieParser())

// ─── Request logging ─────────────────────────────────────────────────────────
// Logs every request/response using YOUR configured pino `logger` (so redaction of
// passwords/tokens applies). Example line: `INFO request completed GET / 200 2ms`.
app.use(pinoHttp({ logger }))

// ─── Health check route ──────────────────────────────────────────────────────
// A simple GET `/` used by load balancers/uptime checks to verify the app is alive.
// `_req` is prefixed with `_` to signal "intentionally unused" (satisfies noUnusedParameters).
// Example: `curl localhost:4000/` → `{"status":"ok"}` with HTTP 200.
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// ─── Feature routes ──────────────────────────────────────────────────────────
// Mount each module's router under a base path. Commented out until auth.routes.ts
// exports a router (importing an empty file would crash at startup).
// Example once ready: `app.use('/api/auth', authRoutes)` → enables `POST /api/auth/register`.
// app.use('/api/auth', authRoutes)

// ─── 404 handler ─────────────────────────────────────────────────────────────
// Reached only if NO route above matched (order matters — it must come after routes).
// Returns a consistent JSON error instead of Express's default HTML page.
// Example: `GET /does-not-exist` → 404 `{"success":false,"message":"Route not found"}`.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  })
})

// ─── Error handler ───────────────────────────────────────────────────────────
// Express recognizes this as an error handler because its function has 4 args
// (err, req, res, next) — see errorHandler.ts. It MUST be registered LAST so it
// catches errors thrown/`next(err)`-ed by any route above.
// Example: a controller does `throw new UnauthorizedError()` → this replies 401 JSON.
app.use(errorHandler)

// ─── Start the server ────────────────────────────────────────────────────────
// Begin listening for HTTP connections on the validated port. The callback runs
// once the socket is open. Example: prints "Server listening on http://localhost:4000".
app.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`)
})

// Export the configured app (useful for testing with e.g. supertest, or a separate
// server bootstrap file). Example: `import app from './app.js'` in a test.
export default app