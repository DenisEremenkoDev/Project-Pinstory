# Pinstory — backend instructions

Use this as a step-by-step plan. Each item is a complete step with a working result. Scope is locked in `FEATURES_SCOPE.md` — read it before starting. General rules and versions — in `CLAUDE.md`. Don't add endpoints for anything marked Coming Soon (full map comparison, routes, shared walks, "today," "on this day," smart suggestions) — that's deliberately deferred.

## Stack and versions

Unchanged after the rebrand — see `CLAUDE.md`: Node.js 24 LTS, Express **5.2.1**, Prisma **6.19.x** + PostgreSQL **17**, JWT via **`jose` 6.2.x** (preferred) or `jsonwebtoken` strictly **≥9.0.0**, **`bcryptjs` 3.0.x** (cost factor 12), **`multer` ≥2.0.2 (use 2.1.1)**. Plus a security layer: `helmet`, `cors`, `express-rate-limit`; logging: `pino` + `pino-http`.

## 1. Project initialization

- Node.js + Express, layered structure: `routes/`, `controllers/`, `services/`, `middleware/`, `prisma/`
- Pin the Node version in `.nvmrc` (24) and `engines` in `package.json`
- `.env`: DB connection string, JWT secret (long random string), port, `YANDEX_GEOCODER_API_KEY` (see §17 — backend-only, never exposed to the client); `.env.example` with empty values in the repo, `.env` in `.gitignore`
- CORS for the frontend URL from `.env` — explicit origin, never `*`, together with `credentials: true` (needed for the refresh cookie)

## 2. Security middleware (do this right away, before other logic)

- `app.use(helmet())` — first in the middleware chain
- `cors({ origin: process.env.FRONTEND_URL, credentials: true })`
- `express-rate-limit`: a general limit (~100 requests / 15 min / IP) on the whole app, a stricter limit (~5–10 requests / 15 min) on `/auth/*` and the photo upload endpoint — return `429`
- `express.json({ limit: '1mb' })` and `express.urlencoded({ limit: '1mb' })`
- `pino` + `pino-http` with `redact` for `authorization`, `password`, `token`, `cookie` fields; level from `process.env.LOG_LEVEL`

## 3. Database schema (Prisma)

The full schema for Pinstory's expanded scope — People/follows, collections, feedback (like/dislike), friends' comments:

```prisma
enum PlaceStatus {
  want_to_visit
  planned
  favorite
}

enum Visibility {
  public
  private
}

enum Sentiment {
  like
  dislike
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  displayName  String              // profile name, required — needed for People/search/comments
  avatarUrl    String?
  bio          String?
  status       String?             // short profile status line
  createdAt    DateTime @default(now())

  places       Place[]
  feedback     PlaceFeedback[]
  comments     PlaceComment[]
  collections  Collection[]

  following    Follow[] @relation("Follower")   // people I follow
  followers    Follow[] @relation("Following")  // people who follow me
}

model Follow {
  id            String   @id @default(uuid())
  followerId    String
  follower      User     @relation("Follower", fields: [followerId], references: [id])
  followingId   String
  following     User     @relation("Following", fields: [followingId], references: [id])
  isCloseFriend Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@unique([followerId, followingId])
}

model Place {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  name        String
  latitude    Float
  longitude   Float
  rating      Int                 // owner's personal rating, 1–5, required at creation
  note        String?             // the "story" — a short emotional note
  photoUrl    String?
  tags        String[]
  status      PlaceStatus         // want_to_visit | planned | favorite — ONLY these three values, "visited" doesn't exist and won't
  visibility  Visibility          // public | private
  createdAt   DateTime @default(now())

  feedback    PlaceFeedback[]
  comments    PlaceComment[]
  collections CollectionPlace[]
}

model PlaceFeedback {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  placeId   String
  place     Place    @relation(fields: [placeId], references: [id])
  sentiment Sentiment           // like | dislike — heart / flag
  createdAt DateTime @default(now())

  @@unique([userId, placeId])   // one user — one opinion per place
}

model PlaceComment {
  id        String   @id @default(uuid())
  placeId   String
  place     Place    @relation(fields: [placeId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  rating    Int                 // the comment author's own rating, 1–5 (not the place owner's rating)
  text      String
  createdAt DateTime @default(now())
}

model Collection {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  name        String
  description String?
  visibility  Visibility   // public | private — same pattern as places
  createdAt   DateTime @default(now())

  places      CollectionPlace[]
}

model CollectionPlace {
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id])
  placeId      String
  place        Place      @relation(fields: [placeId], references: [id])
  addedAt      DateTime   @default(now())

  @@id([collectionId, placeId])
}
```

One `PrismaClient` instance for the whole app. On deploy, only `prisma migrate deploy`.

**Important difference from the old "My Atlas" schema:** place status used to be `"want"|"been"`, now it's `want_to_visit|planned|favorite` — three values, no "visited." The old `Like` (a plain like) is replaced by `PlaceFeedback` with `sentiment: like|dislike` (heart/flag).

**Enums, not raw strings (updated decision):** `status`, `visibility`, and `sentiment` are Prisma `enum` types, not free-form `String`. This gives a real DB-level constraint (Postgres native enum type) in addition to Zod validation, and `@prisma/client` generates the literal union type automatically — no need to hand-duplicate it in Zod schemas on the backend or in TS types on the frontend. Trade-off worth knowing: adding a new enum value later needs a schema migration (a plain string wouldn't), but that's an acceptable cost here since these value sets are locked in `FEATURES_SCOPE.md` and not expected to grow.

## 4. Authentication

- `POST /auth/register` — email + password + `displayName`, password only via bcryptjs (cost factor 12), never logged
- `POST /auth/login` — password check, issues an access token (short-lived, 5–15 min) + a refresh token (httpOnly cookie, `Secure`, `SameSite=Strict`/`Lax`, `Path` scoped to the refresh endpoint)
- `POST /auth/refresh` — refreshes the access token using the refresh token from the cookie
- `POST /auth/logout` — clears the refresh token
- Middleware to verify the access token for all protected routes below; always explicitly check `alg`, never trust the token's header

## 5. Places — CRUD

- `GET /places` — only the current user's own places (by token), including private ones; privacy filtering happens at the Prisma query level
- `GET /places/:id` — if the place belongs to someone else and `visibility = private` — `403`, even if the id is guessed directly
- `POST /places` — creation, server-side validation via Zod (coordinates — numbers within a valid range; name — not empty; `rating` — required, 1–5; `status` — only from `want_to_visit`/`planned`/`favorite`; `visibility` — only from the allowed set)
- `PATCH /places/:id` — editing, only if `ownerId` matches the current user
- `DELETE /places/:id` — same ownership check

## 6. Photos

- `POST /places/:id/photo` — upload via multer (version ≥2.0.2), wired **only to this route**
- Limit by size and file type (extension + MIME)
- Save the file under a generated name (`crypto.randomBytes(16).toString('hex')` + a validated extension), not the client's `originalname`
- Storage — locally on the server disk (`/uploads`, served via Express static); Railway's disk is ephemeral, mention this in the README as a known limitation

## 7. Personal feedback (heart/flag)

- `POST /places/:id/feedback` — body `{ "sentiment": "like" | "dislike" }`, upsert (one user — one record per place, `@@unique([userId, placeId])`)
- `DELETE /places/:id/feedback` — remove your opinion
- Can't leave feedback on someone else's private place if it's not visible to you (same visibility check as `GET /places/:id`)

## 8. Friends' comments and reviews

- `GET /places/:id/comments` — list of comments on a place (available if the place itself is visible to the current user)
- `POST /places/:id/comments` — body `{ "rating": 1-5, "text": "..." }`; anyone who can see the place can comment, not just the owner
- A comment can't be left on an invisible private place belonging to someone else — `403`, same visibility check
- **`PATCH /places/:id/comments/:commentId`** — edit your own comment's `rating`/`text`; **`DELETE /places/:id/comments/:commentId`** — delete your own comment. Both require `authorId === current user` — `403` otherwise, `404` if the comment doesn't exist. (Added to scope — was previously read/create only; `architecture-guard.md` already expects this authorship check, so the reviewer and the spec are now in sync.)
- **Frontend UI is implemented** (per the design mockup): edit/delete icons on your own comment inline in the "Reviews and comments" block, `window.confirm` before delete (same pattern as deleting a place)

## 9. People — search, follows, close friends

- `GET /people/search?q=` — search users by `displayName` (case-insensitive, excludes self), returns `id`/`displayName`/`avatarUrl`/`isFollowing`
- `POST /people/:id/follow` — follow; can't follow yourself (`400`)
- `DELETE /people/:id/follow` — unfollow (also clears `isCloseFriend`, if set)
- `PATCH /people/:id/close-friend` — toggle "close friend"; only available if already following (`403` otherwise)
- `GET /people/:id` — public profile: `displayName`, `avatarUrl`, `bio`, follower/following counts, the current user's `isFollowing`/`isCloseFriend` relative to them, a simplified trust signal (see §11)
- `GET /people/:id/places` — only the specified user's **public** places; used both for the friend profile and for the map overlay (§12)
- `GET /people/:id/collections` — only their public collections

## 10. Collections

- `GET /collections` — own collections + a flat list of public collections from people you follow (frontend splits them into sections)
- `POST /collections` / `PATCH /collections/:id` / `DELETE /collections/:id` — own only, `ownerId` check
- `POST /collections/:id/places/:placeId` — add your own place to your own collection (checks ownership of both the collection and the place)
- `DELETE /collections/:id/places/:placeId` — remove a place from a collection

## 11. "For You" activity feed

- `GET /feed` — aggregates recent public place additions: your own + people you follow; sorted by `createdAt`, paginated (`?cursor=`/`?limit=`)
- Each item — the minimal card field set (see the Unified Place Card in `FRONTEND_INSTRUCTIONS.md`), not the full place object
- No separate "From friends" toggle tab — that's Coming Soon, don't implement it
- **Rule for picking `type` (locked, don't leave to implementation-time judgment):** for each new `Place`, determine the feed item's `type` at creation time as follows — if `status === "want_to_visit"` → `"wants_to_visit"`; else if `note` is non-empty → `"story_added"`; else → `"place_added"`. Check `status` first: a "want to visit" entry with a note is still framed as "wants to visit," not "added a story."

## 12. Friend map overlay (basic — real in MVP)

- No separate endpoint needed — the frontend calls the existing `GET /people/:id/places` (only the selected friend's public places) and renders them as a second pin layer over the user's own
- Only available for people the user follows (checked on the frontend via `isFollowing` from `GET /people/:id`, not as a separate server-side check on top of visibility — the data is already protected by the `visibility = 'public'` filter)
- Full "Map Comparison" (deep intersection analytics, etc.) — Coming Soon, don't build endpoints for it

## 13. Profile

- `GET /profile` — current user's aggregated data: `displayName`, `avatarUrl`, `bio`, status, place count, follower/following counts, own places
- `PATCH /profile` — editing `displayName`/`avatarUrl`/`bio`/`status`/privacy and notification settings (notification fields — minimal, just so the settings form isn't empty; real push notifications are out of MVP scope)

## 14. Security — check on every endpoint

- All input validated server-side via Zod
- Ownership check on every mutating endpoint (`PATCH`/`DELETE`) — for places, collections, and comments (only the author can edit/delete their own comment via `PATCH`/`DELETE /places/:id/comments/:commentId`)
- Place and collection privacy — filtered at the DB query level, not post-processed in code
- Can't follow yourself, can't leave feedback/a comment on an invisible place
- Passwords, tokens — never in logs or the API response body
- Only parameterized Prisma queries

## 15. Environment and local run

- `.env.example` describing all variables, without real secrets
- Instructions for running PostgreSQL locally (Docker or a local install)
- `prisma migrate dev` to apply the schema locally (on deploy — `migrate deploy`)

## 16. Not doing in this pass

- Endpoints for routes, full map comparison, shared walks, "today," "on this day," smart suggestions — do not create, not even a stub. If needed later, add them as a separate step, after updating `FEATURES_SCOPE.md`

## 17. Yandex Geocoder — key and usage constraints (note for when geocoding work starts; nothing to implement yet)

The Geocoder API key already exists and lives in the root `.env` as `YANDEX_GEOCODER_API_KEY` (placeholder in `.env.example`). It deliberately has **no `VITE_` prefix**: Vite only exposes `VITE_*` variables to the client bundle, so this key can never leak into frontend code. All geocoding calls go **through the backend only** — the client never talks to the Geocoder API directly; the backend reads the key from `process.env.YANDEX_GEOCODER_API_KEY`.

**Free-tier limit: 1000 requests/day** (resets daily) — separate from the JS Map API's own 25k/day map-load limit. Every text→coords and coords→text call counts, including each autocomplete keystroke and any map-drag reverse geocoding. At 1000/day this budget is easy to burn with naive autocomplete.

Planned optimizations for the implementation pass (not needed yet — just don't design against them):

- **Debounce address-autocomplete input** (300–500 ms) before calling the geocoder.
- **Store the geocoded result on the Place record** at save time — never re-geocode an address the user already saved. This is the allowed kind of storage per the project's Yandex legal note (only what the user explicitly picked and saved).
- **Short-TTL cache for repeated/popular address queries across users** (in-memory or Redis). ⚠️ Flag, per the doc-conflict rule: a cross-user cache of geocoder responses sits in tension with the project's own legal constraint ("geosuggest and geosearch are always live requests to the Yandex API — never proxy through your own DB", `CLAUDE.md`) and with Yandex's caching terms. Verify against the current API terms of use before building it; if in doubt, skip this cache — debounce + per-place storage already remove most of the load.
- **Reverse-geocode only on explicit user action** (e.g. marker drop / "use this point"), never on every drag movement.
- **Periodically check usage stats** in the Yandex Developer Cabinet, especially the first days after geocoding ships.

---

## Appendix — exact API contracts

Common to all protected endpoints: header `Authorization: Bearer <access_token>`. Missing/invalid — `401`. Rate-limit exceeded — `429`.

Common error shape:
```json
{ "error": { "message": "Human-readable description", "code": "PLACE_NOT_FOUND" } }
```

### Auth

**POST /auth/register** — `{ "email", "password", "displayName" }` → `201 { "id", "email", "displayName" }`. Errors: `409` (email taken), `400` (validation failed).

**POST /auth/login** — `{ "email", "password" }` → `200 { "accessToken", "user": { "id", "email", "displayName", "avatarUrl" } }`. Refresh token — httpOnly cookie only. Errors: `401`.

**POST /auth/refresh** — no body, refresh token from the cookie → `200 { "accessToken" }`. Errors: `401`.

**POST /auth/logout** — no body → `204`.

### Places

**GET /places** → `200 { "places": [ { "id", "name", "latitude", "longitude", "rating", "note", "photoUrl", "tags": [], "status": "want_to_visit"|"planned"|"favorite", "visibility", "createdAt", "myFeedback": "like"|"dislike"|null } ] }`

**GET /places/:id** → `200` (the same object + aggregates: `commentsCount`, like/dislike counts). Errors: `403` (someone else's private place), `404`.

**POST /places** — body without `id`/`createdAt`, `rating` required → `201`.

**PATCH /places/:id** → `200`. `403` — not the owner.

**DELETE /places/:id** → `204`. `403` — not the owner.

**POST /places/:id/photo** — `multipart/form-data`, field `photo` → `200 { "photoUrl": "/uploads/abc.jpg" }`.

### Feedback

**POST /places/:id/feedback** — `{ "sentiment": "like" | "dislike" }` → `200 { "sentiment": "like", "likesCount": 6, "dislikesCount": 1 }`. `403` — invisible place.

**DELETE /places/:id/feedback** → `200` (updated counts).

### Comments

**GET /places/:id/comments** → `200 { "comments": [ { "id", "authorId", "authorName", "authorAvatarUrl", "rating", "text", "createdAt" } ] }`

**POST /places/:id/comments** — `{ "rating": 1-5, "text": "..." }` → `201`. `403` — invisible place.

**PATCH /places/:id/comments/:commentId** — `{ "rating"?, "text"? }` → `200`. `403` — not the comment's author. `404` — comment not found.

**DELETE /places/:id/comments/:commentId** → `204`. `403` — not the comment's author.

### People

**GET /people/search?q=** → `200 { "people": [ { "id", "displayName", "avatarUrl", "isFollowing" } ] }`

**GET /people/:id** → `200 { "id", "displayName", "avatarUrl", "bio", "followersCount", "followingCount", "isFollowing", "isCloseFriend", "trustSignal": "You have similar taste in coffee shops" | null }`

**POST /people/:id/follow** → `200 { "isFollowing": true }`. `400` — following self.

**DELETE /people/:id/follow** → `200 { "isFollowing": false }`

**PATCH /people/:id/close-friend** — `{ "isCloseFriend": true|false }` → `200`. `403` — not following.

**GET /people/:id/places** → `200 { "places": [...] }` (only public places of the specified user, same card shape as `GET /places`)

**GET /people/:id/collections** → `200 { "collections": [ { "id", "name", "description", "placesCount" } ] }` (public only)

### Collections

**GET /collections** → `200 { "own": [...], "following": [...] }`

**POST /collections** — `{ "name", "description", "visibility" }` → `201`

**PATCH /collections/:id** / **DELETE /collections/:id** → `200`/`204`. `403` — not the owner.

**POST /collections/:id/places/:placeId** → `200`. **DELETE** likewise.

### Feed

**GET /feed?cursor=&limit=** → `200 { "items": [ { "type": "place_added"|"wants_to_visit"|"story_added", "place": {...}, "author": { "id", "displayName", "avatarUrl" }, "createdAt" } ], "nextCursor": "..." }`

### Profile

**GET /profile** → `200 { "user": { "id", "email", "displayName", "avatarUrl", "bio", "status" }, "placesCount", "followersCount", "followingCount" }`

**PATCH /profile** — any subset of editable fields → `200`

### Status codes — summary

| Code | When |
|---|---|
| 200 / 201 / 204 | Success (with body / created / no body) |
| 400 | Invalid input |
| 401 | Not authenticated / token expired |
| 403 | Authenticated, but no rights to the resource |
| 404 | Resource doesn't exist |
| 409 | Conflict (email already registered) |
| 429 | Rate limit exceeded |
