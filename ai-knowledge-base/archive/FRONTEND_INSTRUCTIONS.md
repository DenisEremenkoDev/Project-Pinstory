# Pinstory — frontend instructions

Use this as a step-by-step plan. Each item is a complete step with a working result. Scope is locked in `FEATURES_SCOPE.md`. General rules and versions — in `CLAUDE.md`. The source of truth for appearance is the `Pinstory - Standalone.html` prototype and the design system from the product archive — don't invent a new look, port the existing one into code.

## Stack and versions

Unchanged after the rebrand: React 19.2.x, TypeScript ~5.9 (strict), Redux Toolkit 2.x + RTK Query, MUI 6.5.0 (only for standard interactive form elements — text fields, dialogs, buttons inside forms), Vite 7.x, React Router v7, React Hook Form 7.x + `@hookform/resolvers` + Zod 4.x, Prettier, `.env`, enums instead of magic strings.

**Important change from the old design system:** visual icons across the app (navigation, badges, buttons outside forms) go through **Material Symbols Rounded** (variable font), not `@mui/icons-material`. MUI stays only for standard form fields.

## 1. Project initialization

- Create a Vite project (React + TypeScript), pin Node in `.nvmrc` (24)
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- Prettier + ESLint (typescript-eslint + `eslint-config-prettier`)
- `.env` / `.env.example` (API URL, Yandex Maps key), `.env` in `.gitignore`
- Folder structure — feature-based:
  ```
  src/
    app/          — store, routing, entry point
    features/
      auth/
      places/
      people/       — search, follows, close friends, friend profile
      collections/
      feed/         — the "For You" activity feed
      profile/
      theme/        — the ui slice (light/dark theme)
    shared/
      ui/           — reusable visual components (Loader, ComingSoon, UnifiedPlaceCard)
      lib/          — utilities, enums, types
  ```

## 2. Pinstory design system — rebuild on CSS Modules

- Source of truth for appearance — `Pinstory - Standalone.html`
- Each visual block gets its own component + a `Name.module.css` next to it
- Shared values — in `shared/ui/tokens.css`, imported globally — exact values in Appendix A
- Screens to rebuild: login/registration, the main shell with bottom navigation (Map / **Хроника** / + Add / People / Profile — tab 2's UI label is "Хроника," not "For You"), place detail view, add-place bottom sheet, Chronicle "My Memories," People (list + friend profile + search), Collections (inside Profile), the "For You" feed (lives on the Хроника tab, under the in-screen "Для вас" heading), profile settings, the Coming Soon component (reused for everything not in MVP)
- Build the light/dark theme switch from the start — both token sets are used everywhere

## 3. Routing and protected routes

- Public routes: `/login`, `/register`
- Private routes (wrapped in `ProtectedRoute`): `/map`, `/feed`, `/people`, `/people/:id`, `/profile`, `/profile/collections`
- An unauthenticated user on a private route → redirected to `/login`
- After login — redirect to `/map` (the main screen is the map, not a list)

## 4. Auth feature

- RTK Query: `register` (including `displayName`), `login`, `refresh`, `logout`
- Token in memory (Redux), not `localStorage`; refresh — httpOnly cookie on the backend
- Form — RHF + Zod (email, password, display name)

## 5. Places feature

- RTK Query: `getPlaces` (own), `getPlace(id)`, `createPlace`, `updatePlace`, `deletePlace`, `setFeedback`/`clearFeedback`, `getComments`/`addComment`
- `Place` cache invalidation tag — refresh the list and detail after mutations
- **Adding a place (+) — a bottom sheet**, not a full-screen modal: photo (placeholder/preview), geosuggest or map click, **star rating 1–5 right here** (not deferred), a text field "what happened here" (note/story), tags (free-text input + suggestions from already-used tags), status (Want to visit / Planned / ★ Favorite — **no "Visited"**), privacy, "Save memory" button
- **Place detail view** — the emotional center of the app, not a separate page, expands over the current screen:
  - status chips (Want to visit/Planned/★Favorite) and star rating, visible immediately with no scrolling — both **inline-editable right in the detail view** (tap a status chip to switch it, tap a star to re-rate), owner only
  - heart (❤️ like)/flag (🚩 dislike) badge — an explicit toggle next to the stars
  - a "Reviews and comments" block — friends' comments with each one's own star rating, plus a form to add your own comment
  - a trust signal ("Alex has been here — similar taste") with avatars, where applicable
  - the note/story — italic, Newsreader font (see Appendix A)
  - a teaser button "Routes with this place — coming soon" (just leads to the Coming Soon component, not an active feature)
- **Chronicle "My Memories"** — filter chips above the list: All / ❤️ Liked / 🚩 Disliked / Want to visit. A friendly empty state when a filter has no results, not an empty list
- **Unified place card** (`shared/ui/UnifiedPlaceCard`) — one component for three contexts: "My Memories," a friend's places (in their profile), and cards in the activity feed. Shows: photo, rating badge, heart/flag badge, geo icon (📍 near_me — tapping instantly opens the map and highlights the place's point), title, metadata. Tapping in any context → the same full place detail view

## 6. People feature (search, follows, close friends)

- RTK Query: `searchPeople(q)`, `getPerson(id)`, `follow`/`unfollow`, `toggleCloseFriend`, `getPersonPlaces(id)`, `getPersonCollections(id)`
- **"People" screen** (a bottom nav tab, replaces the earlier "Friends" placeholder): a list of followed people with avatar, name, "★ Close friend" badge, trust line ("You have similar taste in coffee shops"); a people-search field at the top
- **Friend profile**: avatar, bio, social header (counts), "Follow"/"Unfollow" button, "★ Close friend" toggle (only shown/enabled if already following), "Compare maps" button (leads to the Coming Soon "Map Comparison" overlay — distinct from the basic map overlay, which is different and real), a list of the friend's public places in the unified card
- The section is built without competitiveness/leaderboards/popularity — trust signals only

## 7. Collections feature

- RTK Query: `getCollections` (own + followed as separate lists), `createCollection`, `updateCollection`, `deleteCollection`, `addPlaceToCollection`, `removePlaceFromCollection`
- The section lives inside Profile (not a separate bottom nav tab — a deliberate decision to avoid a 6th tab)
- Own collections — full CRUD; followed people's collections — view only

## 8. Feed feature (the "For You" feed)

- RTK Query: `getFeed` with pagination (`cursor`/`limit`)
- Cards of types: "Added a new place," "Wants to visit a place," "Added a story" — use the same unified place card where applicable
- Each card has two actions: "Add to mine," "View" (per the design mockup — no third "Go together" button) — **no** engagement mechanics (likes-for-likes, mindless infinite scroll)
- The "Хроника" tab has a "Мои воспоминания" / "От друзей" segmented toggle at the top (per the design mockup) — "Мои воспоминания" shows the existing Chronicle (own places, filter chips, date-grouped); "От друзей" shows the activity feed described above. Default view is "Мои воспоминания"

## 9. Map (Yandex Maps) — do this last

- API key setup — Appendix B
- **Real map implemented (JS API 3.0):** with `VITE_YANDEX_MAPS_API_KEY` set, `YandexMap.tsx` renders the real Yandex map (see Appendix B for the implementation map and gotchas); without a key, `shared/lib/mapProjection.ts` still projects lat/lng onto a fixed percentage viewport (centered on Saint Petersburg) as the fallback — `shared/lib/mapsConfig.ts` (`hasRealMapsKey`) is the switch. Map click/tap in both modes — creates a point with real coordinates and opens the add-place sheet pre-filled with them
- The map component accepts an array of pin "layers": `layers: { source: 'own' | 'friend'; places: Place[] }[]` — not a single hardcoded list (see `CLAUDE.md`). Implemented as `MapPins` (pure pin renderer) fed by `MapPage`
- **Basic friend map overlay (real in MVP):** the "layers" icon → `MapFriendPicker` ("Сравнить карты" — pick a friend from your follows) → their public places (`getPersonPlaces`) are added as a second pin layer over your own, colored by `MapFriendOverlay`'s filter (amber = common place, teal = new-to-you). Toggles: common places / own only / theirs only / favorites / common "want to visit" — filtered on the frontend from the two already-loaded lists via `mapOverlayFilter.ts`, no separate endpoint needed. "Common place" is approximated by name or close coordinates (`mapMatching.ts`) since there's no cross-user place identity in the schema. The friend layer's pin z-index is above other map layers
- Full "Map Comparison" (deep stats, shared-visit history) — Coming Soon teaser, reachable from the friend-overlay filter row
- In-app search over own places/memories (`MapSearchSheet`) lives on the Map tab too — separate from Yandex geosuggest, filters already-loaded own places by name client-side
- Don't cache geosearch results in your own DB as a directory — only what the user explicitly saved

## 10. Profile

- RTK Query: `getProfile`, `updateProfile`
- Social header: post/place count, followers, following — in the spirit of modern social profiles, but without a focus on popularity
- The "Collections" section — inside the profile (see item 7)
- Teaser banner for Routes: "🚧 Routes — coming soon" (leads to Coming Soon)
- Settings: account data, avatar, privacy (default place visibility), notifications — a minimal form, no real push logic

## 11. Coming Soon component

- One reusable component for the whole app (`shared/ui/ComingSoon`) — icon + title + description + "Notify me at launch" button
- Used for: full map comparison, "On this day," Routes, Shared Walks, "Today," Smart Suggestions, the "From friends" feed tab
- **Not** a disabled button and not a hidden feature — the user should feel the product is alive and growing
- Mock data for any visual placeholder — through a typed hook (`useComingSoonMock()` and similar), not scattered in JSX

## 12. Loading and error states

- A shared `Loader` (CSS Module), reused everywhere in `isLoading` state
- Clear error messages (don't show raw server text; `429` → "too many attempts, try again later")

## 13. Frontend security

- Token not in `localStorage`/`sessionStorage`
- Protected routes check auth before rendering content
- Private places/collections must not even flash in someone else's UI — filtering happens on the backend, the frontend isn't the only protection

## 14. PWA basics

- `manifest.json`, 192/512 icons, `apple-touch-icon` — no service worker (this is just home-screen install, not offline mode)
- App name in the manifest — **Pinstory**, not "My Atlas"

## 15. Final review

- Compare every screen 1:1 with `Pinstory - Standalone.html` (spacing, colors, fonts, default/hover/pressed states)
- Check responsiveness at 360/390/430px

---

## Appendix A — Pinstory design tokens

Fully replaces the earlier teal/terracotta "My Atlas" palette. Source — the product archive and `design-reference/Pinstory-source-readable.html`.

### Colors — light theme

```css
:root {
  --color-primary: #4F46E5;        /* Indigo */
  --color-primary-hover: #4338CA;
  --color-primary-subtle: #EEECFD;

  --color-accent: #14B8A6;         /* Teal */
  --color-accent-subtle: #E1F7F3;

  --color-highlight: #F59E0B;      /* Amber */
  --color-highlight-subtle: #FEF3E2;

  --color-canvas: #FBFAF9;
  --color-surface-raised: #FFFFFF;
  --color-surface-sunken: #F3F1EE;
  --color-border: #E8E5E1;

  --color-text-primary: #1C1B1A;
  --color-text-secondary: #6B6660;

  --color-success: #16A34A;
  --color-success-subtle: #4ADE80;
  --color-danger: #E11D48;
  --color-danger-subtle: #FB7185;

  /* Map — muted basemap */
  --color-map-land: #F1EFEA;
  --color-map-water: #DCEDEB;
}
```

### Colors — dark theme

```css
[data-theme="dark"] {
  --color-canvas: #12110F;
  --color-surface-raised: #1B1A17;
  --color-primary: #7C74F0;
  --color-accent: #2DD4BF;
  --color-text-primary: #F5F3EF;
  --color-text-secondary: #B4AFA7;
  /* warm, not blue-black dark mode — derive remaining tokens by the same principle
     as the light theme (warm rgba, never pure black) */
}
```

### Typography

```css
:root {
  --font-ui: 'Plus Jakarta Sans', sans-serif;      /* UI font, 400–800 */
  --font-memory: 'Newsreader', serif;               /* "voice of memory" — italic, quotes/notes only */

  --text-display: 800 34px/40px var(--font-ui);
  --text-title1: 700 28px/34px var(--font-ui);
  --text-title2: 700 22px/28px var(--font-ui);
  --text-title3: 600 18px/24px var(--font-ui);
  --text-body: 500 16px/24px var(--font-ui);
  --text-caption: 600 13px/18px var(--font-ui);
  --text-micro: 700 11px/14px var(--font-ui);       /* uppercase */
  --text-memory-quote: italic 400 20px/28px var(--font-memory);
}
```

`--text-micro` is used with `text-transform: uppercase`. `--font-memory` is **only** for memory quotes/place notes (italic), not regular UI text.

### Icons

**Material Symbols Rounded** — uniform weight 400, 24px optical size. Filled variant (variable font FILL axis) — only for active/selected states (like, star, favorite).

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200&display=swap">
```

**Critical:** the font must load with the full variable range as shown above (`opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200`), not fixed values (`@24,400,0,0`) — otherwise runtime FILL toggling (e.g. filling in rating stars) won't work. This was a real bug found and fixed in the prototype — don't repeat it.

### Spacing, radius, and shadow tokens

```css
:root {
  /* 8pt grid */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px; --space-9: 48px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-card: 20px;

  /* Shadows — soft, warm, NOT black */
  --shadow-sm: 0 1px 2px rgba(28, 20, 10, 0.06);
  --shadow-md: 0 4px 10px rgba(28, 20, 10, 0.08);
  --shadow-lg: 0 8px 24px rgba(28, 20, 10, 0.10);
  --shadow-xl: 0 16px 40px rgba(28, 20, 10, 0.14);
}
```

### Implementation notes (from the prototype — real bugs already found, don't repeat)

- Explicitly set `color` on text elements inside `<button>` (or a global `button { color: inherit; }`) — otherwise button text inherits the link color
- **Don't use nested `<button>` elements** — one interactive element per card; everything else — a `div` with `onClick` + `cursor: pointer`, or separate side/overlay buttons with `stopPropagation` in the handler
- Mobile-first, `clamp()`/%-containers/CSS grid `auto-fit`/`minmax` — no fixed pixel layouts. Touch targets ≥44×44px
- Bottom navigation — exactly 5 tabs: Map / **Хроника** / **+ Add** / People / Profile. Don't add a 6th. Tab 2's UI label is "Хроника" — "Для вас" is only the in-screen heading on that tab, not the tab name

### UI language and tone

Fully Russian in the actual app, modern warm human language, no English calques or corporate speak. Avoid: контент, алгоритм, персонализация, вовлечённость, популярность. Use: Для вас, Сегодня, Открытия, Подборки, Истории, Любимые места, Хочу посетить, Добавить к себе, Пойти вместе, Пригласить, Сравнить карты.

---

## Appendix B — Yandex Maps API setup (implemented — JS API 3.0)

### Getting a key

1. Yandex developer console (yandex.ru/dev), **JavaScript API** section (note: the Geocoder key from `BACKEND_INSTRUCTIONS.md` §17 is a *different product* with its own key and limits)
2. Create a key, specify allowed domains: `localhost` for dev, plus the production domain (`deniseremenkodev.github.io` for the Pages demo)
3. Free tier: 25 000 map loads/day — far above this project's needs

### Environment variables

```
VITE_YANDEX_MAPS_API_KEY=12345678-abcd-1234-abcd-1234567890ab
```

Locally — in `.env`. On GitHub Pages the build reads it from the `VITE_YANDEX_MAPS_API_KEY` **repository variable** (Settings → Secrets and variables → Actions → Variables), wired in `.github/workflows/deploy-pages.yml`. If the variable is unset the build still succeeds — the map falls back to the placeholder projection.

### How it's actually implemented

- **Lazy loader** `shared/lib/yandexMaps.ts` (`loadYmaps3()`): injects the `https://api-maps.yandex.ru/v3/` script only when a key exists, awaits `ymaps3.ready`, allows retry after a network failure. Components never touch the `ymaps3` global directly (service-layer rule from `CLAUDE.md`).
- **`features/places/YandexMap.tsx`**: creates the `YMap`, applies the muted basemap via `YMapDefaultSchemeLayer`'s `customization` (literal hex mirroring `--color-map-water`/`--color-map-land` — the canvas can't read CSS vars), renders pins as `YMapMarker`s with HTML button elements (styles mirror `MapPins.module.css`), and handles tap-to-add via `YMapListener`.
- **`MapPage.tsx`** switches on `hasRealMapsKey` (`shared/lib/mapsConfig.ts`): real map with a key, placeholder projection (`mapProjection.ts` + `MapPins`) without one. Everything else (header, search, friend overlay, add-place sheet) is shared between both modes.
- Types: dev-dependency `@yandex/ymaps3-types` — it declares the `ymaps3` global itself, don't re-declare it.

### Real gotchas (hit during implementation — don't rediscover)

- ymaps3 coordinates are **`[longitude, latitude]`** — the reverse of `PlaceDto`'s field order.
- Use **`onFastClick`**, not `onClick`, on `YMapListener` — otherwise panning/dragging the map opens the add-place sheet. Also skip the event when `object` is set (that's a tap on a pin, handled by the pin element itself).
- Marker elements keep the placeholder's `transform: translate(-50%, -100%) rotate(45deg)` so the teardrop tip lands exactly on the geo point.

### Still pending

Live Yandex **geosuggest** in the add-place form — separate Suggest/Geocoder API, must go through the backend (key and usage constraints already documented in `BACKEND_INSTRUCTIONS.md` §17).

### Legal restriction

Geosuggest/geosearch results can't be bulk-saved into your own DB as a directory — only what the user explicitly saved.
