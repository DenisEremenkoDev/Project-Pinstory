import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getCollectionsHandler,
  createCollectionHandler,
  updateCollectionHandler,
  deleteCollectionHandler,
  addPlaceHandler,
  removePlaceHandler,
} from '../controllers/collectionController'

const router = Router()

// Own + followed collections require a token (personalized aggregation).
router.get('/', requireAuth, getCollectionsHandler)
router.post('/', requireAuth, createCollectionHandler)
router.patch('/:id', requireAuth, updateCollectionHandler)
router.delete('/:id', requireAuth, deleteCollectionHandler)
router.post('/:id/places/:placeId', requireAuth, addPlaceHandler)
router.delete('/:id/places/:placeId', requireAuth, removePlaceHandler)

export default router
