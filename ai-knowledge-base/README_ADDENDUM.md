# Knowledge Base — additions from the V2.2 workspace

Merge these lines into the existing `ai-knowledge-base/README.md` read order.

## New derived documents

- **[api_contracts.md](api_contracts.md)** — every endpoint, error code, and status code, **derived from the
  mock route code**, not from the archived planning docs. Includes a "Known gaps" section: five places where
  the backend must be *stricter* than the mock. Read this instead of the six `*.mockRoutes.ts` files.
- **[doc-conflicts.md](doc-conflicts.md)** — the register of conflicts between the pre-code planning documents
  and the code. The project rule is *flag it, don't silently pick a side*; this is where the flags live.
- **[decisions/](decisions/)** — the **open** decisions (ADR-01…06). `decisions.md` records what *was* decided;
  this folder records what is *not yet*.

## Ground truth, restated

| Level | Source |
|---|---|
| 1 | The code + `project_snapshot.md` |
| 2 | `FEATURES_SCOPE.md` (repo root, living) — **what is in scope** |
| 3 | `design-reference/DESIGN_INDEX.md` — what the product should become |
| 4 | `decisions.md` + `decisions/ADR-*` — which constraints are intentional |
| 5 | **`archive/`** — historical plans. **Not instructions.** |

Derived documents (`api_contracts.md`, `project_snapshot.md`, `architecture.md`, `design_system.md`,
`ui_patterns.md`, `conventions.md`, `current_state.md`) describe the code. **When they disagree with it, fix the
document.** Never the reverse.
