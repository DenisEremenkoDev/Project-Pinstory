import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/testUtils/setupEnv.ts'],
    // Integration tests share one real database and truncate it between tests
    // (testUtils/db.ts resetDb) — running test files in parallel would race on
    // that truncate. Unit tests (mocked Prisma) pay a small, acceptable cost.
    fileParallelism: false,
  },
})
