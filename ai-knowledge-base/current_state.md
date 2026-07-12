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
- `AddPlaceForm` (photo dropzone is a visual stub; rating/mood/tags/status/visibility real).

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

**Coming Soon teasers** (implemented as required overlays)
- Routes (profile + place detail), full Map Comparison, notifications.

**Deployment**
- GitHub Pages workflow (`deploy-pages.yml`) — build + deploy on push to `main`,
  base-path handling, optional map key from repo variable.

---

## 2. Work in progress / partial

- **Real map integration** is wired and functional, but is only exercised when a
  key is present; the placeholder remains the default path.
- **People recommendations** are a simplified heuristic (seeded `trustSignal`
  strings), not a real similar-taste algorithm — by design for MVP.
- **Photo upload** — the add-place form shows a photo dropzone but does not upload;
  `photoUrl` is always `null` in the mock (`POST /places/:id/photo` is unimplemented).
- **Tests** — only the feed is covered (`FeedItemCard.test.tsx`,
  `FeedPage.test.tsx`). `TESTING_PLAN.md` prioritizes auth/access/privacy/follows,
  which are **not yet tested**.

---

## 3. Missing (documented but not in the repo)

- **Entire backend.** `backend/` is empty. No Express, Prisma schema, Postgres,
  JWT, bcrypt, multer, helmet/cors/rate-limit, pino. All server behavior is mocked.
  `BACKEND_INSTRUCTIONS.md` describes the intended implementation.
- **Live Yandex geosuggest / geocoder** in the add-place form (planned to run
  through the backend using `YANDEX_GEOCODER_API_KEY`). Currently `AddPlaceForm`
  uses `DEFAULT_COORDS` when not opened from a map click.
- **Token persistence / refresh.** Access token is memory-only; there is no
  bootstrap on load and refresh is a mock no-op → reload logs the user out.
- **Lint/typecheck/test CI workflow.** `DEPLOYMENT.md` describes a
  lint→typecheck→`vitest run` GitHub Actions pipeline + Dependabot, but only the
  Pages deploy workflow exists in `.github/`.
- **PWA basics** (manifest/icons/install) — listed as build step 19, not present.
- **Coming Soon features by design:** "On this day", Shared Walks, "Today", Smart
  Suggestions, "From friends" feed tab/algorithm, full Map Comparison, Routes — all
  intentionally teaser-only (do not implement without an explicit request).

---

## 4. Known issues & rough edges

1. **Stale README status table.** `README.md` lists auth/profile/places/map/people/
   overlay/collections/feed as "⏳ Not started," which contradicts the implemented
   code. Treat `FEATURES_SCOPE.md` + this file as truth; the README needs updating.
2. **No reload persistence of session** (see above) — expected for a mock-only app,
   but surprising in manual testing.
3. **Profile `followersCount`/`followingCount` are static seed numbers** on
   `MockUser`, not derived from the `follows` table — so following someone does not
   move the counters. Cosmetic in mocks; the real backend should compute them.
4. **`isSamePlace` is an approximation** (name or near-coordinates) with no cross-
   user place identity; overlaps can be imperfect. This is inherent to the schema,
   not a bug, but worth knowing when reasoning about the overlay.
5. **Photo dropzone is non-functional** (visual only).
6. **No focus management in overlays/sheets** (no focus trap / restore) — an
   accessibility gap for new modal work.
7. **`window.confirm`** is used for destructive confirms (delete place / collection /
   comment) — functional but not styled to the design system.

---

## 5. Current priorities (inferred)

Per `FEATURES_SCOPE.md` build order, steps 1–17 (frontend against mocks + real map)
are effectively done; the natural next priorities are:

1. Stand up the real backend (Prisma schema + auth + place/people/collection/feed
   endpoints) and flip `VITE_USE_MOCKS=false`.
2. Add token refresh + reload persistence to match the intended auth design.
3. Implement photo upload and live geosuggest through the backend.
4. Write the prioritized tests from `TESTING_PLAN.md` (auth, privacy, follows,
   ownership, validation).
5. Add the lint/typecheck/test CI workflow + Dependabot; PWA basics (step 19).
6. Refresh the README status table.

These are proposals, not committed scope — see [roadmap.md](roadmap.md) and confirm
with the maintainer before acting.
