import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { TryOnFormValues } from './schema'
import type { ShopItem } from './types'

import { FORM_DEFAULT_TENANT_ID } from './types'

interface ShopContextSectionProps {
  isLoadingShops: boolean
  loadShops: () => Promise<void>
  selectedShop: ShopItem | null
  shopItems: ShopItem[]
}

export function ShopContextSection({
  isLoadingShops,
  loadShops,
  selectedShop,
  shopItems,
}: ShopContextSectionProps) {
  const form = useFormContext<TryOnFormValues>()

  const onRefresh = () => {
    void loadShops()
  }

  const onTenantIdChange = (value: string) => {
    form.setValue('tenantId', value, { shouldValidate: true })
    const tenant = shopItems.find((item) => item.tenant_id === value)
    if (tenant) {
      form.setValue('shopDomain', tenant.shop_domain, {
        shouldValidate: true,
      })
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Shop Context (Manual Testing)</h2>
        <Button
          disabled={isLoadingShops}
          onClick={onRefresh}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoadingShops ? 'Refreshing...' : 'Refresh Credits'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tenant-id">Tenant ID</Label>
          <Select onValueChange={onTenantIdChange} value={form.watch('tenantId')}>
            <SelectTrigger id="tenant-id">
              <SelectValue placeholder="Select tenant id" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FORM_DEFAULT_TENANT_ID}>{FORM_DEFAULT_TENANT_ID}</SelectItem>
              {shopItems
                .filter((item) => item.tenant_id !== FORM_DEFAULT_TENANT_ID)
                .map((item) => (
                  <SelectItem key={item.tenant_id} value={item.tenant_id}>
                    {item.tenant_id}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-credits">Credits</Label>
          <Input
            id="shop-credits"
            readOnly
            value={selectedShop ? String(selectedShop.credits) : 'N/A'}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-credits-reserved">Reserved in flight</Label>
          <Input
            id="shop-credits-reserved"
            readOnly
            value={selectedShop ? String(selectedShop.in_flight_reserved_count) : 'N/A'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-credits-consumed">Completed consumed</Label>
          <Input
            id="shop-credits-consumed"
            readOnly
            value={selectedShop ? String(selectedShop.completed_consumed_count) : 'N/A'}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-credits-refunded">Refunded</Label>
          <Input
            id="shop-credits-refunded"
            readOnly
            value={selectedShop ? String(selectedShop.refunded_credits) : 'N/A'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-credits-failed-charged">Failed charged</Label>
          <Input
            id="shop-credits-failed-charged"
            readOnly
            value={selectedShop ? String(selectedShop.failed_charged_count) : 'N/A'}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="shopDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop Domain</FormLabel>
              <FormControl>
                <Input {...field} placeholder="demo-shop.myshopify.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input {...field} placeholder="dev_vto_api_key" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
