export interface TryOnJobEvent {
  id: string
  job_id: string
  event_type: string
  metadata?: Record<string, unknown>
  occurred_at: string
}

export interface TryOnHistoryItem {
  created_at: string
  id: string
  model: string
  product_id: string
  provider_job_id?: string | null
  result_url?: string | null
  status: string
  updated_at: string
  visitor_id: string
  events?: TryOnJobEvent[]
}

export interface TryOnHistoryResponse {
  items: TryOnHistoryItem[]
  limit: number
  offset: number
  request_id: string
  total: number
}
