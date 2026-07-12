#!/usr/bin/env node
// PostToolUse (Edit|Write) — typecheck + lint the project after any TS/TSX edit.
// Node, not bash: the maintainer is on Windows.
// The project runs strict-plus TS (noUncheckedIndexedAccess, verbatimModuleSyntax,
// noImplicitOverride, erasableSyntaxOnly). A compiler catches invented APIs and
// unsafe indexing that a prompt only asks nicely about.
import { execSync } from 'node:child_process'

let input = ''
process.stdin.on('data', (c) => (input += c))
process.stdin.on('end', () => {
  let path = ''
  try { path = JSON.parse(input)?.tool_input?.file_path ?? '' } catch { /* ignore */ }
  if (!/\.tsx?$/.test(path)) process.exit(0)

  try {
    execSync('npx tsc -b --noEmit', { stdio: 'pipe', cwd: process.env.CLAUDE_PROJECT_DIR })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim()
    console.error(`TypeScript errors — fix before continuing:\n${out.slice(0, 4000)}`)
    process.exit(2)
  }

  try {
    execSync(`npx eslint "${path}"`, { stdio: 'pipe', cwd: process.env.CLAUDE_PROJECT_DIR })
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim()
    console.error(`ESLint errors in ${path}:\n${out.slice(0, 2000)}`)
    process.exit(2)
  }
  process.exit(0)
})
