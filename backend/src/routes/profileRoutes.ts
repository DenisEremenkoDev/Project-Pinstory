import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getProfileHandler, updateProfileHandler } from '../controllers/profileController'

const router = Router()

// Own data — token always required.
router.get('/', requireAuth, getProfileHandler)
router.patch('/', requireAuth, updateProfileHandler)

export default router
