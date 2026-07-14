import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { uploadPhotoHandler } from './photoController'
import * as placeService from '../services/placeService'

describe('uploadPhotoHandler', () => {
  // multer's fileFilter (backend/src/lib/upload.ts) silently drops a disallowed
  // file — req.file is left undefined rather than throwing. The controller must
  // treat that as 400 INVALID_FILE, and must do so before ever calling
  // placeService (i.e. before the ownership check), matching the mock route's
  // documented precedence in places.mockRoutes.ts.
  it('calls next with 400 INVALID_FILE when multer rejected the file (req.file is undefined)', async () => {
    const setPlacePhotoSpy = vi.spyOn(placeService, 'setPlacePhoto')
    const req = { file: undefined, params: { id: 'place-1' }, userId: 'user-1' } as unknown as Request
    const res = {} as Response
    const next = vi.fn() as NextFunction

    await uploadPhotoHandler(req, res, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'INVALID_FILE' }),
    )
    expect(setPlacePhotoSpy).not.toHaveBeenCalled()
  })
})
