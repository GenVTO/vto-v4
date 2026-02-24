import type { TryOnJobEvent } from './types'

export function calculateDuration(start: string, end: string): string {
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

export function getStatusVariant(
  status: string,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (status === 'completed') {
    return 'default' // Using default (primary color) for success/completed
  }
  if (status === 'failed') {
    return 'destructive'
  }
  return 'secondary'
}

export function getOriginalImageUrl(events?: TryOnJobEvent[]): string | undefined {
  if (!events) {
    return undefined
  }
  // Check provider.submit.started event which now has image URLs in metadata
  const startEvent = events.find((e) => e.event_type === 'provider_submit_started')
  if (startEvent?.metadata?.person_image_url) {
    return startEvent.metadata.person_image_url as string
  }
  // Fallback to older events if any
  const oldStartEvent = events.find((e) => e.event_type === 'provider.submit.start')
  return (oldStartEvent?.metadata as any)?.request?.user_image_url
}

export function getProductImageUrl(events?: TryOnJobEvent[]): string | undefined {
  if (!events) {
    return undefined
  }
  // Check provider.submit.started event which now has image URLs in metadata
  const startEvent = events.find((e) => e.event_type === 'provider_submit_started')
  if (startEvent?.metadata?.product_image_url) {
    return startEvent.metadata.product_image_url as string
  }
  // Fallback to older events if any
  const oldStartEvent = events.find((e) => e.event_type === 'provider.submit.start')
  return (oldStartEvent?.metadata as any)?.request?.garment_image_url
}
