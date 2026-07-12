---
description: Compact the session into a handoff note and start clean.
---

# /handoff

Use at roughly 70% context. Quality degrades well before the window is full.
(For simply resuming where you left off, `claude --continue` is cheaper than this.)

Write a note — **no code, no file contents** — with:

1. **Task** — one line.
2. **Decisions made this session** — especially any **API contract change**, and why.
3. **Files touched** — paths only.
4. **State** — what works, what is half-done, what is broken.
5. **Next step** — the single next action, concretely.
6. **Open questions** — anything blocked on the maintainer.

If an ADR was decided, write it to `ai-knowledge-base/decisions/` before compacting. A decision that lives only in a context window is a decision that will be re-litigated.
