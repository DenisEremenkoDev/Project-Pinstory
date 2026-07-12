import type { Request, Response, NextFunction } from 'express'
import { createPlaceSchema, updatePlaceSchema } from '../schemas/placeSchemas'
import * as placeService from '../services/placeService'
import { createError } from '../middleware/errorHandler'

export async function listPlacesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const places = await placeService.listOwnPlaces(req.userId!)
    res.json({ places })
  } catch (err) {
    next(err)
  }
}

export async function getPlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const placeId = req.params.id!
    // Public read: req.userId is set only if a valid token was provided (optionalAuth).
    const place = await placeService.getPlaceDetail(placeId, req.userId ?? null)
    res.json(place)
  } catch (err) {
    next(err)
  }
}

export async function createPlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createPlaceSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные места', 'VALIDATION_ERROR'))
    }
    const place = await placeService.createPlace(req.userId!, parsed.data)
    res.status(201).json(place)
  } catch (err) {
    next(err)
  }
}

export async function updatePlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updatePlaceSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные места', 'VALIDATION_ERROR'))
    }
    const place = await placeService.updatePlace(req.params.id!, req.userId!, parsed.data)
    res.json(place)
  } catch (err) {
    next(err)
  }
}

export async function deletePlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await placeService.deletePlace(req.params.id!, req.userId!)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
