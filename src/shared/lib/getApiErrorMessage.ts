import type { ApiErrorBody } from './apiTypes'

function hasErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data
}

export function getApiErrorMessage(error: unknown, fallback = 'Что-то пошло не так, попробуйте ещё раз'): string {
  if (typeof error !== 'object' || error === null) return fallback

  if ('status' in error && error.status === 429) {
    return 'Слишком много попыток, попробуйте позже'
  }

  if ('data' in error && hasErrorBody(error.data)) {
    return error.data.error.message
  }

  return fallback
}
