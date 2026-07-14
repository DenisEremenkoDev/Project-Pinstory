import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser, createTestPlace, authHeader } from '../testUtils/db'

describe('comment routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#15
  it('POST /places/:id/comments on an invisible private place returns 403', async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'private' })

    const res = await request(app)
      .post(`/places/${place.id}/comments`)
      .set(...authHeader(stranger))
      .send({ rating: 5, text: 'Should not work' })
      .expect(403)
    expect(res.body.error.code).toBe('PLACE_FORBIDDEN')
  })

  it('POST /places/:id/comments on a visible public place owned by someone else returns 201', async () => {
    const owner = await createTestUser()
    const commenter = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'public' })

    const res = await request(app)
      .post(`/places/${place.id}/comments`)
      .set(...authHeader(commenter))
      .send({ rating: 4, text: 'Nice spot' })
      .expect(201)
    expect(res.body.text).toBe('Nice spot')
  })

  // testing.md Priority 1 frontend/backend pairing: only the comment's author may edit/delete it.
  it("PATCH and DELETE on someone else's comment return 403", async () => {
    const owner = await createTestUser()
    const author = await createTestUser()
    const stranger = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'public' })
    const comment = await prisma.placeComment.create({
      data: { placeId: place.id, authorId: author.id, rating: 5, text: 'Original' },
    })

    const patchRes = await request(app)
      .patch(`/places/${place.id}/comments/${comment.id}`)
      .set(...authHeader(stranger))
      .send({ text: 'Hijacked' })
      .expect(403)
    expect(patchRes.body.error.code).toBe('COMMENT_FORBIDDEN')

    const deleteRes = await request(app)
      .delete(`/places/${place.id}/comments/${comment.id}`)
      .set(...authHeader(stranger))
      .expect(403)
    expect(deleteRes.body.error.code).toBe('COMMENT_FORBIDDEN')
  })
})
