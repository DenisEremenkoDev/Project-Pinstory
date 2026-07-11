import { api } from '../../app/api'
import type { FeedItemDto } from '../../shared/lib/apiTypes'

interface FeedResponse {
  items: FeedItemDto[]
  nextCursor: string | null
}

interface FeedRequest {
  cursor?: string
}

export const feedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, FeedRequest>({
      query: (arg) => ({ url: '/feed', params: { cursor: arg.cursor, limit: 10 } }),
      serializeQueryArgs: () => 'feed',
      merge: (currentCache, newData) => {
        currentCache.items.push(...newData.items)
        currentCache.nextCursor = newData.nextCursor
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      providesTags: [{ type: 'Feed', id: 'LIST' }],
    }),
  }),
})

export const { useGetFeedQuery } = feedApi
