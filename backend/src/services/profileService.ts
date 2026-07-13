import { prisma } from '../prisma'
import { createError } from '../middleware/errorHandler'
import { followCounts } from './peopleService'
import type { UpdateProfileInput } from '../schemas/profileSchemas'

export interface ProfileDto {
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl: string | null
    bio: string | null
    status: string | null
    defaultVisibility: 'public' | 'private'
    notificationsEnabled: boolean
  }
  placesCount: number
  followersCount: number
  followingCount: number
}

async function buildProfile(userId: string): Promise<ProfileDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw createError(404, 'Пользователь не найден', 'USER_NOT_FOUND')

  const [placesCount, counts] = await Promise.all([
    prisma.place.count({ where: { ownerId: userId } }),
    followCounts(userId),
  ])

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      defaultVisibility: user.defaultVisibility,
      notificationsEnabled: user.notificationsEnabled,
    },
    placesCount,
    ...counts,
  }
}

// GET /profile — the caller's own aggregated data. Token required (own data).
export async function getProfile(userId: string): Promise<ProfileDto> {
  return buildProfile(userId)
}

// PATCH /profile — editable fields only (schema allowlist excludes email/password).
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.defaultVisibility !== undefined && { defaultVisibility: input.defaultVisibility }),
      ...(input.notificationsEnabled !== undefined && { notificationsEnabled: input.notificationsEnabled }),
    },
  })
  return buildProfile(userId)
}
