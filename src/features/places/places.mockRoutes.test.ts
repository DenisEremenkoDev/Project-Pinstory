import { beforeEach, describe, expect, it, vi } from 'vitest'
import { placesMockRoutes } from './places.mockRoutes'
import { mockDb } from '../../shared/lib/mockDb'
import { MAX_PHOTO_BYTES } from './photoConstraints'
import type { MockRouteContext } from '../../shared/lib/mockBaseQuery'

// jsdom does not implement createObjectURL/revokeObjectURL.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

const photoRoute = placesMockRoutes.find(
  (route) => route.method === 'POST' && route.segments.join('/') === 'places/:id/photo',
)
if (!photoRoute) throw new Error('POST /places/:id/photo mock route not found')

function callRoute(placeId: string, currentUserId: string | null, file: File | null) {
  const body = new FormData()
  if (file) body.append('photo', file)
  const ctx: MockRouteContext = {
    pathParams: { id: placeId },
    searchParams: new URLSearchParams(),
    body,
    currentUserId,
  }
  return photoRoute.handler(ctx)
}

function validJpeg(): File {
  return new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

describe('POST /places/:id/photo (mock route)', () => {
  // place-6 is owned by user-2 (seed data); place-1 is owned by user-1.
  it('403 PLACE_FORBIDDEN when the caller does not own the place, even with a valid file', () => {
    const result = callRoute('place-6', 'user-1', validJpeg())

    expect('error' in result && result.error.status).toBe(403)
    expect('error' in result && result.error.data.error.code).toBe('PLACE_FORBIDDEN')
  })

  // Regression for the documented precedence (places.mockRoutes.ts comment,
  // mirroring the real backend's multer-fileFilter-before-controller order):
  // an invalid file must 400 even for a place the caller doesn't own — it
  // must never leak a 403 (which would confirm the place exists and is someone
  // else's) ahead of the file-shape check.
  it('400 INVALID_FILE for a disallowed MIME type, checked before ownership', () => {
    const gif = new File(['fake-gif-bytes'], 'photo.gif', { type: 'image/gif' })

    const result = callRoute('place-6', 'user-1', gif)

    expect('error' in result && result.error.status).toBe(400)
    expect('error' in result && result.error.data.error.code).toBe('INVALID_FILE')
  })

  it('400 INVALID_FILE for a file over the 5 MB cap, even for the owner of the place', () => {
    const oversized = new File([new ArrayBuffer(MAX_PHOTO_BYTES + 1)], 'photo.jpg', {
      type: 'image/jpeg',
    })

    const result = callRoute('place-1', 'user-1', oversized)

    expect('error' in result && result.error.status).toBe(400)
    expect('error' in result && result.error.data.error.code).toBe('INVALID_FILE')
  })

  it('400 INVALID_FILE when no file is attached at all', () => {
    const result = callRoute('place-1', 'user-1', null)

    expect('error' in result && result.error.status).toBe(400)
    expect('error' in result && result.error.data.error.code).toBe('INVALID_FILE')
  })

  it('accepts a valid file from the owner and stores the resulting photo URL', () => {
    const result = callRoute('place-1', 'user-1', validJpeg())

    expect('data' in result).toBe(true)
    const data = 'data' in result ? (result.data as { photoUrl: string }) : undefined
    expect(data?.photoUrl).toBe('blob:mock-url')
    expect(mockDb.places.find((p) => p.id === 'place-1')?.photoUrl).toBe('blob:mock-url')
  })
})
