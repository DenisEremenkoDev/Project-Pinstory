import type { PlaceDto } from '../../shared/lib/apiTypes'

// No canonical cross-user "place" entity exists (each user owns independent
// Place records), so "the same real-world spot" is approximated by name or
// close coordinates — used only for the friend map overlay comparison.
export function isSamePlace(a: PlaceDto, b: PlaceDto): boolean {
  if (a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) return true
  return Math.abs(a.latitude - b.latitude) < 0.002 && Math.abs(a.longitude - b.longitude) < 0.003
}

// The Prisma-locked status enum has no "visited" value (removed at the
// user's explicit request — see CLAUDE.md); "planned" or "favorite" both
// imply the place was actually experienced, "want_to_visit" is aspirational.
export function hasVisited(place: PlaceDto): boolean {
  return place.status !== 'want_to_visit'
}
