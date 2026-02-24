import React from 'react'

import type { TryOnJobEvent } from './types'

import { calculateEventDuration } from './utils'

interface HistoryTimelineProps {
  events?: TryOnJobEvent[]
}

export function HistoryTimeline({ events }: HistoryTimelineProps) {
  if (!events || events.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-900">Timeline</h4>
      <div className="relative ml-2 space-y-6 border-l border-slate-200 pl-4">
        {events.map((event, index) => {
          const prevEvent = index > 0 ? events[index - 1] : undefined
          const eventDuration = calculateEventDuration(event.occurred_at, prevEvent?.occurred_at)
          return (
            <div key={event.id} className="relative">
              <div className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border border-white bg-slate-300 ring-4 ring-white" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium break-words text-slate-900">{event.event_type}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{new Date(event.occurred_at).toLocaleTimeString()}</span>
                  {eventDuration && <span>(+{eventDuration})</span>}
                </div>
                {event.metadata && (
                  <pre className="mt-1 w-full overflow-x-auto rounded bg-slate-100 p-2 text-[10px] text-slate-600">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
