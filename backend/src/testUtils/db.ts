import bcrypt from 'bcryptjs'
import { prisma } from '../prisma'
import { signAccessToken } from '../lib/jwt'

// Truncates every app table between test files. RESTART IDENTITY is a no-op
// (all ids are uuid, not serial) but CASCADE keeps the statement order-independent.
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "CollectionPlace", "Collection", "PlaceComment", "PlaceFeedback", "Place", "Follow", "User" RESTART IDENTITY CASCADE',
  )
}

let userCounter = 0

interface CreateTestUserOptions {
  email?: string
  password?: string
  displayName?: string
}

export interface TestUser {
  id: string
  email: string
  password: string
  displayName: string
  accessToken: string
}

// Creates a user directly via Prisma (bypassing the HTTP register endpoint,
// which is itself under test elsewhere) and signs a real access token for it.
export async function createTestUser(options: CreateTestUserOptions = {}): Promise<TestUser> {
  userCounter += 1
  const email = options.email ?? `test-user-${userCounter}@example.com`
  const password = options.password ?? 'password123'
  const displayName = options.displayName ?? `Test User ${userCounter}`

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
  })

  const accessToken = await signAccessToken(user.id)
  return { id: user.id, email, password, displayName, accessToken }
}

export function authHeader(user: TestUser): [string, string] {
  return ['Authorization', `Bearer ${user.accessToken}`]
}

interface CreateTestPlaceOptions {
  name?: string
  visibility?: 'public' | 'private'
  status?: 'want_to_visit' | 'planned' | 'favorite'
  rating?: number
  latitude?: number
  longitude?: number
}

export async function createTestPlace(ownerId: string, options: CreateTestPlaceOptions = {}) {
  return prisma.place.create({
    data: {
      ownerId,
      name: options.name ?? 'Test Place',
      latitude: options.latitude ?? 59.93,
      longitude: options.longitude ?? 30.35,
      rating: options.rating ?? 4,
      status: options.status ?? 'want_to_visit',
      visibility: options.visibility ?? 'public',
      tags: [],
    },
  })
}
