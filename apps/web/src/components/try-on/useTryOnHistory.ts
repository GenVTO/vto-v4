import { useCallback, useState } from 'react'

import type { TryOnHistoryResponse } from './TryOnHistoryResults'

const DEFAULT_API_KEY = 'dev_vto_api_key'
const DEFAULT_SHOP_DOMAIN = 'demo-shop.myshopify.com'

export function useTryOnHistory() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [shopDomain, setShopDomain] = useState(DEFAULT_SHOP_DOMAIN)
  const [visitorId, setVisitorId] = useState('')
  const [productId, setProductId] = useState('')
  const [limit, setLimit] = useState('20')
  const [offset, setOffset] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TryOnHistoryResponse | null>(null)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({
        limit: limit.trim() || '20',
        offset: offset.trim() || '0',
        shop_domain: shopDomain.trim(),
      })
      if (visitorId.trim()) {
        query.set('visitor_id', visitorId.trim())
      }
      if (productId.trim()) {
        query.set('product_id', productId.trim())
      }

      const response = await fetch(`/api/v1/try-on/history?${query.toString()}`, {
        headers: { 'x-api-key': apiKey.trim() },
      })
      const payload = (await response.json().catch(() => ({}))) as Partial<TryOnHistoryResponse> & {
        message?: string
      }

      if (!response.ok) {
        setData(null)
        setError(payload.message ?? `History request failed (${response.status})`)
        return
      }

      setData(payload as TryOnHistoryResponse)
    } catch (fetchError) {
      setData(null)
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError))
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, limit, offset, shopDomain, visitorId, productId])

  return {
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
  }
}
