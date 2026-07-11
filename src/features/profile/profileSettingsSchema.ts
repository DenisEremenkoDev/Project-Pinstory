import { z } from 'zod'

export const profileSettingsSchema = z.object({
  displayName: z.string().min(1, 'Имя обязательно'),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  status: z.string().optional(),
  defaultVisibility: z.enum(['public', 'private']),
  notificationsEnabled: z.boolean(),
})
export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>
