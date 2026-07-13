# Pinstory

Every place tells a story. A platform that helps you discover the world through the
experience of people you trust — save places, turn them into memories, follow friends,
and overlay their map on your own.

**Status: MVP, actively developed.** This is a learning portfolio project built step by
step. The frontend is feature-complete against an in-memory mock API; the real backend
(Express + Prisma + PostgreSQL) exists, implements every endpoint, and has been verified
live against a real database and against the running frontend. The mock remains the
default so the app always runs with zero setup — the real backend is opt-in via an env
flag.

## Stack

React 19, TypeScript (strict), Redux Toolkit + RTK Query, MUI 6 (form fields only), CSS
Modules with a custom design system, Vite, React Router, React Hook Form + Zod — frontend.
Node.js, Express 5, Prisma 6, PostgreSQL 17, JWT auth (`jose`), bcrypt — backend.
Yandex Maps JS API 3.0 — map display (live geosuggest still pending).

## What's actually working vs. planned

| Section | Status |
|---|---|
| Project foundation (Vite, TS strict, design tokens, light/dark theme) | ✅ Real |
| Authentication (register/login/refresh/logout, JWT) | ✅ Real |
| Profile | ✅ Real |
| Places catalog / Chronicle "My Memories" | ✅ Real |
| Photo upload | ✅ Real |
| Map of own places (Yandex Maps JS API 3.0, or placeholder without a key) | ✅ Real |
| People — search, follow, close friends | ✅ Real |
| Basic friend map overlay | ✅ Real |
| Collections | ✅ Real |
| Activity feed (own + followed places) | ✅ Real |
| Real backend (Express + Prisma + PostgreSQL, every endpoint above) | ✅ Real — opt-in via `VITE_USE_MOCKS=false` |
| Live Yandex geosuggest through the backend | ⏳ Not started |
| Reload session persistence (refresh-token bootstrap on load) | ⏳ Not started |
| Automated backend/frontend tests | ⏳ Not started |
| Full "Map Comparison", Routes, Shared Walks, "Today", Smart Suggestions | 🔜 Coming soon (teaser only, by design — see `FEATURES_SCOPE.md`) |

## Running locally

### Requirements
- Node.js 24.x
- A PostgreSQL 17 database (only needed if you want the real backend instead of mocks — a free instance from [Neon](https://neon.tech) or [Supabase](https://supabase.com) works fine)

### Frontend only (mocks — zero setup)
```bash
npm install
cp .env.example .env    # fill in your own values, including the Yandex Maps key
npm run dev
```
This runs the full app against the in-memory mock API — no backend or database needed.

### With the real backend
```bash
cd backend
npm install
cp .env.example .env    # fill in DATABASE_URL and a generated JWT_SECRET
npm run db:migrate
npm run dev             # starts the API on the port set in backend/.env
```
Then, in the frontend's `.env`, set:
```
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:<backend-port>
```
and run `npm run dev` in the project root as usual. `backend/.env`'s `FRONTEND_URL`
must match the frontend's actual origin for CORS to allow requests.

## Environment variables

See `.env.example` (frontend) and `backend/.env.example` (backend) — comments there
explain what each variable means.

## Legal note on Yandex Maps

This project will not cache Yandex Maps organization search results in its own database
as a separate directory — only points the user explicitly picked and confirmed into their
catalog will be saved. See the Yandex Maps API terms of use for details.

## License

MIT — see `LICENSE`
