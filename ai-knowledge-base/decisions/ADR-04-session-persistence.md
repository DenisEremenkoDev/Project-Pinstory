# ADR-04 — Refresh token transport & session persistence

**Status:** Open. **Blocks:** Phase 2.

## Context
The access token lives in Redux memory only (`authSlice`) — never `localStorage`. That is deliberate and
XSS-resistant. **The other half is unimplemented:** there is no refresh flow, no cookie, and no bootstrap
on load. Consequence: **a page reload logs the user out.** The mock `logout` is a no-op (D8).

The documented intent is a refresh token in an **httpOnly cookie**.

## The complication
The product is expected to be packaged for mobile later (PWA + a wrapper such as Capacitor). **httpOnly
cookies do not survive that transition cleanly** — a native WebView serves the app from a non-HTTP origin,
and cross-origin cookie handling to an API on a different domain is fragile at best.

This is the one current decision that could quietly foreclose the mobile path. It is unimplemented, which
makes now exactly the right moment to notice it.

## Options
| | Web | Native wrapper | Notes |
|---|---|---|---|
| **A** — httpOnly cookie | Best (XSS-resistant) | Fragile | The documented intent |
| **B** — refresh token in secure native storage, `Authorization` header | Weaker on web (needs a storage choice) | Works | |
| **C** — cookie on web, secure storage in native, behind one interface | Best of both | Works | The token-issuing layer must be swappable |

## Direction (not yet a decision)
Whichever is chosen, **the backend must not hardcode the cookie assumption into route handlers.** Keep the
token-issuing and token-reading layer behind a seam. This costs nothing today and preserves option C.

## Also unresolved here
Session bootstrap on app start: call refresh → set the access token → render. Without it, reload-logout
persists regardless of the transport chosen.

## Prior context
`BACKEND_INSTRUCTIONS.md` §4 specifies the cookie in detail: `httpOnly`, `Secure`, `SameSite=Strict|Lax`,
`Path` scoped to the refresh endpoint, with `cors({ credentials: true })` and an explicit origin.
`DEPLOYMENT.md`'s pre-launch checklist makes it a gate: *"Refresh-токен отправляется как httpOnly cookie,
не в теле ответа."*

That is a **correct and well-specified web design.** The only thing that changed is that the product is now
expected to be packaged for mobile later — which the documents predate. The intent survives; the transport
is what is now open.

## When to close
Phase 2, before implementing the refresh flow. **Do not implement the cookie flow before closing it** —
the seam is cheap to build now and expensive to retrofit.
