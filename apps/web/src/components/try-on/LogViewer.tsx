'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface LogEntry {
  id: string
  time: string
  message: string
  type?: 'info' | 'success' | 'error'
}

interface LogViewerProps {
  logs: LogEntry[]
  isLoading: boolean
}

export function LogViewer({ logs, isLoading }: LogViewerProps) {
  if (logs.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="animate-in rounded-lg border bg-muted/50 p-4 fade-in slide-in-from-bottom-2">
      <h3 className="mb-2 text-sm font-semibold">Process Log</h3>
      <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 h-32 space-y-1 overflow-y-auto pr-2 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-2">
            <span className="shrink-0 text-muted-foreground/60">[{log.time}]</span>
            {log.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
            {log.type === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            <span
              className={cn(
                log.type === 'error' && 'font-bold text-red-500',
                log.type === 'success' && 'font-bold text-green-500',
                !log.type && 'text-foreground',
              )}
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
