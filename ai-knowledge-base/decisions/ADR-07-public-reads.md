# ADR-07 — Public resources are readable without authentication

**Status:** Decided. **Blocks:** the auth middleware in Phase 1 — this must be settled *before* it is written,
not after.

## Context

Reading the mock routes revealed that six read endpoints perform **no `401` check**:

```
GET    /places/:id
GET    /places/:id/comments
GET    /people/:id
GET    /people/:id/places
GET    /people/:id/collections
DELETE /places/:id/feedback          ← not a read. See below.
```

A public place is therefore readable **without a token**. This was ambiguous: an oversight, or intent?

## Decision

**Intent.** Public resources are readable without authentication.

Pinstory is a **memory-sharing** product. Sharing that requires the recipient to sign up first is not sharing.
The product's direction — public profile links, shareable memory URLs, web-to-mobile hand-off, a PWA/native
wrapper — all depend on a public read surface existing from the start. Bolting it on later means retrofitting
every route, every cache key, and every guard.

## The authentication matrix — binding on the backend

**Authentication is required for exactly four things:** private data · user-owned actions · **every mutation** ·
personalized responses.

### Public — no token

| Endpoint | Note |
|---|---|
| `GET /places/:id` | **Public places only.** A private place is not visible to an anonymous caller — the `visibility` filter is unchanged. |
| `GET /places/:id/comments` | Visible if the place is. |
| `GET /people/:id` | `isFollowing` / `isCloseFriend` come back `false` without a token. Correct. |
| `GET /people/:id/places` | `visibility = 'public'` only. |
| `GET /people/:id/collections` | Public collections only. |
| `POST /auth/register`, `POST /auth/login` | Obviously. |

### Requires a token

| Endpoint | Why |
|---|---|
| `GET /places` | **Personal catalogue** — includes the caller's private places. |
| `GET /feed` | **Personalized** — built from who the caller follows. |
| `GET /profile`, `PATCH /profile` | Own data. |
| `GET /people/search` | Personalized (`isFollowing`, `isCloseFriend` per result). |
| **Every `POST` / `PATCH` / `DELETE`, without exception** | Mutations. Including feedback, comments, follows, close-friend, collections, and collection membership. |

## Three consequences. All of them bind.

### C1 — `DELETE /places/:id/feedback` must gain a `401`
It is a **mutation**, not a read. It currently has no auth check. This decision does not excuse that —
**it sharpens it.** Fix the mock and implement the backend with the check.

### C2 — Collapse the existence oracle on public reads
`GET /places/:id` currently distinguishes:
- `404 PLACE_NOT_FOUND` — no such place
- `403 PLACE_FORBIDDEN` — exists, but private and not yours

With authenticated-only reads, that oracle was limited to signed-in users. **Public reads point it at the open
internet.** An anonymous prober can now walk the id space and learn exactly which ids exist and which of them
are private — i.e. enumerate the *existence and privacy status* of every memory in the product, without an
account.

**Return `404` for both cases** on public reads: "not found" and "not yours" must be indistinguishable. The same
collapse is already done correctly on `PATCH`/`DELETE /places/:id`, which return `403` for a non-existent place
rather than leaking `404`. Apply the same discipline to reads, inverted to `404`.

Applies equally to `GET /places/:id/comments` and to feedback routes.

### C3 — Ids must be UUIDs, never sequential
The mock uses `place-1`, `place-2`… — fine for an in-memory mock with six seed users. **In a backend with a
public read surface, sequential ids are an enumeration invitation.** The Prisma schema already specifies
`@default(uuid())`. **Keep it.** This is no longer a stylistic preference; C2's mitigation depends on it.

Related: public reads must be **rate-limited**. `express-rate-limit`'s global bucket (~100 req / 15 min / IP)
covers this, but it is now load-bearing rather than merely tidy.

## What does not change

**The `visibility` filter is still the security boundary, and it is unchanged.** "Public reads" means public
*resources* are readable without a token. It does not mean private resources become readable, and it does not
weaken a single invariant in `.claude/rules/privacy.md`. A private place is invisible to an anonymous caller for
exactly the same reason it is invisible to a signed-in stranger.

## What this enables — do not build it now

Public profile links · shareable memory URLs · web-to-mobile hand-off · deep links into a PWA or native wrapper.

**None of these is in scope** (`FEATURES_SCOPE.md`). This decision exists so they remain *reachable*, not so
they get built. See ADR-03: do not prepare, do not foreclose.
