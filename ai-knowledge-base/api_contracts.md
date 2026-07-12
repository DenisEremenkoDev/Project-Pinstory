# Pinstory — API Contracts

> **Implementation-derived documentation.** Every line below was read out of the code on `main`
> (`src/shared/lib/apiTypes.ts`, `mockBaseQuery.ts`, and the six `features/*/*.mockRoutes.ts`) — **not** copied
> from `archive/BACKEND_INSTRUCTIONS.md`, which is stale.
>
> **The code is the source of truth. When this document and the code disagree, fix this document.**
> Never the reverse.
>
> The mock **is** the backend specification: this is what the Express/Prisma backend must reproduce so the app
> behaves identically with `VITE_USE_MOCKS=false`.
>
> Last derived from: `c66074f`.

---

## Authentication

**Public resources are readable without a token** (ADR-07). Authentication is required for private data,
personalized responses, user-owned actions, and **every mutation without exception**. The full matrix is in
`.claude/rules/privacy.md`.

**Authentication is not the security boundary — `visibility` is.** A route without a `401` is not a route
without a guard.

## Transport

- Auth header on protected requests: `Authorization: Bearer <accessToken>`.
- Mock identity: the token is literally `mock-token-<userId>`; `mockBaseQuery` slices out `<userId>` and passes
  it to handlers as `currentUserId`. This stands in for a backend reading the JWT subject and **disappears with
  the real backend**.
- Mock latency: 200–400 ms, artificial, so loading states are real.
- Unmatched route → `404 MOCK_NOT_FOUND`. A handler that throws → `500 MOCK_HANDLER_ERROR`. Both are
  mock-only artifacts.

## Error envelope

```ts
interface ApiErrorBody { error: { message: string; code: string } }
```
`message` is Russian and user-facing. `code` is English SCREAMING_SNAKE and is what code branches on.

### Every error code in use

| Code | Status | Where |
|---|---|---|
| `UNAUTHORIZED` | 401 | any handler with no `currentUserId` |
| `INVALID_CREDENTIALS` | 401 | `POST /auth/login` |
| `VALIDATION_ERROR` | 400 | create/validate paths |
| `CANNOT_FOLLOW_SELF` | 400 | `POST /people/:id/follow` |
| `EMAIL_TAKEN` | 409 | `POST /auth/register` |
| `PLACE_NOT_FOUND` / `PLACE_FORBIDDEN` | 404 / 403 | places, feedback, comments, collection membership |
| `COMMENT_NOT_FOUND` / `COMMENT_FORBIDDEN` | 404 / 403 | comments |
| `PERSON_NOT_FOUND` | 404 | people |
| `NOT_FOLLOWING` | 403 | `PATCH /people/:id/close-friend` |
| `COLLECTION_NOT_FOUND` / `COLLECTION_FORBIDDEN` | 404 / 403 | collections |
| `USER_NOT_FOUND` | 404 | `/profile` |

`429` is not produced by the mock but **is** handled by `getApiErrorMessage` — the real backend rate-limits.

### Success codes

The mock returns `{ data }` with no status code — RTK Query only ever sees the body, so **the frontend does not
depend on 200 vs 201 vs 204.** The backend should still use `201` on create and `204` on delete; nothing breaks
either way.

---

## Auth

| | |
|---|---|
| `POST /auth/register` | `{ email, password, displayName }` → `{ id, email, displayName }`<br>`400 VALIDATION_ERROR` (any field missing) · `409 EMAIL_TAKEN` |
| `POST /auth/login` | `{ email, password }` → `{ accessToken, user: { id, email, displayName, avatarUrl } }`<br>`401 INVALID_CREDENTIALS` |
| `POST /auth/logout` | no body → no body. **A no-op in the mock** — there is no session to clear. |

**No `POST /auth/refresh` exists.** The refresh flow is designed but unimplemented (ADR-04). Consequence: the
access token lives in Redux memory only, so **a page reload logs the user out.**

**The mock stores passwords in plaintext in `mockDb`.** Obviously mock-only. The backend uses `bcryptjs`, cost 12.

---

## Places

**`GET /places`** → `{ places: PlaceDto[] }`
Only the caller's own places, **including private ones** — this is their personal catalogue. Sorted `createdAt`
descending. **No query parameters, no server-side filtering.** The Chronicle's filter chips work on the client.
`401` if unauthenticated.

**`GET /places/:id`** → `PlaceDto` **+ `{ commentsCount, likesCount, dislikesCount }`** *(this is the only
endpoint returning the detail shape)*
`404 PLACE_NOT_FOUND` · `403 PLACE_FORBIDDEN` if the place is `private` and the caller is not the owner.
**No `401` — intentional.** A public place is readable **without a token** (ADR-07). ⚠ But it distinguishes `404` from `403`, which is an existence oracle (§Known gaps, G6).

**`POST /places`** → the created `PlaceDto`
Body: `{ name, latitude, longitude, rating, note?, tags?, status, visibility, mood? }`.
Validated (`400 VALIDATION_ERROR`): non-empty `name` · `latitude`/`longitude` are numbers · **`rating` is
required, 1–5** · `status` ∈ `want_to_visit|planned|favorite` · `visibility` ∈ `public|private`.
`photoUrl` is always set to `null` — **upload is not implemented.**

**`PATCH /places/:id`** → the updated `PlaceDto`
`403 PLACE_FORBIDDEN` if the caller does not own it — **including when it does not exist** (ownership and
existence are deliberately conflated, so a probe cannot learn that an id is real).
⚠ **No validation on update** (§Known gaps).

**`DELETE /places/:id`** → no body. Same `403`. Cascades: the place's feedback rows are deleted with it.

### Feedback

**`POST /places/:id/feedback`** — `{ sentiment: 'like'|'dislike' }` → `{ sentiment, likesCount, dislikesCount }`
**Upsert semantics**: any existing row for `(user, place)` is removed first, then the new one pushed. One user,
one opinion per place — this is the `@@unique([userId, placeId])` constraint expressed in code.
`401` · `404` · `403` on an invisible private place.

**`DELETE /places/:id/feedback`** → `{ sentiment: null, likesCount, dislikesCount }`
`404` · `403` on an invisible private place. ⚠ **No `401` — this is a bug.** It is a mutation; ADR-07 does not cover it (§Known gaps, G3).

### Comments

**`GET /places/:id/comments`** → `{ comments: PlaceCommentDto[] }`, sorted `createdAt` ascending.
`404` · `403` if the place is not visible. **No `401` — intentional** (ADR-07).

**`POST /places/:id/comments`** — `{ rating: 1–5, text }` → `PlaceCommentDto`
**Anyone who can see the place can comment** — not just the owner. `401` · `404` · `403` on an invisible place ·
`400 VALIDATION_ERROR` on empty text or a rating outside 1–5.

**`PATCH` / `DELETE /places/:id/comments/:commentId`** → the updated comment / no body
`403 COMMENT_FORBIDDEN` unless the caller is the **author**. Ownership of the place is irrelevant.
⚠ `PATCH` does not re-validate (§Known gaps).

`PlaceCommentDto` carries a derived `isAuthor` and denormalized `authorName` / `authorAvatarUrl`.

---

## People

**`GET /people/search?q=`** → `{ people: [{ id, displayName, avatarUrl, isFollowing, isCloseFriend, trustSignal }] }`
Case-insensitive substring on `displayName`. **Excludes the caller.** An empty `q` returns everyone.
`trustSignal` is a **seeded string**, not a computed heuristic — the "similar taste" algorithm is a Vision item.
`401`.

**`GET /people/:id`** → `{ id, displayName, avatarUrl, bio, followersCount, followingCount, isFollowing, isCloseFriend, trustSignal }`
`404 PERSON_NOT_FOUND`. **No `401` — intentional** (ADR-07); without a token, `isFollowing`/`isCloseFriend` come back `false`.
⚠ `followersCount` / `followingCount` are **static seed values**, not derived from `follows` (ADR-05).

**`POST /people/:id/follow`** → `{ isFollowing: true }` · **Idempotent.**
`401` · `400 CANNOT_FOLLOW_SELF` · `404 PERSON_NOT_FOUND`.

**`DELETE /people/:id/follow`** → `{ isFollowing: false }` · Idempotent, **no 404** on a non-existent follow.
**Removing the follow row also removes `isCloseFriend`** — it lives on that row.

**`PATCH /people/:id/close-friend`** — `{ isCloseFriend: boolean }` → `{ isCloseFriend }`
`401` · **`403 NOT_FOLLOWING`** — you must follow first.

**`GET /people/:id/places`** → `{ places: PlaceDto[] }` — **`visibility === 'public'` only**, descending.
**No `401` — intentional** (ADR-07). **No follow check.** The `visibility` filter is the **security boundary**; the follow check is
frontend UX (`isFollowing` from `GET /people/:id`). This same endpoint feeds both the friend profile and the map
overlay — **there is no separate overlay endpoint.**
**Never replace the visibility filter with a follow gate.** They are not equivalent: doing so hands every private
place to every follower.

**`GET /people/:id/collections`** → `{ collections: CollectionSummaryDto[] }` — public only. **No `401` — intentional** (ADR-07).

---

## Collections

**`GET /collections`** → `{ own: OwnCollectionDto[], following: FollowedCollectionDto[] }`
`own` embeds the full `places: PlaceDto[]` of each collection. `following` = **public** collections of users the
caller follows, each with an embedded `owner: UserSummaryDto`. `401`.

**`POST /collections`** — `{ name, description, visibility }` → `OwnCollectionDto`
`400 VALIDATION_ERROR` on an empty name. `401`.

**`PATCH` / `DELETE /collections/:id`** → the updated collection / no body
`401` · `404 COLLECTION_NOT_FOUND` · `403 COLLECTION_FORBIDDEN` unless owner.
⚠ `PATCH` does not re-validate (§Known gaps).

**`POST` / `DELETE /collections/:id/places/:placeId`** → no body
`401` · `404`/`403` on the collection · **and on the place: `403 PLACE_FORBIDDEN` unless the caller owns it —
you may only add your own places to your own collection.** `POST` is idempotent.

---

## Feed

**`GET /feed?cursor=&limit=`** → `{ items: FeedItemDto[], nextCursor: string | null }`
Aggregates **own places + `public` places of followed users**. Nothing else. Sorted `createdAt` descending.
`cursor` is the **id of the last item seen**; `limit` defaults to 10. `401`.

**The item type is derived, not stored:**
```
status === 'want_to_visit'        → 'wants_to_visit'
note is non-empty                 → 'story_added'
otherwise                         → 'place_added'
```
This rule exists nowhere else in the documentation. The backend must reproduce it.

RTK Query accumulates pages under one cache key via `serializeQueryArgs` / `merge` / `forceRefetch`.

---

## Profile

**`GET /profile`** → `ProfileDto` = `{ user: { id, email, displayName, avatarUrl, bio, status, defaultVisibility, notificationsEnabled }, placesCount, followersCount, followingCount }`
`placesCount` **is** derived. `followersCount` / `followingCount` are **not** (ADR-05). `401` · `404 USER_NOT_FOUND`.

**`PATCH /profile`** → `ProfileDto`. ⚠ No validation, no field allow-list (§Known gaps).

---

## Known gaps between the mock and a correct backend

The mock is the spec, but it is not perfect. **These are places where the backend must be stricter than the
mock, not merely equal to it.** Each is a real finding from reading the code.

| # | Gap | Why it matters |
|---|---|---|
| **G1** | **`PATCH` performs no validation anywhere** — `/places/:id`, `/profile`, `/collections/:id` all do a bare `Object.assign(entity, body)`. | You can `PATCH` a place to `status: 'visited'` — the status that "does not exist" — or a rating of `99`, or coordinates as strings. `POST` validates; `PATCH` does not. **`TESTING_PLAN` BE-9 only tests create.** The backend must validate on update with the same Zod schema. |
| **G2** | **`PATCH /profile` is a mass-assignment hole.** `Object.assign(user, body)` over the whole `MockUser`. | A crafted body could overwrite `id`, `password`, or `followersCount`. Harmless in an in-memory mock; a vulnerability in Postgres. The backend needs an explicit editable-field allow-list. |
| **G3** | **`DELETE /places/:id/feedback` has no `401`.** | It is a **mutation**. ADR-07 makes *reads* public; it does not excuse an unauthenticated write. **Add the check** — in the mock and in the backend. |
| **G6** | **Existence oracle on public reads.** `GET /places/:id` returns `404 PLACE_NOT_FOUND` when a place does not exist and `403 PLACE_FORBIDDEN` when it exists but is private and not yours. | Under ADR-07 those reads are **anonymous**. A prober walking the id space learns which memories exist and which are private — without an account. **Return `404` for both.** (`PATCH`/`DELETE` already collapse correctly, to `403`.) Applies to comments and feedback routes too. |
| **G7** | Mock ids are sequential (`place-1`, `place-2`…). | Fine in an in-memory mock. **With a public read surface, sequential ids are an enumeration invitation.** The Prisma schema's `@default(uuid())` is now load-bearing, not stylistic. G6's mitigation depends on it. |
| **G4** | `followersCount` / `followingCount` are static seed values. | Following someone does not move the counters. Cosmetic in the mock; a correctness bug in the backend. **ADR-05: derive them.** |
| **G5** | `photoUrl` is always `null`; `POST /places/:id/photo` does not exist. | The add-place dropzone is a visual stub. Roadmap Phase 4. |

**When the backend fixes G1–G3, fix the mock too** — otherwise the spec keeps lying, and the "identical
behaviour with mocks off" acceptance test starts failing for the *right* reasons, which is indistinguishable
from failing for the wrong ones.

---

## Maintaining this document

Regenerate it from the code whenever a `*.mockRoutes.ts`, `apiTypes.ts`, or `mockBaseQuery.ts` changes — which
the `contract-freeze` hook makes impossible to do by accident. Record the commit it was derived from.
