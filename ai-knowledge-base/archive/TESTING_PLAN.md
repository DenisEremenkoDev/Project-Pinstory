# Pinstory — testing plan

The course (sprint 2) had a clear emphasis on TDD — this file records what and how to test, so this doesn't get skipped once real development starts.

Approach: don't chase 100% coverage. Test where logic can realistically break silently (validation, access rights, privacy, follows) — don't test simple markup just to check a box.

## Backend

Tooling: Jest (or Vitest) + Supertest for HTTP requests.

**Priority 1 — must cover:**
1. Registration: can't register twice with the same email → `409`
2. Login: wrong password → `401`, correct password → token in the response
3. Protected route without a token → `401`
4. `GET /places` — another user's private place does NOT show up in the current user's list
5. `GET /places/:id` — someone else's private place → `403`
6. `PATCH /places/:id` / `DELETE /places/:id` on someone else's place → `403`
7. `POST /places` with invalid coordinates (e.g. latitude out of range) → `400`
8. `POST /places` without `rating` → `400` (rating is required at creation now — a key difference from the old scope)
9. `POST /places` with a `status` outside `want_to_visit`/`planned`/`favorite` → `400` (in particular, passing `"visited"` should also be rejected — that status no longer exists)
10. **Follows**: `POST /people/:id/follow` on yourself → `400`
11. **Follows**: `PATCH /people/:id/close-friend` without an existing follow → `403`
12. **Privacy in People**: `GET /people/:id/places` doesn't return the specified user's private places, even to a follower
13. **Map overlay**: same as above for the basic overlay — a friend's public places are returned, private ones aren't, under any circumstances
14. **Feedback**: `POST /places/:id/feedback` on an invisible private place belonging to someone else → `403`
15. **Comments**: `POST /places/:id/comments` on an invisible private place → `403`; on a visible public place belonging to someone else → `201` (anyone who can see it can comment, not just the owner)
15a. **Comments**: `PATCH`/`DELETE /places/:id/comments/:commentId` on someone else's comment → `403` (own comment → succeeds)
16. **Collections**: `PATCH`/`DELETE /collections/:id` on someone else's collection → `403`

**Priority 2 — nice to have:**
17. Feedback is unique per user+place pair (`sentiment` is overwritten on repeat calls, not duplicated) — from `@@unique([userId, placeId])`
18. `POST /auth/refresh` with an expired/invalid refresh token → `401`
19. `GET /feed` — doesn't include posts from users the current user doesn't follow
20. Unfollowing (`DELETE /people/:id/follow`) also clears `isCloseFriend`, if it was set

Example test skeleton:
```js
describe('POST /places', () => {
  it('rejects creating a place without a rating', async () => {
    const res = await request(app)
      .post('/places')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', latitude: 59.9, longitude: 30.3, status: 'want_to_visit', visibility: 'public', tags: [] });
    expect(res.status).toBe(400);
  });

  it('rejects status "visited" — that value no longer exists', async () => {
    const res = await request(app)
      .post('/places')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', latitude: 59.9, longitude: 30.3, rating: 4, status: 'visited', visibility: 'public', tags: [] });
    expect(res.status).toBe(400);
  });
});
```

## Frontend

Tooling: Vitest + React Testing Library.

**Priority 1:**
1. The add-place form's Zod schema — valid data passes, invalid data (empty name, rating outside 1–5, missing rating) doesn't
2. `ProtectedRoute` — an unauthenticated user is redirected to `/login`, an authenticated one sees the content
3. The auth Redux slice — state changes correctly on successful login/logout
4. Unified place card — tapping in any of the three contexts (own/friend's/feed) opens the same place detail view
5. The place detail component — never shows a "Visited" status under any data (a regression test to make sure the removed feature doesn't quietly come back)

**Priority 2:**
6. Place card — correctly shows the heart/flag badge based on `myFeedback`
7. RTK Query — `isLoading`/`isError` states correctly show the `Loader`/an error message
8. The Coming Soon component — renders with the passed title/description, the "Notify me at launch" button is clickable
9. Chronicle filters — toggling a chip correctly filters the list (with no "Visited" chip/filter in the available options)

**Not worth testing specifically:**
- Pixel-perfect visual match (check visually against the tokens in `FRONTEND_INSTRUCTIONS.md`, Appendix A)
- Static Coming Soon placeholders — there's no logic there, nothing to test

## When to write tests

For critical logic (validation, access rights, follows, privacy) — write the test before or alongside the implementation (the TDD spirit from the course). For everything else, it's fine to add tests after the code stabilizes.

## How to run tests — concrete commands

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:file": "vitest run"
  }
}
```

Run all tests:
```bash
npm run test
```

One specific file:
```bash
npx vitest run src/features/places/places.test.ts
```

By name pattern (e.g. everything about privacy):
```bash
npx vitest run -t "privacy"
```

Watch mode:
```bash
npm run test:watch
```

For the backend with Supertest — same commands, just point at the file inside the backend project.

## Recommended habit after every new feature

1. Write/extend the test for the feature itself (together with `test-writer`, if it's a Priority 1 item)
2. Run the **entire test suite** (`npm run test`), not just the new test
3. If something fails, figure out whether it's expected (an old test needs updating) or a real regression

## Testing tool versions

Vitest **3.2.x** (required for Vite 7), `@testing-library/react` **16.x** (supports React 19), `@testing-library/jest-dom` **6.x**, Supertest **7.x**. Exact versions — in `CLAUDE.md`.

## Automation — CI

Manual runs (`npm run test`) are useful day-to-day, but don't protect you if you forget to run them. Automatic runs on every push (GitHub Actions) — covered in `DEPLOYMENT.md`, the CI section.
