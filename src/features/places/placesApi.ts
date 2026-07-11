import { api } from '../../app/api'
import type { PlaceCommentDto, PlaceDto, Sentiment } from '../../shared/lib/apiTypes'

interface PlaceDetailDto extends PlaceDto {
  commentsCount: number
  likesCount: number
  dislikesCount: number
}

type CreatePlaceRequest = Omit<PlaceDto, 'id' | 'createdAt' | 'myFeedback' | 'photoUrl' | 'isOwner'>
type UpdatePlaceRequest = Partial<CreatePlaceRequest> & { id: string }

interface FeedbackResponse {
  sentiment: Sentiment | null
  likesCount: number
  dislikesCount: number
}

export const placesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlaces: builder.query<PlaceDto[], void>({
      query: () => '/places',
      transformResponse: (response: { places: PlaceDto[] }) => response.places,
      providesTags: (result) =>
        result
          ? [...result.map((place) => ({ type: 'Place' as const, id: place.id })), { type: 'Place' as const, id: 'LIST' }]
          : [{ type: 'Place' as const, id: 'LIST' }],
    }),

    getPlace: builder.query<PlaceDetailDto, string>({
      query: (id) => `/places/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Place', id }],
    }),

    createPlace: builder.mutation<PlaceDto, CreatePlaceRequest>({
      query: (body) => ({ url: '/places', method: 'POST', body }),
      invalidatesTags: [{ type: 'Place', id: 'LIST' }],
    }),

    updatePlace: builder.mutation<PlaceDto, UpdatePlaceRequest>({
      query: ({ id, ...body }) => ({ url: `/places/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Place', id },
        { type: 'Place', id: 'LIST' },
      ],
    }),

    deletePlace: builder.mutation<void, string>({
      query: (id) => ({ url: `/places/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Place', id },
        { type: 'Place', id: 'LIST' },
      ],
    }),

    setFeedback: builder.mutation<FeedbackResponse, { placeId: string; sentiment: Sentiment }>({
      query: ({ placeId, sentiment }) => ({
        url: `/places/${placeId}/feedback`,
        method: 'POST',
        body: { sentiment },
      }),
      invalidatesTags: (_result, _error, { placeId }) => [
        { type: 'Place', id: placeId },
        { type: 'Place', id: 'LIST' },
      ],
    }),

    clearFeedback: builder.mutation<FeedbackResponse, string>({
      query: (placeId) => ({ url: `/places/${placeId}/feedback`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, placeId) => [
        { type: 'Place', id: placeId },
        { type: 'Place', id: 'LIST' },
      ],
    }),

    getPlaceComments: builder.query<PlaceCommentDto[], string>({
      query: (placeId) => `/places/${placeId}/comments`,
      transformResponse: (response: { comments: PlaceCommentDto[] }) => response.comments,
      providesTags: (_result, _error, placeId) => [{ type: 'Place', id: `${placeId}-comments` }],
    }),

    createComment: builder.mutation<PlaceCommentDto, { placeId: string; rating: number; text: string }>({
      query: ({ placeId, ...body }) => ({ url: `/places/${placeId}/comments`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { placeId }) => [
        { type: 'Place', id: `${placeId}-comments` },
        { type: 'Place', id: placeId },
      ],
    }),

    updateComment: builder.mutation<PlaceCommentDto, { placeId: string; commentId: string; rating: number; text: string }>({
      query: ({ placeId, commentId, ...body }) => ({
        url: `/places/${placeId}/comments/${commentId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { placeId }) => [{ type: 'Place', id: `${placeId}-comments` }],
    }),

    deleteComment: builder.mutation<void, { placeId: string; commentId: string }>({
      query: ({ placeId, commentId }) => ({ url: `/places/${placeId}/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { placeId }) => [
        { type: 'Place', id: `${placeId}-comments` },
        { type: 'Place', id: placeId },
      ],
    }),
  }),
})

export const {
  useGetPlacesQuery,
  useGetPlaceQuery,
  useCreatePlaceMutation,
  useUpdatePlaceMutation,
  useDeletePlaceMutation,
  useSetFeedbackMutation,
  useClearFeedbackMutation,
  useGetPlaceCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = placesApi
