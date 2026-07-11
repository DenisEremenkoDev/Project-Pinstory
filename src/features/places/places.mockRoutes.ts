import { defineMockRoute, mockError, type MockRoute } from '../../shared/lib/mockBaseQuery'
import { mockDb, nextMockId, type MockPlace } from '../../shared/lib/mockDb'
import type { Mood, PlaceStatus, Sentiment, Visibility } from '../../shared/lib/apiTypes'

const STATUSES: PlaceStatus[] = ['want_to_visit', 'planned', 'favorite']
const VISIBILITIES: Visibility[] = ['public', 'private']

interface CreatePlaceBody {
  name: string
  latitude: number
  longitude: number
  rating: number
  note?: string | null
  tags?: string[]
  status: PlaceStatus
  visibility: Visibility
  mood?: Mood | null
}

type UpdatePlaceBody = Partial<CreatePlaceBody>

function findOwnedPlace(id: string, currentUserId: string | null): MockPlace | undefined {
  return mockDb.places.find((place) => place.id === id && place.ownerId === currentUserId)
}

function getMyFeedback(placeId: string, userId: string | null): Sentiment | null {
  if (!userId) return null
  return mockDb.feedback.find((f) => f.placeId === placeId && f.userId === userId)?.sentiment ?? null
}

function countFeedback(placeId: string, sentiment: Sentiment): number {
  return mockDb.feedback.filter((f) => f.placeId === placeId && f.sentiment === sentiment).length
}

function validateCreateBody(body: CreatePlaceBody): string | null {
  if (!body.name || !body.name.trim()) return 'Название места не может быть пустым'
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    return 'Координаты обязательны'
  }
  if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
    return 'Оценка обязательна и должна быть от 1 до 5'
  }
  if (!STATUSES.includes(body.status)) return 'Недопустимый статус'
  if (!VISIBILITIES.includes(body.visibility)) return 'Недопустимая приватность'
  return null
}

export const placesMockRoutes: MockRoute[] = [
  defineMockRoute('GET', '/places', ({ currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const places = mockDb.places
      .filter((place) => place.ownerId === currentUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((place) => ({ ...place, myFeedback: getMyFeedback(place.id, currentUserId) }))

    return { data: { places } }
  }),

  defineMockRoute('GET', '/places/:id', ({ pathParams, currentUserId }) => {
    const place = mockDb.places.find((candidate) => candidate.id === pathParams.id)
    if (!place) return mockError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
    if (place.visibility === 'private' && place.ownerId !== currentUserId) {
      return mockError(403, 'Это место недоступно', 'PLACE_FORBIDDEN')
    }

    return {
      data: {
        ...place,
        myFeedback: getMyFeedback(place.id, currentUserId),
        commentsCount: 0,
        likesCount: countFeedback(place.id, 'like'),
        dislikesCount: countFeedback(place.id, 'dislike'),
      },
    }
  }),

  defineMockRoute('POST', '/places', ({ body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const createBody = body as CreatePlaceBody
    const validationError = validateCreateBody(createBody)
    if (validationError) return mockError(400, validationError, 'VALIDATION_ERROR')

    const place: MockPlace = {
      id: nextMockId('place'),
      ownerId: currentUserId,
      name: createBody.name,
      latitude: createBody.latitude,
      longitude: createBody.longitude,
      rating: createBody.rating,
      note: createBody.note ?? null,
      photoUrl: null,
      tags: createBody.tags ?? [],
      status: createBody.status,
      visibility: createBody.visibility,
      mood: createBody.mood ?? null,
      createdAt: new Date().toISOString(),
    }
    mockDb.places.push(place)

    return { data: { ...place, myFeedback: null } }
  }),

  defineMockRoute('PATCH', '/places/:id', ({ pathParams, body, currentUserId }) => {
    const place = findOwnedPlace(pathParams.id ?? '', currentUserId)
    if (!place) return mockError(403, 'Нет прав на редактирование этого места', 'PLACE_FORBIDDEN')

    Object.assign(place, body as UpdatePlaceBody)
    return { data: { ...place, myFeedback: getMyFeedback(place.id, currentUserId) } }
  }),

  defineMockRoute('DELETE', '/places/:id', ({ pathParams, currentUserId }) => {
    const place = findOwnedPlace(pathParams.id ?? '', currentUserId)
    if (!place) return mockError(403, 'Нет прав на удаление этого места', 'PLACE_FORBIDDEN')

    mockDb.places = mockDb.places.filter((candidate) => candidate.id !== place.id)
    mockDb.feedback = mockDb.feedback.filter((f) => f.placeId !== place.id)
    return { data: undefined }
  }),

  defineMockRoute('POST', '/places/:id/feedback', ({ pathParams, body, currentUserId }) => {
    if (!currentUserId) return mockError(401, 'Не авторизован', 'UNAUTHORIZED')

    const place = mockDb.places.find((candidate) => candidate.id === pathParams.id)
    if (!place) return mockError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
    if (place.visibility === 'private' && place.ownerId !== currentUserId) {
      return mockError(403, 'Это место недоступно', 'PLACE_FORBIDDEN')
    }

    const { sentiment } = body as { sentiment: Sentiment }
    mockDb.feedback = mockDb.feedback.filter(
      (f) => !(f.placeId === place.id && f.userId === currentUserId),
    )
    mockDb.feedback.push({ userId: currentUserId, placeId: place.id, sentiment })

    return {
      data: {
        sentiment,
        likesCount: countFeedback(place.id, 'like'),
        dislikesCount: countFeedback(place.id, 'dislike'),
      },
    }
  }),

  defineMockRoute('DELETE', '/places/:id/feedback', ({ pathParams, currentUserId }) => {
    const place = mockDb.places.find((candidate) => candidate.id === pathParams.id)
    if (!place) return mockError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
    if (place.visibility === 'private' && place.ownerId !== currentUserId) {
      return mockError(403, 'Это место недоступно', 'PLACE_FORBIDDEN')
    }

    mockDb.feedback = mockDb.feedback.filter(
      (f) => !(f.placeId === place.id && f.userId === currentUserId),
    )

    return {
      data: {
        sentiment: null,
        likesCount: countFeedback(place.id, 'like'),
        dislikesCount: countFeedback(place.id, 'dislike'),
      },
    }
  }),
]
