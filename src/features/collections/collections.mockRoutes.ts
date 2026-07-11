import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb, nextMockId, type MockCollectionPlace } from '../../shared/lib/mockDb'
import type { PlaceDto, Visibility } from '../../shared/lib/apiTypes'

interface CollectionBody {
  name: string
  description: string | null
  visibility: Visibility
}

function placesCount(collectionId: string): number {
  return mockDb.collectionPlaces.filter((cp) => cp.collectionId === collectionId).length
}

function placesInCollection(collectionId: string, viewerId: string | null): PlaceDto[] {
  const placeIds = mockDb.collectionPlaces
    .filter((cp) => cp.collectionId === collectionId)
    .map((cp) => cp.placeId)

  return mockDb.places
    .filter((place) => placeIds.includes(place.id))
    .map((place) => ({
      ...place,
      myFeedback: mockDb.feedback.find((f) => f.placeId === place.id && f.userId === viewerId)?.sentiment ?? null,
      isOwner: place.ownerId === viewerId,
    }))
}

export const collectionsMockRoutes: MockRoute[] = [
  defineMockRoute('GET', '/collections', ({ currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const own = mockDb.collections
      .filter((collection) => collection.ownerId === currentUserId)
      .map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        visibility: collection.visibility,
        createdAt: collection.createdAt,
        placesCount: placesCount(collection.id),
        places: placesInCollection(collection.id, currentUserId),
      }))

    const followingIds = mockDb.follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)

    const following = mockDb.collections
      .filter((collection) => followingIds.includes(collection.ownerId) && collection.visibility === 'public')
      .map((collection) => {
        const owner = mockDb.users.find((user) => user.id === collection.ownerId)
        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          placesCount: placesCount(collection.id),
          owner: owner
            ? { id: owner.id, displayName: owner.displayName, avatarUrl: owner.avatarUrl }
            : { id: collection.ownerId, displayName: 'Пользователь', avatarUrl: null },
        }
      })

    return { data: { own, following } }
  }),

  defineMockRoute('POST', '/collections', ({ body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const { name, description, visibility } = body as CollectionBody
    if (!name || !name.trim()) return mockError(400, 'Название коллекции не может быть пустым', 'VALIDATION_ERROR')

    const collection = {
      id: nextMockId('collection'),
      ownerId: currentUserId,
      name,
      description: description ?? null,
      visibility,
      createdAt: new Date().toISOString(),
    }
    mockDb.collections.push(collection)

    return { data: { ...collection, placesCount: 0, places: [] } }
  }),

  defineMockRoute('PATCH', '/collections/:id', ({ pathParams, body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const collection = mockDb.collections.find((candidate) => candidate.id === pathParams.id)
    if (!collection) return mockError(404, 'Коллекция не найдена', 'COLLECTION_NOT_FOUND')
    if (collection.ownerId !== currentUserId) {
      return mockError(403, 'Нет прав на редактирование этой коллекции', 'COLLECTION_FORBIDDEN')
    }

    Object.assign(collection, body as Partial<CollectionBody>)

    return {
      data: {
        ...collection,
        placesCount: placesCount(collection.id),
        places: placesInCollection(collection.id, currentUserId),
      },
    }
  }),

  defineMockRoute('DELETE', '/collections/:id', ({ pathParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const collection = mockDb.collections.find((candidate) => candidate.id === pathParams.id)
    if (!collection) return mockError(404, 'Коллекция не найдена', 'COLLECTION_NOT_FOUND')
    if (collection.ownerId !== currentUserId) {
      return mockError(403, 'Нет прав на удаление этой коллекции', 'COLLECTION_FORBIDDEN')
    }

    mockDb.collections = mockDb.collections.filter((candidate) => candidate.id !== collection.id)
    mockDb.collectionPlaces = mockDb.collectionPlaces.filter((cp) => cp.collectionId !== collection.id)

    return { data: undefined }
  }),

  defineMockRoute('POST', '/collections/:id/places/:placeId', ({ pathParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const collection = mockDb.collections.find((candidate) => candidate.id === pathParams.id)
    if (!collection) return mockError(404, 'Коллекция не найдена', 'COLLECTION_NOT_FOUND')
    if (collection.ownerId !== currentUserId) {
      return mockError(403, 'Нет прав на редактирование этой коллекции', 'COLLECTION_FORBIDDEN')
    }

    const place = mockDb.places.find((candidate) => candidate.id === pathParams.placeId)
    if (!place) return mockError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
    if (place.ownerId !== currentUserId) {
      return mockError(403, 'Можно добавлять только свои места', 'PLACE_FORBIDDEN')
    }

    const alreadyIn = mockDb.collectionPlaces.some(
      (cp) => cp.collectionId === collection.id && cp.placeId === place.id,
    )
    if (!alreadyIn) {
      const entry: MockCollectionPlace = { collectionId: collection.id, placeId: place.id, addedAt: new Date().toISOString() }
      mockDb.collectionPlaces.push(entry)
    }

    return { data: undefined }
  }),

  defineMockRoute('DELETE', '/collections/:id/places/:placeId', ({ pathParams, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const collection = mockDb.collections.find((candidate) => candidate.id === pathParams.id)
    if (!collection) return mockError(404, 'Коллекция не найдена', 'COLLECTION_NOT_FOUND')
    if (collection.ownerId !== currentUserId) {
      return mockError(403, 'Нет прав на редактирование этой коллекции', 'COLLECTION_FORBIDDEN')
    }

    mockDb.collectionPlaces = mockDb.collectionPlaces.filter(
      (cp) => !(cp.collectionId === collection.id && cp.placeId === pathParams.placeId),
    )

    return { data: undefined }
  }),
]
