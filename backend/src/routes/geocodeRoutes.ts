import { Router } from 'express'
import { geocodeLimiter } from '../middleware/rateLimits'
import { geocodeSearchHandler } from '../controllers/geocodeController'

const router = Router()

// No auth required — non-sensitive, read-only lookup (same spirit as
// other public reads, ADR-07). Own stricter rate limit: metered external
// resource (1000 req/day free tier, BACKEND_INSTRUCTIONS.md §17).
router.get('/', geocodeLimiter, geocodeSearchHandler)

export default router
