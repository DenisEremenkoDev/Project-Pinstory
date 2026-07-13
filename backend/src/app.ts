import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import pino from 'pino'
import { globalLimiter } from './middleware/rateLimits'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/authRoutes'
import placeRoutes from './routes/placeRoutes'
import peopleRoutes from './routes/peopleRoutes'
import collectionRoutes from './routes/collectionRoutes'
import feedRoutes from './routes/feedRoutes'
import profileRoutes from './routes/profileRoutes'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'body.password', 'body.token', 'req.headers.cookie'],
})

const app = express()

// 1. Security headers — must be first
app.use(helmet())

// 2. CORS — explicit origin only, never *; credentials: true for the refresh cookie
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
)

// 3. Global rate limit
app.use(globalLimiter)

// 4. Body parsing + cookie parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

// 5. HTTP request logger
app.use(
  pinoHttp({
    logger,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }),
)

// 6. Serve uploaded photos
app.use('/uploads', express.static('uploads'))

// 7. Routes
app.use('/auth', authRoutes)
app.use('/places', placeRoutes)
app.use('/people', peopleRoutes)
app.use('/collections', collectionRoutes)
app.use('/feed', feedRoutes)
app.use('/profile', profileRoutes)

// Global error handler — must be last
app.use(errorHandler)

export default app
