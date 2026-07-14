import rateLimit from 'express-rate-limit'

// Integration tests (Supertest) fire far more than 10-100 requests per IP within
// the same 15-minute window by design — skip rate limiting under NODE_ENV=test so
// that's a property of the harness, not the production limiter logic below.
const skipInTest = (): boolean => process.env.NODE_ENV === 'test'

// General limit: ~100 requests / 15 min / IP for the whole app.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: { message: 'Слишком много запросов, попробуйте позже', code: 'RATE_LIMIT_EXCEEDED' } },
})

// Stricter limit on auth endpoints and photo upload: ~10 requests / 15 min / IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: { message: 'Слишком много попыток, попробуйте позже', code: 'RATE_LIMIT_EXCEEDED' } },
})

// Yandex Geocoder free tier is 1000 requests/day TOTAL (BACKEND_INSTRUCTIONS.md
// §17) — a shared, metered external budget. This server-side limit is the real
// protection (a client-side debounce is not a trust boundary — anyone can call
// this route directly and skip it); the frontend's 300-500ms debounce just
// keeps normal typing from needlessly burning the daily budget.
export const geocodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Слишком много запросов геокодирования, попробуйте позже', code: 'RATE_LIMIT_EXCEEDED' } },
})
