import type { PlaceComment, User } from '@prisma/client'

export interface PlaceCommentDto {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  rating: number
  text: string
  createdAt: string
  isAuthor: boolean
}

export function toCommentDto(
  comment: PlaceComment & { author: User },
  viewerId: string | null,
): PlaceCommentDto {
  return {
    id: comment.id,
    authorId: comment.authorId,
    authorName: comment.author.displayName,
    authorAvatarUrl: comment.author.avatarUrl,
    rating: comment.rating,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    isAuthor: comment.authorId === viewerId,
  }
}
