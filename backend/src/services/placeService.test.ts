import { describe, it, expect, vi, beforeEach } from 'vitest'

// `prisma.ts` exports a single PrismaClient instance; mocking the module lets
// setPlacePhoto's ownership logic be exercised without a real database — the
// same lightweight-mocking approach already used for geocodeService.test.ts
// (vi.stubGlobal for fetch there, vi.mock for the Prisma import here).
vi.mock('../prisma', () => ({
  prisma: {
    place: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../prisma'
import { setPlacePhoto } from './placeService'

const mockedFindUnique = vi.mocked(prisma.place.findUnique)
const mockedUpdate = vi.mocked(prisma.place.update)

describe('setPlacePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Mirrors testing.md P1-#6 ("PATCH/DELETE on someone else's place → 403")
  // for the photo endpoint — attaching a photo is a mutation on the place and
  // must be owner-only regardless of the place's visibility.
  it('throws 403 PLACE_FORBIDDEN when the place belongs to someone else', async () => {
    mockedFindUnique.mockResolvedValue({
      id: 'place-6',
      ownerId: 'user-2',
      visibility: 'public',
    } as never)

    await expect(setPlacePhoto('place-6', 'user-1', '/uploads/abc.jpg')).rejects.toMatchObject({
      statusCode: 403,
      code: 'PLACE_FORBIDDEN',
    })
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('throws 403 PLACE_FORBIDDEN when the place does not exist (not-found and not-owned collapse the same way)', async () => {
    mockedFindUnique.mockResolvedValue(null)

    await expect(setPlacePhoto('missing-place', 'user-1', '/uploads/abc.jpg')).rejects.toMatchObject({
      statusCode: 403,
      code: 'PLACE_FORBIDDEN',
    })
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('sets photoUrl and returns it when the caller owns the place', async () => {
    mockedFindUnique.mockResolvedValue({
      id: 'place-1',
      ownerId: 'user-1',
      visibility: 'private',
    } as never)
    mockedUpdate.mockResolvedValue({} as never)

    const result = await setPlacePhoto('place-1', 'user-1', '/uploads/abc.jpg')

    expect(result).toEqual({ photoUrl: '/uploads/abc.jpg' })
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'place-1' },
      data: { photoUrl: '/uploads/abc.jpg' },
    })
  })
})
