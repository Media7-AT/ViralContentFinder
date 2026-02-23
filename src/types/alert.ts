export type DeliveryChannel = 'in_app' | 'slack' | 'email'

export interface AlertCondition {
  field: string
  op: 'gte' | 'lte' | 'gt' | 'lt' | 'eq'
  value: number | string
}

export interface AlertRule {
  id: number
  name: string
  conditionJson: AlertCondition
  deliveryChannel: DeliveryChannel | null
  deliveryTarget: string | null
  active: boolean
  createdAt: string
}

export interface AlertNotification {
  id: number
  ruleId: number
  videoId: string
  triggeredAt: string
  delivered: boolean
  payloadJson: Record<string, unknown> | null
}
