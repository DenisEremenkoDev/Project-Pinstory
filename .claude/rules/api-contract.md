---
description: The API contract. These files are the specification for a backend that does not exist yet.
globs:
  - "src/shared/lib/apiTypes.ts"
  - "src/shared/lib/mockDb.ts"
  - "src/shared/lib/mockBaseQuery.ts"
  - "src/features/**/*Api.ts"
  - "src/features/**/*.mockRoutes.ts"
  - "backend/**"
---

# API Contract

**These files ARE the backend specification.** The Express/Prisma backend has not been written; its only spec is this code. A silent change here does not break a test — it desynchronizes an unwritten backend, and the failure surfaces months later as *"why doesn't the app work with `VITE_USE_MOCKS=false`?"*

**Any change to a DTO, a route shape, a status code, an error code, or a `mockDb` relation is an API change. Say so explicitly before making it.**

## The four files

| File | Role |
|---|---|
| `apiTypes.ts` | Wire shapes (`*Dto`). The HTTP contract. |
| `mockDb.ts` | Storage shapes (`Mock*`). **This is the future Prisma schema.** Keep it relational — join tables, not embedded arrays. |
| `mockBaseQuery.ts` | Request lifecycle + error envelope. |
| `features/*/x.mockRoutes.ts` | Handler semantics: auth, ownership, privacy, validation. |

## Rules

- **DTOs and mock entities are separate types** (D5). `MockPlace = Omit<PlaceDto,'myFeedback'|'isOwner'> & { ownerId }`. Never merge them.
- **`myFeedback` and `isOwner` are computed per viewer inside the handler** (D4). Never store them on the entity. They mirror a real `PlaceFeedback` join + per-request auth.
- **Tags:** queries `providesTags` per-id **plus** `LIST`; mutations `invalidatesTags` the affected id(s) **plus** `LIST` (D6). Comments use synthetic ids (`` `${placeId}-comments` ``). A wrong tag graph throws nothing — it just serves stale data, intermittently.
- **Feed pagination** uses `serializeQueryArgs` / `merge` / `forceRefetch` under one cache key (D7). Do not replace it with page-index pagination.
- **Error envelope:** `{ error: { message, code } }` — build it with `mockError(status, russianMessage, 'SCREAMING_SNAKE_CODE')`. Codes are English SCREAMING_SNAKE; messages are Russian.

| Code | When |
|---|---|
| `200` / `201` / `204` | success / created / no body |
| `400` | invalid input — `VALIDATION_ERROR`, `CANNOT_FOLLOW_SELF` |
| `401` | not authenticated / token expired — `UNAUTHORIZED` |
| `403` | authenticated but not entitled — `*_FORBIDDEN`, `NOT_FOLLOWING` |
| `404` | resource does not exist — `*_NOT_FOUND` |
| `409` | conflict — `EMAIL_TAKEN` (duplicate registration) |
| `429` | rate limit exceeded — handled specially by `getApiErrorMessage` |

Exact per-endpoint request/response shapes: **`BACKEND_INSTRUCTIONS.md`, Appendix "точные контракты API"** — but see the precedence rule below.
- **`transformResponse`** unwraps envelopes (`{ places } → places`). Keep the envelope on the wire.
- Request objects: `{ url, method, body }` or `{ url, params }`. REST-ish paths, params interpolated into the URL.
- `mock-token-<userId>` is a mock-only shortcut standing in for a JWT subject (D10). It disappears with the real backend — do not build on it.

## Long-term evolution (do not build, do not block)

The design reference implies future capabilities: `Memory` as an entity distinct from `Place`; multiple photos per memory (`Place → Photo[]` instead of one nullable `photoUrl`); a subscription plan; shared maps between users.

**Do not prepare for them. Do not foreclose them.** Before changing the contract, check the change is *additive-compatible* with those directions. Today it is: `photoUrl` widens to a `PlacePhoto[]` relation additively, and `note`/`mood`/`rating` on `Place` do not prevent a later Place/Memory split.

## Two documents claim to be the schema. Only one is.

`BACKEND_INSTRUCTIONS.md` §3 contains a full Prisma schema. **It is outdated.** Verified against the code, it is missing:

| Missing from `BACKEND_INSTRUCTIONS.md` §3 | Present in the code |
|---|---|
| `Place.mood` | `Mood = 'calm' \| 'serenity' \| 'hope' \| 'laughter'` — in `apiTypes.ts`, `mockDb.ts`, `addPlaceSchema.ts`, `MoodPicker`, `PlaceDetailView` |
| `User.defaultVisibility` | `ProfileSettingsForm` |
| `User.notifications` | `ProfileSettingsForm` |
| `PlaceComment.updatedAt` | comments are editable via `PATCH` |

**`mockDb.ts` wins.** Transcribing `BACKEND_INSTRUCTIONS.md` §3 into `schema.prisma` would silently drop `mood`, and the loss would only surface with `VITE_USE_MOCKS=false`, when every mood chip renders empty.

Use `BACKEND_INSTRUCTIONS.md` for **endpoint contracts, status codes, and security requirements** — it is authoritative and detailed there. Use `mockDb.ts` for **the schema**. Where they disagree, the code wins and the disagreement is flagged (see `ai-knowledge-base/doc-conflicts.md`).

## Adding an endpoint

Use the `api-endpoint` skill. Four files move in lockstep and the failure mode is silent.
