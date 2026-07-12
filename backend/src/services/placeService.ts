import type { Sentiment } from '@prisma/client'
import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { canViewPlace } from './visibility'
import { toPlaceDto, type PlaceDto } from '../mappers/placeMapper'
import type { CreatePlaceInput, UpdatePlaceInput } from '../schemas/placeSchemas'

export interface PlaceDetailDto extends PlaceDto {
  commentsCount: number
  likesCount: number
  dislikesCount: number
}

// GET /places — only the caller's own places (public + private).
export async function listOwnPlaces(currentUserId: string): Promise<PlaceDto[]> {
  const places = await prisma.place.findMany({
    where: { ownerId: currentUserId },
    orderBy: { createdAt: 'desc' },
  })

  const feedback = await prisma.placeFeedback.findMany({
    where: { userId: currentUserId, placeId: { in: places.map((p) => p.id) } },
  })
  const feedbackByPlace = new Map<string, Sentiment>(feedback.map((f) => [f.placeId, f.sentiment]))

  return places.map((place) => toPlaceDto(place, currentUserId, feedbackByPlace.get(place.id) ?? null))
}

// GET /places/:id — owner sees any; non-owner sees public only.
// A missing place and a non-owner's private place BOTH return 404 so the public
// read surface is not an existence oracle (privacy.md rule #1; ratified 2026-07-12).
export async function getPlaceDetail(
  placeId: string,
  currentUserId: string | null,
): Promise<PlaceDetailDto> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place || !canViewPlace(place, currentUserId)) {
    throw createError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
  }

  const [myFeedbackRow, commentsCount, likesCount, dislikesCount] = await Promise.all([
    currentUserId
      ? prisma.placeFeedback.findUnique({
          where: { userId_placeId: { userId: currentUserId, placeId } },
        })
      : Promise.resolve(null),
    prisma.placeComment.count({ where: { placeId } }),
    prisma.placeFeedback.count({ where: { placeId, sentiment: 'like' } }),
    prisma.placeFeedback.count({ where: { placeId, sentiment: 'dislike' } }),
  ])

  return {
    ...toPlaceDto(place, currentUserId, myFeedbackRow?.sentiment ?? null),
    commentsCount,
    likesCount,
    dislikesCount,
  }
}

// POST /places — photoUrl is always null at creation (set later via photo upload).
export async function createPlace(currentUserId: string, input: CreatePlaceInput): Promise<PlaceDto> {
  const place = await prisma.place.create({
    data: {
      ownerId: currentUserId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      rating: input.rating,
      note: input.note ?? null,
      tags: input.tags ?? [],
      status: input.status,
      visibility: input.visibility,
      mood: input.mood ?? null,
    },
  })
  return toPlaceDto(place, currentUserId, null)
}

// PATCH /places/:id — owner only. Not-found and not-owned both collapse to 403
// (privacy.md: PATCH/DELETE stay 403; they require auth and aren't a public probe surface).
export async function updatePlace(
  placeId: string,
  currentUserId: string,
  input: UpdatePlaceInput,
): Promise<PlaceDto> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place || place.ownerId !== currentUserId) {
    throw createError(403, 'Нет прав на редактирование этого места', 'PLACE_FORBIDDEN')
  }

  const updated = await prisma.place.update({
    where: { id: placeId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.mood !== undefined && { mood: input.mood }),
    },
  })

  const myFeedbackRow = await prisma.placeFeedback.findUnique({
    where: { userId_placeId: { userId: currentUserId, placeId } },
  })
  return toPlaceDto(updated, currentUserId, myFeedbackRow?.sentiment ?? null)
}

// DELETE /places/:id — owner only. Cascades clear feedback/comments/collection rows (schema onDelete: Cascade).
export async function deletePlace(placeId: string, currentUserId: string): Promise<void> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place || place.ownerId !== currentUserId) {
    throw createError(403, 'Нет прав на удаление этого места', 'PLACE_FORBIDDEN')
  }
  await prisma.place.delete({ where: { id: placeId } })
}
