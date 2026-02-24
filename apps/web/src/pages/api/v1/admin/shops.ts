import type { APIRoute } from 'astro'

import { json } from '@/lib/http'
import { runtime } from '@/lib/runtime'

export const GET: APIRoute = async () => {
  const tenants = await runtime.db.listTenants()
  const items = await Promise.all(
    tenants.map(async (tenant) => {
      const snapshot = await runtime.db.getCreditSnapshot(tenant.tenantId)
      return {
        completed_consumed_count: snapshot.completedConsumedCount,
        credits: snapshot.availableCredits,
        failed_charged_count: snapshot.failedChargedCount,
        in_flight_reserved_count: snapshot.inFlightReservedCount,
        refunded_credits: snapshot.refundedCredits,
        reserved_or_spent_credits: snapshot.reservedOrSpentCredits,
        shop_domain: tenant.shopDomain,
        tenant_id: tenant.tenantId,
      }
    }),
  )

  return json({ items })
}
