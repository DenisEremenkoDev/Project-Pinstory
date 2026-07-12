import { PrismaClient } from '@prisma/client'

// Single PrismaClient instance for the whole app.
// Instantiating more than one causes connection pool exhaustion.
export const prisma = new PrismaClient()
