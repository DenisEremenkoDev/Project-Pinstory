import { api } from '../../app/api'
import type { CollectionSummaryDto, PlaceDto } from '../../shared/lib/apiTypes'

interface PersonSearchResult {
  id: string
  displayName: string
  avatarUrl: string | null
  isFollowing: boolean
  isCloseFriend: boolean
  trustSignal: string | null
}

interface PersonDetail {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isCloseFriend: boolean
  trustSignal: string | null
}

export const peopleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchPeople: builder.query<PersonSearchResult[], string>({
      query: (q) => ({ url: '/people/search', params: { q } }),
      transformResponse: (response: { people: PersonSearchResult[] }) => response.people,
      providesTags: (result) =>
        result
          ? [...result.map((person) => ({ type: 'Person' as const, id: person.id })), { type: 'Person' as const, id: 'LIST' }]
          : [{ type: 'Person' as const, id: 'LIST' }],
    }),

    getPerson: builder.query<PersonDetail, string>({
      query: (id) => `/people/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Person', id }],
    }),

    follow: builder.mutation<{ isFollowing: boolean }, string>({
      query: (id) => ({ url: `/people/${id}/follow`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Person', id }],
    }),

    unfollow: builder.mutation<{ isFollowing: boolean }, string>({
      query: (id) => ({ url: `/people/${id}/follow`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Person', id }],
    }),

    toggleCloseFriend: builder.mutation<{ isCloseFriend: boolean }, { id: string; isCloseFriend: boolean }>({
      query: ({ id, isCloseFriend }) => ({
        url: `/people/${id}/close-friend`,
        method: 'PATCH',
        body: { isCloseFriend },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Person', id }],
    }),

    getPersonPlaces: builder.query<PlaceDto[], string>({
      query: (id) => `/people/${id}/places`,
      transformResponse: (response: { places: PlaceDto[] }) => response.places,
      providesTags: (_result, _error, id) => [{ type: 'Person', id: `${id}-places` }],
    }),

    getPersonCollections: builder.query<CollectionSummaryDto[], string>({
      query: (id) => `/people/${id}/collections`,
      transformResponse: (response: { collections: CollectionSummaryDto[] }) => response.collections,
      providesTags: (_result, _error, id) => [{ type: 'Person', id: `${id}-collections` }],
    }),
  }),
})

export const {
  useSearchPeopleQuery,
  useGetPersonQuery,
  useFollowMutation,
  useUnfollowMutation,
  useToggleCloseFriendMutation,
  useGetPersonPlacesQuery,
  useGetPersonCollectionsQuery,
} = peopleApi
