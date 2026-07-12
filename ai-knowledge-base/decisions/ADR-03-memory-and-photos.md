# ADR-03 — `Memory` as an entity, and multiple photos

**Status:** Decided — **Vision, not MVP.** **Blocks:** the Prisma schema (Phase 1) if it ever changes.

## Context
The design reference describes a product larger than the MVP:

- Two separate detail overlays — **PLACE DETAIL** (572–647) and **MEMORY DETAIL** (648–676) — and the
  add sheet is called «Новое воспоминание».
- **Pinstory Plus** (791–807) promises *"неограниченное число фото в воспоминании"*.

The code has **one** `Place` entity with a `note: string` and a **single nullable `photoUrl`**.

## Decision
The MVP keeps `Place` with `note` and one `photoUrl`. `Memory`-as-an-entity and `Place → Photo[]` are
**future product capabilities**, not current requirements.

## Consequences
**Do not prepare for them.** No `Memory` type, no `Photo` join table, no abstraction "for later". That is
the premature optimization this decision exists to prevent.

**Do not foreclose them.** Before any contract change, check it stays additive-compatible with:
- a later `Place → PlacePhoto[]` relation (today: widen `photoUrl` → add a join table; purely additive), and
- a later split of `Place` and `Memory` (today: `note` / `mood` / `rating` living on `Place` does not
  prevent extracting them).

Both are currently reachable without a rewrite. **Keeping them reachable is the only obligation.**

## Guardrails
- `.claude/rules/api-contract.md` — "Long-term evolution (do not build, do not block)".
- `design-reference/DESIGN_INDEX.md` — these screens are marked **Vision**; `@architecture-guard` treats
  building them as a scope blocker.

## When to close
When the maintainer scopes Memories or multi-photo. Not before.
