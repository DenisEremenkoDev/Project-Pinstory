import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb, type MockUser } from '../../shared/lib/mockDb'
import type { ProfileDto } from '../../shared/lib/apiTypes'

function buildProfile(user: MockUser): ProfileDto {
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      defaultVisibility: user.defaultVisibility,
      notificationsEnabled: user.notificationsEnabled,
    },
    placesCount: mockDb.places.filter((place) => place.ownerId === user.id).length,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
  }
}

export const profileMockRoutes: MockRoute[] = [
  defineMockRoute('GET', '/profile', ({ currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')
    const user = mockDb.users.find((candidate) => candidate.id === currentUserId)
    if (!user) return mockError(404, 'Пользователь не найден', 'USER_NOT_FOUND')

    return { data: buildProfile(user) }
  }),

  defineMockRoute('PATCH', '/profile', ({ body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')
    const user = mockDb.users.find((candidate) => candidate.id === currentUserId)
    if (!user) return mockError(404, 'Пользователь не найден', 'USER_NOT_FOUND')

    Object.assign(user, body as Partial<MockUser>)

    return { data: buildProfile(user) }
  }),
]
