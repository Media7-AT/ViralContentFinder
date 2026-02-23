import { z } from 'zod'

export const settingsSchema = z.object({
  polling_interval_minutes: z
    .string()
    .transform(Number)
    .refine((v) => v >= 5 && v <= 1440, 'Polling interval must be between 5 and 1440 minutes')
    .optional(),
  tier1_vs_floor: z
    .string()
    .transform(Number)
    .refine((v) => v >= 0 && v <= 1, 'VS floor must be between 0 and 1')
    .optional(),
  tier2_vs_floor: z
    .string()
    .transform(Number)
    .refine((v) => v >= 0 && v <= 1, 'VS floor must be between 0 and 1')
    .optional(),
  hsi_alert_floor: z
    .string()
    .transform(Number)
    .refine((v) => v >= 0 && v <= 100, 'HSI floor must be between 0 and 100')
    .optional(),
  raw_data_ttl_days: z
    .string()
    .transform(Number)
    .refine((v) => v >= 7 && v <= 365, 'TTL must be between 7 and 365 days')
    .optional(),
  enabled_platforms: z.string().optional(),
  dach_keywords: z.string().optional(),
  anonymize_channels: z.enum(['true', 'false']).optional(),
})

export type SettingsInput = z.input<typeof settingsSchema>
export type SettingsOutput = z.output<typeof settingsSchema>
