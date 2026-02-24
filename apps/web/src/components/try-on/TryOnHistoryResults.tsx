import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { TryOnHistoryResponse } from './history/types'

import { HistoryRow } from './history/HistoryRow'

interface TryOnHistoryResultsProps {
  data: TryOnHistoryResponse | null
}

export function TryOnHistoryResults({ data }: TryOnHistoryResultsProps) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-slate-500">No history found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Results ({data.total})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Visitor</TableHead>
                <TableHead>Provider Job</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Re-export types for consumers
export type { TryOnHistoryResponse } from './history/types'
