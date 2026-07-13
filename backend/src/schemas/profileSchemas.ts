import { z } from 'zod'

// Strict allowlist: email and password are NEVER editable through this route,
// unlike the mock's naive Object.assign(user, body) which would blindly accept
// any field a client sent. Zod validation here is what makes this safe.
// avatarUrl deliberately has no .url() check: the frontend form (profileSettingsSchema.ts)
// does not validate URL format either, and the mock accepts any string — a strict
// check here would 400 on input the frontend happily submits, breaking the
// "identical behavior with VITE_USE_MOCKS=false" bet (backend.md).
export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().max(2000).nullish(),
  bio: z.string().max(500).nullish(),
  status: z.string().max(100).nullish(),
  defaultVisibility: z.enum(['public', 'private']).optional(),
  notificationsEnabled: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
