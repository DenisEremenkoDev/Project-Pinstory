import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb, nextMockId } from '../../shared/lib/mockDb'

interface RegisterBody {
  email: string
  password: string
  displayName: string
}

interface LoginBody {
  email: string
  password: string
}

// The mock has no real cookie storage, so refresh/logout are no-ops that
// always succeed — there's nothing to verify without a backend session.
export const authMockRoutes: MockRoute[] = [
  defineMockRoute('POST', '/auth/register', ({ body }) => {
    const { email, password, displayName } = body as RegisterBody

    if (!email || !password || !displayName) {
      return mockError(400, 'email, password и displayName обязательны', 'VALIDATION_ERROR')
    }
    if (mockDb.users.some((user) => user.email === email)) {
      return mockError(409, 'Пользователь с таким email уже существует', 'EMAIL_TAKEN')
    }

    const user = {
      id: nextMockId('user'),
      email,
      password,
      displayName,
      avatarUrl: null,
      bio: null,
      status: null,
      followersCount: 0,
      followingCount: 0,
      trustSignal: null,
    }
    mockDb.users.push(user)

    return { data: { id: user.id, email: user.email, displayName: user.displayName } }
  }),

  defineMockRoute('POST', '/auth/login', ({ body }) => {
    const { email, password } = body as LoginBody
    const user = mockDb.users.find((candidate) => candidate.email === email)

    if (!user || user.password !== password) {
      return mockError(401, 'Неверный email или пароль', 'INVALID_CREDENTIALS')
    }

    return {
      data: {
        accessToken: `mock-token-${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    }
  }),

  defineMockRoute('POST', '/auth/logout', () => ({ data: undefined })),
]
