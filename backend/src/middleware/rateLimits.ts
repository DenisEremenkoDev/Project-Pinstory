import rateLimit from 'express-rate-limit'

// General limit: ~100 requests / 15 min / IP for the whole app.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Слишком много запросов, попробуйте позже', code: 'RATE_LIMIT_EXCEEDED' } },
})

// Stricter limit on auth endpoints and photo upload: ~10 requests / 15 min / IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Слишком много попыток, попробуйте позже', code: 'RATE_LIMIT_EXCEEDED' } },
})
