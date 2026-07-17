import type { Sentiment } from '@prisma/client'
import { prisma } from '../prisma'

// myFeedback now reflects the PLACE OWNER's own recommendation, the same for
// every viewer — not a per-viewer reaction (superseded D4, decisions.md,
// 2026-07-16, explicit maintainer request). A place can carry feedback rows
// from other users left before this change; only the row matching the
// place's own ownerId is ever surfaced.
export async function getOwnerFeedbackMap(
  places: { id: string; ownerId: string }[],
): Promise<Map<string, Sentiment>> {
  if (places.length === 0) return new Map()

  const rows = await prisma.placeFeedback.findMany({
    where: { placeId: { in: places.map((p) => p.id) } },
  })
  const ownerByPlace = new Map(places.map((p) => [p.id, p.ownerId]))

  const result = new Map<string, Sentiment>()
  for (const row of rows) {
    if (row.userId === ownerByPlace.get(row.placeId)) result.set(row.placeId, row.sentiment)
  }
  return result
}
