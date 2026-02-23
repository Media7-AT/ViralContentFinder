import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  _prismaClient: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma._prismaClient) {
    globalForPrisma._prismaClient = createClient()
  }
  return globalForPrisma._prismaClient
}

// Lazy proxy: the Prisma client is only instantiated on first query,
// not at module import time. This prevents build-time failures when
// DATABASE_URL is not available in the build environment.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return Reflect.get(getClient(), prop)
  },
})
