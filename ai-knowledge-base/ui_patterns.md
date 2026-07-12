# Pinstory — Reusable UI Patterns

> Catalog of the reusable components and interaction patterns, with props and
> "when to use." Visual language (tokens/colors/type) is in
> [design_system.md](design_system.md). Build new screens by composing these, not
> by inventing parallel components — the project rule is *evolve existing screens,
> reuse the same components.*

All components live in `src/shared/ui/` unless a feature path is given. Every
component pairs with a co-located `*.module.css`.

---

## 1. UnifiedPlaceCard (`shared/ui/UnifiedPlaceCard.tsx`)

**The single place-representation used everywhere** — Chronicle, friend profiles,
feed cards. Do not duplicate place markup per context (explicit project rule:
"Unified Place Card Model").

```ts
interface UnifiedPlaceCardProps {
  place: PlaceDto
  onOpen: (id: string) => void          // opens PlaceDetailView
  onOpenOnMap?: (place: PlaceDto) => void // optional geo button (top-right)
}
```
- Renders: photo/gradient, optional mood chip, optional geo button, feedback badge
  (heart=like / flag=dislike), title.
- Whole card is a keyboard-operable button (`role="button"`, Enter/Space → `onOpen`).
- Tapping in **any** context opens the same `PlaceDetailView`.

Used by: `PlacesChronicle`, `FeedItemCard`, `PersonProfilePage`.

---

## 2. PlaceDetailView (`features/places/PlaceDetailView.tsx`)

Full-screen overlay (not a sheet) — the "emotional center" of the app. Props:
`{ placeId: string; onClose: () => void }`. Fetches via `useGetPlaceQuery`.

Layout top→bottom: photo header with back / share / delete(owner) buttons →
meta line (location icon + date) → title → **inline-editable status chips** (owner
only, tap to `PATCH`) → **inline-editable star row** (owner taps a star to set
rating; non-owner sees read-only stars) → note in italic Newsreader quotes → mood
chip + cyclable feedback chip (none→like→dislike→none) → `PlaceComments` → tags →
"Маршруты с этим местом — скоро" `ComingSoon` teaser.

Owner-gating is driven by `place.isOwner`. Delete uses `window.confirm`.

---

## 3. Cards & lists — general pattern

- Card = `--color-surface-raised`, `--radius-card`, `--shadow-sm` (→`md` on hover),
  `overflow: hidden`.
- Lists are simple flex-column `gap` stacks; grids use `auto-fit`/`minmax` where
  wrapping is wanted.
- Chronicle inserts **date-group headers** (`formatLongRuDate`) before the first
  card of each new day.
- `FeedItemCard` (`features/feed/`) wraps a `UnifiedPlaceCard` with an author line
  (avatar + "X добавил(а)…" + date) and an actions row ("Добавить к себе" /
  "Посмотреть"); it manages a local `isAdded` flag and inline error text.

---

## 4. Forms (MUI + RHF + Zod)

**Canonical form recipe** (see `AddPlaceForm`, `CommentForm`, `CollectionForm`,
`ProfileSettingsForm`, `LoginPage`, `RegisterPage`):

```ts
const { register, handleSubmit, control, setError, formState:{errors} } =
  useForm({ resolver: zodResolver(schema), defaultValues })

async function onSubmit(values) {
  try { await someMutation(body).unwrap(); onSaved() }
  catch (e) { setError('root', { message: getApiErrorMessage(e, 'fallback') }) }
}
```
- Layout with MUI `<Stack component="form" gap>`.
- Plain inputs → `{...register('field')}` on MUI `TextField` (+ `error`/`helperText`).
- Non-text inputs (star rating, mood, visibility switch, select) → wrap in
  `<Controller>`.
- Submit button shows a busy label while `isLoading`.
- Boolean/enum toggles use MUI `Switch` mapped to `'private'|'public'` etc.
- Root-level submission errors render as `<Typography color="error">`.

Schemas live in `*Schema.ts` next to the feature and export both the schema and
`z.infer` type.

---

## 5. StarRatingInput (`shared/ui/StarRatingInput.tsx`)

`{ value: number; onChange: (n:number)=>void }`. Five `star` icon buttons; filled
up to `value` via `material-symbols-rounded--filled`. Bridged into RHF with
`Controller`. (Note: `PlaceDetailView` and `PlaceComments` render their own inline
star rows rather than reusing this component, but the visual is identical — filled
stars for the value.)

## 6. MoodPicker (`shared/ui/MoodPicker.tsx`)

`{ value: Mood|null; onChange: (m:Mood|null)=>void }`. Emoji buttons for the four
moods (`MOOD_EMOJI`); clicking the selected mood again clears it. Bridged with
`Controller` in `AddPlaceForm`.

---

## 7. Navigation

### BottomNav (`shared/ui/BottomNav.tsx`)
Fixed bottom bar, **5 slots**: `map` (Карта), `timeline` (Хроника), center raised
**＋** FAB (`onAddPlace` callback — opens sheet, not a route), `group` (Люди),
`person` (Профиль). Uses `NavLink` with active styling; active tab uses filled
icon + primary color. **Do not add a 6th tab** — Collections live inside Profile.

### AppShell (`shared/ui/AppShell.tsx`)
Protected layout: `<main><Outlet/></main>` + `BottomNav` + the global add-place
`BottomSheet`. Owns the add-place open state.

### In-page navigation
Back buttons (`arrow_back` + `useNavigate(-1)`), row chevrons (`chevron_right`),
`Link`/`useNavigate` for cross-screen jumps. Navigation depth is kept shallow by
design.

---

## 8. BottomSheet (`shared/ui/BottomSheet.tsx`)

`{ open, onClose, children }`. Backdrop (`rgba(28,20,10,.4)`, click-to-close) +
bottom-anchored sheet (max-width 480, max-height 85vh, scroll, grab-handle, safe-area
padding). Inner click is stopped from bubbling to the backdrop. Used for: add-place,
profile settings, collection create/edit, manage-collection-places, add-place from
map click. **Use `BottomSheet` for editable forms / secondary flows.**

Some feature-specific sheets/overlays (`MapSearchSheet`, `MapFriendPicker`) are
hand-rolled full/partial overlays rather than `BottomSheet` — follow their local
pattern when extending the map, but prefer `BottomSheet` for new generic sheets.

---

## 9. ComingSoon (`shared/ui/ComingSoon.tsx`)

`{ icon, title, description, onClose }`. Full overlay with icon + title +
description + MUI outlined "Уведомить о запуске" button. **This is the required
treatment for every not-in-MVP feature.** Currently used for: Routes (profile +
place detail), full Map Comparison, notifications. Never ship a not-in-MVP feature
as a disabled button or a hidden element — always this teaser.

---

## 10. State components

| Component | Props | Use |
|---|---|---|
| `Loader` | — | centered spinner while `isLoading` |
| `EmptyState` | `{ icon, title, description? }` | friendly empty result |
| `ErrorState` | `{ title?, description?, onRetry? }` | fetch failure + retry |

**Standard screen state ladder** (apply in this order):
```ts
if (isLoading) return <Loader/>
if (isError || !data) return <ErrorState onRetry={refetch}/>
if (data.length === 0) return <EmptyState .../>
return <content/>
```
Feed refinement: on **load-more** failure keep already-loaded items and show an
inline retry (only a *first* load failure gets the full-page `ErrorState`). This is
explicitly covered by `FeedPage.test.tsx`.

---

## 11. Avatar (`shared/ui/Avatar.tsx`)

`{ id, name, avatarUrl?, size=48 }`. Image if `avatarUrl`, else a
`gradientForId(id)` circle with the first initial. Sizes used: 24 (comments/legend),
26 (overlay), 32 (feed author), 40 (rows), 48 (default), 80 (profile headers).

---

## 12. Profile layouts

- **Own profile** (`ProfilePage`): settings gear (top-right, opens
  `ProfileSettingsForm` sheet) → social header (Avatar 80 + name + status + bio +
  places/followers/following stats) → Collections preview section (up to 3, "Все"
  link to `/profile/collections`) → Routes ComingSoon teaser.
- **Friend profile** (`PersonProfilePage`): back button → same social header (with
  trust signal) → Follow/Unfollow + Close-friend toggle (only when following) →
  their public places as `UnifiedPlaceCard`s (own state ladder).
- **Collections page** (`CollectionsPage`): "Мои коллекции" (create/edit/delete +
  tap to manage places) + "Коллекции друзей" (read-only, tap → owner profile).

Reuse the social-header composition and the stats row for any new profile-like
surface.

---

## 13. Filters & search UI

- **Filter chips** — pill row; state held in the page (`useState`); active chip =
  primary fill. Pattern in `PlacesChronicle` (All / ❤️ / 🚩 / Want to visit) and
  `MapFriendOverlay` (overlay filters).
- **People search** — MUI `TextField` bound to `query`; the query itself is the RTK
  Query arg (`useSearchPeopleQuery(query)`), so filtering is server-side. Empty
  query shows Followed + "Вам может понравиться" sections; non-empty shows a flat
  result list.
- **Map search** (`MapSearchSheet`) — full overlay with a back button + autofocus
  input; filters own places client-side by name; tap a result → open detail.

---

## 14. Map overlays & floating controls (map feature)

- **Floating header** (`MapPage`): "Ваша карта" + place count, a layers button
  (`layers`, toggles active state when an overlay friend is set), a notifications
  button (ComingSoon), and a full-width search button opening `MapSearchSheet`.
- **MapFriendPicker** — sheet listing followed people; select → set overlay friend.
- **MapFriendOverlay** — legend (friend avatar + shared/new counts + close) + filter
  chip row + a "🚧 Полное сравнение" chip opening the full-comparison ComingSoon.
  It renders *controls only*; pins come from the `layers` array (`MapPins`/`YandexMap`).
- **Pins** — teardrop buttons; own vs friend styling per
  `MapPins.module.css` / `YandexMap.module.css`. See [architecture.md](architecture.md) §5.

---

## 15. Comments (`features/places/PlaceComments.tsx` + `CommentForm.tsx`)

`PlaceComments` lists comments (Avatar + name + star row + text) with edit/delete
icons on the author's own comments (inline-swaps the row for `CommentForm` when
editing) and an always-present `CommentForm` at the bottom to add a new one.
`CommentForm` follows the canonical form recipe; on create it resets, on edit it
patches. Anyone who can see the place can comment; only the author edits/deletes.

---

## 16. Reusable layout takeaways for new screens

1. Wrap protected content so it lives under `AppShell` (gets nav + add-place sheet).
2. Fetch with an RTK Query hook; render the standard state ladder.
3. Represent places with `UnifiedPlaceCard`; open detail with `PlaceDetailView`.
4. Put editable forms in a `BottomSheet` using the canonical RHF+Zod+MUI recipe.
5. Gate any not-in-MVP surface behind `ComingSoon`.
6. Style with CSS Modules + tokens; icons via Material Symbols Rounded; MUI only for
   form controls.
7. Keep copy Russian and warm; keep navigation shallow.
