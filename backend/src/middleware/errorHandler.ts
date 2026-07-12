import type { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'
  const message = statusCode === 500 ? 'Внутренняя ошибка сервера' : (err.message || 'Что-то пошло не так')

  if (statusCode === 500) {
    // Logger is attached to res.log by pino-http
    console.error(err)
  }

  res.status(statusCode).json({ error: { message, code } })
}

export function createError(statusCode: number, message: string, code: string): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}
