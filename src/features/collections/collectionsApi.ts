import { api } from '../../app/api'
import type { FollowedCollectionDto, OwnCollectionDto, Visibility } from '../../shared/lib/apiTypes'

interface CollectionsResponse {
  own: OwnCollectionDto[]
  following: FollowedCollectionDto[]
}

interface CreateCollectionRequest {
  name: string
  description: string | null
  visibility: Visibility
}

type UpdateCollectionRequest = Partial<CreateCollectionRequest> & { id: string }

export const collectionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<CollectionsResponse, void>({
      query: () => '/collections',
      providesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    createCollection: builder.mutation<OwnCollectionDto, CreateCollectionRequest>({
      query: (body) => ({ url: '/collections', method: 'POST', body }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    updateCollection: builder.mutation<OwnCollectionDto, UpdateCollectionRequest>({
      query: ({ id, ...body }) => ({ url: `/collections/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    deleteCollection: builder.mutation<void, string>({
      query: (id) => ({ url: `/collections/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    addPlaceToCollection: builder.mutation<void, { collectionId: string; placeId: string }>({
      query: ({ collectionId, placeId }) => ({
        url: `/collections/${collectionId}/places/${placeId}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    removePlaceFromCollection: builder.mutation<void, { collectionId: string; placeId: string }>({
      query: ({ collectionId, placeId }) => ({
        url: `/collections/${collectionId}/places/${placeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddPlaceToCollectionMutation,
  useRemovePlaceFromCollectionMutation,
} = collectionsApi
