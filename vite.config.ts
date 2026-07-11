/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /Project-Pinstory/, not the domain root.
  // Other deploy targets (Vercel/Netlify) set GITHUB_PAGES=false and keep the root base.
  base: process.env.GITHUB_PAGES ? '/Project-Pinstory/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
})
