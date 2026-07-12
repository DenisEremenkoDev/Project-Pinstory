#!/usr/bin/env node
// PreToolUse (Edit|Write) — the API contract is not editable by accident.
//
// apiTypes.ts, mockDb.ts and mockBaseQuery.ts ARE the specification for a backend
// that has not been written. A silent edit here breaks nothing today and
// desynchronizes the backend months from now. It is the highest-cost,
// lowest-visibility failure available in this project — so it gets a hard gate,
// not a prompt.
//
// To proceed deliberately: `export PINSTORY_CONTRACT_CHANGE=1` for the session,
// or edit CONTRACT_FILES below if the contract's shape genuinely moved.
const CONTRACT_FILES = [
  'src/shared/lib/apiTypes.ts',
  'src/shared/lib/mockDb.ts',
  'src/shared/lib/mockBaseQuery.ts',
]

let input = ''
process.stdin.on('data', (c) => (input += c))
process.stdin.on('end', () => {
  let path = ''
  try { path = JSON.parse(input)?.tool_input?.file_path ?? '' } catch { process.exit(0) }

  const norm = path.replace(/\\/g, '/')
  const hit = CONTRACT_FILES.find((f) => norm.endsWith(f))
  if (!hit) process.exit(0)
  if (process.env.PINSTORY_CONTRACT_CHANGE === '1') process.exit(0)

  console.error(
    `BLOCKED: ${hit} is part of the API contract.\n\n` +
      `This file is the specification for the Express/Prisma backend that has not been written yet.\n` +
      `Changing it is an API change, not a refactor.\n\n` +
      `Before proceeding:\n` +
      `  1. State plainly what contract change this is and why.\n` +
      `  2. Confirm it is additive-compatible with the long-term model\n` +
      `     (Memory as a distinct entity, Place -> Photo[]). See .claude/rules/api-contract.md.\n` +
      `  3. Get the maintainer's approval.\n` +
      `  4. Then set PINSTORY_CONTRACT_CHANGE=1 for this session.\n`,
  )
  process.exit(2)
})
