import type { Request, Response, NextFunction } from 'express'
import { registerBodySchema, loginBodySchema } from '../schemas/authSchemas'
import * as authService from '../services/authService'
import { createError } from '../middleware/errorHandler'
import { refreshCookieMaxAge } from '../lib/jwt'

const REFRESH_COOKIE = 'refreshToken'

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: refreshCookieMaxAge(),
  })
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh',
  })
}

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные', 'VALIDATION_ERROR'))
    }
    const { email, password, displayName } = parsed.data
    const result = await authService.register(email, password, displayName)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные', 'VALIDATION_ERROR'))
    }
    const { email, password } = parsed.data
    const { accessToken, refreshToken, user } = await authService.login(email, password)
    setRefreshCookie(res, refreshToken)
    res.json({ accessToken, user })
  } catch (err) {
    next(err)
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!token) {
      return void next(createError(401, 'Отсутствует токен обновления', 'UNAUTHORIZED'))
    }
    const result = await authService.refresh(token)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export function logoutHandler(_req: Request, res: Response): void {
  clearRefreshCookie(res)
  res.status(204).end()
}
