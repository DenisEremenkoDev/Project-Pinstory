import type { Request, Response, NextFunction } from 'express'
import { setFeedbackSchema } from '../schemas/feedbackSchemas'
import * as feedbackService from '../services/feedbackService'
import { createError } from '../middleware/errorHandler'

export async function setFeedbackHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = setFeedbackSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректная реакция', 'VALIDATION_ERROR'))
    }
    const result = await feedbackService.setFeedback(req.params.id!, req.userId!, parsed.data.sentiment)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function clearFeedbackHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await feedbackService.clearFeedback(req.params.id!, req.userId!)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
