import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
  prismaPool?: Pool
  prismaAdapter?: PrismaPg
}

const globalForPrisma = globalThis as GlobalWithPrisma
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required to initialize PrismaClient.')
}

const pool = globalForPrisma.prismaPool ?? new Pool(databaseUrl ? { connectionString: databaseUrl } : undefined)
const adapter = globalForPrisma.prismaAdapter ?? new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaPool = pool
  globalForPrisma.prismaAdapter = adapter
  globalForPrisma.prisma = prisma
}
