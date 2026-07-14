/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /Project-Pinstory/, not the domain root.
  // Other deploy targets (Vercel/Netlify) set GITHUB_PAGES=false and keep the root base.
  base: process.env.GITHUB_PAGES ? '/Project-Pinstory/' : '/',
  // Force IPv4 loopback: on this machine "localhost" can resolve to ::1 only
  // for Vite's default bind, while Chrome/curl resolve it to 127.0.0.1 —
  // causing ERR_CONNECTION_REFUSED even though the dev server is "ready".
  server: {
    host: '127.0.0.1',
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    // Without this, Vitest's default glob also picks up backend/**/*.test.ts —
    // those run fine under mocked Prisma, but a real jose SignJWT call resolves
    // to jose's stricter webapi build under jsdom and throws.
    include: ['src/**/*.{test,spec}.ts?(x)'],
  },
})
