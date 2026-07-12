import type { Prisma } from '@prisma/client'

/**
 * The single visibility helper. Every place read routes through this so the
 * privacy rule lives in exactly one place (see .claude/rules/privacy.md,
 * .claude/rules/backend.md — "one reusable visibility helper").
 *
 * A place is visible to a viewer iff they own it, or it is public. A private
 * place is invisible to everyone but its owner — including anonymous callers,
 * followers, and close friends.
 */
export function canViewPlace(
  place: { ownerId: string; visibility: 'public' | 'private' },
  viewerId: string | null,
): boolean {
  return place.ownerId === viewerId || place.visibility === 'public'
}

/**
 * Prisma where-clause for "places visible to `viewerId` owned by `ownerId`".
 * - ownerId === viewerId  → all of the caller's own places (public + private)
 * - ownerId !== viewerId  → only that owner's public places
 */
export function visiblePlacesWhere(ownerId: string, viewerId: string | null): Prisma.PlaceWhereInput {
  if (ownerId === viewerId) return { ownerId }
  return { ownerId, visibility: 'public' }
}
