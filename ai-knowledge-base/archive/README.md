# Archive — historical planning documents

**These are not instructions. Do not follow them.**

`FEATURES_SCOPE.md`'s scope content has been promoted to a living document at the repo root; everything else
here is frozen. These five documents were written **before the code existed**, under a different development
approach. They are preserved because they explain *why* the system looks the way it does, and because a few
of their lessons were expensive to learn.

They sit at the **bottom of the source hierarchy** (see `CLAUDE.md`). The code wins over every claim here.

## What each one is still good for

| Document | Read it for | Never take from it |
|---|---|---|
| `BACKEND_INSTRUCTIONS.md` | The reasoning behind the security middleware layer and the per-endpoint checks. The history of the schema (`want`/`been` → three statuses; `Like` → `PlaceFeedback` with sentiment). | **§3's Prisma schema.** It is missing `Place.mood`, `User.defaultVisibility`, `User.notifications`, `PlaceComment.updatedAt`. Transcribing it silently deletes the mood feature. **`mockDb.ts` is the schema; `api_contracts.md` is the endpoint reference.** |
| `FRONTEND_INSTRUCTIONS.md` | Appendix A's "технические заметки" — three bugs already paid for (now in `.claude/rules/design.md`). The reasoning behind the map's layer contract. | **Appendix Б's code sample.** It is **ymaps 2.x** (`ymaps.ready`, `new ymaps.Map`, `SuggestView`). This project uses **ymaps 3.0**. The key-registration procedure and the legal constraint are still valid. |
| `TESTING_PLAN.md` | Nothing — its content was promoted **verbatim** into `.claude/rules/testing.md`. Kept for provenance. | — |
| `DEPLOYMENT.md` | The Railway/Vercel plan, preserved as prior art in `decisions/ADR-01`. The Node-version trap and the deploy-order lesson. | **The CI workflow.** It assumes a `frontend/` + `backend/` monorepo. This repo has `src/` and `package.json` at the root. It fails on its first run. It also calls a `typecheck` script that does not exist. |
| `FEATURES_SCOPE.md` | Nothing — superseded by the living `FEATURES_SCOPE.md` at the repo root. Kept for provenance: the original 19-step build order, and the rows the code has since diverged from. | The 19-step build order. The project executed frontend-first. `roadmap.md` is the live plan. |

## Outdated claims, in one place

Full register with evidence: [`../doc-conflicts.md`](../doc-conflicts.md).

- Feed cards have **two** actions («Добавить к себе» / «Посмотреть»). The third — «Пойти вместе» — was
  removed by decision (D24). Both `FEATURES_SCOPE.md` and `FRONTEND_INSTRUCTIONS.md` still show three.
- The bottom-nav tab is **«Хроника»**. "Для вас" is the in-screen heading only (D23).
- The prototype files these documents reference (`Pinstory - Standalone.html`,
  `PINSTORY_CONTEXT_ARCHIVE.md`) **do not exist**. The design reference is `design-reference/`.

## If a diff cites an archived document as its authority, that diff is wrong.
