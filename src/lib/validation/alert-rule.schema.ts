import { z } from 'zod'

export const alertConditionSchema = z.object({
  field: z.enum(['virality_score', 'hsi', 'ev_24h', 'ev_1h', 'views_at_6h']),
  op: z.enum(['gte', 'lte', 'gt', 'lt', 'eq']),
  value: z.number(),
})

export const alertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  condition_json: alertConditionSchema,
  delivery_channel: z.enum(['in_app', 'slack', 'email']).optional(),
  delivery_target: z.string().url().optional().or(z.string().email().optional()),
  active: z.boolean().default(true),
})

export type AlertRuleInput = z.infer<typeof alertRuleSchema>
