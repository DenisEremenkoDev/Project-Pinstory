import type { Request, Response, NextFunction } from 'express'
import { updateProfileSchema } from '../schemas/profileSchemas'
import * as profileService from '../services/profileService'
import { createError } from '../middleware/errorHandler'

export async function getProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.userId!)
    res.json(profile)
  } catch (err) {
    next(err)
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные профиля', 'VALIDATION_ERROR'))
    }
    const profile = await profileService.updateProfile(req.userId!, parsed.data)
    res.json(profile)
  } catch (err) {
    next(err)
  }
}
