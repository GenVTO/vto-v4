import { z } from 'zod'

export const tryOnModelSchema = z.enum(['normal', 'advanced'])

const IDEMPOTENCY_MAX_LENGTH = 128
const HISTORY_LIMIT_MAX = 50

const baseTryOnRequestSchema = z.object({
  customer_id: z.string().nullable().optional(),
  idempotency_key: z.string().min(8).max(IDEMPOTENCY_MAX_LENGTH).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  model: tryOnModelSchema.optional(),
  product_id: z.string().min(1),
  product_image_url: z.url(),
  shop_domain: z.string().min(3),
  visitor_id: z.string().min(8),
})

export const createTryOnRequestSchema = z.union([
  baseTryOnRequestSchema.extend({
    user_image: z.never().optional(),
    user_image_url: z.url(),
  }),
  baseTryOnRequestSchema.extend({
    user_image: z.string().min(1),
    user_image_url: z.never().optional(),
  }),
])

export const tryOnHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(HISTORY_LIMIT_MAX).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  product_id: z.string().optional(),
  shop_domain: z.string().min(3),
  visitor_id: z.string().min(8),
})

export type CreateTryOnRequestInput = z.infer<typeof createTryOnRequestSchema>
export type TryOnHistoryQueryInput = z.infer<typeof tryOnHistoryQuerySchema>
