# ADR-06 — Cross-user place identity

**Status:** Open, deferred. **Blocks:** nothing today.

## Context
Each user owns **independent `Place` rows**. There is no canonical, shared "real-world place" entity (D14).
"The same place" across two users is **approximated** by `mapMatching.isSamePlace`: a case-insensitive name
match, or coordinate proximity (`|Δlat| < 0.002 && |Δlng| < 0.003`).

The friend overlay's "common places" count is therefore an approximation. Overlaps can be imperfect.
**This is inherent to the schema, not a bug** (`current_state.md`, known issue #4).

## Why it is open
The design's Pinstory Plus tier promises **"общие карты с партнёром и семьёй"** (shared maps). A genuinely
shared map is hard to build on an approximation — two people editing "the same place" would still be
editing two different rows.

If shared maps are ever scoped, this forces one of:
- **A canonical `Place` entity** (a real-world POI) with per-user `PlaceMemory` rows attached — a
  significant schema change, and arguably the correct long-term model; or
- **A shared `Map` entity** with joint membership, sidestepping identity entirely; or
- Accepting the approximation and accepting that shared maps will be subtly wrong.

## Decision
**Defer.** The approximation is correct for the MVP and for everything currently scoped.

## The obligation
Do not deepen the dependency on `isSamePlace`. Keep it isolated in `mapMatching.ts`, keep the overlay math
pure, and keep the UI reading from `computeOverlayView` rather than reimplementing matching. As long as
matching lives in one pure function, replacing it later is contained.

## When to close
Only if shared maps are scoped. See ADR-03.
