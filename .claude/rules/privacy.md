---
description: Authorization and visibility invariants. The only unrecoverable failure in this project.
globs:
  - "src/features/**/*.mockRoutes.ts"
  - "src/shared/lib/mockDb.ts"
  - "src/shared/lib/apiTypes.ts"
  - "backend/**"
---

# Privacy & Authorization

A saved place is often someone's home. A leaked coordinate cannot be un-leaked. **This is the only failure in Pinstory that cannot be fixed after the fact.**

## Filter at the query layer. Never in a component.

A component that receives data it should not have has already lost. Filtering must happen where the data is selected — in the mock handler today, in SQL tomorrow.

## Authentication is not the boundary. Visibility is. (ADR-07)

**Public resources are readable without a token** — Pinstory is a memory-sharing product, and sharing that requires the recipient to sign up is not sharing. This is deliberate.

**It changes nothing about privacy.** A private place is invisible to an anonymous caller for exactly the same reason it is invisible to a signed-in stranger: the `visibility` filter. Do not confuse "this route has no `401`" with "this route is unguarded".

| No token needed | Token required |
|---|---|
| `GET /places/:id` *(public only)* | `GET /places` — personal catalogue, includes private |
| `GET /places/:id/comments` | `GET /feed` — personalized |
| `GET /people/:id` | `GET /people/search` — personalized |
| `GET /people/:id/places` *(public only)* | `GET` / `PATCH /profile` |
| `GET /people/:id/collections` *(public only)* | `GET` / `POST` / `PATCH` / `DELETE /collections` |
| `POST /auth/register`, `POST /auth/login` | **Every `POST` / `PATCH` / `DELETE`, without exception** |

**Two rules that follow, and they are not optional:**

1. **On a public read, "not found" and "not yours" must return the same thing — `404`.** Anything else is an existence oracle pointed at the open internet: an anonymous prober walks the id space and learns which memories exist and which are private. The mock currently distinguishes `404 PLACE_NOT_FOUND` from `403 PLACE_FORBIDDEN` on `GET /places/:id` — **that is a bug now.** (`PATCH`/`DELETE` already collapse correctly, to `403`.)
2. **Ids are UUIDs. Never sequential.** With a public read surface, sequential ids are an enumeration invitation, and rule 1's mitigation depends on this.

## The five read invariants

| Endpoint | Returns |
|---|---|
| `GET /places` | **Only the caller's own places.** |
| `GET /places/:id` | Owner: full. Non-owner: only if `visibility === 'public'`, else **403**. |
| `GET /people/:id/places` | **Only that user's `public` places.** Never their private ones, regardless of follow or close-friend status. |
| `GET /people/:id/collections` | Read-only, public only. |
| `GET /feed` | **Own places + followed users' `public` places.** Nothing else aggregates. |

## The write invariants

- Every mutating handler checks `currentUserId` → **401 `UNAUTHORIZED`** when absent.
- **Ownership check on every `PATCH` / `DELETE`** (places, collections, comments) → **403 `*_FORBIDDEN`**.
- Anyone who can *see* a place can comment on it; only the comment's author can edit or delete it.

## Social invariants

- Cannot follow yourself → **400 `CANNOT_FOLLOW_SELF`**.
- Cannot mark someone a close friend without following them first → **403 `NOT_FOLLOWING`**.
- Close-friend status grants **no additional data access today.** If that ever changes, it is an API change *and* a privacy change — raise it explicitly.

## When implementing the backend

Build **one reusable visibility helper**, parameterized by "whose places" (own vs. a specific other user), and route every read through it. Do not reimplement the filter per endpoint — that is how one of them ends up wrong.

## Checklist before any change here

1. Can a non-owner reach a `private` place through this path?
2. Does the feed still aggregate only own + followed-public?
3. Is the filter in the query, or did it drift into the component?
4. Does the response leak a coordinate, an owner id, or a private field the viewer isn't entitled to?
