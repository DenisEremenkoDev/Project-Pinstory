---
name: api-endpoint
description: Add or change an RTK Query endpoint in Pinstory. Use when adding, modifying, or removing any API endpoint, DTO, mock route, or cache tag — four files move in lockstep and the failure mode is silent. Triggers on "add an endpoint", "new API", "change the DTO", "the data is stale", "cache isn't invalidating".
---

# Adding or changing an endpoint

An endpoint in Pinstory spans **four files**. Miss one and nothing throws — the UI just serves stale or wrong data, intermittently. This is also an **API change**: the mock is the specification for a backend that does not exist yet. Announce it before you start.

## Step 0 — Announce
State plainly: *"This changes the API contract: <what>."* Then continue.

## Step 1 — `src/shared/lib/apiTypes.ts` — the wire shape
Add or extend the `*Dto`. Keep it a **wire** shape: what the HTTP response actually carries.
- String-literal unions, never TS `enum`. Add the Russian label `Record` if the union is user-visible.
- Viewer-dependent fields (`myFeedback`, `isOwner`, counts) belong on the **DTO**, never on the `Mock*` entity.

## Step 2 — `src/shared/lib/mockDb.ts` — only if a new relation is needed
**This file is the future Prisma schema.** Keep it relational: a join table, not an embedded array. `nextMockId(prefix)` generates ids.
Reuse existing seed users; do not add seed data unless the feature needs it.

## Step 3 — `src/features/<domain>/<domain>.mockRoutes.ts` — the semantics
```ts
defineMockRoute('GET', '/places/:id/things', ({ pathParams, searchParams, body, currentUserId }) => {
  if (!currentUserId) return mockError(401, 'Требуется авторизация', 'UNAUTHORIZED')
  // ownership check for PATCH/DELETE  → mockError(403, '…', 'THING_FORBIDDEN')
  // existence check                   → mockError(404, '…', 'THING_NOT_FOUND')
  // validation                        → mockError(400, '…', 'VALIDATION_ERROR')
  // ⚠ visibility filter — see rules/privacy.md. Filter HERE, not in the component.
  return { data: { things } }   // compute myFeedback / isOwner / counts here
})
```
Error `code`s are English SCREAMING_SNAKE. `message`s are Russian. Register the route in the feature's exported `MockRoute[]`.

## Step 4 — `src/features/<domain>/<domain>Api.ts` — the endpoint + the tag graph
```ts
export const thingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getThings: build.query<ThingDto[], string>({
      query: (placeId) => ({ url: `/places/${placeId}/things` }),
      transformResponse: (r: { things: ThingDto[] }) => r.things,
      providesTags: (_res, _err, placeId) => [
        { type: 'Place', id: `${placeId}-things` },   // synthetic id for a sub-collection
        { type: 'Place', id: 'LIST' },
      ],
    }),
    addThing: build.mutation<ThingDto, { placeId: string; body: NewThing }>({
      query: ({ placeId, body }) => ({ url: `/places/${placeId}/things`, method: 'POST', body }),
      invalidatesTags: (_res, _err, { placeId }) => [
        { type: 'Place', id: `${placeId}-things` },
        { type: 'Place', id: 'LIST' },
      ],
    }),
  }),
})
export const { useGetThingsQuery, useAddThingMutation } = thingsApi
```
`tagTypes` are fixed: `Place · Person · Collection · Feed · Profile`. Adding a sixth is an architectural change — raise it.

**Tag rule:** every query provides **per-id + `LIST`**; every mutation invalidates **the affected id(s) + `LIST`**.

## Step 5 — verify the cache graph out loud
Answer these before you finish. If any answer is "I'm not sure", the tag graph is wrong:
1. After this mutation, **which cached queries must refetch?** Does `invalidatesTags` name all of them?
2. Does any *other* feature's query provide the same tag and now refetch unnecessarily?
3. Does the feed need to change? (It aggregates places — a place mutation usually invalidates `Feed`.)

## Step 6 — the component
State ladder in order (`Loader → ErrorState → EmptyState → content`). Mutations via `.unwrap()` in try/catch → `setError('root', getApiErrorMessage(e, fallback))`.

## Do not
- Do not filter visibility in the component. Ever.
- Do not store `myFeedback` / `isOwner` on the entity.
- Do not add a slice to cache the response.
- Do not foreclose the long-term model (Memory as an entity, `Place → Photo[]`). Additive changes only — see `rules/api-contract.md`.
