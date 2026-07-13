export type FeedItemType = 'place_added' | 'wants_to_visit' | 'story_added'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export function parseFeedLimit(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(n), MAX_LIMIT)
}
