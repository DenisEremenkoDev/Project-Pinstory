import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser, authHeader } from '../testUtils/db'

describe('collection routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#16
  it("PATCH and DELETE /collections/:id on someone else's collection return 403", async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const collection = await prisma.collection.create({
      data: { ownerId: owner.id, name: 'My spots', visibility: 'public' },
    })

    const patchRes = await request(app)
      .patch(`/collections/${collection.id}`)
      .set(...authHeader(stranger))
      .send({ name: 'Hijacked' })
      .expect(403)
    expect(patchRes.body.error.code).toBe('COLLECTION_FORBIDDEN')

    const deleteRes = await request(app)
      .delete(`/collections/${collection.id}`)
      .set(...authHeader(stranger))
      .expect(403)
    expect(deleteRes.body.error.code).toBe('COLLECTION_FORBIDDEN')
  })

  it('PATCH /collections/:id on a nonexistent collection returns 404', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .patch('/collections/00000000-0000-0000-0000-000000000000')
      .set(...authHeader(user))
      .send({ name: 'Ghost' })
      .expect(404)
    expect(res.body.error.code).toBe('COLLECTION_NOT_FOUND')
  })
})
