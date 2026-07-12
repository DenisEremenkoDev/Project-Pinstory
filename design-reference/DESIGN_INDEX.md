# Pinstory — Design Index

The canonical visual reference is `Pinstory-source-readable.html` (1,373 lines), extracted from the
compiled Claude Design bundle published at <https://github.com/DenisEremenkoDev/Pinstory>.
The 7.6 MB bundle is **not** committed — ~5.6 MB of it is base64 font data that no agent can read.

## How to use this file

**Read the screen's line range before building or reviewing it. Never read the whole file.**
For a full fidelity check, dispatch `@design-auditor` — it reads the range in an isolated context
and returns only a diff list.

## Scope

| Marking | Meaning |
|---|---|
| **MVP** | In scope. Build it. |
| **Vision** | The product's long-term direction. **Do not implement, do not scaffold, do not add types.** Reference only, for understanding feature boundaries. |

## Index

| Screen | Lines | Scope | Implemented as |
|---|---|---|---|
| SPLASH | 314–322 | **Vision** | — |
| ONBOARDING | 323–335 | **Vision** | — |
| MAIN APP SHELL | 336–338 | MVP | `AppShell.tsx` |
| — MAP TAB | 339–403 | MVP | `MapPage.tsx` + `MapPins` / `YandexMap` |
| — MAP FRIEND PICKER SHEET | 404–422 | MVP | `MapFriendPicker.tsx` |
| — FEED TAB | 423–492 | MVP | `FeedPage.tsx` + `FeedItemCard` + `PlacesChronicle` |
| — PEOPLE TAB | 493–534 | MVP | `PeopleListPage.tsx` |
| — PROFILE TAB | 535–561 | MVP | `ProfilePage.tsx` |
| — BOTTOM NAV | 562–571 | MVP | `BottomNav.tsx` — **5 slots, never a sixth** |
| PLACE DETAIL OVERLAY | 572–647 | MVP | `PlaceDetailView.tsx` |
| MEMORY DETAIL OVERLAY | 648–676 | **Vision** | — (no `Memory` entity exists; `Place` carries `note`) |
| COLLECTION DETAIL OVERLAY | 677–692 | MVP | `CollectionsPage.tsx` (manage-places sheet) |
| COLLECTIONS OVERLAY | 693–709 | MVP | `CollectionsPage.tsx` |
| FRIEND PROFILE OVERLAY | 710–751 | MVP | `PersonProfilePage.tsx` |
| COMING SOON OVERLAY | 752–762 | MVP | `ComingSoon.tsx` |
| SETTINGS OVERLAY | 763–790 | MVP | `ProfileSettingsForm.tsx` |
| **SUBSCRIPTION (Pinstory Plus)** | **791–807** | **Vision** | — **monetization; in no scope document** |
| **IMPORT / EXPORT** | **808–823** | **Vision** | — |
| NOTIFICATIONS OVERLAY | 824–841 | **Vision** | `ComingSoon` teaser only |
| SEARCH OVERLAY | 842–858 | MVP | `MapSearchSheet.tsx` |
| ADD MEMORY SHEET | 859–884 | MVP | `AddPlaceForm.tsx` in a `BottomSheet` |
| TOAST | 885–895 | **Vision** | — (no toast system; destructive confirms use `window.confirm`) |

## What the Vision screens tell us (and must not make us build)

The design describes a larger product than the MVP:

- **Pinstory Plus** — $4.99/mo, 7-day trial. Promises unlimited photos per memory, shared maps with
  partner/family, a year-in-review and a printable memory book.
- **Memory as an entity distinct from Place** — the design has two separate detail overlays and calls
  the sheet «Новое воспоминание». The code has one `Place` with a `note` field.
- **Multiple photos per memory** — the code has a single nullable `photoUrl`.
- **Shared maps** — would require a canonical cross-user place entity, which `decisions.md` D14
  explicitly says does not exist by design (`isSamePlace` is an approximation).

**Do not prepare for these. Do not foreclose them.** See `ai-knowledge-base/decisions/ADR-03` and the
"Long-term evolution" section of `.claude/rules/api-contract.md`.

## Known inconsistency inside the mockup

The bottom-nav "Люди" tab calls a handler named `goCollections` (line 566). Cosmetic; the label and
destination are correct. Noted so it isn't mistaken for a routing intent.
