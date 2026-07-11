import { z } from 'zod'

export const collectionSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
})
export type CollectionFormValues = z.infer<typeof collectionSchema>
