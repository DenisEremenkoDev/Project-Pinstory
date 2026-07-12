# Pinstory AI Workspace — Final Architecture

Generated per **V2.2**. Everything here is committed: the workspace is part of the project architecture and
evolves with the codebase.

---

## Source precedence

Every artifact in this workspace obeys this order. It is the spine of the whole design.

| # | Source | Answers |
|---|---|---|
| 1 | **The code** + `ai-knowledge-base/project_snapshot.md` | What exists now. **Always wins.** |
| 2 | **`FEATURES_SCOPE.md`** *(repo root, living)* | What is in scope. |
| 3 | **`design-reference/DESIGN_INDEX.md`** | What the product should become. Direction, never a mandate. |
| 4 | **`ai-knowledge-base/decisions.md`** + `decisions/ADR-*` | Which constraints are intentional. |
| 5 | **`ai-knowledge-base/archive/`** | Historical plans. **Not instructions.** |

Derived documents describe the code. **When they disagree with it, fix the document.** Never the reverse.

---

## The shape of it

| Mechanism | Count | Used for | Why not something else |
|---|---|---|---|
| `CLAUDE.md` | 1 | Facts + precedence | Loaded every message — holds only what must always be true. |
| **Rules** | 7 | Conventions, per area | Zero cost when idle; automatic when their path is touched. |
| **Skill** | 1 | The one real procedure | Adding an endpoint spans four files and fails **silently**. |
| **Subagents** | 3 | Read-heavy, short-output work | Their file reads never enter the main window. |
| **Commands** | 2 | The inner loop | Explicit, deterministic, zero idle cost. |
| **Hooks** | 2 | Guarantees | A compiler catches invented APIs. A prompt only asks nicely. |

### Rules — `.claude/rules/`
`api-contract` · `privacy` · `frontend` · `design` · `map` · `testing` · `backend` *(dormant until Phase 1)*

### Subagents — `.claude/agents/`
`architecture-guard` *(read-only review)* · `test-writer` · `design-auditor` *(keeps the 101 KB design out of the main window)*

### Hooks — `.claude/hooks/`
`typecheck` *(tsc + eslint, PostToolUse)* · `contract-freeze` *(PreToolUse — the only hard gate)*

Written in **Node**, not bash: the maintainer is on Windows and `engines.node = "24.x"` is guaranteed where Git Bash is not.

---

## Cost

| Loaded every session | ~ |
|---|---|
| `CLAUDE.md` | ~950 tok |
| `api-endpoint` skill description | ~60 tok |
| 3 subagent descriptions | ~120 tok |
| **Total** | **≈ 1,150 tok** |

Rules cost **nothing** until their path is touched. Hooks cost **nothing, ever** — they run outside the context
window.

---

## Install

```
CLAUDE.md                                        → repo root  (new)
FEATURES_SCOPE.md                                → repo root  (REPLACES the old one — rewritten as scope authority)
.claude/                                         → repo root  (new)
design-reference/DESIGN_INDEX.md                 → new
design-reference/Pinstory-source-readable.html   → new (101 KB, extracted from the 7.6 MB bundle)
ai-knowledge-base/api_contracts.md               → new (derived from code)
ai-knowledge-base/doc-conflicts.md               → new
ai-knowledge-base/decisions/                     → new (7 ADRs)
ai-knowledge-base/archive/README.md              → new
ai-knowledge-base/README_ADDENDUM.md             → merge into the existing README
gitignore.patched                                → replaces .gitignore (review the diff first)
```

**Move into `ai-knowledge-base/archive/`:** `FRONTEND_INSTRUCTIONS.md`, `BACKEND_INSTRUCTIONS.md`,
`TESTING_PLAN.md`, `DEPLOYMENT.md`, and the **old** `FEATURES_SCOPE.md`.

**Commit `ai-knowledge-base/`** — its 8 existing documents are currently untracked. The knowledge base the whole
design rests on lives on exactly one machine.

---

## Verify after installing

1. **Rules fire.** Open a file under `src/features/` → ask *"which rules are active?"* → expect `frontend.md`.
   Open `src/shared/lib/apiTypes.ts` → expect `api-contract.md` **and** `privacy.md`.
2. **The contract gate works.** Ask Claude to add a field to `apiTypes.ts`. It must be **blocked** with an
   explanation, not silently edited.
3. **The typecheck hook works.** Ask for a deliberate type error. The edit must be rejected.
4. **Attribution is off.** Make a commit — no `Co-Authored-By` trailer.
5. **Subagents load.** `/agents` lists `architecture-guard`, `test-writer`, `design-auditor`.

### Known caveat — path-scoped rules
Rule path scoping is the newest of Claude Code's steering mechanisms; community reports say `paths:` is
unreliable and `globs:` is more predictable. **This workspace uses `globs:`.** Run step 1 before trusting any
rule. As a backstop, the invariants that must never be missed are duplicated in `CLAUDE.md`.

---

## What the workspace knows that no single document did

Five findings that came out of reading the code, not the docs. Each is now encoded somewhere it cannot be
missed.

| | Finding | Where it lives |
|---|---|---|
| 1 | **`PATCH` validates nothing** — `/places/:id`, `/profile`, `/collections/:id` are bare `Object.assign`. You can `PATCH` a place to `status: 'visited'` — the status that "does not exist". | `api_contracts.md` G1 · `rules/backend.md` |
| 2 | **`PATCH /profile` is a mass-assignment hole** — a crafted body overwrites `id`, `password`, `followersCount`. | `api_contracts.md` G2 |
| 3 | **Public reads create an existence oracle** — `404` vs `403` on `GET /places/:id` lets an anonymous prober enumerate which memories exist and which are private. | ADR-07 C2 · `rules/privacy.md` |
| 4 | **The feed item type is derived, not stored** — `want_to_visit → wants_to_visit`; has a note → `story_added`; else `place_added`. This rule appears in **no** document. | `api_contracts.md` |
| 5 | **`BACKEND_INSTRUCTIONS.md` §3's Prisma schema drops `mood`** — transcribing it silently deletes a shipped feature, discoverable only when mocks are switched off. | `CLAUDE.md` · `rules/backend.md` · `archive/README.md` |

---

## Open decisions

| ADR | Question | Status |
|---|---|---|
| 01 | Where does the backend run? | **Deliberately open.** Blocks the first deploy, not the code. |
| 02 | Geo storage | Decided: plain `Float` lat/lng. No PostGIS — there are no spatial queries. |
| 03 | Memory-as-entity, multiple photos | Decided: Vision, not MVP. Do not prepare; do not foreclose. |
| 04 | Refresh-token transport | **Open.** An httpOnly cookie does not survive a native wrapper. Decide before implementing. |
| 05 | Follower counts | Decided: derive in SQL. The mock currently lies. |
| 06 | Cross-user place identity | Open, deferred. Only forced if shared maps are scoped. |
| 07 | Public reads without a token | Decided: **yes** — with three binding consequences (401 on the feedback mutation, collapse the 404/403 oracle, UUIDs not sequential ids). |

---

## Deferred to Phase 5 — not built, on purpose

- **CI.** The archived workflow assumes a `frontend/` + `backend/` monorepo. This repo has `src/` and
  `package.json` at the root. It fails on its first run, and it calls a `typecheck` script that does not exist.
- **`"typecheck": "tsc -b --noEmit"` in `package.json`.** One line. Needed before CI.
- **Dependabot.** Right idea, wrong directories.

Building any of them now would be exactly the premature optimization this design keeps refusing.
