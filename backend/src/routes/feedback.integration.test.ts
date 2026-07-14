import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser, createTestPlace, authHeader } from '../testUtils/db'

describe('feedback routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#14
  it('POST /places/:id/feedback on an invisible private place returns 403', async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'private' })

    const res = await request(app)
      .post(`/places/${place.id}/feedback`)
      .set(...authHeader(stranger))
      .send({ sentiment: 'like' })
      .expect(403)
    expect(res.body.error.code).toBe('PLACE_FORBIDDEN')
  })

  // testing.md Priority 2: feedback is unique per (user, place) — a repeat call overwrites, never duplicates.
  it('repeat feedback calls overwrite sentiment instead of duplicating', async () => {
    const owner = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'public' })

    await request(app)
      .post(`/places/${place.id}/feedback`)
      .set(...authHeader(owner))
      .send({ sentiment: 'like' })
      .expect(200)
    const second = await request(app)
      .post(`/places/${place.id}/feedback`)
      .set(...authHeader(owner))
      .send({ sentiment: 'dislike' })
      .expect(200)

    expect(second.body.sentiment).toBe('dislike')
    expect(second.body.likesCount).toBe(0)
    expect(second.body.dislikesCount).toBe(1)

    const rows = await prisma.placeFeedback.findMany({ where: { placeId: place.id } })
    expect(rows).toHaveLength(1)
  })
})
