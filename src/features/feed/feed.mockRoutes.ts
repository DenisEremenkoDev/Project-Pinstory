import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb, type MockPlace } from '../../shared/lib/mockDb'
import type { FeedItemType } from '../../shared/lib/apiTypes'

function feedTypeFor(place: MockPlace): FeedItemType {
  if (place.status === 'want_to_visit') return 'wants_to_visit'
  if (place.note && place.note.trim()) return 'story_added'
  return 'place_added'
}

export const feedMockRoutes: MockRoute[] = [
  defineMockRoute('GET', '/feed', ({ searchParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const followingIds = mockDb.follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)

    const eligiblePlaces = mockDb.places.filter(
      (place) =>
        place.ownerId === currentUserId ||
        (followingIds.includes(place.ownerId) && place.visibility === 'public'),
    )

    const sorted = [...eligiblePlaces].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const cursor = searchParams.get('cursor')
    const limit = Number(searchParams.get('limit')) || 10
    const startIndex = cursor ? sorted.findIndex((place) => place.id === cursor) + 1 : 0
    const page = sorted.slice(startIndex, startIndex + limit)
    const lastPlace = page[page.length - 1]
    const nextCursor = startIndex + limit < sorted.length && lastPlace ? lastPlace.id : null

    const items = page.map((place) => {
      const owner = mockDb.users.find((user) => user.id === place.ownerId)
      return {
        type: feedTypeFor(place),
        place: {
          ...place,
          myFeedback:
            mockDb.feedback.find((f) => f.placeId === place.id && f.userId === currentUserId)
              ?.sentiment ?? null,
          isOwner: place.ownerId === currentUserId,
        },
        author: owner
          ? { id: owner.id, displayName: owner.displayName, avatarUrl: owner.avatarUrl }
          : { id: place.ownerId, displayName: 'Пользователь', avatarUrl: null },
        createdAt: place.createdAt,
      }
    })

    return { data: { items, nextCursor } }
  }),
]
