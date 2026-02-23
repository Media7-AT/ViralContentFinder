import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { EvaluateAlertsPayload } from '@/lib/queue'
import type { AlertCondition } from '@/types/alert'

export async function processEvaluateAlerts(job: Job<EvaluateAlertsPayload>): Promise<void> {
  const { video_id, virality_score } = job.data

  const activeRules = await prisma.alertRule.findMany({
    where: { active: true },
  })

  if (activeRules.length === 0) return

  const video = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
  })
  if (!video) return

  for (const rule of activeRules) {
    const condition = rule.conditionJson as unknown as AlertCondition
    const fieldValue = getFieldValue(video, condition.field)

    if (fieldValue === null) continue

    const triggered = evaluateCondition(fieldValue, condition.op, Number(condition.value))
    if (!triggered) continue

    // Check for duplicate (don't fire same rule twice for same video)
    const existing = await prisma.alertNotification.findFirst({
      where: { ruleId: rule.id, videoId: video_id },
    })
    if (existing) continue

    await prisma.alertNotification.create({
      data: {
        ruleId: rule.id,
        videoId: video_id,
        payloadJson: {
          video_id,
          virality_score,
          rule_name: rule.name,
          condition: condition as unknown as Prisma.InputJsonValue,
          field_value: fieldValue,
        } as Prisma.InputJsonValue,
      },
    })

    job.log(`Alert fired: rule="${rule.name}" for video=${video_id}`)
  }
}

function getFieldValue(video: Record<string, unknown>, field: string): number | null {
  const map: Record<string, string> = {
    virality_score: 'viralityScore',
    hsi: 'hsi',
    ev_24h: 'ev24h',
    ev_1h: 'ev1h',
    views_at_6h: 'viewsAt6h',
  }
  const key = map[field]
  if (!key) return null
  const val = video[key]
  if (val === null || val === undefined) return null
  return typeof val === 'bigint' ? Number(val) : Number(val)
}

function evaluateCondition(
  fieldValue: number,
  op: AlertCondition['op'],
  threshold: number
): boolean {
  switch (op) {
    case 'gte':
      return fieldValue >= threshold
    case 'lte':
      return fieldValue <= threshold
    case 'gt':
      return fieldValue > threshold
    case 'lt':
      return fieldValue < threshold
    case 'eq':
      return fieldValue === threshold
    default:
      return false
  }
}
