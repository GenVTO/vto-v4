import React, { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export function SystemStatus() {
  const [status, setStatus] = useState<'operational' | 'degraded' | 'down' | 'checking'>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) {
          setStatus('operational')
        } else {
          setStatus('degraded')
        }
      })
      .catch(() => {
        setStatus('down')
      })
  }, [])

  if (status === 'checking') {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'relative flex h-2 w-2',
          status === 'operational' && 'bg-green-500',
          status === 'degraded' && 'bg-yellow-500',
          status === 'down' && 'bg-red-500',
        )}
      >
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            status === 'operational' && 'bg-green-500',
            status === 'degraded' && 'bg-yellow-500',
            status === 'down' && 'bg-red-500',
          )}
        />
      </span>
      <span className="text-sm font-medium text-slate-400">
        {status === 'operational' && 'All systems operational'}
        {status === 'degraded' && 'Degraded performance'}
        {status === 'down' && 'System outage'}
      </span>
    </div>
  )
}
