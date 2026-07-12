import { Router } from 'express'
import { authLimiter } from '../middleware/rateLimits'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from '../controllers/authController'

const router = Router()

router.use(authLimiter)

router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', logoutHandler)

export default router
