import type { Place } from '@prisma/client'
import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { canViewPlace } from './visibility'

// For AUTHENTICATED mutations that touch an existing place (feedback, comments).
// Distinguishes 404 (no such place) from 403 (exists, invisible to the caller).
// This is deliberately NOT the ADR-07 C2 collapse used by the public GET reads
// (GET /places/:id, GET /places/:id/comments) — those are reachable anonymously,
// so distinguishing codes leaks an existence oracle to the open internet. These
// routes always require a valid token first, so there is no anonymous prober to
// protect against here. Matches testing.md P1 #14 (feedback → 403) and #15
// (comments → 403), not a 404 collapse.
export async function assertPlaceVisibleForMutation(placeId: string, userId: string): Promise<Place> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place) throw createError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
  if (!canViewPlace(place, userId)) throw createError(403, 'Это место недоступно', 'PLACE_FORBIDDEN')
  return place
}
