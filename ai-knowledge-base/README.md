# Pinstory — AI Knowledge Base

A permanent, English-language knowledge base built so a fresh AI session can
understand this project by reading these documents **instead of re-analyzing the
entire codebase**. It reflects the repository as it actually exists in code on
`main`; where prose docs (`README.md`, `*_INSTRUCTIONS.md`) disagree with the code,
the code wins and the disagreement is flagged.

## Read order

1. **[project_snapshot.md](project_snapshot.md)** — technical passport: overview,
   stack, structure, routing, features, flow, map, API, state, models, status.
   *Start here.*
2. **[architecture.md](architecture.md)** — how the code is organized and why
   (data layer, mock-as-spec, auth, map subsystem, theming, forms).
3. **[design_system.md](design_system.md)** — visual language: tokens, color,
   typography, iconography, spacing, layout, tone. Reproduce the look from this.
4. **[ui_patterns.md](ui_patterns.md)** — reusable components & interaction
   patterns (cards, forms, sheets, nav, states, map overlays). Compose new screens
   from these.
5. **[current_state.md](current_state.md)** — done / in-progress / missing / known
   issues / priorities.
6. **[decisions.md](decisions.md)** — architectural decisions, marked
   [Confirmed]/[Assumption], with evidencing files.
7. **[conventions.md](conventions.md)** — naming, TS, styling, RTK Query, mocks,
   tests, copy, git conventions.
8. **[roadmap.md](roadmap.md)** — logical next steps, [Confirmed]/[Proposal].

## Ground truth still lives outside this KB

- **Product/scope truth:** `FEATURES_SCOPE.md` (feature matrix + build order),
  `CLAUDE.md` (project rules).
- **Design truth:** `design-reference/DESIGN_INDEX.md` → readable HTML mockup. Read
  the relevant line range **before** building any listed screen.
- **Backend spec (unimplemented):** `BACKEND_INSTRUCTIONS.md`.
- **Frontend rules:** `FRONTEND_INSTRUCTIONS.md`. **Testing priorities:**
  `TESTING_PLAN.md`.

## Maintenance

These files describe a moving codebase. When architecture, scope, or conventions
change materially, update the affected file(s) and keep the [Confirmed]/[Assumption]
markers honest. This is analysis/documentation only — it changes no application code.
