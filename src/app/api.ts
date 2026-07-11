import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createMockBaseQuery, type MockBaseQuery } from '../shared/lib/mockBaseQuery'
import { authMockRoutes } from '../features/auth/auth.mockRoutes'
import { placesMockRoutes } from '../features/places/places.mockRoutes'
import { peopleMockRoutes } from '../features/people/people.mockRoutes'
import type { RootState } from './store'

// Flip VITE_USE_MOCKS to "false" (and set VITE_API_URL) once the real
// backend exists — no endpoint or component code needs to change.
const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

const mockBaseQuery: MockBaseQuery = createMockBaseQuery([
  ...authMockRoutes,
  ...placesMockRoutes,
  ...peopleMockRoutes,
])

const realBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return headers
  },
})

export const api = createApi({
  reducerPath: 'api',
  baseQuery: useMocks ? mockBaseQuery : realBaseQuery,
  tagTypes: ['Place', 'Person', 'Collection', 'Feed', 'Profile'],
  endpoints: () => ({}),
})
