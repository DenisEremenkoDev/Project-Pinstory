---
description: Build or evolve a screen end-to-end, in the project's own order.
argument-hint: <screen or feature name>
---

# /feature $ARGUMENTS

The inner loop. Do not skip steps, and **stop at every gate** — do not run the whole thing and present a finished result.

## 1. Scope gate
- **`FEATURES_SCOPE.md` (repo root) is the authority.** If `$ARGUMENTS` is not in its "In scope" list, **stop.** Its own rule: a "small extra" gets recorded there first and decided deliberately — never absorbed into the current change.
- Find `$ARGUMENTS` in `design-reference/DESIGN_INDEX.md`. **If it is marked `Vision`, stop and say so.**
- If it is a Coming Soon item, the deliverable is a `ComingSoon` overlay — not an implementation.
- Never cite `ai-knowledge-base/archive/` as authority for anything.

## 2. Read the design
Read **only** the screen's line range from `design-reference/Pinstory-source-readable.html`. Never the whole file.

## 3. Plan — then stop
State in ≤ 10 lines: which files change, whether the **API contract** changes (`apiTypes.ts` / `mockDb.ts` / `*.mockRoutes.ts` — if so, say it explicitly), which existing components are reused, and what is *not* being built.
**Wait for approval.** Do not write code before the plan is approved.

## 4. Contract first (only if the plan says so)
Use the `api-endpoint` skill. DTO → mockDb → mock route (auth + ownership + **visibility filter**) → RTK Query endpoint + tag graph.

## 5. Screen
Compose from existing components — `UnifiedPlaceCard`, `BottomSheet`, `Loader` / `EmptyState` / `ErrorState`, the social header, the form recipe. **Do not invent parallel components.** Markup and logic together, one screen per pass.

## 6. Verify
`npm run lint && npm run build` (typecheck) — the `tsc` hook will have caught most of it already.

## 7. Review
- `@design-auditor` — fidelity against the design's line range.
- `@architecture-guard` — dependency direction, contract drift, privacy, scope, missing tests.
- If auth / access / follows / visibility logic changed: `@test-writer`.

Run them **one at a time**, not in parallel.

## 8. Knowledge base
If this changed architecture, scope, or conventions, update the affected file in `ai-knowledge-base/` **in the same commit** and keep the `[Confirmed]` / `[Assumption]` markers honest. If nothing structural changed, do nothing — refreshing docs "to be safe" is a token tax with no payoff.
