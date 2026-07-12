import bcrypt from 'bcryptjs'
import { prisma } from '../prisma'
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt'
import { createError } from '../middleware/errorHandler'

export async function register(email: string, password: string, displayName: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError(409, 'Пользователь с таким email уже существует', 'EMAIL_TAKEN')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
    select: { id: true, email: true, displayName: true },
  })

  return user
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false

  // Compare even when user is null to prevent timing-based email enumeration.
  if (!user || !passwordMatch) {
    throw createError(401, 'Неверный email или пароль', 'INVALID_CREDENTIALS')
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id),
    signRefreshToken(user.id),
  ])

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  }
}

export async function refresh(refreshToken: string) {
  const { userId } = await verifyToken(refreshToken).catch(() => {
    throw createError(401, 'Сессия истекла, войдите снова', 'UNAUTHORIZED')
  })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) throw createError(401, 'Пользователь не найден', 'UNAUTHORIZED')

  const accessToken = await signAccessToken(userId)
  return { accessToken }
}
