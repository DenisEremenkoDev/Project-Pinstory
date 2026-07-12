---
description: React/RTK Query conventions for feature and app code.
globs:
  - "src/app/**"
  - "src/features/**/*.tsx"
  - "src/features/**/*.ts"
---

# Frontend

Match the surrounding file's style over any rule here if they ever conflict.

## Structure
- **Feature-based**, never file-type-based. One directory per domain: `auth`, `places`, `people`, `collections`, `feed`, `profile`, `theme`.
- Pages in `features/x/pages/XPage.tsx`. Feature-local components at the feature root. Shared components in `shared/ui/`.
- Co-locate: component + `*.module.css` + test together; `*Api.ts` + `*.mockRoutes.ts` + `*Schema.ts` together.
- **Dependency direction `app → features → shared`.** `shared` never imports from `features`. Features reach each other only through exported `*Api.ts` hooks and exported components.

## Components
- **Named function components, named exports.** The only default export is `App`.
- `interface XProps` declared above the component, not exported unless reused.
- Callbacks named `onX` (`onOpen`, `onClose`, `onSaved`, `onRetry`, `onPinTap`).
- Icon-only buttons carry `aria-label`. Clickable non-buttons get `role="button"` + `tabIndex={0}` + Enter/Space handling.
- Data fetching lives in pages / feature components. Keep leaf components presentational.

## State
- **Server data → RTK Query only.** Never write a slice to cache server entities. Slices exist only for `auth` (token) and `theme` (mode).
- **Local UI state → `useState` in the owning page** (open sheets, selected id, active filter, cursor, overlay friend). No global UI store. Modals and sheets are conditionally-rendered children of the page that owns their state.
- Typed hooks only: `useAppDispatch` / `useAppSelector` from `app/hooks.ts`. Never raw `useDispatch` / `useSelector`.

## The state ladder — always in this order
```ts
if (isLoading) return <Loader />
if (isError || !data) return <ErrorState onRetry={refetch} />
if (data.length === 0) return <EmptyState icon="..." title="..." />
return <content />
```
Feed exception (tested in `FeedPage.test.tsx`): a **load-more** failure keeps the loaded items and shows an inline retry. Only a *first* load failure gets the full-page `ErrorState`.

## Mutations & forms
```ts
try { await someMutation(body).unwrap(); onSaved() }
catch (e) { setError('root', { message: getApiErrorMessage(e, 'fallback') }) }
```
RHF + `zodResolver` + MUI. Plain inputs via `{...register('field')}`; non-text inputs (stars, mood, switches, selects) via `<Controller>`. Zod schema per form in `*Schema.ts`, exporting the schema **and** `z.infer` type. Submit button shows a busy label while `isLoading`. Root errors render as `<Typography color="error">`.

## TypeScript
- `verbatimModuleSyntax` → **`import type` / `export type` for type-only imports.** Split mixed imports.
- `noUncheckedIndexedAccess` → indexed access is `T | undefined`. Guard, `!`, or `?? fallback` (`pathParams.id ?? ''`).
- **No `any`.** In tests, `as never` on mocked RTK hook returns is the accepted escape — nowhere else.
- Enums are **string-literal unions** + Russian label `Record` maps in `apiTypes.ts`. Never TS `enum`.

## Imports
React/node → third-party → app/shared → feature-local → own `styles` from `*.module.css` last. Relative paths; no aliases are configured.

## Future compatibility (constraint, not a task)
The app is expected to be packaged for mobile later (PWA + a wrapper such as Capacitor). Do not build for it. **Do not block it:** keep business logic in RTK Query and feature code — never in the router — and keep the router configuration a single line in `App.tsx`.
