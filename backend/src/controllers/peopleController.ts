import type { Request, Response, NextFunction } from 'express'
import { closeFriendSchema } from '../schemas/peopleSchemas'
import * as peopleService from '../services/peopleService'
import { createError } from '../middleware/errorHandler'

export async function searchPeopleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : ''
    const people = await peopleService.searchPeople(q, req.userId!)
    res.json({ people })
  } catch (err) {
    next(err)
  }
}

export async function getPersonHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const person = await peopleService.getPersonDetail(req.params.id!, req.userId ?? null)
    res.json(person)
  } catch (err) {
    next(err)
  }
}

export async function followHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await peopleService.followPerson(req.userId!, req.params.id!)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function unfollowHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await peopleService.unfollowPerson(req.userId!, req.params.id!)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function closeFriendHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = closeFriendSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные', 'VALIDATION_ERROR'))
    }
    const result = await peopleService.setCloseFriend(req.userId!, req.params.id!, parsed.data.isCloseFriend)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getPersonPlacesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const places = await peopleService.getPersonPlaces(req.params.id!, req.userId ?? null)
    res.json({ places })
  } catch (err) {
    next(err)
  }
}

export async function getPersonCollectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const collections = await peopleService.getPersonCollections(req.params.id!)
    res.json({ collections })
  } catch (err) {
    next(err)
  }
}
