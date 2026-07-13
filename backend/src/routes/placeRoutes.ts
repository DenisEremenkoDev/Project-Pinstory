import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimits'
import { photoUpload } from '../lib/upload'
import {
  listPlacesHandler,
  getPlaceHandler,
  createPlaceHandler,
  updatePlaceHandler,
  deletePlaceHandler,
} from '../controllers/placeController'
import { setFeedbackHandler, clearFeedbackHandler } from '../controllers/feedbackController'
import { uploadPhotoHandler } from '../controllers/photoController'
import {
  getCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
} from '../controllers/commentController'

const router = Router()

// GET /places — personal catalogue (own, incl. private). Token required.
router.get('/', requireAuth, listPlacesHandler)

// GET /places/:id — public read (public places readable without a token;
// owner sees private). optionalAuth extracts the viewer when present.
router.get('/:id', optionalAuth, getPlaceHandler)

// Place mutations — token always required.
router.post('/', requireAuth, createPlaceHandler)
router.patch('/:id', requireAuth, updatePlaceHandler)
router.delete('/:id', requireAuth, deletePlaceHandler)

// Feedback — mutations, token required (DELETE too, per ADR-07 C1).
router.post('/:id/feedback', requireAuth, setFeedbackHandler)
router.delete('/:id/feedback', requireAuth, clearFeedbackHandler)

// Photo upload — stricter rate limit; multer attached to THIS route only.
router.post('/:id/photo', authLimiter, requireAuth, photoUpload, uploadPhotoHandler)

// Comments — GET is a public read (collapses to 404, ADR-07 C2); mutations
// require a token and use 403 for an invisible place (testing.md P1-#15).
router.get('/:id/comments', optionalAuth, getCommentsHandler)
router.post('/:id/comments', requireAuth, createCommentHandler)
router.patch('/:id/comments/:commentId', requireAuth, updateCommentHandler)
router.delete('/:id/comments/:commentId', requireAuth, deleteCommentHandler)

export default router
