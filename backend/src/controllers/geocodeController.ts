import type { Request, Response, NextFunction } from 'express'
import { searchGeocode } from '../services/geocodeService'

export async function geocodeSearchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : ''
    if (!query) {
      res.json({ results: [] })
      return
    }
    const results = await searchGeocode(query)
    res.json({ results })
  } catch (err) {
    next(err)
  }
}
