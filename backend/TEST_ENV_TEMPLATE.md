# Test environment setup

Integration tests (`*.integration.test.ts`) run real HTTP requests against `app.ts`
with a real Prisma-backed database. They need their own env file, gitignored like
`.env`: **`backend/.env.test`**.

Create it with these keys (a dedicated Neon branch — never the dev/prod `DATABASE_URL`,
tests truncate every table between test files):

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="test-only-secret-do-not-use-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
FRONTEND_URL="http://localhost:5173"
```

Then run migrations against it once:

```
npx dotenv -e .env.test -- npx prisma migrate deploy
```

`vitest.config.ts` loads `.env.test` automatically (`src/testUtils/setupEnv.ts`)
and forces `NODE_ENV=test`, which also disables rate limiting for the run
(`middleware/rateLimits.ts` — integration tests fire far more requests per IP
than the production limits allow).
