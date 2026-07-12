# ADR-05 — Follower / following counts

**Status:** Decided — **derive them.** **Blocks:** Phase 1 (profile endpoints).

## Context
`MockUser.followersCount` and `followingCount` are **static seed numbers**, not derived from the `follows`
table. Following someone in the app does not move the counters (`current_state.md`, known issue #3).

Cosmetic in the mock. **A correctness bug the moment the backend is real.**

## Decision
The backend computes both counts from the `Follow` table. They are **never stored columns**.

This follows the same principle as `myFeedback` and `isOwner` (D4): **anything derivable per request is
derived, not stored.** Storing it worked in the mock only by accident of a single seed user.

## Consequence
The mock currently lies about this. That is acceptable — it is a mock — but the divergence must be
remembered when Phase 1 acceptance is checked ("does the app behave identically with mocks off?").
The counters are the one place where the answer will legitimately be *"no — and the backend is right."*

Consider fixing the mock to derive them too, so the spec stops lying. Low cost, and it removes a trap.
