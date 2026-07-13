# Pinstory — Project Snapshot (Technical Passport)

> Single source of truth for AI agents. Read this first; the other files in
> `ai-knowledge-base/` drill into specific dimensions:
> [architecture.md](architecture.md), [design_system.md](design_system.md),
> [ui_patterns.md](ui_patterns.md), [current_state.md](current_state.md),
> [decisions.md](decisions.md), [conventions.md](conventions.md),
> [roadmap.md](roadmap.md).
>
> This snapshot describes the repository **as it actually exists in code** on the
> `main` branch. Where the code and the prose docs (`CLAUDE.md`,
> `FEATURES_SCOPE.md`, `README.md`, `*_INSTRUCTIONS.md`) disagree, the code wins
> and the disagreement is flagged.

---

## 1. Overview

**Pinstory** ("Every place tells a story") is a mobile-first web app for saving
real-world places as personal memories and discovering new places through people
you trust. It is deliberately *not* a navigation app and *not* a conventional
social network — calm, personal, warm minimalism, no engagement mechanics.

- **Project was renamed** from "My Atlas" → "Pinstory". Old "My Atlas" mentions in
  comments/notes refer to the same project; nothing needs re-scaffolding.
- **Learning / portfolio project** built step by step, primarily by the author
  with AI pair-support. Code is meant to stay understandable to its author.
- **Market / language:** Russian. All user-facing UI strings are in Russian; all
  code, identifiers, and documentation are in English.

### Current implementation reality (important)

- **Backend Phase 1 is complete** (`roadmap.md`, all 11 steps). `backend/` is a
  real Express 5 + Prisma 6 + PostgreSQL 17 project covering every domain: auth
  (register/login/refresh/logout, JWT via `jose`, bcrypt cost 12, httpOnly refresh
  cookie), places CRUD, photo upload (`multer`), feedback, people (search/follow/
  close-friend/public places+collections), collections CRUD+membership, comments
  CRUD, feed aggregation (keyset cursor pagination), profile — layered as
  `routes/ → controllers/ → services/ → mappers/`, plus `middleware/`, `lib/`,
  `schemas/`, `prisma/schema.prisma`. One reusable `services/visibility.ts`
  (`canViewPlace`/`visiblePlacesWhere`) plus `services/placeAccess.ts`
  (`assertPlaceVisibleForMutation`) route every privacy check through two
  functions, not one-off per endpoint, per `.claude/rules/privacy.md`.
- **Verified live**, twice: 27/27 smoke-test assertions against a real PostgreSQL
  instance (all Priority-1 privacy/validation invariants from
  `.claude/rules/testing.md`), and manually in-browser with the frontend's
  `VITE_USE_MOCKS=false` — the app runs against the real backend with the same
  observable behavior as the mock.
- The mock layer (`shared/lib/mockBaseQuery.ts` + `*.mockRoutes.ts`) still exists
  and remains the default (`VITE_USE_MOCKS` unset ⇒ mocks); the real backend is
  opt-in via env, same pattern as the map key switch (D12).
- The map has **two modes**: a placeholder lat/lng→percentage projection (default,
  no key needed) and the **real Yandex Maps JS API 3.0** (activated when
  `VITE_YANDEX_MAPS_API_KEY` is set).

See [current_state.md](current_state.md) for the precise done/in-progress/missing
breakdown. `README.md` has been synced to reflect Phase 1 completion.

---

## 2. Goals

| Goal | How it manifests in code |
|---|---|
| Save places as emotional "memories" | `PlaceDto` carries `note` (a story), `mood`, `rating`, `myFeedback` (like/dislike) |
| Discover via trusted people, not popularity | People section has follow / close-friend only; no likes/leaderboards; `trustSignal` strings |
| One unified place representation everywhere | `UnifiedPlaceCard` reused in Chronicle, friend profiles, and feed |
| Own map + light friend overlay | `MapPage` renders `layers: {source: 'own'|'friend'}[]` |
| Backend-swappable frontend | Mock baseQuery mirrors a future REST API 1:1 |
| Calm premium design system | `tokens.css` design tokens + CSS Modules; MUI only for form fields |

---

## 3. Technology Stack (pinned)

**Environment:** Node.js 24.x (`.nvmrc` = `24`, `engines.node = "24.x"`).

**Frontend (implemented):**
- React **19.2.x** + `@types/react`/`react-dom` 19.2.x
- TypeScript **~5.9.3**, strict + `noUncheckedIndexedAccess` + `noImplicitOverride` + `verbatimModuleSyntax`
- Redux Toolkit **2.x** + react-redux **9.x**; all server data via **RTK Query**
- MUI **6.5.0** (`@mui/material` + Emotion) — **form fields only**
- Vite **7.x** + `@vitejs/plugin-react` 5.x
- React Router **v7** (`react-router`, not `react-router-dom`)
- React Hook Form **7.x** + `@hookform/resolvers` 5.x + **Zod 4.x**
- `@yandex/ymaps3-types` (types only) for the real map integration
- Prettier; ESLint 10 flat config (typescript-eslint, react-hooks, react-refresh)
- Vitest **3.x** + Testing Library + jsdom

**Backend (implemented, Phase 1 complete):** Node + Express **5.2.1**, Prisma **6.19.x**
+ PostgreSQL 17, JWT via `jose`, `bcryptjs` (cost 12), `multer`, `helmet`/`cors`/
`express-rate-limit`, `pino`/`pino-http`, `cookie-parser`, `dotenv`, Zod for
request validation. `@types/express` pinned to v4 (v5 types are unstable).
See `BACKEND_INSTRUCTIONS.md` for the endpoint contracts (schema section is
outdated — `prisma/schema.prisma` and `mockDb.ts` are the real schema source).

**IDE:** WebStorm. **Deploy target:** GitHub Pages (also Vercel/Netlify-compatible).

Exact versions live in `package.json`. Do not upgrade/downgrade without an
explicit request.

---

## 4. Folder Structure

```
D:\Pinstory
├── src/
│   ├── app/                      # Composition root (store, api, routes, theme)
│   │   ├── main.tsx              # ReactDOM root + <Provider store>
│   │   ├── App.tsx               # ThemeProvider + BrowserRouter + AppRoutes
│   │   ├── AppRoutes.tsx         # Route table, public vs ProtectedLayout
│   │   ├── store.ts              # configureStore (theme, auth, api reducers)
│   │   ├── api.ts                # createApi; mock-vs-real baseQuery switch
│   │   ├── hooks.ts             # typed useAppDispatch/useAppSelector
│   │   └── muiTheme.ts           # minimal MUI theme mirroring tokens
│   ├── features/                 # Feature-based decomposition (one dir = one domain)
│   │   ├── auth/                 # slice, api, schemas, mockRoutes, ProtectedRoute, pages
│   │   ├── places/              # placesApi, mockRoutes, map subsystem, forms, detail, chronicle
│   │   ├── people/               # peopleApi, mockRoutes, list + person profile pages
│   │   ├── collections/          # collectionsApi, mockRoutes, forms, manage-places
│   │   ├── feed/                 # feedApi, mockRoutes, FeedItemCard, FeedPage (+ tests)
│   │   ├── profile/              # profileApi, mockRoutes, settings form, profile + collections pages
│   │   └── theme/                # themeSlice + useTheme
│   ├── shared/
│   │   ├── ui/                   # Reusable presentational components + tokens.css
│   │   └── lib/                  # apiTypes, mockDb, mockBaseQuery, map libs, utils
│   ├── index.css                 # global reset + imports tokens & material-symbols css
│   └── setupTests.ts             # jest-dom matchers for Vitest
├── backend/                      # EMPTY (no source yet)
├── design-reference/             # DESIGN_INDEX.md + readable HTML mockup (design source of truth)
├── public/                       # favicon.svg, icons.svg
├── .github/workflows/            # deploy-pages.yml (build + GitHub Pages)
├── index.html                    # loads Plus Jakarta Sans, Newsreader, Material Symbols
├── vite.config.ts                # base path switch + vitest config
├── tsconfig.app.json             # strict TS options
├── eslint.config.js
└── *.md                          # CLAUDE.md, FEATURES_SCOPE.md, FRONTEND/BACKEND_INSTRUCTIONS, etc.
```

Full architectural rationale: [architecture.md](architecture.md).

---

## 5. Routing

Defined in `src/app/AppRoutes.tsx`; `BrowserRouter basename={import.meta.env.BASE_URL}`
(so it works under the GitHub Pages `/Project-Pinstory/` base).

| Path | Element | Access | Notes |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Sets access token → navigates `/map` |
| `/register` | `RegisterPage` | Public | On success navigates `/login` with `justRegistered` |
| `/` | `<Navigate to="/map">` | Protected | Redirect |
| `/map` | `MapPage` | Protected | Map + all map overlays/sheets |
| `/feed` | `FeedPage` | Protected | Tab label is **«Хроника»**; in-screen heading is "Для вас" |
| `/people` | `PeopleListPage` | Protected | Search + follow |
| `/people/:id` | `PersonProfilePage` | Protected | Friend profile + public places |
| `/profile` | `ProfilePage` | Protected | Social header + collections preview |
| `/profile/collections` | `CollectionsPage` | Protected | Own + followed collections |
| `*` | `<Navigate to="/map">` | — | Catch-all |

Protection: `ProtectedLayout` = `<ProtectedRoute><AppShell/></ProtectedRoute>`.
`ProtectedRoute` reads `state.auth.accessToken`; if absent → `<Navigate to="/login">`.
`AppShell` renders `<Outlet/>` + `BottomNav` + the global Add-Place `BottomSheet`.

**Bottom navigation = 5 slots:** Карта (`/map`), Хроника (`/feed`), central **＋**
(opens add-place sheet, not a route), Люди (`/people`), Профиль (`/profile`).
Collections are reached from within Profile — do **not** add a 6th tab.

---

## 6. Main Features (all real against mocks unless marked)

1. **Auth** — register / login / logout; protected routes; token in Redux memory.
2. **Profile** — social header (places/followers/following counts), settings form
   (name, avatar URL, bio, status, default visibility, notifications, dark theme, logout).
3. **Places / Chronicle "My Memories"** — list with filter chips
   (All / ❤️ Liked / 🚩 Disliked / Want to visit), date-grouped, `UnifiedPlaceCard`.
4. **Add place** — bottom-sheet form: photo dropzone (stub), location, name, note,
   star rating (set immediately), mood, tags, status, visibility.
5. **Place detail** — full-screen overlay: photo, inline-editable status chips +
   star rating (owner only), note (italic), mood + like/dislike (heart/flag) chip,
   comments block, tags, "Routes — coming soon" teaser.
6. **Comments** — per-place comments with each author's own star rating; create /
   edit / delete own only.
7. **Feedback** — like (heart) / dislike (flag) per (user, place); cycled in detail.
8. **People** — search by name, follow/unfollow, close-friend toggle (only when
   following), trust signals; friend profile with their public places.
9. **Map** — interactive map of own places; click-to-add; in-app search sheet.
10. **Friend map overlay** — pick a friend → their public places as a second pin
    layer with legend + filter chips (all/common/own only/theirs only/favorites/
    common want-to-visit). Basic overlay only; full "Map Comparison" is a teaser.
11. **Collections** — own (create/edit/delete, add/remove places) + read-only
    followed collections.
12. **Activity feed** ("От друзей" view on the Хроника tab) — own + followed public
    places as cards ("added a place"/"wants to visit"/"added a story") with two
    actions: "Add to mine" / "View". Cursor-paginated.
13. **Coming Soon teasers** — Routes, full Map Comparison, "On this day", Shared
    Walks, "Today", Smart Suggestions, notifications, "From friends" tab.

Authoritative feature matrix: `FEATURES_SCOPE.md`. Status detail:
[current_state.md](current_state.md).

---

## 7. Application Flow

```
main.tsx
  └─ <Provider store>
      └─ App.tsx  (useTheme() sets data-theme; ThemeProvider; BrowserRouter)
          └─ AppRoutes
              ├─ /login, /register  → auth pages (RHF+Zod → authApi → authSlice.setAccessToken)
              └─ ProtectedLayout (needs accessToken)
                  └─ AppShell (<Outlet/> + BottomNav + AddPlace BottomSheet)
                      └─ MapPage / FeedPage / PeopleListPage / ProfilePage / ...
```

Data flow for any screen: **Component → RTK Query hook → `api` → baseQuery**.
- If `VITE_USE_MOCKS !== 'false'` → `createMockBaseQuery` matches the request
  against registered `MockRoute[]` and mutates/reads `mockDb` (in-memory).
- Else → `fetchBaseQuery` with `Authorization: Bearer <accessToken>`.

The mock derives the current user from the token: mock tokens are literally
`mock-token-<userId>`; the mock baseQuery slices out `<userId>` and passes it to
handlers as `currentUserId` (mirrors a backend reading the JWT subject).

---

## 8. Map Subsystem (summary — full detail in architecture.md §Map)

| Concern | Placeholder mode | Real mode |
|---|---|---|
| Trigger | default (no key) | `VITE_YANDEX_MAPS_API_KEY` set → `hasRealMapsKey` |
| Renderer | `MapPins` (abs-positioned `<button>`s) | `YandexMap.tsx` (ymaps3 markers) |
| Positioning | `mapProjection.ts` `projectToPercent` | ymaps3 `[lng, lat]` coordinates |
| Add-place click | `MapPage.handleMapClick` → `projectFromPercent` | ymaps3 `onFastClick` geo coords |
| Basemap | CSS gradients (`MapPage.module.css`) | muted "parchment" customization |
| SDK loading | none | `yandexMaps.ts` lazy `<script>` injection, memoized |

Both modes consume the **same** `layers: MapLayer[]` array, so business logic is
renderer-agnostic. Friend-overlay math (`mapOverlayFilter.ts` +
`mapMatching.ts`) is pure and shared. "Same real-world place" across users is
*approximated* by name or close coordinates — there is no cross-user place entity.

External map access always goes through the `shared/lib` service layer
(`mapsConfig.ts` / `yandexMaps.ts`); components never touch `import.meta.env` or
the `ymaps3` global directly.

---

## 9. API Layer

- One RTK Query API instance: `src/app/api.ts`, `reducerPath: 'api'`,
  `tagTypes: ['Place','Person','Collection','Feed','Profile']`, `endpoints: () => ({})`.
- Each feature **injects** its endpoints via `api.injectEndpoints`
  (`authApi`, `placesApi`, `peopleApi`, `collectionsApi`, `feedApi`, `profileApi`).
- Cache invalidation via `providesTags` / `invalidatesTags` (per-id + `LIST`).
- Feed uses `serializeQueryArgs`/`merge`/`forceRefetch` for cursor pagination.

**Endpoint inventory** (mock URL → RTK hook):

| Domain | Endpoints |
|---|---|
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` |
| places | `GET /places`, `GET /places/:id`, `POST /places`, `PATCH /places/:id`, `DELETE /places/:id`, `POST/DELETE /places/:id/feedback`, `GET/POST /places/:id/comments`, `PATCH/DELETE /places/:id/comments/:commentId` |
| people | `GET /people/search`, `GET /people/:id`, `POST/DELETE /people/:id/follow`, `PATCH /people/:id/close-friend`, `GET /people/:id/places`, `GET /people/:id/collections` |
| collections | `GET/POST /collections`, `PATCH/DELETE /collections/:id`, `POST/DELETE /collections/:id/places/:placeId` |
| feed | `GET /feed?cursor&limit` |
| profile | `GET /profile`, `PATCH /profile` |

Mock handlers live in each feature's `*.mockRoutes.ts` and are aggregated in
`api.ts`. They enforce auth (`currentUserId`), ownership, and visibility — a
faithful preview of the future backend's rules.

---

## 10. State Management

- **Redux store** (`store.ts`): 3 reducers — `theme`, `auth`, `api`.
- **`authSlice`** — `{ accessToken: string | null }`; actions `setAccessToken`,
  `clearAccessToken`. **Memory only** (never `localStorage`); lost on reload.
- **`themeSlice`** — `{ mode: 'light' | 'dark' }`; persisted to `localStorage`
  (`pinstory-theme`), initialized from stored value or `prefers-color-scheme`.
  `useTheme()` syncs `document.documentElement[data-theme]`.
- **Server state** — entirely RTK Query cache (no hand-written slices per domain).
- **Local UI state** — `useState` inside pages (open sheets, selected place id,
  active filter, feed cursor, overlay friend id, etc.). No global UI slice.

---

## 11. Data Models (see `src/shared/lib/apiTypes.ts` + `mockDb.ts`)

**Enums / unions:**
- `PlaceStatus = 'want_to_visit' | 'planned' | 'favorite'` (three values — **no
  "visited"**, intentionally and permanently removed).
- `Visibility = 'public' | 'private'`
- `Sentiment = 'like' | 'dislike'`
- `Mood = 'calm' | 'serenity' | 'hope' | 'laughter'`
- `FeedItemType = 'place_added' | 'wants_to_visit' | 'story_added'`
- Russian label maps: `PLACE_STATUS_LABELS`, `MOOD_LABELS`, `MOOD_EMOJI`.

**DTOs (wire shapes):** `PlaceDto`, `PlaceDetailDto` (+counts), `UserSummaryDto`,
`CollectionSummaryDto` / `OwnCollectionDto` / `FollowedCollectionDto`,
`PlaceCommentDto`, `FeedItemDto`, `ProfileDto`, `ApiErrorBody`.

**Mock entities (relational, mirror the planned Prisma schema):** `MockUser`,
`MockFollow` (with `isCloseFriend`), `MockPlace` (`Omit<PlaceDto,'myFeedback'|'isOwner'> & { ownerId }`),
`MockFeedback` (per user+place), `MockCollection`, `MockCollectionPlace`,
`MockPlaceComment`. Seeded with 6 users, 7 places, 3 collections, 2 comments,
sample follows/feedback in `mockDb.ts`.

Key modeling note: `myFeedback` and `isOwner` are **computed per viewer**, never
stored on the place (mirrors a real `PlaceFeedback` join and per-request auth).

---

## 12. Libraries — where each is used

| Library | Used for |
|---|---|
| Redux Toolkit / RTK Query | store, `createApi`, all data fetching + cache |
| react-redux | `<Provider>`, typed hooks |
| react-router v7 | routing, `NavLink`, `Navigate`, `useParams`, `useNavigate` |
| react-hook-form + @hookform/resolvers | all forms (`useForm`, `Controller`) |
| zod | validation schemas (`*Schema.ts`) + inferred form types |
| @mui/material | TextField, Button, Switch, Select/MenuItem, Stack, Typography — forms only |
| @emotion/react + styled | MUI's styling engine (transitive requirement) |
| @yandex/ymaps3-types | typing the global `ymaps3` in the real map |
| vitest + @testing-library/* + jsdom | component tests |

---

## 13. Interaction Between Modules

```
app/api.ts ──injectEndpoints──> features/*/*.Api.ts ──used by──> feature pages/components
     │
     └─ baseQuery: shared/lib/mockBaseQuery.ts ──routes──> features/*/*.mockRoutes.ts ──mutate──> shared/lib/mockDb.ts

app/store.ts ──> authSlice, themeSlice, api.reducer
features/* ──import──> shared/ui (UnifiedPlaceCard, BottomSheet, Loader, ...) + shared/lib (apiTypes, formatDate, gradientPalette, getApiErrorMessage)
features/places/MapPage ──composes──> YandexMap | MapPins + MapFriendOverlay/Picker + MapSearchSheet + AddPlaceForm + PlaceDetailView
features/feed/FeedPage ──reuses──> PlacesChronicle (own view) + FeedItemCard (friends view) + PlaceDetailView
```

Cross-feature reuse worth knowing: `FeedItemCard` and `MapPage` import
`placesApi`; `MapPage`/`MapFriendPicker`/`MapFriendOverlay` import `peopleApi`;
`ProfilePage`/`CollectionsPage` import `collectionsApi`; `ProfileSettingsForm`
imports `authApi` + `authSlice` + `themeSlice`. `UnifiedPlaceCard` and
`PlaceDetailView` are the shared "place" surfaces reused across contexts.

---

## 14. Configuration & Build

- **`vite.config.ts`** — `base` = `/Project-Pinstory/` when `GITHUB_PAGES` set,
  else `/`; React plugin; Vitest (`jsdom`, `setupTests.ts`, `globals: true`).
- **`tsconfig.app.json`** — `target/lib ES2023`, `moduleResolution: bundler`,
  `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals/Parameters`, `erasableSyntaxOnly`, `jsx: react-jsx`, `noEmit`.
- **`eslint.config.js`** — flat config: js recommended + typescript-eslint +
  react-hooks + react-refresh + prettier; ignores `dist`.
- **Scripts** — `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`,
  `format`, `test` (`vitest run`), `test:watch`, `deploy` (`git push origin HEAD:main`).
- **Env vars** — `VITE_API_URL`, `VITE_YANDEX_MAPS_API_KEY`, `VITE_USE_MOCKS`
  (`true`/`false`), `YANDEX_GEOCODER_API_KEY` (backend-only, no `VITE_` prefix on
  purpose). See `.env.example`.
- **CI/CD** — `.github/workflows/deploy-pages.yml` builds with `GITHUB_PAGES=true`
  and deploys `dist/` to GitHub Pages on push to `main`. (No separate lint/test CI
  workflow is present in the repo despite `DEPLOYMENT.md` describing one — flagged
  in [current_state.md](current_state.md).)

---

## 15. Current Implementation Status (one-line)

Frontend MVP is substantially implemented; the mock backend it was built against
is now backed by a **real, verified Express/Prisma/PostgreSQL backend** (Phase 1
complete — all endpoint groups, live-tested). The real Yandex map is wired and
used when a key is present, but **live geosuggest** in the add-place form is
still pending (Phase 3). Backend tests (Priority 1 list) are not yet written;
frontend tests exist only for the feed. Full breakdown:
[current_state.md](current_state.md).
