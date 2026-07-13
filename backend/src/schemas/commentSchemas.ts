import { z } from 'zod'

export const createCommentSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
})

export const updateCommentSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().trim().min(1).max(2000).optional(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
