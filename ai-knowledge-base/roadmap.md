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

- **[Confirmed]** Write the prioritized tests from `TESTING_PLAN.md`: auth, access
  rights, follows, place/collection privacy, Zod validation. Only the feed is tested
  today. Use `test-writer` after implementing risky logic.
- **[Confirmed]** Add the lint → typecheck → `vitest run` GitHub Actions CI and
  Dependabot described in `DEPLOYMENT.md` (only the Pages deploy workflow exists).
- **[Confirmed]** PWA basics (build step 19): `manifest.json`, icons, install-to-home.
- **[Done, 2026-07-13]** ~~Refresh the stale `README.md` status table~~ — done
  alongside Phase 1's completion.
- **[Proposal]** Replace `window.confirm` destructive prompts with an on-brand
  confirm dialog; add focus management to sheets/overlays.

---

## Post-MVP backlog (do NOT build without explicit request) [Confirmed]

From `FEATURES_SCOPE.md` "future ideas": full Map Comparison (filters, intersection
stats, shared-visit history), a real "similar taste" ML recommendation algorithm,
Routes, Shared Walks, "Today", Smart Suggestions, "On this day", a "From friends"
feed tab/algorithm. Each needs its own design pass before implementation. Until then
they remain `ComingSoon` teasers.

---

## Suggested ordering rationale

Backend first (Phase 1) unlocks everything real and validates the mock-as-spec
bet; auth/session (Phase 2) removes the most jarring UX gap; map/media (Phases 3–4)
finish the last real MVP features; quality/delivery (Phase 5) hardens the portfolio
repo. This mirrors `FEATURES_SCOPE.md`'s own sequence (backend 1–8, frontend 9–16,
map 17, polish 18, PWA 19) with the frontend/mock portion already complete.
