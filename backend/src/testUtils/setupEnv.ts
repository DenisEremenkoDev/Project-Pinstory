import { config } from 'dotenv'

// Integration tests need their own DATABASE_URL (a dedicated Neon branch, never
// the dev database) plus a JWT_SECRET — kept in .env.test, gitignored like .env.
// See TEST_ENV_TEMPLATE.md for the required keys.
config({ path: '.env.test', quiet: true })
process.env.NODE_ENV = 'test'
// pino-http logs every request by default — deafening across 9 integration
// test files. Silence it here rather than in app.ts so a real `npm run dev`
// run still logs normally.
process.env.LOG_LEVEL = 'silent'
