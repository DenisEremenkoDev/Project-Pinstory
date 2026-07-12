# Pinstory — Design System

> How the UI looks and *why*, at enough fidelity that an agent can build a **new**
> screen indistinguishable from the existing ones. Reusable component behavior is
> in [ui_patterns.md](ui_patterns.md). The canonical visual reference is the
> readable mockup indexed by `design-reference/DESIGN_INDEX.md` — **read the
> relevant line range there before building any listed screen.**

---

## 1. Design philosophy

References: Apple, Linear, Airbnb, Notion, Arc Browser — **premium, calm, warm
minimalism.** Explicit anti-goals ("no AI slop"): no aggressive gradients, no stray
emoji outside brand context, no "rounded-card-with-left-border" cliché, never a
saturated Google-Maps look. The app should never feel like Google Maps, Instagram,
Pinterest, or a generic social network. Memory (the content) is always more
visually important than chrome or the map.

Product-level consequences that shape UI: minimize navigation depth; evolve
existing screens instead of adding new ones; every interaction deliberate; optimize
for a few polished interactions over many mediocre ones.

---

## 2. Where the design system lives in code

| Concern | File |
|---|---|
| Design tokens (colors, type, spacing, radii, shadows) | `src/shared/ui/tokens.css` |
| Global reset + token/icon imports | `src/index.css` |
| Icon font setup + FILL toggle class | `src/shared/ui/material-symbols.css` |
| Font loading (Plus Jakarta Sans, Newsreader, Material Symbols) | `index.html` |
| Placeholder gradients (photos/avatars) | `src/shared/lib/gradientPalette.ts` |
| MUI theme bridge (form fields only) | `src/app/muiTheme.ts` |
| Per-component styling | co-located `*.module.css` CSS Modules |

**Styling rule:** CSS Modules per the design system for all custom visual blocks
(cards, map, nav, feed, sheets). MUI is used **only** for standard interactive form
elements (text fields, selects, switches, buttons inside forms). Never restyle the
app's look through MUI; use tokens.

---

## 3. Color palette (from `tokens.css`)

### Light theme (`:root`)
| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#4F46E5` | Indigo — primary actions, active nav, own pins |
| `--color-primary-hover` | `#4338CA` | hover |
| `--color-primary-subtle` | `#EEECFD` | selected-pin halo, subtle fills |
| `--color-accent` | `#14B8A6` | Teal — "new to you" friend pins, accents |
| `--color-accent-subtle` | `#E1F7F3` | |
| `--color-highlight` | `#F59E0B` | Amber — "common place" friend pins, highlights |
| `--color-highlight-subtle` | `#FEF3E2` | |
| `--color-canvas` | `#FBFAF9` | app background (warm off-white) |
| `--color-surface-raised` | `#FFFFFF` | cards, sheets, nav |
| `--color-surface-sunken` | `#F3F1EE` | inset areas, photo placeholders |
| `--color-border` | `#E8E5E1` | hairlines, dividers |
| `--color-text-primary` | `#1C1B1A` | |
| `--color-text-secondary` | `#6B6660` | |
| `--color-text-tertiary` | `#9C968E` | placeholders, muted icons |
| `--color-success` / `-subtle` | `#16A34A` / `#4ADE80` | |
| `--color-danger` / `-subtle` | `#E11D48` / `#FB7185` | like heart, destructive |
| `--color-map-land` | `#F1EFEA` | muted basemap land (parchment) |
| `--color-map-water` | `#DCEDEB` | muted basemap water |

### Dark theme (`[data-theme='dark']`)
Warm (not blue-black), neon-free. Overrides: canvas `#12110F`, surface raised
`#1B1A17`, sunken `#211F1C`, border `#322F2A`, primary `#7C74F0` (hover `#948CF3`,
subtle `#2A2650`), accent `#2DD4BF` (subtle `#1A3A37`), highlight subtle `#3A2C14`,
text `#F5F3EF`/`#B4AFA7`/`#8A8177`, success `#4ADE80`/`#163A24`, danger
`#FB7185`/`#3A1620`, map land `#2A2825`, water `#16302D`, and darker shadow ramps.

**Rule:** always use tokens, never raw hex — except in two documented places where
the canvas can't read CSS vars: the ymaps3 basemap customization in `YandexMap.tsx`
(literal `#DCEDEB`/`#F1EFEA`, mirroring the map tokens) and the gradient palette.

---

## 4. Typography

Two fonts, loaded in `index.html`:
- **Plus Jakarta Sans** (400–800, italic axis) — `--font-ui`, the UI voice:
  geometric, confident.
- **Newsreader italic** — `--font-memory`, the **"voice of memory"**: used *only*
  for place notes / memory quotes (e.g. `PlaceDetailView` `.note`), giving diary
  warmth. Never use it for chrome.

Type scale (CSS shorthand tokens — apply with `font: var(--text-*)`):
| Token | Spec |
|---|---|
| `--text-display` | `800 34px/40px` |
| `--text-title1` | `700 28px/34px` |
| `--text-title2` | `700 22px/28px` |
| `--text-title3` | `600 18px/24px` |
| `--text-body` | `500 16px/24px` (global default on `body`) |
| `--text-caption` | `600 13px/18px` |
| `--text-micro` | `700 11px/14px` (uppercase, used for nav labels) |
| `--text-memory-quote` | `italic 400 20px/28px` Newsreader |

Large screen titles sometimes use `clamp()` for fluid sizing (e.g. `MapPage.title`
= `clamp(20px, 5.5vw, 24px); font-weight: 800`).

---

## 5. Iconography

- **Material Symbols Rounded** (variable font), weight 400, 24px optical size.
  Loaded with the **full variable range**
  `opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200` in `index.html` — required so
  the runtime `FILL` toggle works (rating stars, active nav, like heart).
- Usage: `<span className="material-symbols-rounded">icon_name</span>`.
- **Filled variant** = add `material-symbols-rounded--filled` (sets
  `font-variation-settings: 'FILL' 1`). Use filled **only for active/selected
  states**: active nav tab, filled star, liked heart, close-friend star.
- This is **not** `@mui/icons-material`. All visual icons in custom components go
  through Material Symbols Rounded. MUI is form fields only.
- In CSS Modules, target the icon via `:global(.material-symbols-rounded)` (e.g.
  to set `font-size`), since the class is global, not module-scoped.

Common icons in use: `map`, `timeline`, `group`, `person`, `add`, `search`,
`location_on`, `near_me`, `layers`, `notifications`, `favorite`/`favorite_border`,
`flag`, `star`, `close`, `arrow_back`, `chevron_right`, `check_circle`, `settings`,
`bookmarks`/`bookmark`/`bookmark_add`, `lock`, `edit`, `delete`, `ios_share`,
`add_a_photo`, `image`, `route`, `compare`, `error_outline`, `explore`,
`auto_stories`, `auto_awesome`, `person_search`.

---

## 6. Spacing, radii, shadows

- **Spacing** — 8pt grid tokens `--space-1..9` = `4/8/12/16/20/24/32/40/48px`.
  Use tokens, not raw px.
- **Radii** — `--radius-sm 8`, `md 12`, `lg 16`, `xl 24`, `--radius-card 20`.
  Cards use `--radius-card`; bottom sheets use `--radius-xl` on top corners;
  pills/chips use `--radius-xl`.
- **Shadows** — soft & **warm** (`rgba(28,20,10,…)` in light), never black:
  `--shadow-sm/md/lg/xl`. Cards rest at `sm`, lift to `md` on hover; sheets use
  `xl`; floating buttons use `md`.

---

## 7. Layout & responsiveness

- **Mobile-first.** Responsive at 360 / 390 / 430px via `clamp()`, `%` containers,
  and CSS grid `auto-fit`/`minmax`. No fixed-pixel page layouts.
- **App shell:** fixed bottom nav (64px + safe-area). Page content
  (`AppShell.module.css .content`) has `min-height: 100vh` and
  `padding-bottom: calc(64px + env(safe-area-inset-bottom))` so content clears the
  nav.
- **Bottom sheets** are centered, `max-width: 480px`, `max-height: 85vh`,
  scrollable, with a top grab-handle and `env(safe-area-inset-bottom)` padding.
- **Map page** occupies `calc(100vh - 145px)`; header floats over the map with
  `z-index`.
- **Touch targets ≥ 44×44** (nav tabs enforce `min-width: 44px`).
- Safe-area insets (`env(safe-area-inset-bottom)`) are respected in nav + sheets
  for notched devices / PWA.

---

## 8. Animation & transitions

Minimal and purposeful ("every animation aids understanding, not decoration").
Present in code: card shadow lift on hover, add-button background transition
(`0.15s ease`), the loader spinner, selected-pin halo. There is no heavy motion
library. New motion should stay this restrained.

---

## 9. Placeholder imagery (gradients)

`gradientPalette.ts` maps any string id → a deterministic warm linear gradient
(`linear-gradient(160deg, from, to)`) from a 7-stop palette (teal/indigo/amber
family). Used for:
- Place cards / detail when `photoUrl` is null (`UnifiedPlaceCard`, `PlaceDetailView`).
- Avatars without an image (`Avatar` shows the gradient + first initial).

This gives every place/person a stable, on-brand visual identity without real
images. Reuse `gradientForId(id)` for any new placeholder surface.

---

## 10. UI language & tone (Russian)

All in-app copy is **Russian**, warm and human — no English calques or corporate
speak.
- **Avoid:** контент, алгоритм, персонализация, вовлечённость, популярность.
- **Use:** Для вас, Сегодня, Открытия, Подборки, Истории, Любимые места, Хочу
  посетить, Добавить к себе, Пойти вместе, Пригласить, Сравнить карты.
- Established labels: nav = Карта / Хроника / Люди / Профиль; place statuses = Хочу
  посетить / Запланировано / ★ Любимое; feed actions = Добавить к себе / Посмотреть;
  moods = Спокойствие 😊 / Умиротворение 😌 / Трогательно 🥹 / Смех 😂.

Keep code, comments, commit messages, and these knowledge-base docs in **English**;
only user-visible strings are Russian.

---

## 11. State visuals (loading / empty / error / coming-soon)

Consistent, icon-led, centered blocks (see [ui_patterns.md](ui_patterns.md) for
the components):
- **Loader** — centered spinner (`Loader`).
- **EmptyState** — Material Symbol + title + optional description; friendly, never a
  bare empty list (e.g. "Пока пусто", "Никого не нашли").
- **ErrorState** — `error_outline` + title + description + "Повторить" retry button.
- **ComingSoon** — full overlay: icon + title + description + a MUI outlined
  "Уведомить о запуске" button. This is the mandated treatment for every
  not-in-MVP feature — **a teaser, not a disabled button and not a hidden feature.**

---

## 12. Signature UI motifs (reproduce these for a native feel)

- **Unified place card**: rounded (`--radius-card`) white surface, 160px photo (or
  gradient), overlaid mood chip (top-left, translucent dark), geo button (top-right,
  translucent white), feedback badge (bottom-left, heart=danger / flag=tertiary),
  title below in `--text-title3`.
- **Map pins**: teardrop (`border-radius: 50% 50% 50% 5px; rotate(45deg)`). Own =
  primary indigo, 32px, selected gets a `--color-primary-subtle` halo. Friend =
  22px with white border, amber (common) or teal (new-to-you), z-index above own.
- **Filter chips**: pill row, inactive = sunken surface, active = primary. Used in
  Chronicle and the friend overlay.
- **Segmented toggle**: "Мои воспоминания / От друзей" on the Хроника tab.
- **Social header**: avatar (80px) + name + optional status/bio + a 3-up stats row
  (places / followers / following) — identical on own Profile and friend profile.
- **Bottom nav with center FAB**: 2 tabs, a raised circular ＋ button (primary,
  `--radius-xl`, shadow-md) that opens the add-place sheet, 2 more tabs.

---

## 13. Accessibility

Baseline patterns already in code (keep them): `aria-label` on all icon-only
buttons; `role="button"` + `tabIndex={0}` + Enter/Space handling on the clickable
card; `alt` on images; `autoFocus` on the search input; touch targets ≥44px;
`color-scheme: light dark` on body. No focus-trap/roving-tabindex library is
present in sheets/overlays — a known gap to be mindful of for new modals.
