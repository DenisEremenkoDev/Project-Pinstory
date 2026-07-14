import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prisma } from '../prisma'
import { resetDb, createTestUser } from '../testUtils/db'

describe('auth routes', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // testing.md P1-#1
  it('POST /auth/register with a duplicate email returns 409 EMAIL_TAKEN', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', displayName: 'First' })
      .expect(201)

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', displayName: 'Second' })
      .expect(409)

    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  // testing.md P1-#2
  it('POST /auth/login with the wrong password returns 401, correct password returns a token', async () => {
    const user = await createTestUser({ email: 'login@example.com', password: 'correct-password' })

    const wrong = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401)
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS')

    const right = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200)
    expect(typeof right.body.accessToken).toBe('string')
    expect(right.body.accessToken.length).toBeGreaterThan(0)
  })

  // testing.md P1-#3
  it('a protected route without a token returns 401', async () => {
    const res = await request(app).get('/places').expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
