import type { Request, Response, NextFunction } from 'express'
import * as feedService from '../services/feedService'
import { parseFeedLimit } from '../schemas/feedSchemas'

export async function getFeedHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null
    const limit = parseFeedLimit(req.query.limit)
    const result = await feedService.getFeed(req.userId!, cursor, limit)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
