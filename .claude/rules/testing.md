---
description: Vitest + RTL conventions and the prioritized test list.
globs:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/setupTests.ts"
---

# Testing

**Frontend:** Vitest 3.2 + React Testing Library 16 + `user-event`, jsdom, `globals: true`. `setupTests.ts` registers `jest-dom/vitest`.
**Backend (Phase 1):** Vitest + **Supertest 7** for HTTP.

Principle from `TESTING_PLAN.md`: **do not chase coverage.** Test where logic can break silently — validation, access rights, privacy, follows. Do not test markup for the sake of a number.

## Priority 1 — backend (all currently unwritten)

1. Duplicate registration with the same email → **409**
2. Login: wrong password → **401**; correct → token in the response
3. Protected route without a token → **401**
4. `GET /places` — another user's **private** place does not appear in the caller's list
5. `GET /places/:id` — another user's private place → **404** (even by guessing the id). Collapses with "not found" so this public read is not an existence oracle (privacy.md rule #1; ratified 2026-07-12, supersedes the mock's old 403). `PATCH`/`DELETE` still → **403**.
6. `PATCH` / `DELETE /places/:id` on someone else's place → **403**
7. `POST /places` with out-of-range coordinates → **400**
8. `POST /places` **without `rating`** → **400** (rating is mandatory at creation)
9. `POST /places` with a `status` outside `want_to_visit`/`planned`/`favorite` → **400** — **including `"visited"`, which must be rejected: the status does not exist**
10. `POST /people/:id/follow` on yourself → **400**
11. `PATCH /people/:id/close-friend` without following first → **403**
12. `GET /people/:id/places` does not return that user's private places — **not even to a follower**
13. The friend map overlay: same guarantee — public places yes, private never, under any condition
14. `POST /places/:id/feedback` on an invisible private place → **403**
15. `POST /places/:id/comments` on an invisible private place → **403**; on a visible **public** place owned by someone else → **201** (anyone who can see it can comment)
16. `PATCH` / `DELETE /collections/:id` on someone else's collection → **403**

## Priority 1 — frontend

1. The add-place Zod schema: valid data passes; empty name, rating outside 1–5, or a missing rating do not
2. `ProtectedRoute` — unauthenticated redirects to `/login`; authenticated renders the content
3. `authSlice` — state transitions correctly on login and logout
4. `UnifiedPlaceCard` — a tap in **any** of the three contexts (own / friend's / feed) opens the **same** detail screen
5. **Regression: `PlaceDetailView` never shows a "Посетил" status, under any data.** The status was removed by explicit request; this test exists so it cannot creep back in. The Chronicle filter list must likewise never offer it.

## Priority 2
Feedback is unique per (user, place) — a repeat call overwrites `sentiment`, never duplicates (`@@unique([userId, placeId])`) · `POST /auth/refresh` with an expired/invalid token → 401 · `GET /feed` excludes users the caller does not follow · unfollowing also clears `isCloseFriend` · the heart/flag badge follows `myFeedback` · `Loader`/`ErrorState` render on `isLoading`/`isError` · `ComingSoon` renders its props and the button is clickable · Chronicle chips filter correctly.

## Do not test
Pixel-perfect visual fidelity (compare against tokens instead) · static `ComingSoon` placeholders — no logic, nothing to assert · design tokens.

## Conventions
- Mock RTK Query hooks with `vi.mock(...)` + `vi.mocked(...)`; cast mocked returns **`as never`** — the only acceptable type escape in the codebase.
- **Query by accessible role / name / text, using the Russian UI strings.** Assert on visible behaviour, never on implementation detail.
- Test file next to its source: `Name.test.tsx`. References: `FeedItemCard.test.tsx`, `FeedPage.test.tsx`.

## When
For **critical logic — validation, access rights, follows, privacy** — write the test with or before the implementation. For everything else, after the code settles.
After any new feature: extend its test, then run the **whole** suite (`npm run test`), not just the new file. If something else breaks, decide whether it is an expected behaviour change or a real regression — do not just update the old test to make it green.

## The trap
A test that mirrors the implementation freezes the bug in place. For privacy and access tests, derive the expectation from `.claude/rules/privacy.md` and the list above — **not** from the code under test.
