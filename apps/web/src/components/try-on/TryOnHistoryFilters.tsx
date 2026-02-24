import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TryOnHistoryFiltersProps {
  apiKey: string
  isLoading: boolean
  limit: string
  offset: string
  onApiKeyChange: (value: string) => void
  onFetchHistory: () => void
  onLimitChange: (value: string) => void
  onOffsetChange: (value: string) => void
  onProductIdChange: (value: string) => void
  onShopDomainChange: (value: string) => void
  onVisitorIdChange: (value: string) => void
  productId: string
  shopDomain: string
  visitorId: string
}

export function TryOnHistoryFilters({
  apiKey,
  isLoading,
  limit,
  offset,
  onApiKeyChange,
  onFetchHistory,
  onLimitChange,
  onOffsetChange,
  onProductIdChange,
  onShopDomainChange,
  onVisitorIdChange,
  productId,
  shopDomain,
  visitorId,
}: TryOnHistoryFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Try-On History (DB)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="history-api-key">API Key</Label>
            <Input
              id="history-api-key"
              onChange={(e) => onApiKeyChange(e.target.value)}
              value={apiKey}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-shop-domain">Shop domain</Label>
            <Input
              id="history-shop-domain"
              onChange={(e) => onShopDomainChange(e.target.value)}
              value={shopDomain}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="history-visitor-id">Visitor ID (optional)</Label>
            <Input
              id="history-visitor-id"
              onChange={(e) => onVisitorIdChange(e.target.value)}
              placeholder="visitor_12345678"
              value={visitorId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-product-id">Product ID (optional)</Label>
            <Input
              id="history-product-id"
              onChange={(e) => onProductIdChange(e.target.value)}
              placeholder="prod_xxx"
              value={productId}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="history-limit">Limit</Label>
            <Input
              id="history-limit"
              onChange={(e) => onLimitChange(e.target.value)}
              value={limit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-offset">Offset</Label>
            <Input
              id="history-offset"
              onChange={(e) => onOffsetChange(e.target.value)}
              value={offset}
            />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onFetchHistory}>
          {isLoading ? 'Loading...' : 'Load History'}
        </Button>
      </CardContent>
    </Card>
  )
}
