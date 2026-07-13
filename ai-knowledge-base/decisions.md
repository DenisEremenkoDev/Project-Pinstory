# Pinstory — Architectural Decisions

> Decisions **observable in the code** (with the file that evidences them) plus a
> few from the project docs. Each is marked **[Confirmed]** (present in code) or
> **[Assumption]** (inferred; verify before relying on it). Companion:
> [architecture.md](architecture.md), [conventions.md](conventions.md).

---

## Data & API

**D1. One RTK Query API, endpoints injected per feature. [Confirmed]**
`app/api.ts` creates a single `api`; features call `injectEndpoints`. *Why:* one
cache/tag space, one middleware, while keeping domain code co-located.

**D2. Swappable transport via a custom mock `baseQuery`. [Confirmed]**
`VITE_USE_MOCKS !== 'false'` selects `createMockBaseQuery` vs `fetchBaseQuery`
(`app/api.ts`, `shared/lib/mockBaseQuery.ts`). *Why:* endpoints/components never
change when the real backend arrives — flip one env flag. The mock is the
executable spec for the backend.

**D3. In-memory relational mock DB shaped like the future Prisma schema. [Confirmed]**
`shared/lib/mockDb.ts` uses join tables (`follows`, `feedback`, `collectionPlaces`,
`comments`). *Why:* swapping in Postgres/Prisma requires no reshaping.

**D4. `myFeedback` and `isOwner` are computed per viewer, never stored on the place.
[Confirmed]** `MockPlace = Omit<PlaceDto,'myFeedback'|'isOwner'> & { ownerId }`;
handlers derive them from `currentUserId`. *Why:* mirrors a real `PlaceFeedback`
join + per-request auth; storing them worked only by accident with a single seed
user (documented in `mockDb.ts`).

**D5. DTOs vs mock entities are separate types. [Confirmed]**
Wire shapes in `apiTypes.ts` (`*Dto`), storage shapes in `mockDb.ts` (`Mock*`).
*Why:* the API contract is independent of storage.

**D6. Cache invalidation via tags with per-id + `LIST`. [Confirmed]**
e.g. `placesApi` provides `{type:'Place', id}` + `{type:'Place', id:'LIST'}` and
mutations invalidate accordingly; comments use synthetic ids like
`` `${placeId}-comments` ``. *Why:* precise refetching without manual cache edits.

**D7. Feed pagination via cursor with `merge`/`serializeQueryArgs`/`forceRefetch`.
[Confirmed]** `feedApi.getFeed` accumulates pages under a single cache key. *Why:*
"show more" appends instead of replacing.

---

## Auth & security

**D8. Access token in Redux memory only; refresh via httpOnly cookie (intended).
[Confirmed in code / Assumption for cookie]** `authSlice` holds the token; there is
no `localStorage` for it. The cookie/refresh half is **documented intent** with no
implementation (mock `logout` is a no-op). *Consequence:* reload = logout (no
rehydrate). *Why:* XSS-resistant token handling per `CLAUDE.md`.

**D9. Authorization enforced at the query layer, mirrored in mocks. [Confirmed]**
Ownership checks on mutations; privacy filtering on reads (own-only `/places`,
public-only friend places, 403 on private detail, feed = own + followed public);
social invariants (no self-follow, close-friend requires following). *Why:* a
user's private data must never leak, even via a friend's profile/map/feed.

**D10. Mock identity via `mock-token-<userId>`. [Confirmed]**
`getUserIdFromMockToken` slices the id; stands in for reading a JWT subject. *Why:*
a mock-only shortcut that disappears with the real backend.

---

## Map

**D11. Map accepts an array of pin *layers*, not a hardcoded list. [Confirmed]**
`MapLayer = { source:'own'|'friend'; places:[] }`; `MapPage` builds it, both
renderers consume it. *Why:* the friend overlay is a first-class second layer.

**D12. Dual-mode map behind a single key switch. [Confirmed]**
`hasRealMapsKey` (`mapsConfig.ts`) chooses `YandexMap` vs `MapPins`+projection.
*Why:* the app runs (and deploys) with no map key; the real map is opt-in — same
pattern as `VITE_USE_MOCKS`.

**D13. External map API isolated in a service layer. [Confirmed]**
Only `mapsConfig.ts` reads the env key; only `yandexMaps.ts` loads the SDK/touches
`ymaps3`. *Why:* components stay SDK-agnostic; matches the "external APIs behind a
service layer" rule.

**D14. Cross-user "same place" is approximated, not modeled. [Confirmed]**
`isSamePlace` matches by name or near-coordinates (`mapMatching.ts`). *Why:* each
user owns independent `Place` rows; there is no shared place entity by design.

**D15. Geosuggest/geocoding will proxy through the backend; key is non-`VITE_`.
[Assumption / Confirmed intent]** `.env.example` `YANDEX_GEOCODER_API_KEY` has no
`VITE_` prefix on purpose (must not be bundled client-side). Not yet implemented.
Also a legal constraint: never cache Yandex org-search results as a directory.

---

## UI & design

**D16. CSS Modules + design tokens for custom visuals; MUI for form fields only.
[Confirmed]** `tokens.css` + co-located `*.module.css`; MUI theme omits
`CssBaseline` (`muiTheme.ts`). *Why:* full control of the bespoke look; MUI only
where standard form UX helps.

**D17. One `UnifiedPlaceCard` across all contexts. [Confirmed]**
Reused in Chronicle, feed, friend profile. *Why:* consistency; no per-context
markup duplication.

**D18. Coming Soon = a teaser overlay, not a disabled/hidden control. [Confirmed]**
`ComingSoon` component + usages. *Why:* communicate the roadmap without shipping
half-features.

**D19. Icons via Material Symbols Rounded variable font (full axis range), not
`@mui/icons-material`. [Confirmed]** `index.html` loads the full
`opsz,wght,FILL,GRAD` range; `material-symbols.css` defines the FILL toggle. *Why:*
runtime FILL switching for active/selected states (stars, hearts, nav).

**D20. Theme = CSS-var swap via `data-theme` + persisted slice. [Confirmed]**
`themeSlice` (localStorage `pinstory-theme`) + `useTheme` writes `data-theme`.
*Why:* instant, CSS-only theming for custom components.

---

## Product scope (from docs, reflected in code)

**D21. Place statuses are exactly three: want_to_visit / planned / favorite — no
"visited." [Confirmed]** `PlaceStatus` union + `apiTypes.ts` labels; `hasVisited`
derives from status rather than a stored flag. *Why:* removed at the user's
explicit request (3×), permanently — do not reintroduce.

**D22. Bottom nav is 5 slots; Collections live in Profile. [Confirmed]**
`BottomNav` (2 tabs + center add + 2 tabs). *Why:* minimize navigation; don't add a
6th tab.

**D23. Feed tab labeled «Хроника»; "Для вас" is only the in-screen heading.
[Confirmed]** `BottomNav` label vs `FeedPage` `<h1>`.

**D24. No engagement/competition mechanics in People/feed. [Confirmed]**
People has follow/close-friend/trust only; feed has "Add to mine"/"View" only (no
third "Go together", no likes-for-likes). *Why:* trust-based discovery, not a
social network.

**D25. Feature-based folder structure; one slice per domain (only auth+theme need
one). [Confirmed]** *Why:* server state lives in RTK Query, so most domains need no
slice.

---

## Tooling & delivery

**D26. TS strict-plus (`noUncheckedIndexedAccess`, `noImplicitOverride`,
`verbatimModuleSyntax`, no unused). [Confirmed]** `tsconfig.app.json`. *Why:*
maximal safety; explicit `type` imports.

**D27. Deploy to GitHub Pages with a base-path switch. [Confirmed]**
`vite.config.ts` `base` + `deploy-pages.yml` `GITHUB_PAGES=true`. Non-Pages targets
set `GITHUB_PAGES=false` and keep root base. *Why:* Pages serves under a sub-path.

**D28. Minimal ceremony for a solo portfolio project. [Confirmed intent]**
`CLAUDE.md` explicitly excludes CONTRIBUTING/CODE_OF_CONDUCT/CODEOWNERS, SBOM,
Renovate, E2E, Docker. *Why:* avoid over-engineering a learning project.

---

## Notable open gaps between docs and code (verify before acting)

- **Backend Phase 1 is complete and verified** (was "documented but absent" —
  resolved 2026-07-13). README synced to match.
- **Refresh-token/cookie flow is implemented server-side** (`POST /auth/refresh`,
  httpOnly cookie) but the frontend doesn't call it on load yet — reload still
  logs the user out. [Confirmed — Phase 2 work]
- **Lint/test CI + Dependabot described in `DEPLOYMENT.md` but not present.**
  [Confirmed]

When docs and the design mockup disagree, the project rule is to **flag it, not
silently pick a side** (`CLAUDE.md`, `DESIGN_INDEX.md`).
