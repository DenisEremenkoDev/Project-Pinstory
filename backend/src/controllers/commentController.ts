import type { Request, Response, NextFunction } from 'express'
import { createCommentSchema, updateCommentSchema } from '../schemas/commentSchemas'
import * as commentService from '../services/commentService'
import { createError } from '../middleware/errorHandler'

export async function getCommentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const comments = await commentService.getComments(req.params.id!, req.userId ?? null)
    res.json({ comments })
  } catch (err) {
    next(err)
  }
}

export async function createCommentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные комментария', 'VALIDATION_ERROR'))
    }
    const comment = await commentService.createComment(req.params.id!, req.userId!, parsed.data)
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
}

export async function updateCommentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      return void next(createError(400, 'Некорректные данные комментария', 'VALIDATION_ERROR'))
    }
    const comment = await commentService.updateComment(
      req.params.id!,
      req.params.commentId!,
      req.userId!,
      parsed.data,
    )
    res.json(comment)
  } catch (err) {
    next(err)
  }
}

export async function deleteCommentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await commentService.deleteComment(req.params.id!, req.params.commentId!, req.userId!)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
