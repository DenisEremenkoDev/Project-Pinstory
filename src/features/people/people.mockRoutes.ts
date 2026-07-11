import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb } from '../../shared/lib/mockDb'

function isFollowing(followerId: string, followingId: string): boolean {
  return mockDb.follows.some((f) => f.followerId === followerId && f.followingId === followingId)
}

function findFollow(followerId: string, followingId: string) {
  return mockDb.follows.find((f) => f.followerId === followerId && f.followingId === followingId)
}

export const peopleMockRoutes: MockRoute[] = [
  defineMockRoute('GET', '/people/search', ({ searchParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const query = (searchParams.get('q') ?? '').trim().toLowerCase()
    const people = mockDb.users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => !query || user.displayName.toLowerCase().includes(query))
      .map((user) => ({
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isFollowing: isFollowing(currentUserId, user.id),
        isCloseFriend: findFollow(currentUserId, user.id)?.isCloseFriend ?? false,
        trustSignal: user.trustSignal,
      }))

    return { data: { people } }
  }),

  defineMockRoute('GET', '/people/:id', ({ pathParams, currentUserId }) => {
    const person = mockDb.users.find((user) => user.id === pathParams.id)
    if (!person) return mockError(404, 'Пользователь не найден', 'PERSON_NOT_FOUND')

    const follow = currentUserId ? findFollow(currentUserId, person.id) : undefined

    return {
      data: {
        id: person.id,
        displayName: person.displayName,
        avatarUrl: person.avatarUrl,
        bio: person.bio,
        followersCount: person.followersCount,
        followingCount: person.followingCount,
        isFollowing: !!follow,
        isCloseFriend: follow?.isCloseFriend ?? false,
        trustSignal: person.trustSignal,
      },
    }
  }),

  defineMockRoute('POST', '/people/:id/follow', ({ pathParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')
    const targetId = pathParams.id ?? ''
    if (targetId === currentUserId) return mockError(400, 'Нельзя подписаться на себя', 'CANNOT_FOLLOW_SELF')

    const person = mockDb.users.find((user) => user.id === targetId)
    if (!person) return mockError(404, 'Пользователь не найден', 'PERSON_NOT_FOUND')

    if (!isFollowing(currentUserId, targetId)) {
      mockDb.follows.push({ followerId: currentUserId, followingId: targetId, isCloseFriend: false })
    }

    return { data: { isFollowing: true } }
  }),

  defineMockRoute('DELETE', '/people/:id/follow', ({ pathParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')
    const targetId = pathParams.id ?? ''

    mockDb.follows = mockDb.follows.filter(
      (f) => !(f.followerId === currentUserId && f.followingId === targetId),
    )

    return { data: { isFollowing: false } }
  }),

  defineMockRoute('PATCH', '/people/:id/close-friend', ({ pathParams, body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')
    const targetId = pathParams.id ?? ''

    const follow = findFollow(currentUserId, targetId)
    if (!follow) return mockError(403, 'Сначала нужно подписаться', 'NOT_FOLLOWING')

    const { isCloseFriend } = body as { isCloseFriend: boolean }
    follow.isCloseFriend = isCloseFriend

    return { data: { isCloseFriend: follow.isCloseFriend } }
  }),

  defineMockRoute('GET', '/people/:id/places', ({ pathParams, currentUserId }) => {
    const places = mockDb.places
      .filter((place) => place.ownerId === pathParams.id && place.visibility === 'public')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((place) => ({
        ...place,
        myFeedback:
          mockDb.feedback.find((f) => f.placeId === place.id && f.userId === currentUserId)
            ?.sentiment ?? null,
        isOwner: place.ownerId === currentUserId,
      }))

    return { data: { places } }
  }),

  defineMockRoute('GET', '/people/:id/collections', ({ pathParams }) => {
    const collections = mockDb.collections
      .filter((collection) => collection.ownerId === pathParams.id && collection.visibility === 'public')
      .map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        placesCount: mockDb.collectionPlaces.filter((cp) => cp.collectionId === collection.id).length,
      }))

    return { data: { collections } }
  }),
]
