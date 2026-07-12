# Pinstory — Document Conflicts Register

The project rule is **flag it, don't silently pick a side** (`CLAUDE.md`). This file is where the flags live,
so each session doesn't rediscover them.

`FEATURES_SCOPE.md`, `FRONTEND_INSTRUCTIONS.md`, `BACKEND_INSTRUCTIONS.md`, `TESTING_PLAN.md` and
`DEPLOYMENT.md` were written **before** the code existed. They are historical planning documents, not a
higher source of truth. Where they disagree with the code, **the code wins.**

## Confirmed conflicts — the plan doc is wrong

| # | Doc says | Code does | Verdict |
|---|---|---|---|
| C1 | `BACKEND_INSTRUCTIONS.md` §3 Prisma schema: no `Place.mood`, no `User.defaultVisibility`, no `User.notifications`, no `PlaceComment.updatedAt` | All four exist (`apiTypes.ts`, `mockDb.ts`, `addPlaceSchema.ts`, `MoodPicker`, `ProfileSettingsForm`) | **Schema is outdated. `mockDb.ts` is the schema.** Transcribing §3 silently drops the mood feature. Highest-cost conflict in this list. |
| C2 | `FEATURES_SCOPE.md` + `FRONTEND_INSTRUCTIONS.md` §8: feed card has three actions — «Добавить к себе» / «Посмотреть» / **«Пойти вместе»** | Two actions only | **Docs outdated.** `decisions.md` D24 [Confirmed]: no third action — trust-based discovery, not a social network. |
| C3 | `FRONTEND_INSTRUCTIONS.md` §2, Appendix A: bottom-nav tabs are Карта / **«Для вас»** / ＋ / Люди / Профиль | Tab label is **«Хроника»**; "Для вас" is only the in-screen `<h1>` of `FeedPage` | **Docs outdated.** `decisions.md` D23. |
| C4 | `FRONTEND_INSTRUCTIONS.md` Appendix Б: Yandex Maps **2.x** API — `ymaps.ready()`, `new ymaps.Map()`, `new ymaps.SuggestView()` | **ymaps 3.0** — `YMapMarker`, `onFastClick`, `[lng, lat]` order, `@yandex/ymaps3-types` | **Actively misleading.** An agent following Appendix Б would write v2 code against a v3 SDK. Use the appendix only for the key-registration procedure and the legal constraint. |
| C5 | `DEPLOYMENT.md` CI: `matrix: [frontend, backend]`, `working-directory`, `cache-dependency-path: ${{ matrix.project }}/package-lock.json` | **Not a monorepo.** `src/` and `package.json` are at the repo root; `backend/` is empty | **CI would fail on the first run.** Must be rewritten for the actual layout before it is added (Phase 5). |
| C6 | `DEPLOYMENT.md` CI runs `npm run typecheck` | **No `typecheck` script exists.** Scripts: `dev`, `build`, `lint`, `preview`, `format`, `test`, `test:watch`, `deploy` | Add `"typecheck": "tsc -b --noEmit"` to `package.json` before adding CI. |
| C7 | `TESTING_PLAN.md` references `npm run test:file` | No such script | Cosmetic. Use `npx vitest run <path>`. |
| C8 | `FRONTEND_INSTRUCTIONS.md` Appendix A dark-theme tokens are a partial list ("остальные токены наследуют логику") | `tokens.css` has the complete set | **Code wins.** Do not re-derive dark tokens from the appendix. |
| C9 | `FEATURES_SCOPE.md` references `PINSTORY_CONTEXT_ARCHIVE.md` and `Pinstory - Standalone.html`; `FRONTEND_INSTRUCTIONS.md` §3, §15 reference the same prototype | Neither file exists. The design reference is `design-reference/Pinstory-source-readable.html` + `DESIGN_INDEX.md` | **Dangling references.** Redirect to the current design reference. |

## Ambiguity worth pinning (not a conflict — a security-shaped question)

**A1 — Does `GET /people/:id/places` require following?**

- `FEATURES_SCOPE.md` (matrix row "Карта — базовое наложение друга"): *"только публичные места указанного пользователя, **требует подписки** на него"*.
- `BACKEND_INSTRUCTIONS.md` §12 is precise: the follow check lives **on the frontend** (`isFollowing` from `GET /people/:id`); the server does **not** gate on follow status, *"сами данные и так защищены фильтром `visibility = 'public'`"*.

**BACKEND_INSTRUCTIONS.md is the operative contract.** The visibility filter is the security boundary; the follow check is UX.

This matters because the two readings fail differently. If someone "simplifies" by replacing the visibility filter with a follow gate, every follower gains access to every private place. **Do not add a server-side follow gate without a decision, and never remove the visibility filter on the assumption the follow gate covers it.**

## Superseded by V2.1, deliberately

| Doc says | V2.1 |
|---|---|
| `DEPLOYMENT.md`: backend on **Railway**, frontend on **Vercel/Netlify**, with concrete env vars | **ADR-01: hosting is deliberately undecided.** The Railway/Vercel plan is preserved as *prior art* in ADR-01 — its concrete details (`NIXPACKS_NODE_VERSION=24`, `migrate deploy` only, CORS/`FRONTEND_URL` coupling, the Yandex allowed-domains step) remain correct **for that host** and are worth keeping. |
| `DEPLOYMENT.md` checklist: *"Refresh-токен отправляется как httpOnly cookie"* | **ADR-04 is open.** An httpOnly cookie does not survive a native wrapper. The intent stands; the transport does not. |
| The repo currently deploys to **GitHub Pages** (`deploy-pages.yml`), which `DEPLOYMENT.md` never mentions | The frontend deploy is real and works. `DEPLOYMENT.md` predates it. |

## Still fully valid — absorbed into the Workspace

- `BACKEND_INSTRUCTIONS.md` **Appendix "точные контракты API"** — status codes, error envelope, per-endpoint shapes. Now summarized in `.claude/rules/api-contract.md`; the appendix stays the detailed reference.
- `BACKEND_INSTRUCTIONS.md` §2, §14 — the security middleware layer and per-endpoint checks. → `.claude/rules/backend.md`.
- `TESTING_PLAN.md` — the 16 backend + 5 frontend Priority-1 cases. → `.claude/rules/testing.md`, verbatim. **This is the single most valuable thing recovered from these documents.**
- `FRONTEND_INSTRUCTIONS.md` Appendix A "технические заметки" — no nested `<button>`; explicit `color` in buttons; Material Symbols must load with the full variable axis range. Three bugs already paid for once. → `.claude/rules/design.md`.
- The legal constraint on Yandex geosuggest (never cache org-search results as a directory) → `.claude/rules/map.md`.
- `FEATURES_SCOPE.md` — the Coming Soon list and the "record it before you build it" discipline. The scope authority; C2 and C3 are corrected in the current version at the repo root.
