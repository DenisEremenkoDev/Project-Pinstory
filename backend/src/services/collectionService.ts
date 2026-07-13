import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { toPlaceDto, type PlaceDto } from '../mappers/placeMapper'
import type { CreateCollectionInput, UpdateCollectionInput } from '../schemas/collectionSchemas'

export interface OwnCollectionDto {
  id: string
  name: string
  description: string | null
  visibility: 'public' | 'private'
  createdAt: string
  placesCount: number
  places: PlaceDto[]
}

export interface FollowedCollectionDto {
  id: string
  name: string
  description: string | null
  placesCount: number
  owner: { id: string; displayName: string; avatarUrl: string | null }
}

async function placesInCollection(collectionId: string, viewerId: string): Promise<PlaceDto[]> {
  const memberships = await prisma.collectionPlace.findMany({
    where: { collectionId },
    include: { place: true },
  })
  const feedback = await prisma.placeFeedback.findMany({
    where: { userId: viewerId, placeId: { in: memberships.map((m) => m.placeId) } },
  })
  const feedbackByPlace = new Map(feedback.map((f) => [f.placeId, f.sentiment]))

  return memberships.map((m) => toPlaceDto(m.place, viewerId, feedbackByPlace.get(m.placeId) ?? null))
}

// GET /collections — own (full, incl. places) + followed users' public collections.
export async function getCollections(
  currentUserId: string,
): Promise<{ own: OwnCollectionDto[]; following: FollowedCollectionDto[] }> {
  const ownRows = await prisma.collection.findMany({
    where: { ownerId: currentUserId },
    include: { _count: { select: { places: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const own = await Promise.all(
    ownRows.map(async (c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      visibility: c.visibility,
      createdAt: c.createdAt.toISOString(),
      placesCount: c._count.places,
      places: await placesInCollection(c.id, currentUserId),
    })),
  )

  const followedRows = await prisma.collection.findMany({
    where: { visibility: 'public', owner: { followers: { some: { followerId: currentUserId } } } },
    include: { _count: { select: { places: true } }, owner: true },
    orderBy: { createdAt: 'desc' },
  })
  const following: FollowedCollectionDto[] = followedRows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    placesCount: c._count.places,
    owner: { id: c.owner.id, displayName: c.owner.displayName, avatarUrl: c.owner.avatarUrl },
  }))

  return { own, following }
}

// POST /collections
export async function createCollection(
  currentUserId: string,
  input: CreateCollectionInput,
): Promise<OwnCollectionDto> {
  const collection = await prisma.collection.create({
    data: {
      ownerId: currentUserId,
      name: input.name,
      description: input.description ?? null,
      visibility: input.visibility,
    },
  })
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    createdAt: collection.createdAt.toISOString(),
    placesCount: 0,
    places: [],
  }
}

// PATCH /collections/:id — owner only. Distinguishes 404 (no such collection)
// from 403 (exists, not yours) faithfully, matching the mock and testing.md #16.
async function findOwnedOrThrow(collectionId: string, currentUserId: string) {
  const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
  if (!collection) throw createError(404, 'Коллекция не найдена', 'COLLECTION_NOT_FOUND')
  if (collection.ownerId !== currentUserId) {
    throw createError(403, 'Нет прав на редактирование этой коллекции', 'COLLECTION_FORBIDDEN')
  }
  return collection
}

export async function updateCollection(
  collectionId: string,
  currentUserId: string,
  input: UpdateCollectionInput,
): Promise<OwnCollectionDto> {
  await findOwnedOrThrow(collectionId, currentUserId)

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
    },
    include: { _count: { select: { places: true } } },
  })

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    visibility: updated.visibility,
    createdAt: updated.createdAt.toISOString(),
    placesCount: updated._count.places,
    places: await placesInCollection(collectionId, currentUserId),
  }
}

// DELETE /collections/:id — owner only, same 404/403 distinction.
export async function deleteCollection(collectionId: string, currentUserId: string): Promise<void> {
  await findOwnedOrThrow(collectionId, currentUserId)
  await prisma.collection.delete({ where: { id: collectionId } })
}

// POST /collections/:id/places/:placeId — ownership of BOTH the collection and
// the place is checked (backend.md §10). Idempotent.
export async function addPlaceToCollection(
  collectionId: string,
  placeId: string,
  currentUserId: string,
): Promise<void> {
  await findOwnedOrThrow(collectionId, currentUserId)

  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place) throw createError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
  if (place.ownerId !== currentUserId) {
    throw createError(403, 'Можно добавлять только свои места', 'PLACE_FORBIDDEN')
  }

  await prisma.collectionPlace.upsert({
    where: { collectionId_placeId: { collectionId, placeId } },
    create: { collectionId, placeId },
    update: {},
  })
}

// DELETE /collections/:id/places/:placeId — collection ownership only; idempotent.
export async function removePlaceFromCollection(
  collectionId: string,
  placeId: string,
  currentUserId: string,
): Promise<void> {
  await findOwnedOrThrow(collectionId, currentUserId)
  await prisma.collectionPlace.deleteMany({ where: { collectionId, placeId } })
}
