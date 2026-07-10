import { z } from 'zod'

export const addPlaceSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  rating: z.number().min(1, 'Поставьте оценку').max(5),
  note: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['want_to_visit', 'planned', 'favorite']),
  visibility: z.enum(['public', 'private']),
  mood: z.enum(['calm', 'serenity', 'hope', 'laughter']).optional(),
})
export type AddPlaceFormValues = z.infer<typeof addPlaceSchema>
