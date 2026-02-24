'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { TryOnHistoryFilters } from './TryOnHistoryFilters'
import { TryOnHistoryResults } from './TryOnHistoryResults'
import { useTryOnHistory } from './useTryOnHistory'

export function TryOnHistoryViewer() {
  const {
    apiKey,
    data,
    error,
    fetchHistory,
    isLoading,
    limit,
    offset,
    productId,
    setApiKey,
    setLimit,
    setOffset,
    setProductId,
    setShopDomain,
    setVisitorId,
    shopDomain,
    visitorId,
  } = useTryOnHistory()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Try-On History (DB)</CardTitle>
        </CardHeader>
        <CardContent>
          <TryOnHistoryFilters
            apiKey={apiKey}
            isLoading={isLoading}
            limit={limit}
            offset={offset}
            onApiKeyChange={setApiKey}
            onFetchHistory={fetchHistory}
            onLimitChange={setLimit}
            onOffsetChange={setOffset}
            onProductIdChange={setProductId}
            onShopDomainChange={setShopDomain}
            onVisitorIdChange={setVisitorId}
            productId={productId}
            shopDomain={shopDomain}
            visitorId={visitorId}
          />
          {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <TryOnHistoryResults data={data} />
    </div>
  )
}
