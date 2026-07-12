# Pinstory — deployment, CI, and repository

Aim: free/cheap options and a minimal automation kit suitable for a pet project and portfolio — not production-grade infrastructure. Deliberately NOT doing at this scale: Docker, multi-environment pipelines, deploying straight from CI, Node version matrices, E2E tests, SBOM/Snyk — see `CLAUDE.md`, "Repository and CI" section.

The technical stack didn't change with the "My Atlas" → Pinstory rebrand — every step below is as valid as before.

## Node — important warning before your first deploy

Vite 7 requires Node ≥20.19/22.12. Railway's free tier sometimes defaults to an older Node — the frontend build will fail with an engine-incompatibility error. If this happens, set `NIXPACKS_NODE_VERSION=24` in the service settings on Railway.

## Backend + database — Railway

1. Create a Railway account, start a new project
2. Add a **PostgreSQL** service — Railway will provide a connection string
3. Add a service from your backend repository (connect via GitHub)
4. Environment variables on Railway (Settings → Variables):
   ```
   DATABASE_URL=<from the PostgreSQL service, auto-filled by Railway once linked>
   JWT_SECRET=<a long random string — generate it, don't make one up by hand>
   FRONTEND_URL=<the deployed frontend's address — for CORS>
   PORT=<usually auto-assigned by Railway>
   NIXPACKS_NODE_VERSION=24
   ```
5. Build/start command — `npm install && npx prisma migrate deploy && npm start` (migrations applied via `migrate deploy`, never `migrate dev`)
6. After the first deploy, verify `prisma migrate deploy` actually ran (check the Railway logs)

## Frontend — Vercel or Netlify

1. Connect the frontend repository
2. Build command: `npm run build`, output directory: `dist`
3. Environment variables (same names as in `.env`, but with production values):
   ```
   VITE_API_URL=<the deployed backend's address on Railway>
   VITE_YANDEX_MAPS_API_KEY=<the same key, but with the production domain allowed>
   ```
4. Once you have the real frontend address, go back to the Yandex Maps console and add this domain to the allowed list (see `FRONTEND_INSTRUCTIONS.md`, Appendix B)
5. Once you have the real frontend address, update `FRONTEND_URL` in the backend's Railway variables (for correct CORS)

## Order of operations for the first deploy

1. Deploy the backend first, get its real address
2. Deploy the frontend, pointing its variables at the already-deployed backend
3. Update the frontend domain in both the backend's CORS settings and the Yandex Maps key's allowed domains
4. Test login/registration on the live site — this is the most common failure point on a first deploy (CORS/URL mismatches, Node version)

## CI — minimal GitHub Actions workflow

Running tests manually (see `TESTING_PLAN.md`) doesn't protect you if you forget to run them. One file, `.github/workflows/ci.yml`, at the repo root:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
permissions: { contents: read }
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      matrix:
        project: [frontend, backend]
    defaults:
      run: { working-directory: ${{ matrix.project }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: ${{ matrix.project }}/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck        # tsc --noEmit
      - run: npx vitest run
      - run: npm audit --audit-level=high || true   # visible, non-blocking for now
```

Runs on every push and pull request to `main`. `vitest run` (not watch mode). `npm audit` is non-blocking for now (`|| true`) — make it blocking once you've triaged the baseline set of warnings.

## Dependabot — dependency scanning

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 5
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 5
```
Gives weekly version-update PRs plus security alerts, no external service needed. Sufficient for a solo project.

## Repository — README and LICENSE

Required before showing the project to anyone:
- **README.md** — following the template in `README_TEMPLATE.md`
- **LICENSE** — MIT
- **`.env.example`** — a sanitized variable template, no real secrets

Don't add `CONTRIBUTING.md`/`CODE_OF_CONDUCT.md`/CODEOWNERS/issue-PR templates — overkill for a solo repo.

## Checklist before showing the project to anyone

- [ ] `.env` with real secrets is not committed to the repository
- [ ] Passwords/tokens don't end up in public Railway logs (verify `pino` is actually redacting secrets)
- [ ] The refresh token is sent as an httpOnly cookie, not in the response body
- [ ] The frontend domain is registered both in the backend's CORS and in the Yandex Maps key's allowed domains
- [ ] Private places really aren't visible via a direct request to someone else's `GET /places/:id` (verify by hand, not just by reading the code)
- [ ] Private places aren't returned via `GET /people/:id/places` either (same principle, now also matters for the basic friend map overlay)
- [ ] CI is green on the latest commit to `main`
- [ ] README and LICENSE exist in the repository
