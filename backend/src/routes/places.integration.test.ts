import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser, createTestPlace, authHeader } from '../testUtils/db'

const validPlaceBody = {
  name: 'Cafe Cinnamon',
  latitude: 59.93,
  longitude: 30.35,
  rating: 5,
  status: 'want_to_visit',
  visibility: 'public',
}

describe('places routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#4
  it("GET /places does not include another user's private place", async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    await createTestPlace(owner.id, { name: 'Owner private', visibility: 'private' })
    await createTestPlace(other.id, { name: 'Other private', visibility: 'private' })
    await createTestPlace(owner.id, { name: 'Owner public', visibility: 'public' })

    const res = await request(app)
      .get('/places')
      .set(...authHeader(owner))
      .expect(200)

    const names = (res.body.places as { name: string }[]).map((p) => p.name)
    expect(names).toContain('Owner private')
    expect(names).toContain('Owner public')
    expect(names).not.toContain('Other private')
  })

  // testing.md P1-#5
  it("GET /places/:id on another user's private place returns 404, even to a signed-in stranger", async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'private' })

    const anonymous = await request(app).get(`/places/${place.id}`).expect(404)
    expect(anonymous.body.error.code).toBe('PLACE_NOT_FOUND')

    const signedIn = await request(app)
      .get(`/places/${place.id}`)
      .set(...authHeader(stranger))
      .expect(404)
    expect(signedIn.body.error.code).toBe('PLACE_NOT_FOUND')

    // Owner still sees it.
    await request(app)
      .get(`/places/${place.id}`)
      .set(...authHeader(owner))
      .expect(200)
  })

  // testing.md P1-#6
  it("PATCH and DELETE /places/:id on someone else's place return 403", async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const place = await createTestPlace(owner.id, { visibility: 'public' })

    const patchRes = await request(app)
      .patch(`/places/${place.id}`)
      .set(...authHeader(stranger))
      .send({ name: 'Hijacked' })
      .expect(403)
    expect(patchRes.body.error.code).toBe('PLACE_FORBIDDEN')

    const deleteRes = await request(app)
      .delete(`/places/${place.id}`)
      .set(...authHeader(stranger))
      .expect(403)
    expect(deleteRes.body.error.code).toBe('PLACE_FORBIDDEN')
  })

  // testing.md P1-#7
  it('POST /places with out-of-range coordinates returns 400', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .post('/places')
      .set(...authHeader(user))
      .send({ ...validPlaceBody, latitude: 999 })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  // testing.md P1-#8
  it('POST /places without rating returns 400', async () => {
    const user = await createTestUser()
    const withoutRating = {
      name: validPlaceBody.name,
      latitude: validPlaceBody.latitude,
      longitude: validPlaceBody.longitude,
      status: validPlaceBody.status,
      visibility: validPlaceBody.visibility,
    }

    const res = await request(app)
      .post('/places')
      .set(...authHeader(user))
      .send(withoutRating)
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  // testing.md P1-#9
  it('POST /places with a status outside the three valid values returns 400, including "visited"', async () => {
    const user = await createTestUser()

    const visited = await request(app)
      .post('/places')
      .set(...authHeader(user))
      .send({ ...validPlaceBody, status: 'visited' })
      .expect(400)
    expect(visited.body.error.code).toBe('VALIDATION_ERROR')

    const bogus = await request(app)
      .post('/places')
      .set(...authHeader(user))
      .send({ ...validPlaceBody, status: 'somewhere-else' })
      .expect(400)
    expect(bogus.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('POST /places with valid data succeeds', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .post('/places')
      .set(...authHeader(user))
      .send(validPlaceBody)
      .expect(201)
    expect(res.body.name).toBe(validPlaceBody.name)
  })
})
