import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'

function extractBearer(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

// Rejects the request with 401 when no valid token is present.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req)
  if (!token) {
    res.status(401).json({ error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' } })
    return
  }
  try {
    const { userId } = await verifyToken(token)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: { message: 'Сессия истекла, войдите снова', code: 'UNAUTHORIZED' } })
  }
}

// Never rejects: sets req.userId when a valid token is present, otherwise
// leaves it undefined. For public reads whose response varies by viewer
// (e.g. GET /places/:id — owner sees private, anonymous sees public only).
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req)
  if (token) {
    try {
      const { userId } = await verifyToken(token)
      req.userId = userId
    } catch {
      // Invalid token on a public read is treated as anonymous, not an error.
    }
  }
  next()
}
