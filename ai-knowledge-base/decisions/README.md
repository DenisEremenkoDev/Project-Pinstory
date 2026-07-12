# Open Decisions (ADRs)

`../decisions.md` records what **was** decided, with the file that evidences it.
This folder records what is **not yet** decided — and what each open question blocks.

An open decision that lives only in a chat session is a decision that will be re-litigated.

| ADR | Question | Blocks | Status |
|---|---|---|---|
| [ADR-01](ADR-01-backend-hosting.md) | Where does the backend run? | Phase 1 deployment | **Deliberately open** |
| [ADR-02](ADR-02-geo-storage.md) | Plain `lat`/`lng` or PostGIS? | Phase 1 schema | **Decided: plain floats** |
| [ADR-03](ADR-03-memory-and-photos.md) | Is `Memory` a distinct entity? Multiple photos? | Phase 1 schema | **Decided: Vision, not MVP** |
| [ADR-04](ADR-04-session-persistence.md) | How is the refresh token transported? | Phase 2 | **Open** |
| [ADR-05](ADR-05-follower-counts.md) | Where do follower counts come from? | Phase 1 | **Decided: derive in SQL** |
| [ADR-06](ADR-06-place-identity.md) | Is cross-user place identity permanently approximate? | Only if shared maps are scoped | **Open, deferred** |
| [ADR-07](ADR-07-public-reads.md) | Are public resources readable without a token? | The auth middleware (Phase 1) | **Decided: yes — with three binding consequences** |

---

**Conflicts between the pre-code planning documents and the code** are registered in
[`../doc-conflicts.md`](../doc-conflicts.md), not here. That file is a flag list, not a decision list —
the project rule is *flag it, don't silently pick a side*.
