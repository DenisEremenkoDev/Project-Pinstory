# Pinstory — Project Rules

Mobile-first web app: save real places as personal memories, discover through people you trust.
Not a navigation app, not a conventional social network. No engagement mechanics.

## Stack (pinned — never upgrade without an explicit request)
Node 24 · React 19.2 · TypeScript 5.9 (strict + `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noImplicitOverride`, `erasableSyntaxOnly`) · Vite 7 · Redux Toolkit 2 + RTK Query · MUI 6.5 (form fields only) · React Router 7 (`react-router`) · React Hook Form 7 + Zod 4 · Vitest 3 + RTL · Yandex Maps JS API 3.0.
Backend (documented, not implemented): Express 5 + Prisma 6 + PostgreSQL 17.

## Invariants
1. **Dependency direction: `app → features → shared`.** Never backwards. Features never reach into each other's internals — only through exported `*Api.ts` hooks and exported components.
2. **The mock is the backend specification.** `apiTypes.ts`, `mockDb.ts`, `mockBaseQuery.ts` and `*.mockRoutes.ts` *are* the API contract. Changing them is an API change — say so out loud.
3. **Privacy is filtered at the query layer, never in a component.** Own places only; a friend's *public* places only; 403 on a private place to a non-owner; feed = own + followed public.
4. **Server data → RTK Query only.** Slices exist only for `auth` and `theme`. Local UI state → `useState` in the owning page.
5. **Design tokens only.** No raw hex/px (two documented exceptions: the ymaps3 basemap literals in `YandexMap.tsx`, and `gradientPalette.ts`). MUI is for form controls, never for the app's look.

## Product rules
- Place statuses are exactly three: `want_to_visit` / `planned` / `favorite`. **"Visited" was removed permanently — never reintroduce it.**
- Bottom nav is 5 slots (Карта · Хроника · ＋ · Люди · Профиль). **Do not add a sixth tab.** Collections live inside Profile.
- Non-MVP features ship as a `ComingSoon` overlay — never a disabled button, never a hidden element.
- Scope is `FEATURES_SCOPE.md`. The design reference shows the long-term vision; build only what is marked MVP in `design-reference/DESIGN_INDEX.md`.
- One `UnifiedPlaceCard` everywhere. Evolve existing screens rather than adding new ones.

## Language
User-facing strings: **Russian**, warm and human. Everything else — code, identifiers, comments, commits, documentation — **English**.

## Working agreement
Claude writes code sequentially; the maintainer reviews and discusses. Markup and logic together, one screen per pass.
Commit only when asked. **Never add `Co-Authored-By`.**

## Commands
`npm run dev` · `npm run build` (tsc -b && vite build) · `npm run lint` · `npm run test` (vitest run) · `npm run format`

## Source precedence

| # | Source | Answers |
|---|---|---|
| 1 | **The code** + `ai-knowledge-base/project_snapshot.md` | What exists now. **Always wins.** |
| 2 | **`FEATURES_SCOPE.md`** | What is in scope. The product scope authority. |
| 3 | **`design-reference/DESIGN_INDEX.md`** | What the product should become. Direction, never a mandate. Build only rows marked MVP. |
| 4 | **`ai-knowledge-base/decisions.md`** + `decisions/ADR-*` | Which constraints are intentional. |
| 5 | **`ai-knowledge-base/archive/`** | Historical plans. **Not instructions.** Read for *why*, never for *what to do*. |

Derived docs (`api_contracts.md`, `project_snapshot.md`, `architecture.md`, …) describe the code. When they
disagree with it, **the code wins and the doc gets fixed** — never the reverse. **Flag the disagreement; never
silently pick a side.** Known conflicts: `ai-knowledge-base/doc-conflicts.md`.

**Two traps in `archive/`, stated here because they are expensive:**
- `BACKEND_INSTRUCTIONS.md` §3's Prisma schema is **outdated** — it drops `mood`. **`mockDb.ts` is the schema.**
- `FRONTEND_INSTRUCTIONS.md` Appendix Б shows **ymaps 2.x**. This project uses **ymaps 3.0**.
