---
description: Visual language, design tokens, and the design reference — including what NOT to build from it.
globs:
  - "src/shared/ui/**"
  - "src/index.css"
  - "**/*.module.css"
---

# Design

**Read the screen's line range in `design-reference/DESIGN_INDEX.md` before building or reviewing it.** Do not open the whole reference — read the range. For a full fidelity check, dispatch `@design-auditor` instead of reading it in the main session.

Philosophy: premium, calm, warm minimalism (Apple / Linear / Airbnb / Notion / Arc). Anti-goals: no aggressive gradients, no stray emoji, no saturated Google-Maps look. **The memory is always more visually important than the chrome or the map.**

## Tokens only
Everything comes from `shared/ui/tokens.css`: `var(--color-*)`, `var(--space-*)`, `var(--text-*)`, `var(--radius-*)`, `var(--shadow-*)`.
**No raw hex, no raw px.** Exactly two documented exceptions, both because the canvas cannot read CSS vars: the ymaps3 basemap literals in `YandexMap.tsx` (`#DCEDEB` / `#F1EFEA`) and `gradientPalette.ts`.

- Spacing: 8pt grid, `--space-1..9` = 4/8/12/16/20/24/32/40/48.
- Radii: cards `--radius-card` (20), sheets `--radius-xl` (24) on top corners, chips `--radius-xl`.
- Shadows: **warm**, `rgba(28,20,10,…)` — never black. Cards rest at `sm`, lift to `md` on hover; sheets `xl`.
- Type: apply with the shorthand — `font: var(--text-title3)`.
- **`--font-memory` (Newsreader italic) is the voice of memory** — place notes only. Never chrome.
- Dark theme is a `[data-theme='dark']` CSS-var swap. Warm, not blue-black. Never neon.

## MUI is form controls only
TextField, Button, Switch, Select, Stack, Typography — inside forms. **Never restyle the app through MUI.** `muiTheme.ts` deliberately omits `CssBaseline`.

## Icons
Material Symbols Rounded variable font, via `<span className="material-symbols-rounded">icon_name</span>`. **Not `@mui/icons-material`.**
`material-symbols-rounded--filled` **only for active/selected states** — active nav tab, filled star, liked heart, close-friend star.
Inside a CSS Module, target it as `:global(.material-symbols-rounded)`.

## Compose, don't invent
- **`UnifiedPlaceCard` is the only place representation.** Chronicle, feed, friend profile — same component. Never duplicate place markup per context.
- `BottomSheet` for editable forms and secondary flows. `PlaceDetailView` (full-screen overlay) for place detail.
- `Loader` / `EmptyState` / `ErrorState` — never a bare empty list, never a silent failure.
- **`ComingSoon` is the mandated treatment for every non-MVP feature.** Full overlay: icon + title + description + "Уведомить о запуске". Never a disabled button. Never a hidden element.
- Reuse the social-header composition (Avatar 80 + name + status + bio + 3-up stats) for any profile-like surface.
- `gradientForId(id)` for any placeholder image or avatar.

## Layout
Mobile-first; responsive at 360/390/430 via `clamp()`, `%`, and grid `auto-fit`/`minmax`. No fixed-pixel page layouts.
Touch targets ≥ 44×44. Respect `env(safe-area-inset-bottom)` in fixed/bottom UI.
Animation is minimal and purposeful. There is no motion library — keep it that way.

## Three bugs already paid for — do not repeat them

1. **Never nest a `<button>` inside a `<button>`.** One interactive element per card. Everything else is a `div` with `onClick` + `cursor: pointer`, or a separate button layered on top with `event.stopPropagation()` in its handler. `UnifiedPlaceCard` is the reference implementation: the card is the button; the geo button on top calls `stopPropagation`.
2. **Set `color` explicitly on text inside a `<button>`** (or rely on a global `button { color: inherit }`). Otherwise button text inherits the link colour.
3. **Material Symbols must load with the full variable range** — `opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200` in `index.html`. Fixed values (`@24,400,0,0`) break the runtime `FILL` toggle, so rating stars stop filling when tapped. This bug was found and fixed once already.

## Copy
Russian, warm, human. Banned: контент, алгоритм, персонализация, вовлечённость, популярность.
Established labels are frozen: nav = Карта / Хроника / Люди / Профиль; statuses = Хочу посетить / Запланировано / ★ Любимое; feed actions = Добавить к себе / Посмотреть.

## Known accessibility gap
No focus trap or focus restore in sheets and overlays. Be deliberate about it in any new modal work.

## The design reference shows the product's future, not its scope
`DESIGN_INDEX.md` marks every screen **MVP** or **Vision**. Build only MVP.
**Vision screens — Pinstory Plus, Import/Export, Onboarding, Splash, Memory-detail, Toast — are not in scope.** Do not implement them, do not scaffold them, do not add types for them. If a task appears to require one, stop and ask.

**The scope authority is `FEATURES_SCOPE.md`** (repo root, living). The design shows direction; `FEATURES_SCOPE.md` says what is in. When a "small extra" appears, its rule applies: **record it there first, decide deliberately.** Never absorb it into the current change.
