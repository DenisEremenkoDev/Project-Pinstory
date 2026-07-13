import { api } from '../../app/api'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl: string | null
  }
}

interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

interface RegisterResponse {
  id: string
  email: string
  displayName: string
}

interface RefreshResponse {
  accessToken: string
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    // Called once on app load to silently restore a session from the httpOnly
    // refresh cookie. Always 401 in mock mode — there is no persisted cookie.
    refresh: builder.mutation<RefreshResponse, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useRefreshMutation, useLogoutMutation } = authApi
