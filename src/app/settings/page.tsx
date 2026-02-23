'use client'

import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const settingsFormSchema = z.object({
  polling_interval_minutes: z.coerce.number().min(5).max(1440),
  tier1_vs_floor: z.coerce.number().min(0).max(1),
  tier2_vs_floor: z.coerce.number().min(0).max(1),
  hsi_alert_floor: z.coerce.number().min(0).max(100),
  raw_data_ttl_days: z.coerce.number().min(7).max(365),
  youtube_api_key: z.string().optional(),
  apify_api_token: z.string().optional(),
  audd_api_token: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

const DEFAULTS: SettingsFormValues = {
  polling_interval_minutes: 30,
  tier1_vs_floor: 0.78,
  tier2_vs_floor: 0.6,
  hsi_alert_floor: 55,
  raw_data_ttl_days: 90,
  youtube_api_key: '',
  apify_api_token: '',
  audd_api_token: '',
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema) as Resolver<SettingsFormValues>,
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        reset({
          polling_interval_minutes: Number(data.polling_interval_minutes ?? 30),
          tier1_vs_floor: Number(data.tier1_vs_floor ?? 0.78),
          tier2_vs_floor: Number(data.tier2_vs_floor ?? 0.6),
          hsi_alert_floor: Number(data.hsi_alert_floor ?? 55),
          raw_data_ttl_days: Number(data.raw_data_ttl_days ?? 90),
          youtube_api_key: data.youtube_api_key ?? '',
          apify_api_token: data.apify_api_token ?? '',
          audd_api_token: data.audd_api_token ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [reset])

  const onSubmit = async (values: SettingsFormValues) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      toast.success('Settings saved')
      reset(values)
    } else {
      toast.error('Failed to save settings')
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading settings...</div>
  }

  return (
    <div className="max-w-2xl space-y-6 pb-8">
      <h1 className="text-lg font-bold">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingField
              label="YouTube Data API Key"
              type="password"
              {...register('youtube_api_key')}
            />
            <SettingField
              label="Apify API Token"
              type="password"
              {...register('apify_api_token')}
            />
            <SettingField label="AudD API Token" type="password" {...register('audd_api_token')} />
          </CardContent>
        </Card>

        {/* Polling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Polling Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingField
              label="Polling Interval (minutes)"
              type="number"
              error={errors.polling_interval_minutes?.message}
              {...register('polling_interval_minutes')}
            />
          </CardContent>
        </Card>

        {/* Virality Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Virality Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingField
              label="Tier 1 VS Floor (0–1)"
              type="number"
              step="0.01"
              error={errors.tier1_vs_floor?.message}
              {...register('tier1_vs_floor')}
            />
            <SettingField
              label="Tier 2 VS Floor (0–1)"
              type="number"
              step="0.01"
              error={errors.tier2_vs_floor?.message}
              {...register('tier2_vs_floor')}
            />
            <SettingField
              label="HSI Alert Floor (%)"
              type="number"
              error={errors.hsi_alert_floor?.message}
              {...register('hsi_alert_floor')}
            />
          </CardContent>
        </Card>

        {/* GDPR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Retention (GDPR)</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingField
              label="Raw API Data TTL (days)"
              type="number"
              error={errors.raw_data_ttl_days?.message}
              description="Records older than this are deleted. Min 7, max 365."
              {...register('raw_data_ttl_days')}
            />
          </CardContent>
        </Card>

        <Separator />

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving...' : 'Save All Settings'}
        </Button>
      </form>
    </div>
  )
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  description?: string
}

function SettingField({ label, error, description, ...props }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Input className="max-w-xs" {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
