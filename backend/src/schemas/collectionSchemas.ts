import { z } from 'zod'

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullish(),
  visibility: z.enum(['public', 'private']),
})

export const updateCollectionSchema = createCollectionSchema.partial()

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
