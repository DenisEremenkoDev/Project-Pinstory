import { SignJWT, jwtVerify } from 'jose'

let _secret: Uint8Array | undefined

function getSecret(): Uint8Array {
  if (!_secret) {
    const raw = process.env.JWT_SECRET
    if (!raw) throw new Error('JWT_SECRET env var is not set')
    _secret = new TextEncoder().encode(raw)
  }
  return _secret
}

function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration)
  if (!match) throw new Error(`Invalid duration string: ${duration}`)
  const n = Number(match[1])
  const unit = match[2] as 's' | 'm' | 'h' | 'd'
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return n * multipliers[unit]
}

export async function signAccessToken(userId: string): Promise<string> {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'
  return new SignJWT()
    .setSubject(userId)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function signRefreshToken(userId: string): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d'
  return new SignJWT()
    .setSubject(userId)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
  if (typeof payload.sub !== 'string') throw new Error('Token missing sub claim')
  return { userId: payload.sub }
}

export function refreshCookieMaxAge(): number {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d'
  return parseDurationMs(expiresIn)
}
