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

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi
