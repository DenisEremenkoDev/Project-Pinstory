import { api } from '../../app/api'
import type { ProfileDto, Visibility } from '../../shared/lib/apiTypes'

interface UpdateProfileRequest {
  displayName?: string
  avatarUrl?: string | null
  bio?: string | null
  status?: string | null
  defaultVisibility?: Visibility
  notificationsEnabled?: boolean
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileDto, void>({
      query: () => '/profile',
      providesTags: [{ type: 'Profile', id: 'ME' }],
    }),

    updateProfile: builder.mutation<ProfileDto, UpdateProfileRequest>({
      query: (body) => ({ url: '/profile', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
