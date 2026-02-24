import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface TryOnHistoryResultsProps {
  data: TryOnHistoryResponse | null
}

export function TryOnHistoryResults({ data }: TryOnHistoryResultsProps) {
  if (!data) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Results ({data.items.length}/{data.total}) request_id={data.request_id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs found for current filters.</p>
        ) : null}
        {data.items.map((item) => (
          <div className="rounded-lg border p-3 text-sm" key={item.id}>
            <p>
              <strong>job_id:</strong> {item.id}
            </p>
            <p>
              <strong>status:</strong> {item.status}
            </p>
            <p>
              <strong>model:</strong> {item.model}
            </p>
            <p>
              <strong>product_id:</strong> {item.product_id}
            </p>
            <p>
              <strong>visitor_id:</strong> {item.visitor_id}
            </p>
            <p>
              <strong>provider_job_id:</strong> {item.provider_job_id ?? '-'}
            </p>
            <p>
              <strong>result_url (platform):</strong>{' '}
              {item.result_url ? (
                <a className="underline" href={item.result_url} rel="noreferrer" target="_blank">
                  {item.result_url}
                </a>
              ) : (
                '-'
              )}
            </p>
            <p>
              <strong>created_at:</strong> {item.created_at}
            </p>
            <p>
              <strong>updated_at:</strong> {item.updated_at}
            </p>

            {item.events && item.events.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 font-semibold">Events:</p>
                <div className="space-y-2">
                  {item.events.map((event) => (
                    <div className="rounded bg-muted/50 p-2 text-xs" key={event.id}>
                      <div className="flex justify-between">
                        <span className="font-medium">{event.event_type}</span>
                        <span className="text-muted-foreground">{event.occurred_at}</span>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <pre className="mt-1 overflow-x-auto text-[10px] whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
