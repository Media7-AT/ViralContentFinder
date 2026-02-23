import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { settingsSchema } from '@/lib/validation/settings.schema'
import type { AppSettings } from '@/types/api'

export async function GET(): Promise<NextResponse<AppSettings>> {
  const rows = await prisma.appSetting.findMany()
  const settings: AppSettings = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const updates = Object.entries(body as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({ key, value: String(value) }))

  const updated: string[] = []
  for (const { key, value } of updates) {
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
    updated.push(key)
  }

  return NextResponse.json({ updated })
}
