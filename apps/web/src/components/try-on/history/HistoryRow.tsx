import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'

import type { TryOnHistoryItem } from './types'

import { HistoryImages } from './HistoryImages'
import { HistoryTimeline } from './HistoryTimeline'
import { calculateDuration, getStatusVariant } from './utils'

interface HistoryRowProps {
  item: TryOnHistoryItem
}

export function HistoryRow({ item }: HistoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const duration = calculateDuration(item.created_at, item.updated_at)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}...</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
        </TableCell>
        <TableCell className="font-mono text-xs">{item.product_id}</TableCell>
        <TableCell className="font-mono text-xs">{item.visitor_id.slice(0, 8)}...</TableCell>
        <TableCell className="font-mono text-xs">{item.provider_job_id || '-'}</TableCell>
        <TableCell className="text-xs">{duration}</TableCell>
        <TableCell className="text-right text-xs">
          {new Date(item.created_at).toLocaleString()}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
          <TableCell colSpan={8} className="p-4 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <HistoryImages item={item} />
              <HistoryTimeline events={item.events} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
