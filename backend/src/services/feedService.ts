import type { Place } from '@prisma/client'
import { prisma } from '../prisma'
import { toPlaceDto } from '../mappers/placeMapper'
import type { FeedItemType } from '../schemas/feedSchemas'

export interface FeedItemDto {
  type: FeedItemType
  place: ReturnType<typeof toPlaceDto>
  author: { id: string; displayName: string; avatarUrl: string | null }
  createdAt: string
}

// Mirrors feed.mockRoutes.ts `feedTypeFor` exactly: computed from the place's
// CURRENT status/note at read time, not stored at creation — despite
// BACKEND_INSTRUCTIONS.md §11 saying "at creation time." The mock is the
// executable spec (CLAUDE.md source precedence: code wins over archived
// planning prose) and it recomputes dynamically on every GET /feed call, so a
// place's feed framing can change if its status/note changes after creation.
function feedTypeFor(place: Pick<Place, 'status' | 'note'>): FeedItemType {
  if (place.status === 'want_to_visit') return 'wants_to_visit'
  if (place.note?.trim()) return 'story_added'
  return 'place_added'
}

// GET /feed — own + followed users' public places, cursor-paginated.
// Keyset pagination (createdAt desc, id desc) rather than Prisma's native
// `cursor` option: an unknown/stale cursor id falls back to page 1, matching
// the mock's findIndex(-1)+1=0 behavior, instead of throwing.
export async function getFeed(
  userId: string,
  cursor: string | null,
  limit: number,
): Promise<{ items: FeedItemDto[]; nextCursor: string | null }> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const followingIds = follows.map((f) => f.followingId)

  const cursorAnchor = cursor
    ? await prisma.place.findUnique({ where: { id: cursor }, select: { createdAt: true, id: true } })
    : null

  const results = await prisma.place.findMany({
    where: {
      AND: [
        { OR: [{ ownerId: userId }, { ownerId: { in: followingIds }, visibility: 'public' }] },
        ...(cursorAnchor
          ? [
              {
                OR: [
                  { createdAt: { lt: cursorAnchor.createdAt } },
                  { createdAt: cursorAnchor.createdAt, id: { lt: cursorAnchor.id } },
                ],
              },
            ]
          : []),
      ],
    },
    include: { owner: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })

  const hasMore = results.length > limit
  const page = hasMore ? results.slice(0, limit) : results
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null

  const feedback = await prisma.placeFeedback.findMany({
    where: { userId, placeId: { in: page.map((p) => p.id) } },
  })
  const feedbackByPlace = new Map(feedback.map((f) => [f.placeId, f.sentiment]))

  const items: FeedItemDto[] = page.map((place) => ({
    type: feedTypeFor(place),
    place: toPlaceDto(place, userId, feedbackByPlace.get(place.id) ?? null),
    author: { id: place.owner.id, displayName: place.owner.displayName, avatarUrl: place.owner.avatarUrl },
    createdAt: place.createdAt.toISOString(),
  }))

  return { items, nextCursor }
}
