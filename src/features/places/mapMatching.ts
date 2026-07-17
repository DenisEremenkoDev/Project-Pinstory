import type { PlaceDto } from '../../shared/lib/apiTypes'

// No canonical cross-user "place" entity exists (each user owns independent
// Place records), so "the same real-world spot" is approximated by name or
// close coordinates — used only for the friend map overlay comparison.
export function isSamePlace(a: PlaceDto, b: PlaceDto): boolean {
  if (a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) return true
  return Math.abs(a.latitude - b.latitude) < 0.002 && Math.abs(a.longitude - b.longitude) < 0.003
}

// The Prisma-locked status enum has no "visited" value (removed at the
// user's explicit request — see CLAUDE.md). A place counts as visited once
// its owner has recommended it either way (myFeedback set) — or, for places
// created before the "Рекомендую/Не рекомендую" model (2026-07-16), if its
// creation-time status was already something other than "want_to_visit".
export function hasVisited(place: PlaceDto): boolean {
  return place.status !== 'want_to_visit' || place.myFeedback !== null
}
