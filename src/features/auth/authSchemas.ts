import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  displayName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})
export type RegisterFormValues = z.infer<typeof registerSchema>
