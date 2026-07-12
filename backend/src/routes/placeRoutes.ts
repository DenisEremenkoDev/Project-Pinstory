import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/auth'
import {
  listPlacesHandler,
  getPlaceHandler,
  createPlaceHandler,
  updatePlaceHandler,
  deletePlaceHandler,
} from '../controllers/placeController'

const router = Router()

// GET /places — personal catalogue (own, incl. private). Token required.
router.get('/', requireAuth, listPlacesHandler)

// GET /places/:id — public read (public places readable without a token;
// owner sees private). optionalAuth extracts the viewer when present.
router.get('/:id', optionalAuth, getPlaceHandler)

// Mutations — token always required.
router.post('/', requireAuth, createPlaceHandler)
router.patch('/:id', requireAuth, updatePlaceHandler)
router.delete('/:id', requireAuth, deletePlaceHandler)

export default router
