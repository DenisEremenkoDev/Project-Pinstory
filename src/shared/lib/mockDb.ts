import type { PlaceDto, Sentiment } from './apiTypes'

export interface MockUser {
  id: string
  email: string
  password: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  status: string | null
  followersCount: number
  followingCount: number
  trustSignal: string | null
}

export interface MockFollow {
  followerId: string
  followingId: string
  isCloseFriend: boolean
}

export type MockPlace = Omit<PlaceDto, 'myFeedback'> & { ownerId: string }

export interface MockFeedback {
  userId: string
  placeId: string
  sentiment: Sentiment
}

/**
 * In-memory mock "database." Lives only for the current browser session —
 * mutations (register, createPlace, follow, ...) persist until reload.
 * Seed data intentionally mirrors the Prisma schema in BACKEND_INSTRUCTIONS.md
 * so swapping the real backend in later doesn't require reshaping anything.
 *
 * `myFeedback` is NOT stored on MockPlace — feedback is per (userId, placeId),
 * same as the real PlaceFeedback model, and looked up from `feedback` for
 * whichever user is asking. Storing it directly on the place only worked by
 * accident while every place was viewed by the same single seed user.
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
      followersCount: 12,
      followingCount: 3,
      trustSignal: null,
    },
    {
      id: 'user-2',
      email: 'alexey@pinstory.dev',
      password: 'password123',
      displayName: 'Алексей Волков',
      avatarUrl: null,
      bio: 'Ищу лучший кофе в городе',
      status: null,
      followersCount: 89,
      followingCount: 42,
      trustSignal: 'У вас похожий вкус в кофейнях',
    },
    {
      id: 'user-3',
      email: 'darya@pinstory.dev',
      password: 'password123',
      displayName: 'Дарья Соколова',
      avatarUrl: null,
      bio: 'Рестораны, вино, долгие ужины',
      status: null,
      followersCount: 156,
      followingCount: 61,
      trustSignal: 'Вы одинаково оцениваете рестораны',
    },
    {
      id: 'user-4',
      email: 'igor@pinstory.dev',
      password: 'password123',
      displayName: 'Игорь Петров',
      avatarUrl: null,
      bio: null,
      status: null,
      followersCount: 34,
      followingCount: 28,
      trustSignal: 'Вы часто сохраняете похожие места',
    },
    {
      id: 'user-5',
      email: 'marina@pinstory.dev',
      password: 'password123',
      displayName: 'Марина Ким',
      avatarUrl: null,
      bio: null,
      status: null,
      followersCount: 210,
      followingCount: 95,
      trustSignal: 'Похожие места в подборках',
    },
    {
      id: 'user-6',
      email: 'egor@pinstory.dev',
      password: 'password123',
      displayName: 'Егор Литвинов',
      avatarUrl: null,
      bio: null,
      status: null,
      followersCount: 47,
      followingCount: 19,
      trustSignal: 'Совпадает вкус в ресторанах',
    },
  ] as MockUser[],

  follows: [
    { followerId: 'user-1', followingId: 'user-2', isCloseFriend: true },
    { followerId: 'user-1', followingId: 'user-3', isCloseFriend: true },
    { followerId: 'user-1', followingId: 'user-4', isCloseFriend: false },
  ] as MockFollow[],

  feedback: [
    { userId: 'user-1', placeId: 'place-1', sentiment: 'like' },
    { userId: 'user-1', placeId: 'place-4', sentiment: 'dislike' },
  ] as MockFeedback[],

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
    },
    {
      id: 'place-6',
      ownerId: 'user-2',
      name: 'Кофейня «Северный ветер»',
      latitude: 59.9386,
      longitude: 30.3141,
      rating: 5,
      note: 'Обжаривают зерно сами, спроси про эфиопскую воронку.',
      photoUrl: null,
      tags: ['кофе'],
      status: 'favorite',
      visibility: 'public',
      mood: 'calm',
      createdAt: '2026-06-20T09:00:00.000Z',
    },
    {
      id: 'place-7',
      ownerId: 'user-2',
      name: 'Смотровая у моста',
      latitude: 59.9421,
      longitude: 30.3308,
      rating: 4,
      note: null,
      photoUrl: null,
      tags: ['вид'],
      status: 'planned',
      visibility: 'public',
      mood: null,
      createdAt: '2026-06-25T19:00:00.000Z',
    },
  ] as MockPlace[],
}

let idCounter = 1000

export function nextMockId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}
