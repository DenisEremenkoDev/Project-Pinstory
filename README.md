# Pinstory

Every place tells a story. A platform that helps you discover the world through the
experience of people you trust — save places, turn them into memories, follow friends,
and overlay their map on your own.

**Status: early work in progress.** This is a learning portfolio project being built
step by step; most features below are not implemented yet.

## Stack

React 19, TypeScript (strict), Redux Toolkit + RTK Query, MUI 6 (form fields only), CSS
Modules with a custom design system, Vite, React Router, React Hook Form + Zod — frontend.
Node.js, Express, Prisma, PostgreSQL, JWT auth — backend (not started yet).
Yandex Maps JS API — geosuggest and map display (not started yet).

## What's actually working vs. planned

| Section | Status |
|---|---|
| Project foundation (Vite, TS strict, design tokens, light/dark theme) | ✅ Real |
| Authentication | ⏳ Not started |
| Profile | ⏳ Not started |
| Places catalog / Chronicle "My Memories" | ⏳ Not started |
| Map of own places | ⏳ Not started |
| People — search, follow, close friends | ⏳ Not started |
| Basic friend map overlay | ⏳ Not started |
| Collections | ⏳ Not started |
| "For You" activity feed | ⏳ Not started |
| Full "Map Comparison", Routes, Shared Walks, "Today", Smart Suggestions | 🔜 Coming soon (teaser only, by design — see `FEATURES_SCOPE.md`) |

## Running locally

### Requirements
- Node.js 24.x

### Frontend
```bash
npm install
cp .env.example .env    # fill in your own values, including the Yandex Maps key
npm run dev
```

Backend setup instructions will be added once the backend is started.

## Environment variables

See `.env.example` — comments there explain what each variable means.

## Legal note on Yandex Maps

This project will not cache Yandex Maps organization search results in its own database
as a separate directory — only points the user explicitly picked and confirmed into their
catalog will be saved. See the Yandex Maps API terms of use for details.

## License

MIT — see `LICENSE`
