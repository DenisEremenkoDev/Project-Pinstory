# Pinstory — Product Scope Authority

> **What belongs in the product. Not how to build it.**
>
> This is a **living document** and the scope authority for current development decisions
> (`CLAUDE.md`, source precedence, level 2). Implementation order lives in
> `ai-knowledge-base/roadmap.md`. Architecture lives in `ai-knowledge-base/architecture.md`.
> Neither belongs here.
>
> The original version of this file — with its 19-step build order and pre-code technical assumptions — is
> preserved at `ai-knowledge-base/archive/FEATURES_SCOPE.md`. **Do not read it for scope.**

---

## The scope change rule

**Nothing gets built that is not in the "In scope" list below.**

If something "small" comes up mid-task — **record it here first and make a deliberate decision.** Do not
absorb it into the current change. This rule is the reason this project has not sprawled, and it is the one
line worth defending.

Adding an item here is a product decision, not an engineering one.

---

## In scope (v1.0 MVP)

All of the following are **real features** with a working data layer, not placeholders.

| # | Feature | State |
|---|---|---|
| 1 | **Auth** — register, login, logout, protected routes | Built (mock) |
| 2 | **Profile** — settings (display name, avatar, bio, status, default visibility, notifications) + social header (places / followers / following) | Built (mock) |
| 3 | **Collections** — own collections (full CRUD, add/remove places) + read-only view of followed users' public collections. **Lives inside Profile — not a sixth nav tab.** | Built (mock) |
| 4 | **Add place (＋)** — bottom sheet: photo, location, name, **star rating set immediately at creation**, note/story, mood, tags, status, visibility | Built (mock) · photo upload and live geosuggest are **not** implemented |
| 5 | **Chronicle "Мои воспоминания"** — filter chips (Все / ❤️ / 🚩 / Хочу посетить), date-grouped | Built (mock) |
| 6 | **Unified place card** — **one** component across Chronicle, friend profiles, and the feed. A tap in any context opens the same detail screen. | Built |
| 7 | **Place detail** — the emotional centre. Inline-editable rating (owner) and a single recommendation chip (owner-only; read-only for everyone else), mood, note, comments, tags. | Built (mock) |
| 8 | **Comments** — anyone who can see a place can comment, each with their own star rating. Only the author edits or deletes. | Built (mock) |
| 9 | **Feedback** — a single owner-set recommendation per place: «Хочу посетить» / «Рекомендую» / «Не рекомендую», visible to everyone who can see the place. **Only the owner can set it** — revised 2026-07-16 from the original "anyone visible can react" model, by explicit maintainer request (see `ai-knowledge-base/decisions.md` D4). "Запланировано"/"★ Любимое" no longer appear as separate states; the underlying `status` enum is unchanged (still set once at creation) but no longer separately editable in the detail view. | Built (mock) |
| 10 | **Map** — interactive map of own places, click-to-add, in-app search over own places | Built (Yandex Maps 3.0 with a key; projection placeholder without) |
| 11 | **People** — search by name, follow/unfollow, close-friend toggle (only when following), friend profile with their public places | Built (mock) |
| 12 | **Basic friend map overlay** — pick a followed person → their public places render as a second pin layer. Filters: all / common / own only / theirs only / favorites / common want-to-visit. | Built (mock) |
| 13 | **Activity feed** — own + followed users' public places, as cards ("added a place" / "wants to visit" / "added a story"), cursor-paginated | Built (mock) |
| 14 | **"On this day" map memory** — on the Map tab, a dismissible card surfaces own places added on this calendar day in a previous year ("N лет назад вы сохранили «X»"), tap opens that place's detail. Always shown when there's a match — no settings toggle. Computed client-side from the already-loaded own-places list (no new endpoint, no DTO change). Moved here from "Coming Soon" by explicit maintainer decision, 2026-07-16 — see `roadmap.md`. | Built |

### Partial by design

- **People recommendations.** The "similar taste" trust signal is a **seeded string**, not an algorithm. A real
  recommendation engine is out of scope. Do not build one.

### Still missing inside the MVP

Nothing — every item tracked here is built. See `roadmap.md` Phase 5 for the
closing history (backend, photo upload, geosuggest, session bootstrap,
Priority-1 tests, CI, PWA basics all done as of 2026-07-16).

---

## Hard product constraints — not negotiable

| Constraint | Why |
|---|---|
| **Place statuses are exactly three:** `want_to_visit` / `planned` / `favorite` | **"Посетил" was removed by explicit request, three times, permanently.** Do not reintroduce it — not as a status, not as a filter, not as a derived label. A regression test exists for this (`rules/testing.md`, FE-5). |
| **Bottom nav is 5 slots**: Карта · Хроника · ＋ · Люди · Профиль | Navigation depth is a product value. Collections live in Profile. **No sixth tab.** |
| **Star rating is set at creation**, in the add sheet | Not deferred, not optional. `rating` is required by the API. |
| **One unified place card** everywhere | No per-context place markup. Ever. |
| **Heart / flag** is the explicit opinion indicator | The personal-opinion signal, distinct from the star rating. |
| **No engagement mechanics** | No likes-for-likes, no leaderboards, no popularity, no infinite scroll for its own sake. **Trust-based discovery, not a social network.** |
| **Feed cards have exactly two actions**: «Добавить к себе» and «Посмотреть» | A third action («Пойти вместе») appears in the archived documents. It was removed by decision (D24). **Do not add it back.** |
| **Non-MVP features ship as a `ComingSoon` overlay** | Icon + title + description + «Уведомить о запуске». **Never a disabled button. Never a hidden element.** The product should feel alive and growing, not broken. |

---

## Coming Soon — teaser only, do not implement

Each of these is a **full-overlay teaser** today. Each needs its own design pass before it becomes real.
**Do not build any of them without an explicit request, and do not scaffold "just the types".**

- Full **Map Comparison** (beyond the basic overlay — deep filters, intersection stats, shared-visit history)
- **Routes**
- **Shared Walks**
- **"Today"**
- **Smart Suggestions**
- **"От друзей"** as a separate feed tab / recommendation algorithm
- **Notifications**

---

## Vision — the product's future, not its scope

The design reference (`design-reference/DESIGN_INDEX.md`) shows screens that describe where Pinstory is going.
They are **not in scope** and are marked `Vision` there:

- **Pinstory Plus** — a paid tier ($4.99/mo): unlimited photos per memory, shared maps with partner and family,
  a year-in-review and a printable memory book
- **Import / Export** — import geotagged photos; export a memory book as PDF
- **Memory as an entity distinct from Place** — the design has two detail overlays; the code has one `Place`
  with a `note`
- **Onboarding / Splash**
- **Toast notifications** — destructive confirms currently use `window.confirm`

**Do not build these. Do not prepare for them. Do not foreclose them.**
Contract changes must stay additive-compatible with `Place → Photo[]` and a later Place/Memory split — see
`.claude/rules/api-contract.md` and `ai-knowledge-base/decisions/ADR-03`.

---

## Deliberate non-goals (engineering)

Not product scope, but recorded here because they are repeatedly proposed and repeatedly declined (D28):

Docker as a shipped artifact · multi-environment pipelines · deploy-from-CI · Node version matrices ·
E2E tests · SBOM / Snyk · `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `CODEOWNERS` / issue templates.

This is a solo portfolio project. **The absence of ceremony is a decision, not an oversight.** Do not
"professionalise" it.
