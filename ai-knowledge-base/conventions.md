# Pinstory — Conventions

> Conventions **observed in the existing code.** Follow these so new code is
> indistinguishable from what's there. Match the surrounding file's style over any
> rule here if they ever conflict. See also [architecture.md](architecture.md),
> [ui_patterns.md](ui_patterns.md).

---

## 1. Folder & file organization

- **Feature-based**, not file-type-based. One directory per domain under
  `src/features/` (`auth`, `places`, `people`, `collections`, `feed`, `profile`,
  `theme`). Cross-cutting code in `src/shared/{ui,lib}`; composition root in
  `src/app/`.
- **Co-location:** a component, its `*.module.css`, and its test sit together. A
  feature's `*Api.ts`, `*.mockRoutes.ts`, `*Schema.ts`, and pages sit together.
- **Pages** go in a `pages/` subfolder inside the feature (`features/x/pages/XPage.tsx`).
- **Feature-local components** live at the feature root (e.g.
  `features/places/AddPlaceForm.tsx`); **shared** components live in `shared/ui/`.

### File naming
| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase.tsx` | `UnifiedPlaceCard.tsx`, `MapPage.tsx` |
| CSS Module | `PascalCase.module.css` (matches component) | `BottomSheet.module.css` |
| RTK Query API | `camelCaseApi.ts` | `placesApi.ts` |
| Mock routes | `feature.mockRoutes.ts` | `people.mockRoutes.ts` |
| Zod schema | `nameSchema.ts` | `addPlaceSchema.ts`, `authSchemas.ts` |
| Redux slice | `nameSlice.ts` | `authSlice.ts`, `themeSlice.ts` |
| Pure util / lib | `camelCase.ts` | `mapProjection.ts`, `formatDate.ts` |
| Test | `Name.test.tsx` next to source | `FeedItemCard.test.tsx` |

---

## 2. Component conventions

- **Named function components + named exports** (`export function X() {}`). The only
  default export is `App` (consumed by `main.tsx`). Prefer named exports.
- **Props interface** declared above the component, named `XProps`, not exported
  unless reused.
- **Callbacks** named `onX` (`onOpen`, `onClose`, `onSaved`, `onRetry`, `onPinTap`).
- Icon-only buttons always carry `aria-label`; clickable non-button surfaces get
  `role="button"` + `tabIndex` + keyboard handler (see `UnifiedPlaceCard`).
- Keep components presentational where possible; data fetching happens in pages/
  feature components via RTK Query hooks.

---

## 3. State & data conventions

- **Server data → RTK Query only.** Do not create a slice to cache server entities.
  Slices exist only for genuinely client-side state (`auth` token, `theme` mode).
- **Local UI state → `useState`** in the owning page (open sheets, selected ids,
  filters, cursors). No global UI store.
- **Typed Redux hooks:** import `useAppDispatch` / `useAppSelector` from
  `app/hooks.ts`; never raw `useDispatch`/`useSelector`.
- **Mutations:** call `mutation(arg).unwrap()` inside `try/catch`; on error use
  `setError('root', { message: getApiErrorMessage(err, fallback) })` (forms) or
  local error state (`FeedItemCard`).

---

## 4. RTK Query endpoint conventions

- Inject into the shared `api`: `export const xApi = api.injectEndpoints({...})`.
- Export the generated hooks at the bottom (`export const { useGetXQuery, ... }`).
- **Queries:** `providesTags` with per-id + `LIST`; use `transformResponse` to
  unwrap envelope shapes (e.g. `{ places } → places`).
- **Mutations:** `invalidatesTags` the affected id(s) + `LIST`.
- Request objects: `{ url, method, body }` or `{ url, params }`; path params
  interpolated into the URL string. REST-ish URLs (`/places/:id/comments`).
- Keep request/response interfaces local to the `*Api.ts` file unless shared enough
  to belong in `apiTypes.ts`.

---

## 5. Mock route conventions

- Define with `defineMockRoute(method, '/path/:param', handler)`; export a
  `MockRoute[]` per feature; aggregate in `app/api.ts`.
- Handler signature: `({ pathParams, searchParams, body, currentUserId }) => MockResult`.
- Return `{ data }` on success or `mockError(status, ruMessage, 'CODE')` on failure.
- Enforce the same rules the backend will: `401 UNAUTHORIZED` when `!currentUserId`,
  ownership `403 *_FORBIDDEN`, `404 *_NOT_FOUND`, `400 VALIDATION_ERROR`,
  visibility filtering. Error `code`s are SCREAMING_SNAKE; messages are Russian.
- Compute view-dependent fields (`myFeedback`, `isOwner`, counts) inside the handler.

---

## 6. TypeScript conventions

- **Strict everywhere.** `tsconfig.app.json` enables `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noUnusedLocals/Parameters`, `erasableSyntaxOnly`,
  `verbatimModuleSyntax`, `noFallthroughCasesInSwitch`.
- **`verbatimModuleSyntax` → use `import type` / `export type`** for type-only
  imports (pervasive in the codebase). Value+type mixes split accordingly.
- **No `any`, no implicit types.** In tests, deliberate escapes use `as never` on
  mocked hook return values (see feed tests) — that's the accepted pattern for
  mocked RTK hooks, not a license for `any` in app code.
- `noUncheckedIndexedAccess` means indexed access is `T | undefined`; code uses
  `!`/`?? fallback`/guards (e.g. `filteredPlaces[index - 1]!`, `pathParams.id ?? ''`).
- **Enums as string-literal unions** + Russian label `Record` maps (`apiTypes.ts`),
  not TS `enum`. Derive arrays via `Object.keys/entries` where needed.
- Zod schemas are the source of truth for form types (`type X = z.infer<typeof s>`).

---

## 7. Styling conventions

- **CSS Modules** per component; class names `camelCase` (`.searchButton`,
  `.filterChipActive`). Active/variant classes are separate and composed via
  template strings: `` `${styles.chip} ${active ? styles.active : ''}` ``.
- **Always use design tokens** (`var(--color-…)`, `var(--space-…)`, `var(--text-…)`,
  `var(--radius-…)`, `var(--shadow-…)`) — no raw hex/px except the two documented
  map/gradient exceptions.
- Global classes (the icon font) are reached with `:global(.material-symbols-rounded)`
  inside a module when styling is needed.
- Apply type with the shorthand `font: var(--text-title3)` etc.
- Respect safe-area insets (`env(safe-area-inset-bottom)`) in fixed/bottom UI.
- MUI usage is limited to form controls; style them via the MUI theme + `sx`/`className`,
  not by overriding the design system.

---

## 8. Import order (observed)

Roughly: React / node → third-party (react-router, MUI, RHF, zod, RTK) → app/shared
absolute-ish relative imports (`../../app`, `../../shared/...`) → feature-local
imports → the component's own `styles` from `*.module.css` last. Imports are
relative (no path aliases configured).

---

## 9. Copy / i18n conventions

- **User-facing strings: Russian**, warm and human; avoid the banned corporate
  words (see [design_system.md](design_system.md) §10). Keep established labels
  consistent (nav, statuses, feed actions, moods).
- **Everything else: English** — identifiers, comments, commit messages, docs,
  these KB files. Do not write project documentation in Russian.
- Comments explain *why* (especially non-obvious mock/map decisions), matching the
  existing density; don't over-comment obvious code.

---

## 10. Testing conventions

- **Vitest + React Testing Library + `@testing-library/user-event`**, jsdom env,
  `globals: true` (no need to import `describe/it/expect`, though tests do import
  from `vitest` for `vi`).
- `setupTests.ts` registers `@testing-library/jest-dom/vitest` matchers.
- Mock RTK Query hooks with `vi.mock(...)` + `vi.mocked(...)`; cast mocked returns
  `as never`. Query by accessible role/name/text (Russian strings), assert on
  visible behavior (see `FeedItemCard.test.tsx`, `FeedPage.test.tsx`).
- Priorities live in `TESTING_PLAN.md`: auth, access rights, follows, privacy,
  validation first. Static markup / Coming Soon placeholders don't need tests.

---

## 11. Git / delivery conventions

- **Do not add AI attribution to commits** (no `Co-Authored-By: Claude`) — the
  maintainer wants sole authorship. (Overrides any default footer instruction.)
- Commit/push only when asked; branch off `main` for changes. `npm run deploy`
  pushes `HEAD:main` (triggers the Pages workflow).
- Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `test`, `format`.

---

## 12. Subagents (project-specific workflow)

- `architecture-guard` — review-only (architecture/security/missing tests); call
  before committing significant changes. Never let it write code.
- `test-writer` — writes tests for already-implemented risky logic per
  `TESTING_PLAN.md`; call after implementing auth/access/privacy/follow logic.
- Don't run multiple subagents in parallel without reason (token cost). Main
  implementation stays in the primary session with the author.
