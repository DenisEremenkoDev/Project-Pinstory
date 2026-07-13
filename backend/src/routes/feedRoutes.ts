import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getFeedHandler } from '../controllers/feedController'

const router = Router()

// GET /feed — personalized (own + followed public). Token required (ADR-07).
router.get('/', requireAuth, getFeedHandler)

export default router
