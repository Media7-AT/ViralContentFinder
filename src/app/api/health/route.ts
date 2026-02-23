import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import type { HealthResponse } from '@/types/api'

export async function GET(): Promise<NextResponse<HealthResponse>> {
  let db: 'connected' | 'error' = 'error'
  let redisStatus: 'connected' | 'error' = 'error'

  try {
    await prisma.$queryRaw`SELECT 1`
    db = 'connected'
  } catch {}

  try {
    await redis.ping()
    redisStatus = 'connected'
  } catch {}

  const status = db === 'connected' && redisStatus === 'connected' ? 'ok' : 'error'

  return NextResponse.json(
    { status, db, redis: redisStatus, timestamp: new Date().toISOString() },
    { status: status === 'ok' ? 200 : 503 }
  )
}
