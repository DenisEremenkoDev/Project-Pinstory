---
description: The dual-mode map subsystem. Renderer-agnostic by design.
globs:
  - "src/features/places/**Map**"
  - "src/shared/lib/map*.ts"
  - "src/shared/lib/yandexMaps.ts"
  - "src/shared/lib/mapsConfig.ts"
---

# Map

The map is a **rendering and integration** concern. **There is no spatial query layer in Pinstory** — no bbox, no radius, no `near`, no spatial index. `GET /places` returns all of the caller's places; the map projects them. Do not introduce geo-querying without an explicit product decision.

## ⚠ The coordinate trap
**ymaps3 uses `[longitude, latitude]` — the reverse of `PlaceDto`'s field order.** This is the single most frequent source of bugs in this subsystem. Check the order every time.

## Dual mode, one data contract
```ts
type MapLayer = { source: 'own' | 'friend'; places: { place: PlaceDto; variant?: ... }[] }
```
`MapPage` builds `layers: MapLayer[]`. **Both renderers consume the same array.** Never hardcode a place list — the friend overlay is a first-class second layer (D11).

| | Placeholder mode (default) | Real mode |
|---|---|---|
| Trigger | no key | `VITE_YANDEX_MAPS_API_KEY` set → `hasRealMapsKey` |
| Renderer | `MapPins` (absolutely-positioned buttons) | `YandexMap.tsx` (ymaps3 markers) |
| Position | `mapProjection.projectToPercent` | ymaps3 `[lng, lat]` |
| Click-to-add | `projectFromPercent` | `onFastClick` geo coords |

`hasRealMapsKey` is the **only** switch (D12) — the same pattern as `VITE_USE_MOCKS`. The app must always run and deploy with no map key.

## Service-layer isolation (D13)
- **Only `mapsConfig.ts` reads `import.meta.env.VITE_YANDEX_MAPS_API_KEY`.**
- **Only `yandexMaps.ts` loads the SDK script and touches the `ymaps3` global.** It lazy-loads once, memoizes the promise, and resets it on failure to allow retry.
- Components call `loadYmaps3()` and never see the SDK. **This isolation is what makes a future native map plugin a contained change** — do not leak `ymaps3` upward.

## Pure overlay math
- `mapMatching.isSamePlace(a, b)` — **an approximation**, by name (case-insensitive) or proximity (`|Δlat| < 0.002 && |Δlng| < 0.003`). There is no canonical cross-user place entity; each user owns independent `Place` rows (D14). Overlaps can be imperfect. That is inherent to the schema, not a bug.
- `mapMatching.hasVisited(place)` — status is not `want_to_visit`. **There is no "visited" status and never will be.**
- `mapOverlayFilter.computeOverlayView(filter, own, friend)` is the brain of the overlay. `MapFriendOverlay` renders legend and chips only. **Keep the math pure and tested; keep the UI dumb.**

## Performance notes
The real map is created **once**; latest-callback refs prevent re-init on parent re-render. Markers are torn down and rebuilt on `layers`/`selectedPlaceId` change — inefficient but correct. `destroy()` on unmount.
Initial center: first own place, else Saint Petersburg `[30.35, 59.93]`, zoom 12.

## Geocoding (implemented — Phase 3, 2026-07-13)
`YANDEX_GEOCODER_API_KEY` has **no `VITE_` prefix on purpose** — it must never be bundled client-side. Geosuggest/geocoding routes **through the backend** (D15): `GET /geocode?query=` (`backend/src/services/geocodeService.ts`), consumed by `LocationSearchSheet.tsx` in the add-place form, debounced 300–500ms client-side.
**Legal constraint:** geosuggest/geosearch are always live requests. **Never cache Yandex org-search results as a directory.** Persist only what the user explicitly saved. (The mock's static fake result list is fictional demo data, not real Yandex results — it doesn't violate this.)
**Not built (deferred):** reverse geocoding on map-click-to-add (prefilling a suggested name from tapped coordinates).
