import { z } from 'zod'

const platformEnum = z.enum(['youtube', 'tiktok', 'instagram', 'facebook'])

export const ingestTriggerSchema = z.object({
  platforms: z.array(platformEnum).optional(),
  keyword_override: z.array(z.string().min(1).max(100)).optional(),
})

export const ingestVideoSchema = z.object({
  video_id: z.string().min(1).max(255),
  platform: platformEnum,
})

export type IngestTriggerInput = z.infer<typeof ingestTriggerSchema>
export type IngestVideoInput = z.infer<typeof ingestVideoSchema>
