import type { APIRoute } from 'astro'

import { json } from '@/lib/http'
import { runtime } from '@/lib/runtime'

interface RuntimeLocals {
  runtime?: {
    env?: Record<string, unknown>
  }
}

export const GET: APIRoute = async (context) => {
  const env = (context.locals as RuntimeLocals)?.runtime?.env
  const isDev =
    import.meta.env.DEV ||
    import.meta.env.NODE_ENV === 'development' ||
    env?.NODE_ENV === 'development' ||
    context.url.hostname === 'localhost' ||
    context.url.hostname === '127.0.0.1'

  if (!isDev) {
    return new Response('Not Found', { status: 404 })
  }

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
