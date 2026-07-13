import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { toPlaceDto, type PlaceDto } from '../mappers/placeMapper'

export interface PersonSearchResult {
  id: string
  displayName: string
  avatarUrl: string | null
  isFollowing: boolean
  isCloseFriend: boolean
  trustSignal: string | null
}

export interface PersonDetail {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isCloseFriend: boolean
  trustSignal: string | null
}

// followersCount/followingCount are ALWAYS derived from the Follow table, never
// stored on User (backend.md — the mock's static seed counters are a known lie,
// issue #3 / ADR-05; do not repeat that mistake here).
export async function followCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ])
  return { followersCount, followingCount }
}

// GET /people/search — personalized (token required, per ADR-07).
export async function searchPeople(query: string, currentUserId: string): Promise<PersonSearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      ...(query.trim() && { displayName: { contains: query.trim(), mode: 'insensitive' } }),
    },
  })

  const follows = await prisma.follow.findMany({
    where: { followerId: currentUserId, followingId: { in: users.map((u) => u.id) } },
  })
  const followByTarget = new Map(follows.map((f) => [f.followingId, f]))

  return users.map((user) => {
    const follow = followByTarget.get(user.id)
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isFollowing: !!follow,
      isCloseFriend: follow?.isCloseFriend ?? false,
      trustSignal: user.trustSignal,
    }
  })
}

// GET /people/:id — public read (ADR-07); isFollowing/isCloseFriend are false
// when the caller is anonymous.
export async function getPersonDetail(
  targetId: string,
  currentUserId: string | null,
): Promise<PersonDetail> {
  const person = await prisma.user.findUnique({ where: { id: targetId } })
  if (!person) throw createError(404, 'Пользователь не найден', 'PERSON_NOT_FOUND')

  const follow = currentUserId
    ? await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
      })
    : null

  const counts = await followCounts(targetId)

  return {
    id: person.id,
    displayName: person.displayName,
    avatarUrl: person.avatarUrl,
    bio: person.bio,
    ...counts,
    isFollowing: !!follow,
    isCloseFriend: follow?.isCloseFriend ?? false,
    trustSignal: person.trustSignal,
  }
}

// POST /people/:id/follow — 400 self-follow, 404 unknown target, idempotent.
export async function followPerson(
  currentUserId: string,
  targetId: string,
): Promise<{ isFollowing: true }> {
  if (targetId === currentUserId) {
    throw createError(400, 'Нельзя подписаться на себя', 'CANNOT_FOLLOW_SELF')
  }
  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) throw createError(404, 'Пользователь не найден', 'PERSON_NOT_FOUND')

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
  })
  if (!existing) {
    await prisma.follow.create({ data: { followerId: currentUserId, followingId: targetId } })
  }
  return { isFollowing: true }
}

// DELETE /people/:id/follow — deleting the row also clears isCloseFriend (backend.md).
export async function unfollowPerson(
  currentUserId: string,
  targetId: string,
): Promise<{ isFollowing: false }> {
  await prisma.follow.deleteMany({ where: { followerId: currentUserId, followingId: targetId } })
  return { isFollowing: false }
}

// PATCH /people/:id/close-friend — requires an existing follow row.
export async function setCloseFriend(
  currentUserId: string,
  targetId: string,
  isCloseFriend: boolean,
): Promise<{ isCloseFriend: boolean }> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
  })
  if (!follow) throw createError(403, 'Сначала нужно подписаться', 'NOT_FOLLOWING')

  await prisma.follow.update({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
    data: { isCloseFriend },
  })
  return { isCloseFriend }
}

// GET /people/:id/places — ALWAYS public only, unconditionally (privacy.md:
// "never their private ones, regardless of follow or close-friend status").
// Deliberately does NOT special-case currentUserId === targetId.
export async function getPersonPlaces(
  targetId: string,
  currentUserId: string | null,
): Promise<PlaceDto[]> {
  const places = await prisma.place.findMany({
    where: { ownerId: targetId, visibility: 'public' },
    orderBy: { createdAt: 'desc' },
  })

  const feedback = currentUserId
    ? await prisma.placeFeedback.findMany({
        where: { userId: currentUserId, placeId: { in: places.map((p) => p.id) } },
      })
    : []
  const feedbackByPlace = new Map(feedback.map((f) => [f.placeId, f.sentiment]))

  return places.map((place) => toPlaceDto(place, currentUserId, feedbackByPlace.get(place.id) ?? null))
}

export interface CollectionSummaryDto {
  id: string
  name: string
  description: string | null
  placesCount: number
}

// GET /people/:id/collections — public collections only.
export async function getPersonCollections(targetId: string): Promise<CollectionSummaryDto[]> {
  const collections = await prisma.collection.findMany({
    where: { ownerId: targetId, visibility: 'public' },
    include: { _count: { select: { places: true } } },
  })

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    placesCount: c._count.places,
  }))
}
