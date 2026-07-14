import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser, createTestPlace, authHeader } from '../testUtils/db'

describe('people routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#10
  it('POST /people/:id/follow on yourself returns 400 CANNOT_FOLLOW_SELF', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .post(`/people/${user.id}/follow`)
      .set(...authHeader(user))
      .expect(400)
    expect(res.body.error.code).toBe('CANNOT_FOLLOW_SELF')
  })

  // testing.md P1-#11
  it('PATCH /people/:id/close-friend without following first returns 403 NOT_FOLLOWING', async () => {
    const user = await createTestUser()
    const target = await createTestUser()

    const res = await request(app)
      .patch(`/people/${target.id}/close-friend`)
      .set(...authHeader(user))
      .send({ isCloseFriend: true })
      .expect(403)
    expect(res.body.error.code).toBe('NOT_FOLLOWING')

    // Following first makes it succeed.
    await request(app)
      .post(`/people/${target.id}/follow`)
      .set(...authHeader(user))
      .expect(200)
    await request(app)
      .patch(`/people/${target.id}/close-friend`)
      .set(...authHeader(user))
      .send({ isCloseFriend: true })
      .expect(200)
  })

  // testing.md P1-#12 / #13 (the friend map overlay reads this same endpoint)
  it("GET /people/:id/places never returns that user's private places, not even to a follower", async () => {
    const owner = await createTestUser()
    const follower = await createTestUser()
    await createTestPlace(owner.id, { name: 'Public place', visibility: 'public' })
    await createTestPlace(owner.id, { name: 'Private place', visibility: 'private' })
    await request(app)
      .post(`/people/${owner.id}/follow`)
      .set(...authHeader(follower))
      .expect(200)

    const res = await request(app)
      .get(`/people/${owner.id}/places`)
      .set(...authHeader(follower))
      .expect(200)

    const names = (res.body.places as { name: string }[]).map((p) => p.name)
    expect(names).toContain('Public place')
    expect(names).not.toContain('Private place')
  })

  it('unfollowing also clears isCloseFriend', async () => {
    const user = await createTestUser()
    const target = await createTestUser()
    await request(app)
      .post(`/people/${target.id}/follow`)
      .set(...authHeader(user))
      .expect(200)
    await request(app)
      .patch(`/people/${target.id}/close-friend`)
      .set(...authHeader(user))
      .send({ isCloseFriend: true })
      .expect(200)

    await request(app)
      .delete(`/people/${target.id}/follow`)
      .set(...authHeader(user))
      .expect(200)

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
    })
    expect(follow).toBeNull()
  })
})
