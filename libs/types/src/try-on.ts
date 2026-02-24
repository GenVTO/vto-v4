export type TryOnModel = 'normal' | 'advanced'

export type TryOnJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'provider_expired'

interface CreateTryOnBaseRequest {
  shop_domain: string
  product_id: string
  product_image_url: string
  visitor_id: string
  customer_id?: string | null
  model?: TryOnModel
  idempotency_key?: string
  metadata?: Record<string, unknown>
}

export type CreateTryOnRequest =
  | (CreateTryOnBaseRequest & { user_image_url: string; user_image?: never })
  | (CreateTryOnBaseRequest & { user_image: string; user_image_url?: never })

export interface CreateTryOnResponse {
  job_id: string
  status: TryOnJobStatus
  cache_hit: boolean
  credits_charged: 0 | 1
  result_url?: string | null
}

export interface TryOnJobEvent {
  id: string
  job_id: string
  event_type: string
  metadata?: Record<string, unknown>
  occurred_at: string
}

export interface TryOnJob {
  id: string
  shop_domain: string
  product_id: string
  shopify_product_handle?: string | null
  visitor_id: string
  customer_id?: string | null
  model: TryOnModel
  status: TryOnJobStatus
  result_url?: string | null
  user_image_hash: string
  credits_charged: number
  provider_job_id?: string | null
  error_code?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
  events?: TryOnJobEvent[]
}

export interface TryOnHistoryResponse {
  items: TryOnJob[]
  total: number
  offset: number
  limit: number
}

export interface TryOnHistoryQuery {
  shop_domain: string
  visitor_id?: string
  product_id?: string
  limit?: number
  offset?: number
}
