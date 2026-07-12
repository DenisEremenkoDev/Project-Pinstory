// Augment Express Request to carry the verified userId set by requireAuth middleware.
// export {} makes this a module file so declare module merges instead of replaces.
import type { Logger } from 'pino'

export {}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
    log: Logger // attached by pino-http
  }
}
