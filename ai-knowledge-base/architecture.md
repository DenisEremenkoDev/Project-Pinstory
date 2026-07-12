# Pinstory — Architecture

> Companion to [project_snapshot.md](project_snapshot.md). This file explains
> **how the code is organized and *why*.** For UI-specific patterns see
> [ui_patterns.md](ui_patterns.md); for confirmed decisions & assumptions see
> [decisions.md](decisions.md).

---

## 1. High-level shape

Pinstory is a **single-page React 19 application** with a **feature-based**
architecture and a **swappable data layer**. There is currently no running
backend; a mock layer stands in for one and is designed so the swap to a real
REST API is a one-line change.

Three structural layers:

1. **`src/app/`** — composition root. Wires the store, the RTK Query API, routing,
   and theming together. Contains no business logic.
2. **`src/features/`** — one directory per domain entity (auth, places, people,
   collections, feed, profile, theme). Each feature owns its API endpoints, mock
   handlers, Zod schemas, Redux slice (if any), pages, and feature-local
   components. Features do not reach into each other's internals except through
   their public `*Api.ts` hooks and exported components.
3. **`src/shared/`** — cross-cutting building blocks: `ui/` (presentational
   components + design tokens) and `lib/` (DTO types, the mock DB + mock
   baseQuery, map libs, and small pure utilities).

Dependency direction is strictly **app → features → shared**. Shared never imports
from features; features never import from app except the store types and the `api`
object.

---

## 2. Why feature-based (not layer-based)

The project rule (`CLAUDE.md`) is *feature-based decomposition, not by file type.*
Rationale encoded in the tree:

- A change to "places" touches `features/places/*` and rarely anything else — the
  API endpoints, the mock, the schema, and the UI for a domain live together.
- One **Redux Toolkit slice per domain entity** is the stated model. In practice
  only `auth` and `theme` need slices (everything else is server state living in
  RTK Query cache), so those are the only two slices that exist. This is
  consistent with "all server data goes through RTK Query."
- RTK Query endpoints are **grouped by the same domains** and injected into one
  API instance, keeping a single normalized cache and a single middleware.

---

## 3. The data layer: one API, swappable transport

`src/app/api.ts` creates exactly one RTK Query API:

```ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: useMocks ? mockBaseQuery : realBaseQuery,
  tagTypes: ['Place', 'Person', 'Collection', 'Feed', 'Profile'],
  endpoints: () => ({}),
})
```

- **`useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'`** — mocks are the
  default; only the literal string `"false"` turns them off.
- **`realBaseQuery`** — `fetchBaseQuery({ baseUrl: VITE_API_URL })` with
  `prepareHeaders` attaching `Authorization: Bearer <accessToken>` from
  `state.auth.accessToken`.
- **`mockBaseQuery`** — `createMockBaseQuery([...all feature mock routes])`.

Endpoints are **injected**, not defined inline, so each feature file
(`placesApi.ts`, etc.) calls `api.injectEndpoints`. This keeps feature code
co-located while sharing one cache/tag space.

### Why a custom mock baseQuery instead of MSW / json-server

A `BaseQueryFn` is the smallest seam that lets **endpoint definitions and
components stay identical** whether talking to mocks or a real server. Swapping
backends means changing one line in `api.ts` — no component, hook, or endpoint
change. `mockBaseQuery.ts` documents this contract explicitly.

### Mock request lifecycle (`shared/lib/mockBaseQuery.ts`)

1. Normalize args to `{ url, method, body, params }`.
2. Split URL into path segments + query string; merge `params` into `searchParams`.
3. Derive `currentUserId` from the access token
   (`mock-token-<userId>` → `<userId>`) — the mock's stand-in for reading a JWT
   subject. This detail vanishes with the real backend.
4. Linear-match registered routes (`method` + segment count + `:param` capture).
5. Call the matched handler with `{ pathParams, searchParams, body, currentUserId }`.
6. Return `{ data }` or `{ error: { status, data: ApiErrorBody } }`.
7. Artificial 200–400 ms latency simulates the network so loading states are real.

Handlers throw → caught → `500 MOCK_HANDLER_ERROR`; no match → `404 MOCK_NOT_FOUND`.

### The mock "database" (`shared/lib/mockDb.ts`)

- A plain module-level object with arrays (`users`, `follows`, `feedback`,
  `places`, `collections`, `collectionPlaces`, `comments`).
- **In-memory, per browser session** — mutations persist until reload, then reset
  to seed data. No persistence layer, deliberately.
- Entities are **relational and normalized** (join tables for follows, feedback,
  collection membership) precisely so the shape maps onto the planned Prisma schema
  1:1. `nextMockId(prefix)` generates ids.

---

## 4. Authentication & authorization architecture

- **Token storage:** access token in **Redux memory only** (`authSlice`), never
  `localStorage`. Design intent is refresh token in an httpOnly cookie; the mock
  has no cookie storage, so `logout`/refresh are no-ops. **Consequence:** a page
  reload drops the token and forces re-login (there is no bootstrap/rehydrate). See
  [decisions.md](decisions.md) and [current_state.md](current_state.md).
- **Route protection:** `ProtectedRoute` gates on `accessToken` presence and
  redirects to `/login`. It is a wrapper component, applied once via
  `ProtectedLayout` in the route table.
- **Server-side authorization (in the mock, mirroring the future backend):**
  - Every mutating handler checks `currentUserId` (401 if missing).
  - **Ownership checks** on `PATCH`/`DELETE` for places, collections, comments
    (403 `*_FORBIDDEN` otherwise).
  - **Privacy filtering** is applied at the query level: `GET /places` returns only
    the caller's own places; `GET /people/:id/places` returns only that user's
    **public** places; private place detail is 403 to non-owners; the feed only
    aggregates own + followed **public** places.
  - **Social invariants:** can't follow yourself (`400 CANNOT_FOLLOW_SELF`); can't
    mark a close friend without following first (`403 NOT_FOLLOWING`).

This is the security model the real backend must reproduce; the mock is the
executable spec. See `CLAUDE.md` "Security" and `TESTING_PLAN.md`.

---

## 5. The Map subsystem architecture

The map is the most involved subsystem and is intentionally built to be
**renderer-agnostic** and **backend-swappable**, mirroring the data-layer pattern.

### Dual-mode rendering, single data contract

`MapPage` builds a `layers: MapLayer[]` array where
`MapLayer = { source: 'own' | 'friend'; places: { place, variant? }[] }`.
Both renderers consume this same array:

- **Placeholder mode** (`hasRealMapsKey === false`, default): `MapPins` renders
  each pin as an absolutely-positioned `<button>` whose `top/left` come from
  `mapProjection.projectToPercent(lat, lng)` (a fixed viewport centered on Saint
  Petersburg). Map clicks are DOM clicks converted back via `projectFromPercent`.
- **Real mode** (`VITE_YANDEX_MAPS_API_KEY` set): `YandexMap.tsx` creates a real
  ymaps3 map, adds a muted "parchment" scheme layer, renders each pin as a
  `YMapMarker` with a `<button>` element, and uses the ymaps3 `onFastClick`
  listener for genuine geo coordinates.

The switch is a single boolean, `hasRealMapsKey`, read from `mapsConfig.ts`.
`MapPage` chooses which renderer to mount and which click handler to attach.

**Why one `layers` array (not a hardcoded own-places list):** the friend overlay
needs a *second* pin layer on top of the user's own pins. `CLAUDE.md` mandates the
map accept an array of layers so this overlay is a first-class, non-hacky
addition. Friend pins get a higher `zIndex` (8 vs 3) so they sit above own pins.

### Service-layer isolation of the external API

- `mapsConfig.ts` is the **only** place that reads
  `import.meta.env.VITE_YANDEX_MAPS_API_KEY`.
- `yandexMaps.ts` is the **only** place that loads the ymaps3 `<script>` and
  touches the `ymaps3` global. It lazy-loads once, memoizes the promise, and resets
  the promise on failure to allow retry. Components call `loadYmaps3()` and never
  see the SDK plumbing.

This satisfies the rule "all external APIs go through a dedicated service layer,
never directly inside components."

### Friend-overlay computation (pure, testable)

- `mapMatching.ts` — `isSamePlace(a, b)` approximates cross-user place identity by
  name (case-insensitive) or close coordinates (`|Δlat| < 0.002 && |Δlng| < 0.003`),
  because **no canonical cross-user place entity exists** (each user owns
  independent `Place` rows). `hasVisited(place)` = status is not `want_to_visit`
  (there is no "visited" status; planned/favorite imply real experience).
- `mapOverlayFilter.ts` — `computeOverlayView(filter, own, friend)` returns
  `{ own: PlaceDto[]; friend: { place, shared }[] }` for each filter
  (`all`/`common`/`own_only`/`friend_only`/`favorites`/`common_want`). This is the
  brains of the overlay; the UI (`MapFriendOverlay`) only renders legend + chips.

### Map camera / performance notes

- Real map: created **once**; latest-callback refs (`onPinTapRef`, `onMapClickRef`,
  `initialLayersRef`) prevent re-init on parent re-render. Markers are torn down
  and rebuilt on `layers`/`selectedPlaceId` change. `destroy()` on unmount.
- Initial center: first own place, else Saint Petersburg `[30.35, 59.93]`, zoom 12.
- ymaps3 uses `[longitude, latitude]` order — the reverse of `PlaceDto` field
  order; a frequent source of coordinate bugs, called out in code comments.

Full concern-by-concern map table: [project_snapshot.md](project_snapshot.md) §8.

---

## 6. Theming architecture

- Design tokens are **CSS custom properties** in `shared/ui/tokens.css`, with a
  `[data-theme='dark']` block overriding color/shadow tokens.
- `themeSlice` holds the mode and persists it to `localStorage`; `useTheme()` (run
  once in `App`) writes `data-theme` to `<html>`. Toggling theme is instant and
  CSS-only for custom components.
- A separate minimal **MUI theme** (`app/muiTheme.ts`) mirrors the primary/error/
  success colors and the UI font so MUI form fields match — but deliberately omits
  `CssBaseline` (the app's look comes from `tokens.css`, not MUI). MUI is scoped to
  form fields only.

The two theming systems are intentionally parallel: CSS-Modules-driven custom
visuals for cards/map/nav/feed, MUI for interactive form controls.

---

## 7. Forms architecture

Uniform pattern across every form (`AddPlaceForm`, `CommentForm`, `CollectionForm`,
`ProfileSettingsForm`, `LoginPage`, `RegisterPage`):

`useForm({ resolver: zodResolver(schema) })` → MUI fields via `register` /
`Controller` → submit calls an RTK Query mutation `.unwrap()` → on failure
`setError('root', { message: getApiErrorMessage(error, fallback) })`.

- **Zod schema per form** (`*Schema.ts`) is the single source of validation and of
  the form's TS type (`z.infer`).
- Custom inputs (star rating, mood) are bridged into RHF with `Controller`.
- `getApiErrorMessage` centralizes turning an RTK Query error into a Russian
  message (handles 429 specially, else reads `error.data.error.message`).

---

## 8. Rendering / state ownership

- **Server state** lives in RTK Query cache and is the source of truth for lists,
  detail, profile, feed, people. Components subscribe with generated hooks and get
  `isLoading`/`isFetching`/`isError`/`refetch` for free.
- **UI state** is local `useState` in the owning page (which sheet is open, the
  selected place id, the active filter, the feed cursor, the overlay friend). No
  global UI store — modals/sheets are conditionally rendered children of the page
  that owns their state.
- **Optimistic UX** is generally handled by tag invalidation + refetch (e.g. toggle
  follow → invalidate `Person:id`), not manual cache edits. `FeedItemCard` keeps a
  tiny local `isAdded` flag for immediate button feedback.

---

## 9. Error / loading / empty conventions (architectural, not just visual)

Every data-driven screen renders one of four states, always in the same order:
`isLoading → <Loader/>`, `isError → <ErrorState onRetry={refetch}/>`,
empty result → `<EmptyState/>`, else content. The feed additionally distinguishes
*initial* failure (full-page error) from *load-more* failure (keep loaded items,
show inline retry) — this is explicitly tested. See [ui_patterns.md](ui_patterns.md).

---

## 10. Why the backend isn't here yet (and how it's provisioned for)

The build sequence in `FEATURES_SCOPE.md` front-loads the backend (steps 1–8) but
the repo reflects a **frontend-first execution against mocks** (steps 9–17 done).
The mock layer, the DTO/enum types, and the relational `mockDb` are all shaped to
match the documented Prisma schema and REST routes, so backend work becomes:
implement the same routes → flip `VITE_USE_MOCKS=false` → set `VITE_API_URL`. No
frontend rewrite. `BACKEND_INSTRUCTIONS.md` holds the intended schema, auth, and
security spec. Status and gaps: [current_state.md](current_state.md),
next steps: [roadmap.md](roadmap.md).
