import type { UseFormSetValue } from 'react-hook-form'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { TryOnFormValues } from './schema'
import type { ShopItem } from './types'

interface UseShopContextProps {
  setValue: UseFormSetValue<TryOnFormValues>
  tenantId: string
}

export function useShopContext({ setValue, tenantId }: UseShopContextProps) {
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [isLoadingShops, setIsLoadingShops] = useState(false)
  const tenantIdRef = useRef(tenantId)

  useEffect(() => {
    tenantIdRef.current = tenantId
  }, [tenantId])

  const loadShops = useCallback(async () => {
    setIsLoadingShops(true)
    try {
      const response = await fetch('/api/v1/admin/shops')
      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { items?: ShopItem[] }
      if (!data.items?.length) {
        return
      }

      setShopItems(data.items)

      const currentTenantId = tenantIdRef.current
      const matchingTenant = data.items.find((item) => item.tenant_id === currentTenantId)
      const firstTenant = data.items[0]
      const nextTenant = matchingTenant ?? firstTenant

      if (nextTenant) {
        // Only update if value is different to avoid loops
        if (nextTenant.tenant_id !== currentTenantId) {
          setValue('tenantId', nextTenant.tenant_id, { shouldValidate: true })
        }
        // Always update domain as it might have changed for same tenant? Or just update if needed.
        // Actually if tenantId changed, we update both.
        // If tenantId is same, we might want to ensure domain is correct.
        setValue('shopDomain', nextTenant.shop_domain, { shouldValidate: true })
      }
    } finally {
      setIsLoadingShops(false)
    }
  }, [setValue]) // Removed tenantId from dependencies

  useEffect(() => {
    void loadShops()
  }, [loadShops])

  return {
    isLoadingShops,
    loadShops,
    shopItems,
  }
}
