# ADR-02 — Coordinate storage

**Status:** Decided — **plain `Float` `lat` / `lng`. No PostGIS.** **Blocks:** the Prisma schema (Phase 1).

## Context
Pinstory is a map product, so PostGIS looks like the obvious professional choice. The endpoint inventory
says otherwise:

```
GET /places              → the caller's own places (all of them)
GET /people/:id/places   → that user's public places (all of them)
GET /feed?cursor&limit   → own + followed public, cursor-paginated
```

**There is no bbox, no radius, no `near`, no spatial index, and nothing geographic crosses the wire.**
The map receives a plain array and projects it. Cross-user matching (`isSamePlace`) and overlay filtering
(`mapOverlayFilter`) are pure client-side computation.

## Decision
Store `lat` and `lng` as plain `Float` columns, exactly as `mockDb.ts` already does.

## Rationale
- **There is no spatial query to accelerate.** PostGIS would be infrastructure bought for a query that
  does not exist.
- **Prisma has no native geometry type.** A PostGIS column becomes `Unsupported("geography(...)")`, which
  is typed `any` in the client and strips `create`/`update` from the model — every write would go through
  raw SQL. That is a real cost to the type safety this project is built on.
- **`mockDb.ts` is the schema** (D3). It already uses plain numbers.

## Reversibility
Cheap, and additive. If a genuine proximity feature is ever scoped, the migration adds a column derived
from the floats already stored — no data migration, no backfill:

```sql
CREATE EXTENSION postgis;
ALTER TABLE "Place" ADD COLUMN geog geography(Point,4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;
CREATE INDEX place_geog_idx ON "Place" USING GIST (geog);
```
Prisma never needs to know the column exists; only raw geo queries would use it.
(Verify the cast is `IMMUTABLE` on the PostGIS version in use; the fallback is a trigger-maintained column.)

## When to revisit
Only if a real proximity feature ("places near me", nearest-N) is scoped. It is not in the MVP and it is
not even in the design.
