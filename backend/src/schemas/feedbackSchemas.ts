import { z } from 'zod'

export const setFeedbackSchema = z.object({
  sentiment: z.enum(['like', 'dislike']),
})
