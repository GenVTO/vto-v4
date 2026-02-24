import { useState } from 'react'
import { GlassMagnifier } from 'react-image-magnifiers'

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

function getOriginalImageUrl(events?: TryOnJobEvent[]): string | undefined {
  if (!events) {
    return undefined
  }
  const startEvent = events.find((e) => e.event_type === 'provider.submit.start')
  return (startEvent?.metadata as any)?.request?.user_image_url
}

function getProductImageUrl(events?: TryOnJobEvent[]): string | undefined {
  if (!events) {
    return undefined
  }
  const startEvent = events.find((e) => e.event_type === 'provider.submit.start')
  return (startEvent?.metadata as any)?.request?.garment_image_url
}

export function TryOnHistoryResults({ data }: TryOnHistoryResultsProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  if (!data) {
    return null
  }

  const selectedJob = data.items.find((item) => item.id === selectedJobId)
  const originalImageUrl = selectedJob ? getOriginalImageUrl(selectedJob.events) : undefined
  const productImageUrl = selectedJob ? getProductImageUrl(selectedJob.events) : undefined

  return (
    <div className="space-y-6">
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
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-state={selectedJobId === item.id ? 'selected' : undefined}
                      onClick={() => setSelectedJobId(selectedJobId === item.id ? null : item.id)}
                    >
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-blue-500 underline">
                        {item.id}
                      </TableCell>
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
                            onClick={(e) => e.stopPropagation()}
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

      {selectedJob && (
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Job Details</CardTitle>
                <p className="mt-1 font-mono text-sm text-muted-foreground">ID: {selectedJob.id}</p>
              </div>
              <Badge variant={getStatusVariant(selectedJob.status)} className="px-3 py-1 text-sm">
                {selectedJob.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Image Comparison Section */}
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Result Comparison
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-center text-sm font-medium">User Image</p>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted/30">
                      {originalImageUrl ? (
                        <GlassMagnifier
                          imageSrc={originalImageUrl}
                          imageAlt="Original User Image"
                          largeImageSrc={originalImageUrl}
                          magnifierSize="30%"
                          allowOverflow={false}
                          className="h-full w-full object-cover"
                          square
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Not available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-center text-sm font-medium">Product Image</p>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted/30">
                      {productImageUrl ? (
                        <GlassMagnifier
                          imageSrc={productImageUrl}
                          imageAlt="Product Image"
                          largeImageSrc={productImageUrl}
                          magnifierSize="30%"
                          allowOverflow={false}
                          className="h-full w-full object-cover"
                          square
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Not available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-center text-sm font-medium">Result</p>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted/30">
                      {selectedJob.result_url ? (
                        <GlassMagnifier
                          imageSrc={selectedJob.result_url}
                          imageAlt="Result Image"
                          largeImageSrc={selectedJob.result_url}
                          magnifierSize="30%"
                          allowOverflow={false}
                          className="h-full w-full object-cover"
                          square
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Not generated
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Configuration
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{selectedJob.model}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Product ID:</span>
                      <span className="font-medium">{selectedJob.product_id}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Visitor ID:</span>
                      <span className="font-medium">{selectedJob.visitor_id}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">Provider Job ID:</span>
                      <span className="font-mono">{selectedJob.provider_job_id ?? '-'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Event Timeline
                  </h3>
                  {selectedJob.events && selectedJob.events.length > 0 ? (
                    <div className="relative ml-2 space-y-6 border-l-2 border-muted pl-4">
                      {selectedJob.events.map((event, index) => {
                        const prevEvent = index > 0 ? selectedJob.events![index - 1] : undefined
                        const duration = prevEvent
                          ? calculateEventDuration(event.occurred_at, prevEvent.occurred_at)
                          : calculateDuration(selectedJob.created_at, event.occurred_at)

                        return (
                          <div key={event.id} className="relative">
                            <div className="absolute top-1 -left-[21px] h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-muted" />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{event.event_type}</span>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  +{duration}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.occurred_at).toLocaleTimeString()}
                              </span>
                              {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="mt-2 rounded-md bg-muted p-2">
                                  <pre className="overflow-x-auto text-[10px] text-muted-foreground">
                                    {JSON.stringify(event.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No events recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
