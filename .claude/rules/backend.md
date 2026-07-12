---
description: Express + Prisma backend. Dormant until Phase 1 — the mock is the spec.
globs:
  - "backend/**"
  - "prisma/**"
---

# Backend

**Not implemented.** `backend/` is empty. This rule activates when it isn't.

## The prime directive
**The mock is the specification.** `mockDb.ts` *is* the Prisma schema; the mock routes *are* the endpoint semantics. Implementing the backend is **transcription, not design.** If you find yourself redesigning something, stop — either the mock is wrong (fix the mock first, and say so) or you are drifting.

**Acceptance:** the app behaves identically with `VITE_USE_MOCKS=false`. Zero frontend changes. That is the whole bet — do not compromise it for backend convenience.

## ⚠ `BACKEND_INSTRUCTIONS.md` §3 is an outdated schema
It contains a full Prisma schema. **Do not transcribe it.** It is missing `Place.mood`, `User.defaultVisibility`, `User.notifications`, and `PlaceComment.updatedAt` — all of which exist in the code. Copying it silently drops the mood feature, and you would not find out until mocks are switched off.

**Take the schema from `mockDb.ts`. Take the endpoint contracts, status codes and security requirements from `BACKEND_INSTRUCTIONS.md`** — those parts are authoritative and detailed. See `ai-knowledge-base/doc-conflicts.md`.

## Stack (fixed)
Express **5.2.1** · Prisma **6.19.x** · PostgreSQL **17** · `jose` 6.2.x (JWT) · `bcryptjs` 3.0.x (**cost factor 12**) · `multer` 2.1.1 · `helmet` · `cors` · `express-rate-limit` · `pino`/`pino-http`. One `PrismaClient` instance for the whole app.
Layered structure: `routes/` · `controllers/` · `services/` · `middleware/` · `prisma/`.
Tests: Vitest + **Supertest 7**.

## Security middleware — before any business logic
- `helmet()` **first** in the chain.
- `cors({ origin: process.env.FRONTEND_URL, credentials: true })` — an **explicit origin, never `*`**. `credentials: true` is required for the refresh cookie.
- `express-rate-limit`: ~100 req / 15 min / IP globally; **~5–10 req / 15 min on `/auth/*` and photo upload** → `429`.
- `express.json({ limit: '1mb' })` and `express.urlencoded({ limit: '1mb' })`.
- `pino` + `pino-http` with **`redact` on `authorization`, `password`, `token`, `cookie`**.
- Every input validated **server-side with Zod**. Only parameterized Prisma queries.
- Passwords and tokens never appear in logs or in a response body.
- JWT: always verify `alg` explicitly. Never trust the token header.

## Infrastructure-agnostic — deliberately
The hosting target is **undecided** (ADR-01). Therefore:
1. **No vendor SDKs. No platform-specific build steps. All configuration through environment variables.**
2. **Photo storage behind an interface** — `multer` to local disk now, object storage later. Do not let the storage choice leak into route handlers.
3. **Nothing may assume a filesystem that persists across deploys.** `BACKEND_INSTRUCTIONS.md` §6 already flags ephemeral disk as a known limitation — treat it as a property of *any* host, not one vendor's quirk.
4. Migrations: `prisma migrate dev` locally, **`prisma migrate deploy` on every deploy — never `migrate dev`.**

## Photo upload
`POST /places/:id/photo` — multer attached to **this route only**. Validate extension **and** MIME. Save under a generated name (`crypto.randomBytes(16).toString('hex')` + a verified extension), **never the client's `originalname`**.

## Auth
`POST /auth/register` (email + password + `displayName`, 409 on duplicate) · `POST /auth/login` (short-lived access token, 5–15 min) · `POST /auth/refresh` · `POST /auth/logout` → 204.
**Refresh-token transport is ADR-04.** An httpOnly cookie (`Secure`, `SameSite`, `Path` scoped to the refresh endpoint) is the documented intent, but it does not survive a future native wrapper. **Keep the token-issuing and token-reading layer behind a seam — do not hardcode the cookie assumption into route handlers.**

## Data notes
- Coordinates are plain `Float` `lat`/`lng`. **No PostGIS** — there are no spatial queries in this product (ADR-02).
- `followersCount` / `followingCount` **must be derived from the `Follow` table**, never stored. The mock uses static seed values and lies about this (known issue #3, ADR-05).
- `myFeedback` / `isOwner` are computed per request, never columns.
- `PlaceFeedback` is `@@unique([userId, placeId])` — an upsert, not an insert.
- Unfollowing must also clear `isCloseFriend`.

## Security — reproduce exactly
Every status code and error `code` from the mock, unchanged. Full invariant list: `privacy.md`.
Build **one reusable visibility helper** parameterized by "whose places", and route every read through it. Do not reimplement the filter per endpoint — that is how one of them ends up wrong.

**One clarification worth pinning:** `GET /people/:id/places` returns that user's **public** places. The follow check lives on the **frontend** (`isFollowing` from `GET /people/:id`); the server does **not** gate on follow status, because the `visibility = 'public'` filter already protects the data (`BACKEND_INSTRUCTIONS.md` §12). `FEATURES_SCOPE.md` phrases this as "требует подписки", which is looser than the actual contract. Do not add a server-side follow gate without an explicit decision — and do not remove the visibility filter on the assumption that the follow gate covers it.

## Do not build
No endpoints — not even stubs — for Routes, full Map Comparison, Shared Walks, "Today", "On this day", Smart Suggestions. If one becomes necessary, update `FEATURES_SCOPE.md` first.

## Order of work
`roadmap.md` Phase 1, steps 1–11. Port **one mock route at a time**. After each, run the frontend against it with `VITE_USE_MOCKS=false` and confirm nothing changed.
