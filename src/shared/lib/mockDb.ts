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
  places: [
    {
      id: 'place-1',
      ownerId: 'user-1',
      name: 'Кофейня «Полдень»',
      latitude: 59.9343,
      longitude: 30.3351,
      rating: 5,
      note: 'Лучший флэт уайт в городе — обязательно взять столик у окна и никуда не спешить.',
      photoUrl: null,
      tags: ['кофе', 'уют'],
      status: 'favorite',
      visibility: 'public',
      mood: 'calm',
      createdAt: '2026-06-28T10:00:00.000Z',
      myFeedback: 'like',
    },
    {
      id: 'place-2',
      ownerId: 'user-1',
      name: 'Летний сад',
      latitude: 59.9436,
      longitude: 30.3367,
      rating: 4,
      note: null,
      photoUrl: null,
      tags: ['парк', 'прогулка'],
      status: 'planned',
      visibility: 'public',
      mood: 'serenity',
      createdAt: '2026-07-01T14:30:00.000Z',
      myFeedback: null,
    },
    {
      id: 'place-3',
      ownerId: 'user-1',
      name: 'Смотровая на крыше',
      latitude: 59.9311,
      longitude: 30.3609,
      rating: 5,
      note: null,
      photoUrl: null,
      tags: ['вид', 'закат'],
      status: 'want_to_visit',
      visibility: 'public',
      mood: 'hope',
      createdAt: '2026-07-05T18:00:00.000Z',
      myFeedback: null,
    },
    {
      id: 'place-4',
      ownerId: 'user-1',
      name: 'Бар «Тайный подвал»',
      latitude: 59.9299,
      longitude: 30.3471,
      rating: 2,
      note: 'Долго ждали столик, коктейли так себе — больше не пойду.',
      photoUrl: null,
      tags: ['бар'],
      status: 'favorite',
      visibility: 'private',
      mood: 'laughter',
      createdAt: '2026-06-15T20:00:00.000Z',
      myFeedback: 'dislike',
    },
    {
      id: 'place-5',
      ownerId: 'user-1',
      name: 'Буквоед на Восстания',
      latitude: 59.9308,
      longitude: 30.3609,
      rating: 4,
      note: null,
      photoUrl: null,
      tags: ['книги'],
      status: 'want_to_visit',
      visibility: 'public',
      mood: null,
      createdAt: '2026-07-08T09:15:00.000Z',
      myFeedback: null,
    },
  ] as MockPlace[],
}

let idCounter = 1000

export function nextMockId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}
