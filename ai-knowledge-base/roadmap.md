# Pinstory — Roadmap

> A logical forward path derived from the current code and the project's own
> `FEATURES_SCOPE.md` build sequence. **[Confirmed]** = grounded in existing code
> or explicit project docs. **[Proposal]** = a reasonable next step inferred here,
> not committed scope — confirm with the maintainer first. Nothing below authorizes
> building Coming Soon features without an explicit request. See
> [current_state.md](current_state.md) for what's done/missing.

---

## Guiding constraints (do not violate)

- **[Confirmed]** MVP scope is locked in `FEATURES_SCOPE.md`. Don't build beyond it
  in one pass; if a "small" extra appears, record it there and decide deliberately.
- **[Confirmed]** Coming Soon items stay teasers: full Map Comparison, Routes,
  Shared Walks, "Today", Smart Suggestions, "On this day", "From friends" feed tab.
- **[Confirmed]** Never reintroduce a "Visited" status/filter. Statuses stay three.
- **[Confirmed]** Don't change the pinned stack/versions; don't add ceremony
  (Docker/E2E/CODEOWNERS/etc.).
- **[Confirmed]** The mock layer, DTOs, and `mockDb` are shaped so the real backend
  is a drop-in — preserve the API contract when implementing it.

---

## Phase 1 — Real backend (highest leverage) [Confirmed direction]

The frontend is done against mocks; the biggest gap is the absent backend
(`backend/` empty). Per `FEATURES_SCOPE.md` steps 1–8 and `BACKEND_INSTRUCTIONS.md`:

1. Project init (Express 5, TS), one `PrismaClient`, Postgres 17, security layer
   (`helmet`, `cors` allowlist, `express-rate-limit`), `pino`/`pino-http` with
   `redact` for auth/password/token/cookie.
2. Prisma schema mirroring the mock entities: `User` (displayName/avatarUrl/bio/
   status/defaultVisibility/notifications), `Place`, `PlaceFeedback`, `PlaceComment`,
   `Follow` (isCloseFriend), `Collection`, `CollectionPlace`.
3. Auth: register/login/refresh, JWT (`jose`) access + refresh, `bcryptjs` cost 12,
   route-protection middleware, refresh token in httpOnly cookie.
4. Places CRUD with ownership + privacy checks and rating-required-at-creation.
5. Photos (`multer`, type+size validation, random filename) + feedback.
6. People: search, follow/unfollow, close friends, followed user's public places/
   collections; self-follow and follow-before-close-friend guards.
7. Collections CRUD + membership.
8. Comments CRUD with place-visibility checks.
9. Feed aggregation endpoint (own + followed public, paginated).
10. **Reusable privacy query helper** parameterized by "whose places" (own vs a
    specific other user) — the mocks already imply this shape.
11. Flip `VITE_USE_MOCKS=false`, set `VITE_API_URL`; verify no frontend changes are
    needed (the whole point of the mock design).

*Acceptance:* the app behaves identically with mocks off, and the security rules in
`CLAUDE.md`/`TESTING_PLAN.md` hold at the SQL layer.

---

## Phase 2 — Close the auth/session gaps

- **[Done, 2026-07-13]** `POST /auth/refresh` in `authApi.ts` + mock (mock always
  401 — no real cookie storage, by design per D8); `credentials:'include'` on
  `fetchBaseQuery`; `useSessionBootstrap` hook gates `App.tsx` behind a silent
  refresh attempt on load. Reload no longer logs the user out when running
  against the real backend. Mock mode is unaffected (still memory-only, by design).

---

## Phase 3 — Map completion

- **[Done, 2026-07-13]** Live Yandex **geosuggest/geocoder** in the add-place form,
  routed **through the backend** (`GET /geocode?query=`) using `YANDEX_GEOCODER_API_KEY`
  (non-`VITE_`). `LocationSearchSheet.tsx` (debounced 300-500ms) opens from
  `AddPlaceForm`'s location chip when the form wasn't opened via a map click.
  `GeocodeResultDto` is a live pass-through — no `mockDb` relation, no cache tags;
  the legal constraint (never cache org-search results as a directory) holds.
  Scope was deliberately narrowed to forward address search only — reverse
  geocoding on map-click-to-add was explicitly deferred, not built.
- **[Proposal]** Optional map polish: clustering for dense own-place sets, camera
  fit-to-bounds, smoother marker diffing (currently full teardown/rebuild).
- **[Proposal, deferred from Phase 3]** Reverse-geocode on map-click-to-add (prefill
  a suggested place name from tapped coordinates) — needs `GET /geocode/reverse`.

---

## Phase 4 — Media & content

- **[Done, 2026-07-13]** Real photo upload wired end-to-end. Backend
  `POST /places/:id/photo` (multer, JPEG/PNG/WebP, 5MB cap) already existed
  since Phase 1 Step 5; this closed the frontend gap — `AddPlaceForm`'s photo
  slot is now a real `<label>`+hidden file input with client-side validation
  (`photoConstraints.ts`, shared with the mock's server-side check), a new
  `uploadPhoto` mutation (`placesApi.ts`), and a mock route mirroring the real
  backend's precedence (file-shape check before ownership). Upload runs
  best-effort after place creation (needs a real `placeId`) — a failed photo
  attach doesn't block the save, by explicit maintainer decision.
  `UnifiedPlaceCard`/`PlaceDetailView` already rendered `photoUrl` correctly;
  no display-side changes were needed.

---

## Phase 5 — Quality & delivery [Confirmed direction]

- **[Done, 2026-07-16]** Priority-1 backend tests (`testing.md` items 1-16) as
  Supertest integration tests against a dedicated Neon test-branch database:
  `backend/src/routes/*.integration.test.ts` (auth, places, people, feedback,
  comments, collections). Rate limiting is skipped under `NODE_ENV=test`.
  Fixed a real pre-existing bug this surfaced: the root Vitest config had no
  `include` scope, so `npm run test` silently picked up `backend/**/*.test.ts`
  too — harmless while those were mocked-Prisma unit tests, but a real `jose`
  `SignJWT` call resolves to a stricter webapi build under jsdom and throws.
  Scoped root Vitest to `src/**`.
- **[Done, 2026-07-16]** `.github/workflows/ci.yml` (lint / frontend build+test /
  backend build+migrate+test against an ephemeral Postgres 17 service
  container — no Neon secret needed in CI) and `.github/dependabot.yml`
  (root, `backend/`, github-actions, weekly).
- **[Done, 2026-07-16]** PWA basics (build step 19): `public/manifest.json`,
  `public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png`
  (rasterized from the existing `favicon.svg` mark via a disposable Playwright
  script, not committed), a minimal `public/sw.js` (no caching strategy — just
  enough for Chrome's installability check) registered in `main.tsx`
  (production-only). `index.html` gained the manifest link, theme-color, and
  Apple PWA meta tags. Verified in a real browser: manifest/sw/icons all 200,
  service worker registers and activates, no regressions.
- **[Proposal]** Replace `window.confirm` destructive prompts with an on-brand
  confirm dialog; add focus management to sheets/overlays.

---

## Post-MVP backlog (do NOT build without explicit request) [Confirmed]

From `FEATURES_SCOPE.md` "future ideas": full Map Comparison (filters, intersection
stats, shared-visit history), a real "similar taste" ML recommendation algorithm,
Routes, Shared Walks, "Today", Smart Suggestions, a "From friends"
feed tab/algorithm. Each needs its own design pass before implementation. Until then
they remain `ComingSoon` teasers.

**"On this day" moved out of this backlog on 2026-07-16** (explicit maintainer
request) — see Phase 6 below.

---

## Phase 6 — Design-fidelity pass + "On this day" (2026-07-16)

Triggered by a maintainer visual QA pass after Phase 5 closed. `@design-auditor`
audits confirmed real drift, not just "looks different":

- **Geo-jump icon.** `UnifiedPlaceCard` already implements a `near_me` button
  (`onOpenOnMap` prop) matching the mockup (FEED TAB, source lines 449/473;
  FRIEND PROFILE OVERLAY 740) — but none of its three call sites
  (`PlacesChronicle`, `FeedItemCard`, `PersonProfilePage`) ever pass the prop,
  so it never renders anywhere. Fix requires more than passing a callback:
  `MapPage` has no way today to receive "open with place X focused" from
  another tab — needs a navigation-state/query-param mechanism.
- **Stale feedback badge.** `setFeedback`/`clearFeedback` in `placesApi.ts`
  only invalidate `Place` tags, not `Feed`/`Person` — liking a place from its
  detail view doesn't refresh the heart/flag badge on feed cards or a
  friend-profile card for that same place until an unrelated full refetch.
  Real bug, fix the tag graph.
- **Profile screen drift.** Settings is a `BottomSheet` form; the mockup is a
  full-screen overlay with "Приватность"/"Уведомления" section headers. Stat
  cards, the routes-teaser card, avatar size, and top safe-area inset also
  drifted from the mock. `ProfilePage.tsx`'s live collections preview grid and
  `design.md`'s documented "Avatar 80 + status + bio + 3-up stats" composition
  are intentional deviations from the literal mock, not bugs — kept as-is.
- **Collections privacy — turned out already fully built.** The maintainer's
  ask ("настраивать коллекцию публичной или приватной, приватная — скрыта от
  всех") is exactly `Collection.visibility`, already wired end-to-end:
  `CollectionForm`'s public/private `Switch`, the 🔒 icon in `CollectionsPage`,
  and both the mock and real `collectionService.ts` already filter followed
  users' private collections out entirely. No new Settings toggle needed —
  the mockup's "Защищать коллекции кодом" (a PIN-code idea) was a red herring;
  what the maintainer actually wanted already exists per-collection.
- **"On this day" map memory — moved into MVP scope by explicit request.**
  Original ask was framed as a Settings notification toggle; turned out the
  real feature is a dismissible card on the Map tab surfacing own places added
  on this calendar day in a previous year, tap → that place's detail. Decided
  **always-on, no settings toggle** (maintainer's explicit choice — simpler,
  like Google Photos' "memories"). Computed **client-side** from the
  already-loaded own-places list (`GET /places` already returns every own
  place with `createdAt`) — no new endpoint, no DTO change, no backend work.
- **Geo-jump from the detail view.** `PlaceDetailView`'s location pin next to
  the date was decorative — made it a real geo-jump button (same
  `focusPlaceId`/`focusFriendId` router-state mechanism as the card version).
  All three renderers of `PlaceDetailView` (`MapPage`, `FeedPage`,
  `PersonProfilePage`) now thread through the friend id they already have.
- **Current-location button on the Map.** New `my_location` header icon —
  `navigator.geolocation.getCurrentPosition`, recenters the real Yandex map
  (`YMap.setLocation`) and renders a "you are here" dot in both real and
  placeholder rendering paths. On permission denial: an inline dismissible
  error banner, **not a toast** (the project has no toast system — `TOAST` is
  explicitly Vision-scope per `design.md`).
- **Status/feedback model redesign — the largest change in this pass, revised
  D4 (decisions.md), 2026-07-16, explicit maintainer request.** Original ask
  ("remove the three status labels, replace with Liked/Not Recommended, and
  show a friend's own rating") turned out to require reversing a foundational
  decision, not a relabel:
  - **`myFeedback` is now the place OWNER's own recommendation, identical for
    every viewer** — not each viewer's independent personal reaction. Only
    the owner may `POST`/`DELETE /places/:id/feedback` now (403 for anyone
    else, even on a fully visible public place — new behavior, previously
    "anyone who can see it can react").
  - **`PlaceDetailView`** lost the three-status chip row (`want_to_visit`/
    `planned`/`favorite`, owner-editable) and the separate feedback cycling
    button. Replaced by **one** tappable chip cycling
    «Хочу посетить» → «Рекомендую» → «Не рекомендую» (owner) / read-only for
    everyone else, driven entirely by `myFeedback` — `setFeedback`/
    `clearFeedback`, not `updatePlace`. The `status` enum itself is
    **unchanged** (still exactly `want_to_visit`/`planned`/`favorite`, still
    set once at `AddPlaceForm` creation, per `CLAUDE.md`'s lock) — it is
    simply no longer edited or displayed after creation.
  - **"Запланировано" collapsed into "Хочу посетить"** everywhere a filter
    used to read raw `status`: `PlacesChronicle`'s chip, `mapOverlayFilter`'s
    `ownWantToVisit`/`friendWantToVisit`, both now test `myFeedback === null`
    instead of `status === 'want_to_visit'`. `mapOverlayFilter`'s `favorites`
    filter now tests `myFeedback === 'like'` instead of `status === 'favorite'`.
  - **`hasVisited()`** (`mapMatching.ts`) redefined as
    `status !== 'want_to_visit' || myFeedback !== null`, so places created
    before this change (with a real `planned`/`favorite` status but no
    feedback row) still count correctly in the friend-overlay comparison.
  - Backend: new shared `getOwnerFeedbackMap` helper
    (`backend/src/services/ownerFeedback.ts`) used by `feedService`,
    `peopleService`, `collectionService`; `placeService.getPlaceDetail` and
    the mock routes query feedback by `place.ownerId`, not `currentUserId`.
    `feedbackService.setFeedback`/`clearFeedback` now assert ownership
    (`assertPlaceOwnedForFeedback`), not merely visibility.
  - `UnifiedPlaceCard`'s heart/flag badge needed **no code change** — it
    already renders from `myFeedback`, which now carries the new meaning
    automatically. Same for `PlacesChronicle`'s own-place filtering (viewer
    is always the owner there, so behavior for own places is unchanged).
  - `AddPlaceForm`'s creation-time status picker is untouched — still offers
    all three `PLACE_STATUS_LABELS` values, deliberately, since this change
    is scoped to post-creation display/editing only.

---

## Suggested ordering rationale

Backend first (Phase 1) unlocks everything real and validates the mock-as-spec
bet; auth/session (Phase 2) removes the most jarring UX gap; map/media (Phases 3–4)
finish the last real MVP features; quality/delivery (Phase 5) hardens the portfolio
repo. This mirrors `FEATURES_SCOPE.md`'s own sequence (backend 1–8, frontend 9–16,
map 17, polish 18, PWA 19) with the frontend/mock portion already complete.
