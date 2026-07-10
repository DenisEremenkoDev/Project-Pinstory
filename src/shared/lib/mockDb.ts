import type { PlaceDto } from './apiTypes'

export interface MockUser {
  id: string
  email: string
  password: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  status: string | null
}

export interface MockFollow {
  followerId: string
  followingId: string
  isCloseFriend: boolean
}

export interface MockPlace extends PlaceDto {
  ownerId: string
}

/**
 * In-memory mock "database." Lives only for the current browser session —
 * mutations (register, createPlace, follow, ...) persist until reload.
 * Seed data intentionally mirrors the Prisma schema in BACKEND_INSTRUCTIONS.md
 * so swapping the real backend in later doesn't require reshaping anything.
 */
export const mockDb = {
  users: [
    {
      id: 'user-1',
      email: 'anna@pinstory.dev',
      password: 'password123',
      displayName: 'Анна',
      avatarUrl: null,
      bio: 'Люблю уютные кофейни и виды на закат',
      status: null,
    },
  ] as MockUser[],
  follows: [] as MockFollow[],
  places: [] as MockPlace[],
}

let idCounter = 1000

export function nextMockId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}
