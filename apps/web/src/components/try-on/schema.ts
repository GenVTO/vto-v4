import { z } from 'zod'

import type { OptimizedImagePayload } from './ImageUpload'

export const tryOnFormSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.enum(['normal', 'advanced']),
  productImage: z.custom<OptimizedImagePayload>(Boolean, {
    message: 'Product image is required',
  }),
  shopDomain: z.string().min(1, 'Shop domain is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  userImage: z.custom<OptimizedImagePayload>(Boolean, {
    message: 'User image is required',
  }),
})

export type TryOnFormValues = z.infer<typeof tryOnFormSchema>
