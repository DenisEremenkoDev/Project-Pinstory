import { z } from 'zod'

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(100),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
