import type { Sentiment } from '@prisma/client'
import { prisma } from '../prisma'
import { assertPlaceVisibleForMutation } from './placeAccess'

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

// POST /places/:id/feedback — one opinion per (user, place): upsert, never insert.
export async function setFeedback(
  placeId: string,
  userId: string,
  sentiment: Sentiment,
): Promise<FeedbackResponse> {
  await assertPlaceVisibleForMutation(placeId, userId)
  await prisma.placeFeedback.upsert({
    where: { userId_placeId: { userId, placeId } },
    create: { userId, placeId, sentiment },
    update: { sentiment },
  })
  return { sentiment, ...(await counts(placeId)) }
}

// DELETE /places/:id/feedback — remove the caller's opinion. Idempotent.
export async function clearFeedback(placeId: string, userId: string): Promise<FeedbackResponse> {
  await assertPlaceVisibleForMutation(placeId, userId)
  await prisma.placeFeedback.deleteMany({ where: { userId, placeId } })
  return { sentiment: null, ...(await counts(placeId)) }
}
