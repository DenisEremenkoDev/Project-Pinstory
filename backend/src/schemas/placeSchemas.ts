import { z } from 'zod'

// Enum values mirror apiTypes.ts / mockDb.ts exactly.
// "visited" is intentionally absent and must be rejected (testing.md P1-#9).
const placeStatusSchema = z.enum(['want_to_visit', 'planned', 'favorite'])
const visibilitySchema = z.enum(['public', 'private'])
const moodSchema = z.enum(['calm', 'serenity', 'hope', 'laughter'])

export const createPlaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rating: z.number().int().min(1).max(5), // required at creation
  note: z.string().max(2000).nullish(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  status: placeStatusSchema,
  visibility: visibilitySchema,
  mood: moodSchema.nullish(),
})

export const updatePlaceSchema = createPlaceSchema.partial()

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>
