import { z } from 'zod'

export const commentSchema = z.object({
  rating: z.number().min(1, 'Поставьте оценку').max(5),
  text: z.string().min(1, 'Напишите комментарий'),
})
export type CommentFormValues = z.infer<typeof commentSchema>
