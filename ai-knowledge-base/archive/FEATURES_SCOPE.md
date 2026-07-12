# Pinstory — final implementation scope, matrix, and sequence of action

This file records exactly what is being built for real right now, and what stays a Coming Soon teaser, based on the product archive `PINSTORY_CONTEXT_ARCHIVE.md` (MVP scope v1.0, locked and refined — the authoritative source for product/design) and the already-finished HTML prototype (`Pinstory - Standalone.html`).

**Rebrand:** the project was "My Atlas," now it's **Pinstory**, with a significantly expanded MVP: full people search and follows, collections, an activity feed, and a basic friend map overlay are all now real, not mocked. The technical stack didn't change — see `CLAUDE.md`.

## Scope decision (locked in)

**Fully real, with a working backend (v1.0):**
1. Authentication (registration, login, protected routes)
2. Profile — settings (account data, avatar, privacy, notifications), social header (posts/followers/following)
3. Collections — a full section (own collections + collections of people you follow)
4. Adding a place (+) — full flow: photo, location (geosuggest), star rating (immediately at creation), note/story, like/dislike indicator (heart/flag), tags, privacy
5. Chronicle → "My Memories" — with filters: All / ❤️ Liked / 🚩 Disliked / Want to visit. **There is no "Visited" filter or status, and there won't be** — removed at explicit request, don't bring it back
6. Unified place card (own and a friend's) — one component: star rating, the author's note, heart/flag badge, geo icon (instant jump to the exact point on the map)
7. Map — a fully working interactive map of your own places
8. People — people search, follow/unfollow, "close friends" toggle, a friend's profile with their public places
9. **Basic friend map overlay** — a simple overlay mechanism: pick a friend → their public places are layered onto your own map as a second pin layer (common places, own only, theirs only, favorites, common "want to visit")
10. Friends' reviews and comments on a place — with each commenter's own star rating, visible directly in the place detail view
11. "For You" activity feed — your own recent additions + public additions from people you follow; cards like "Added a place"/"Wants to visit"/"Added a story," each with two actions: "Add to mine," "View" (per the design mockup — no third "Go together" action)

**Partially real (v1.0):**
- People — search and follow work; full interest-based recommendations ("you have similar taste") are a simplified heuristic in MVP, a real algorithm is for later

**Stays Coming Soon (a teaser overlay — icon + title + description + "Notify me at launch" button, NOT a disabled button and not a hidden feature):**
- A "From friends" tab in the feed, or full friend-recommendation logic in the feed
- Full "Map Comparison" (beyond the basic overlay — a deep comparison tool)
- "On this day" popup recommendations
- Routes
- Shared Walks
- "Today"
- Smart Suggestions

**Important:** don't implement anything beyond this list in the first pass. If something "small" comes up along the way — write it down here first and make a deliberate decision.

## UI/UX requirements, locked in as mandatory

- An explicit visual indicator of personal opinion on a place card: heart (❤️ like/recommend) and flag (🚩 dislike/don't recommend)
- The "Visited" status/label — removed from place cards entirely, don't bring it back
- The star rating is set immediately when adding a new place (in the Add Memory / "Add place" form)
- Identical design and the same set of information on "My Places," "My Memories," and "Friend Places" cards — the same card component, the same information (photo, rating, feedback badge, geo icon)

## Matrix: screen → status → frontend → backend

| Screen / feature | Status | Frontend (what's needed) | Backend (what's needed) |
|---|---|---|---|
| Login / registration | Real | RHF+Zod form (email, password, name), protected route, redirect | `POST /auth/register` (including `displayName`), `POST /auth/login`, `POST /auth/refresh`, JWT + bcrypt |
| Profile: settings and social header | Real | Display from RTK Query, profile edit form (avatar, bio, privacy, notifications) | `GET /profile`, `PATCH /profile` (aggregates places, followers, following) |
| Collections: own | Real | List, create/edit/delete, add a place to a collection | `GET/POST/PATCH/DELETE /collections`, `POST/DELETE /collections/:id/places/:placeId` |
| Collections: followed | Real | Display public collections of people you follow (read-only) | `GET /people/:id/collections` (public only) |
| Adding a place (+) | Real | Bottom sheet: photo, geosuggest/map click, star rating immediately, note, tags (free-text with suggestions), privacy | `POST /places` (validates coordinates/fields, `rating` required at creation) |
| Place card (rating/photo/tags/status/privacy) | Real | Edit form, photo upload | `PATCH /places/:id`, `POST /places/:id/photo` |
| Place detail view (emotional center) | Real | Status (Want to visit/Planned/★Favorite — no "Visited") and rating, visible immediately without scrolling and **inline-editable right in the view** (tap a status chip / tap a star, owner only), heart/flag badge, "Reviews and comments" block from friends with each commenter's own rating, trust signal ("Alex has been here") with avatars, note/story (italic, Newsreader), teaser button "Routes with this place — coming soon" | `GET /places/:id`, `PATCH /places/:id` (status/rating), `GET/POST /places/:id/comments`, `POST/DELETE /places/:id/feedback` |
| Chronicle "My Memories" | Real | Filter chips: All/❤️/🚩/Want to visit; friendly empty state, not an empty list | `GET /places` (own, sorted by date) |
| Unified place card | Real | One component for "My Memories," a friend's places, and feed cards — photo, rating badge, heart/flag badge, geo icon (instantly opens the map and highlights the point), title, metadata; tapping in any context opens the same full place detail | Not needed — pure frontend component |
| Map — own places | Real | Header ("Ваша карта" + place count), own places as pins, click-to-add a point, in-app search over own places/memories. Rendered via the real Yandex Maps JS API 3.0 (`features/places/YandexMap.tsx`, lazy loader in `shared/lib/yandexMaps.ts`) when `VITE_YANDEX_MAPS_API_KEY` is set; without a key it falls back to the placeholder lat/lng→percent projection (`shared/lib/mapProjection.ts`). Live Yandex geosuggest in the add-place form is still pending (separate Suggest/Geocoder API via the backend — see `BACKEND_INSTRUCTIONS.md` §17) | `GET /places` |
| Map — basic friend overlay | Real | Layers icon → "Сравнить карты" friend picker → their public places as a second pin layer (amber = common place, teal = new-to-you), legend badge with counts, filter chips (all/common/own only/theirs only/favorites/common "want to visit"); friend layer z-index above own pins. "Common place" is approximated by name or close coordinates (no cross-user place identity exists in the schema) | `GET /people/:id/places` (only the specified user's public places, requires following them) |
| People: search | Real | Search field by name, results list with avatar/name/follow status | `GET /people/search?q=` |
| People: follow / close friends | Real | "Follow"/"Unfollow" button, "★ Close friend" toggle (only available once already following) | `POST/DELETE /people/:id/follow`, `PATCH /people/:id/close-friend` |
| Friend profile | Real | Avatar, bio, social header, trust line ("similar taste in coffee shops" — simplified heuristic in MVP), list of their public places (unified card) | `GET /people/:id`, `GET /people/:id/places` |
| "For You" activity feed | Real | Lives on the "Хроника" tab behind a "Мои воспоминания"/"От друзей" segmented toggle (per the design mockup — own Chronicle is the default view). "От друзей" view: cards "Added a place"/"Wants to visit"/"Added a story" (followed users' public places), actions "Add to mine"/"View" (two only — no third "Go together" button) | `GET /feed` (aggregates own + followed public places, paginated) |
| Friends' reviews and comments | Real | Lives in the "Отзывы и комментарии" block inside Place Detail, right after the rating/like-dislike row: list of comments (avatar/name/stars/text) with edit/delete icons on your own, plus a comment form (own star rating + text) below the list | `GET/POST/PATCH/DELETE /places/:id/comments(/:commentId)` (anyone who can see the place can comment; only the author can edit/delete their own) |
| "People": interest-based recommendations | Partial | Simple "similar taste" heuristic on a friend's card (shared tags/categories) | Computed on the backend in `GET /people/:id`, no separate ML — simple tag/category intersection |
| Feed: "From friends" tab | Coming Soon | Static teaser overlay (icon + title + description + "Notify me at launch") | Not needed |
| Full "Map Comparison" | Coming Soon | Teaser overlay, the "Compare maps" button in a friend's profile leads here | Not needed |
| "On this day" | Coming Soon | Teaser overlay | Not needed |
| Routes | Coming Soon | Teaser banner in profile ("🚧 Routes — coming soon"), static "Routes" tab in the catalog | Not needed |
| Shared Walks | Coming Soon | Teaser overlay | Not needed |
| "Today" | Coming Soon | Teaser overlay | Not needed |
| Smart Suggestions | Coming Soon | Teaser overlay | Not needed |

## Sequence of action (build order — don't reorder without a reason)

1. **Backend: foundation** — project init, Prisma schema (User with `displayName`/`avatarUrl`/`bio`, Place, PlaceFeedback, PlaceComment, Follow, Collection, CollectionPlace), PostgreSQL connection
2. **Backend: authentication** — register (with `displayName`)/login/refresh, route protection middleware
3. **Backend: places** — CRUD endpoints with owner and privacy checks, star rating required at creation
4. **Backend: photos and feedback** — file upload, like/dislike (`PlaceFeedback`)
5. **Backend: people** — search, follow/unfollow, close friends, a followed user's public places and collections
6. **Backend: collections** — CRUD, adding/removing places in a collection
7. **Backend: comments** — CRUD for `PlaceComment` with place-visibility checks
8. **Backend: feed** — the aggregating `GET /feed` endpoint
9. **Frontend: foundation** — Vite project, TS strict, feature-based folder structure, Prettier/env/enums
10. **Frontend: rebuilding the Pinstory design system** — tokens (colors/fonts/icons/shadows/radii), dark theme, unified place card, Coming Soon component
11. **Frontend: routing and protected routes** — public (login/register) and private (map/feed/profile/people) routes
12. **Frontend: auth slice** — RTK Query, token storage, redirect
13. **Frontend: places slice** — CRUD, adding a place with rating immediately, place detail, feedback, comments
14. **Frontend: people slice** — search, follow, close friends, friend profile
15. **Frontend: collections slice** — own + followed
16. **Frontend: feed slice** — activity feed
17. **Frontend: Yandex Maps** — map display, click-to-add, basic friend map overlay (second pin layer). **Done, including the real map:** with `VITE_YANDEX_MAPS_API_KEY` set, `YandexMap.tsx` renders the real Yandex JS API 3.0 map (muted basemap, pins as markers, tap-to-add); without a key the placeholder lat/lng projection remains as fallback. Live Yandex geosuggest in the add-place form is still pending (separate Suggest/Geocoder API, goes through the backend)
18. **Polish** — loading/error states, Coming Soon overlays for everything on the "not in MVP" list, final comparison against the prototype
19. **PWA basics** — `manifest.json`, icons, install to home screen

Steps 1–8 (backend) and 9–16 (frontend against mocks) can partly be done in parallel, but step 17 (the real map + overlay) makes sense to do last — the least predictable part.

## Future ideas backlog (post-v1.0 — do not build now)

- Full "Map Comparison" (beyond the basic overlay — filters, intersection stats, shared-visit history)
- Friend recommendations in the feed as a separate tab/algorithm
- A real ML "similar taste" algorithm instead of the simple tag heuristic
- Routes, Shared Walks, "Today," Smart Suggestions, "On this day" — once they get their own design pass
