import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return `${(diff / 1000).toFixed(2)}s`
}

export function calculateEventDuration(
  current: string,
  previous: string | undefined,
): string | null {
  if (!previous) {
    return null
  }
  const diff = new Date(current).getTime() - new Date(previous).getTime()
  return `${(diff / 1000).toFixed(2)}s`
}

function getStatusVariant(status: string): 'success' | 'destructive' | 'default' {
  if (status === 'completed') {
    return 'success'
  }
  if (status === 'failed') {
    return 'destructive'
  }
  return 'default'
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
      <CardContent>
        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs found for current filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Job ID</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => {
                const totalDuration = calculateDuration(item.created_at, item.updated_at)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.product_id}</TableCell>
                    <TableCell className="font-mono">{totalDuration}</TableCell>
                    <TableCell>
                      {item.result_url ? (
                        <a
                          className="text-blue-500 underline hover:text-blue-700"
                          href={item.result_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
