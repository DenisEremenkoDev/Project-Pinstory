import type { Sentiment } from '@prisma/client'
import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'

export interface FeedbackResponse {
  sentiment: Sentiment | null
  likesCount: number
  dislikesCount: number
}

async function counts(placeId: string): Promise<Pick<FeedbackResponse, 'likesCount' | 'dislikesCount'>> {
  const [likesCount, dislikesCount] = await Promise.all([
    prisma.placeFeedback.count({ where: { placeId, sentiment: 'like' } }),
    prisma.placeFeedback.count({ where: { placeId, sentiment: 'dislike' } }),
  ])
  return { likesCount, dislikesCount }
}

// Feedback is now the place OWNER's own recommendation, shown to every
// viewer — only the owner may set it (superseded D4, 2026-07-16, explicit
// maintainer request). Owner-only, not merely visibility-gated: a stranger
// on a PUBLIC place now also gets 403, which is new behavior versus the old
// "anyone who can see it can react" model.
async function assertPlaceOwnedForFeedback(placeId: string, userId: string): Promise<void> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place) throw createError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
  if (place.ownerId !== userId) {
    throw createError(403, 'Отметить можно только своё место', 'PLACE_FORBIDDEN')
  }
}

// POST /places/:id/feedback — one recommendation per place: upsert, never insert.
export async function setFeedback(
  placeId: string,
  userId: string,
  sentiment: Sentiment,
): Promise<FeedbackResponse> {
  await assertPlaceOwnedForFeedback(placeId, userId)
  await prisma.placeFeedback.upsert({
    where: { userId_placeId: { userId, placeId } },
    create: { userId, placeId, sentiment },
    update: { sentiment },
  })
  return { sentiment, ...(await counts(placeId)) }
}

// DELETE /places/:id/feedback — clear the owner's recommendation. Idempotent.
export async function clearFeedback(placeId: string, userId: string): Promise<FeedbackResponse> {
  await assertPlaceOwnedForFeedback(placeId, userId)
  await prisma.placeFeedback.deleteMany({ where: { userId, placeId } })
  return { sentiment: null, ...(await counts(placeId)) }
}
