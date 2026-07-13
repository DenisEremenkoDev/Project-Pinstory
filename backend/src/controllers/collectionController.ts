import type { Request, Response, NextFunction } from 'express'
import { createCollectionSchema, updateCollectionSchema } from '../schemas/collectionSchemas'
import * as collectionService from '../services/collectionService'
import { createError } from '../middleware/errorHandler'

export async function getCollectionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await collectionService.getCollections(req.userId!)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function createCollectionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createCollectionSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные коллекции', 'VALIDATION_ERROR'))
    }
    const collection = await collectionService.createCollection(req.userId!, parsed.data)
    res.status(201).json(collection)
  } catch (err) {
    next(err)
  }
}

export async function updateCollectionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateCollectionSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные коллекции', 'VALIDATION_ERROR'))
    }
    const collection = await collectionService.updateCollection(req.params.id!, req.userId!, parsed.data)
    res.json(collection)
  } catch (err) {
    next(err)
  }
}

export async function deleteCollectionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await collectionService.deleteCollection(req.params.id!, req.userId!)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function addPlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await collectionService.addPlaceToCollection(req.params.id!, req.params.placeId!, req.userId!)
    res.status(200).end()
  } catch (err) {
    next(err)
  }
}

export async function removePlaceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await collectionService.removePlaceFromCollection(req.params.id!, req.params.placeId!, req.userId!)
    res.status(200).end()
  } catch (err) {
    next(err)
  }
}
