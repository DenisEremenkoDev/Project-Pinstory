# ADR-01 — Backend hosting

**Status:** Deliberately open. **Blocks:** the first backend deploy. Does **not** block writing the backend.

## Context
The deploy target for the frontend is **GitHub Pages** (`deploy-pages.yml`), which serves static files only.
Express + PostgreSQL cannot run there. No document in the repository names a host for the backend —
`DEPLOYMENT.md`, `roadmap.md` and `decisions.md` are all silent on it.

## Decision
**Leave it open.** The AI Workspace and the backend code remain **infrastructure-agnostic**.

## Consequences — binding on backend code
1. **No vendor SDKs.** No platform-specific build steps.
2. **All configuration through environment variables.** Nothing reads a platform's proprietary config.
3. **Photo storage behind an interface** — `multer` to local disk now, object storage later. If a storage
   choice leaks into route handlers, picking a host later becomes a refactor instead of a config change.
4. **Nothing may assume a filesystem that persists across deploys.**

Violating any of the four turns a deferred decision into an expensive one. That is the entire cost of
leaving this open, and it is a cost worth paying for the flexibility.

## Prior art — do not lose it
`DEPLOYMENT.md` (written before this decision was deferred) contains a **complete, concrete plan** for
**Railway (backend + PostgreSQL) + Vercel/Netlify (frontend)**. It is not a decision, but it is real work
and it is the leading candidate. Its details remain correct *for that host*:

- **Vite 7 requires Node ≥ 20.19 / 22.12.** Railway's free tier sometimes ships older Node and the build
  fails on an engine mismatch → set `NIXPACKS_NODE_VERSION=24`.
- Start command: `npm install && npx prisma migrate deploy && npm start`. **`migrate deploy` only — never
  `migrate dev` on a deploy.**
- Env: `DATABASE_URL`, `JWT_SECRET` (generated, not invented), `FRONTEND_URL` (for CORS), `PORT`.
- **Deploy order matters:** backend first → get its URL → deploy the frontend pointing at it → then update
  `FRONTEND_URL` on the backend **and** add the frontend domain to the Yandex Maps key's allowed domains.
  Auth on the live site is the most common first-deploy failure (CORS/URL mismatch, Node version).
- Local disk on Railway is **ephemeral** — which is why photo storage must sit behind an interface
  (consequence 3 above). That is a property of most hosts, not a Railway quirk.

Note that the **frontend already deploys** — to GitHub Pages (`deploy-pages.yml`), which `DEPLOYMENT.md`
predates and never mentions. Only the backend's home is open.

## When to close
Before the first backend deploy. Not before.
