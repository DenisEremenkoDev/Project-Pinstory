import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { canViewPlace } from './visibility'
import { assertPlaceVisibleForMutation } from './placeAccess'
import { toCommentDto, type PlaceCommentDto } from '../mappers/commentMapper'
import type { CreateCommentInput, UpdateCommentInput } from '../schemas/commentSchemas'

// GET /places/:id/comments — public read. A missing place and a non-owner's
// private place BOTH collapse to 404 (ADR-07 C2 names this route explicitly;
// same existence-oracle reasoning as GET /places/:id).
export async function getComments(
  placeId: string,
  viewerId: string | null,
): Promise<PlaceCommentDto[]> {
  const place = await prisma.place.findUnique({ where: { id: placeId } })
  if (!place || !canViewPlace(place, viewerId)) {
    throw createError(404, 'Место не найдено', 'PLACE_NOT_FOUND')
  }

  const comments = await prisma.placeComment.findMany({
    where: { placeId },
    orderBy: { createdAt: 'asc' },
    include: { author: true },
  })
  return comments.map((c) => toCommentDto(c, viewerId))
}

// POST /places/:id/comments — anyone who can see the place can comment.
// Mutation, token required: 404 if the place doesn't exist, 403 if invisible
// (testing.md P1-#15) — not the anonymous-read collapse used by GET.
export async function createComment(
  placeId: string,
  authorId: string,
  input: CreateCommentInput,
): Promise<PlaceCommentDto> {
  await assertPlaceVisibleForMutation(placeId, authorId)

  const comment = await prisma.placeComment.create({
    data: { placeId, authorId, rating: input.rating, text: input.text },
    include: { author: true },
  })
  return toCommentDto(comment, authorId)
}

async function findOwnCommentOrThrow(
  placeId: string,
  commentId: string,
  authorId: string,
  action: 'редактировать' | 'удалить',
) {
  const comment = await prisma.placeComment.findFirst({ where: { id: commentId, placeId } })
  if (!comment) throw createError(404, 'Комментарий не найден', 'COMMENT_NOT_FOUND')
  if (comment.authorId !== authorId) {
    throw createError(403, `Можно ${action} только свой комментарий`, 'COMMENT_FORBIDDEN')
  }
  return comment
}

// PATCH /places/:id/comments/:commentId — only the comment's author.
export async function updateComment(
  placeId: string,
  commentId: string,
  authorId: string,
  input: UpdateCommentInput,
): Promise<PlaceCommentDto> {
  await findOwnCommentOrThrow(placeId, commentId, authorId, 'редактировать')

  const updated = await prisma.placeComment.update({
    where: { id: commentId },
    data: {
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.text !== undefined && { text: input.text }),
    },
    include: { author: true },
  })
  return toCommentDto(updated, authorId)
}

// DELETE /places/:id/comments/:commentId — only the comment's author.
export async function deleteComment(placeId: string, commentId: string, authorId: string): Promise<void> {
  await findOwnCommentOrThrow(placeId, commentId, authorId, 'удалить')
  await prisma.placeComment.delete({ where: { id: commentId } })
}
