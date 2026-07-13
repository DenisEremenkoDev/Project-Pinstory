import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/auth'
import {
  searchPeopleHandler,
  getPersonHandler,
  followHandler,
  unfollowHandler,
  closeFriendHandler,
  getPersonPlacesHandler,
  getPersonCollectionsHandler,
} from '../controllers/peopleController'

const router = Router()

// /search must be registered before /:id — otherwise "search" matches as an id.
// Personalized (isFollowing/isCloseFriend per result) — token required.
router.get('/search', requireAuth, searchPeopleHandler)

// Public reads (ADR-07): readable without a token, isFollowing/isCloseFriend
// default to false for an anonymous caller.
router.get('/:id', optionalAuth, getPersonHandler)
router.get('/:id/places', optionalAuth, getPersonPlacesHandler)
router.get('/:id/collections', getPersonCollectionsHandler)

// Mutations — token always required.
router.post('/:id/follow', requireAuth, followHandler)
router.delete('/:id/follow', requireAuth, unfollowHandler)
router.patch('/:id/close-friend', requireAuth, closeFriendHandler)

export default router
