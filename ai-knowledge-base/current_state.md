# Pinstory — Current State

> Snapshot of what exists in code on `main` as of this knowledge base's creation
> (repo date context: 2026-07). Distinguishes **done / in-progress / missing** and
> lists **known issues**. Cross-refs: [project_snapshot.md](project_snapshot.md),
> [roadmap.md](roadmap.md).

---

## 1. Completed functionality (implemented, working against mocks)

**Foundation**
- Vite + React 19 + TS strict project; feature-based structure; Prettier/ESLint.
- Design system: `tokens.css` (light + dark), Material Symbols setup, fonts,
  `gradientPalette`, MUI theme bridge. Dark/light theme with persistence.
- Redux store (theme, auth, api); typed hooks.
- RTK Query API with mock/real baseQuery switch (`VITE_USE_MOCKS`).
- In-memory relational mock DB with seed data.

**Auth**
- Register / login / logout endpoints (mock); RHF+Zod forms; `ProtectedRoute`;
  access token in Redux; redirect flows.

**Places**
- CRUD (`GET/POST/PATCH/DELETE /places`), rating required at creation.
- `PlaceDetailView` with inline-editable status + rating (owner), feedback cycle,
  mood, note, tags, comments, Routes teaser.
- Chronicle "My Memories" with filter chips + date grouping (`PlacesChronicle`).
- Feedback (like/dislike) per user+place.
- Comments CRUD with per-author rating and ownership rules.
- `AddPlaceForm` (photo upload real, Phase 4 done 2026-07-13 — best-effort after
  place creation; rating/mood/tags/status/visibility real).

**People**
- Search, follow/unfollow, close-friend toggle (guarded), friend profile with
  public places, trust signals, "you might like" recommendations (simple heuristic
  via seeded `trustSignal` strings).

**Collections**
- Own collections CRUD, add/remove places, followed (read-only) collections,
  profile preview + full collections page.

**Feed**
- "От друзей" activity feed on the Хроника tab (own + followed public places),
  card types, "Add to mine" / "View", cursor pagination ("Показать ещё").
- Segmented toggle "Мои воспоминания / От друзей"; default = own Chronicle.

**Profile**
- Social header (places/followers/following), settings form (name, avatar URL, bio,
  status, default visibility, notifications, dark theme toggle, logout).

**Map**
- Placeholder projection mode (default): `MapPins` + `mapProjection` + click-to-add.
- **Real Yandex Maps JS API 3.0** mode (`YandexMap.tsx`) when
  `VITE_YANDEX_MAPS_API_KEY` is set: muted basemap, marker pins, tap-to-add via
  `onFastClick`, load/error/retry states.
- Basic friend map overlay: picker, second pin layer, legend, filter chips, overlay
  math (`mapOverlayFilter` + `mapMatching`).
- In-app search over own places (`MapSearchSheet`).
- **Live Yandex geosuggest** (Phase 3, done 2026-07-13): `LocationSearchSheet.tsx`
  in `AddPlaceForm`, debounced address search against `GET /geocode` (real
  backend proxies Yandex Geocoder; mock returns static fake results). Only
  active when the add-place sheet wasn't opened via a map click. Reverse
  geocoding on map-click-to-add was deliberately deferred, not built.

**Coming Soon teasers** (implemented as required overlays)
- Routes (profile + place detail), full Map Comparison, notifications.

**Backend (Phase 1 complete, real — not mocked)**
- Express 5 + Prisma 6 + PostgreSQL 17, layered `routes/ → controllers/ →
  services/ → mappers/`. Every domain implemented: auth (JWT via `jose`, bcrypt
  cost 12, httpOnly refresh cookie), places CRUD, photo upload (`multer`),
  feedback, people (search/follow/close-friend/public places+collections),
  collections CRUD+membership, comments CRUD, feed (keyset cursor pagination),
  profile.
- One reusable `visibility.ts` (`canViewPlace`/`visiblePlacesWhere`) +
  `placeAccess.ts` (`assertPlaceVisibleForMutation`) — every privacy check routes
  through these two, not reimplemented per endpoint.
- `followersCount`/`followingCount` are correctly derived from the `Follow` table
  here (unlike the mock's static seed numbers — see known issue #3 below).
- Verified live against a real PostgreSQL instance (27/27 smoke-test assertions
  covering every Priority-1 case in `.claude/rules/testing.md`) and against the
  actual frontend with `VITE_USE_MOCKS=false`.
- The mock layer is unchanged and remains the default; the real backend is
  opt-in via `VITE_USE_MOCKS=false` + `VITE_API_URL`, same pattern as the map key.

**Deployment**
- GitHub Pages workflow (`deploy-pages.yml`) — build + deploy on push to `main`,
  base-path handling, optional map key from repo variable.

---

## 2. Work in progress / partial

- **Real map integration** is wired and functional, but is only exercised when a
  key is present; the placeholder remains the default path.
- **People recommendations** are a simplified heuristic (seeded `trustSignal`
  strings), not a real similar-taste algorithm — by design for MVP.
- **Tests** — only the feed is covered (`FeedItemCard.test.tsx`,
  `FeedPage.test.tsx`). `TESTING_PLAN.md` prioritizes auth/access/privacy/follows,
  which are **not yet tested**.

---

## 3. Missing (documented but not in the repo)

- **Lint/typecheck/test CI workflow.** `DEPLOYMENT.md` describes a
  lint→typecheck→`vitest run` GitHub Actions pipeline + Dependabot, but only the
  Pages deploy workflow exists in `.github/`.
- **PWA basics** (manifest/icons/install) — listed as build step 19, not present.
- **Coming Soon features by design:** "On this day", Shared Walks, "Today", Smart
  Suggestions, "From friends" feed tab/algorithm, full Map Comparison, Routes — all
  intentionally teaser-only (do not implement without an explicit request).

---

## 4. Known issues & rough edges

1. **Mock's `followersCount`/`followingCount` are still static seed numbers** on
   `MockUser`, not derived from the `follows` table — cosmetic, mock-only. The
   real backend correctly derives both from the `Follow` table; this is not a bug
   there, only in the mock's seed data.
2. **`isSamePlace` is an approximation** (name or near-coordinates) with no cross-
   user place identity; overlaps can be imperfect. This is inherent to the schema,
   not a bug, but worth knowing when reasoning about the overlay.
3. **No focus management in overlays/sheets** (no focus trap / restore) — an
   accessibility gap for new modal work.
4. **`window.confirm`** is used for destructive confirms (delete place / collection /
   comment) — functional but not styled to the design system.

---

## 5. Current priorities (inferred)

Phases 1–4 (`roadmap.md`) are complete and verified. Natural next priorities,
in no committed order — confirm with the maintainer:

1. Write the prioritized tests from `.claude/rules/testing.md` against the real
   backend (Vitest + Supertest) — none exist yet server-side beyond one unit
   test for `geocodeService` (Phase 5).
2. Add the lint/typecheck/test CI workflow + Dependabot; PWA basics (Phase 5).
3. Replace `window.confirm`; add focus management to sheets/overlays (Phase 5,
   proposal-level).

These are proposals, not committed scope — see [roadmap.md](roadmap.md) and confirm
with the maintainer before acting.
