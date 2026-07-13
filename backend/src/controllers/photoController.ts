import type { Request, Response, NextFunction } from 'express'
import * as placeService from '../services/placeService'
import { publicPhotoPath } from '../lib/upload'
import { createError } from '../middleware/errorHandler'

// multer's fileFilter silently drops a disallowed file, leaving req.file
// undefined — treat that as a validation error.
export async function uploadPhotoHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      return void next(createError(400, 'Недопустимый файл изображения', 'INVALID_FILE'))
    }
    const result = await placeService.setPlacePhoto(
      req.params.id!,
      req.userId!,
      publicPhotoPath(req.file.filename),
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}
