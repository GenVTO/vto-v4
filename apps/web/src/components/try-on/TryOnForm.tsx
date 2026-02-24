'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'

import type { TryOnFormValues } from './schema'

import { ImageUploadSection } from './ImageUploadSection'
import { LogViewer } from './LogViewer'
import { ModelSelectionSection } from './ModelSelectionSection'
import { ResultViewer } from './ResultViewer'
import { tryOnFormSchema } from './schema'
import { ShopContextSection } from './ShopContextSection'
import { SubmitButton } from './SubmitButton'
import { FORM_DEFAULT_API_KEY, FORM_DEFAULT_SHOP_DOMAIN, FORM_DEFAULT_TENANT_ID } from './types'
import { useTryOnJob } from './use-try-on-job'
import { useShopContext } from './useShopContext'

export function TryOnForm() {
  const form = useForm<TryOnFormValues>({
    defaultValues: {
      apiKey: FORM_DEFAULT_API_KEY,
      model: 'advanced',
      productImage: undefined as never,
      shopDomain: FORM_DEFAULT_SHOP_DOMAIN,
      tenantId: FORM_DEFAULT_TENANT_ID,
      userImage: undefined as never,
    },
    resolver: zodResolver(tryOnFormSchema),
  })

  const { isLoading, logs, resultUrl, submitJob, reset } = useTryOnJob()
  const tenantId = form.watch('tenantId')

  const { isLoadingShops, loadShops, shopItems } = useShopContext({
    setValue: form.setValue,
    tenantId,
  })

  const selectedShop = useMemo(
    () => shopItems.find((item) => item.tenant_id === tenantId) ?? null,
    [shopItems, tenantId],
  )
  const hasAvailableCredits = selectedShop ? selectedShop.credits > 0 : true

  const handleSubmit = useCallback(
    async (values: TryOnFormValues) => {
      if (!hasAvailableCredits) {
        return
      }
      await submitJob(values.userImage, values.productImage, values.model, {
        apiKey: values.apiKey.trim(),
        shopDomain: values.shopDomain.trim(),
        tenantId: values.tenantId,
      })
    },
    [hasAvailableCredits, submitJob],
  )

  const handleReset = useCallback(() => {
    reset()
    form.reset({
      apiKey: FORM_DEFAULT_API_KEY,
      model: 'advanced',
      productImage: undefined as never,
      shopDomain: FORM_DEFAULT_SHOP_DOMAIN,
      tenantId: FORM_DEFAULT_TENANT_ID,
      userImage: undefined as never,
    })
  }, [form, reset])

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
              <ShopContextSection
                isLoadingShops={isLoadingShops}
                loadShops={loadShops}
                selectedShop={selectedShop}
                shopItems={shopItems}
              />

              <ImageUploadSection />

              {(form.formState.errors.userImage || form.formState.errors.productImage) && (
                <div className="space-y-1">
                  <p className="text-sm text-destructive">
                    {form.formState.errors.userImage?.message}
                  </p>
                  <p className="text-sm text-destructive">
                    {form.formState.errors.productImage?.message}
                  </p>
                </div>
              )}

              <ModelSelectionSection />

              {!hasAvailableCredits && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  No hay créditos disponibles para lanzar nuevos try-ons. Recarga créditos o espera
                  a que se liberen reservas.
                </div>
              )}

              <SubmitButton hasAvailableCredits={hasAvailableCredits} isLoading={isLoading} />
            </form>
          </Form>
        </CardContent>
      </Card>

      <LogViewer isLoading={isLoading} logs={logs} />

      <ResultViewer onReset={handleReset} resultUrl={resultUrl} />
    </div>
  )
}
