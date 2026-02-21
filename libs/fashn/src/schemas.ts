import { z } from 'zod'

export const fashnRunResponseSchema = z.object({
  id: z.string().min(1),
})

const statusValues = [
  'queued',
  'in_queue',
  'pending',
  'starting',
  'processing',
  'completed',
  'success',
  'succeeded',
  'failed',
  'error',
  'expired',
  'not_found',
] as const

export const fashnStatusResponseSchema = z.object({
  error: z.unknown().optional(),
  output: z.unknown().optional(),
  status: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(statusValues))
    .optional(),
})

export type FashnRunResponse = z.infer<typeof fashnRunResponseSchema>
export type FashnStatusResponse = z.infer<typeof fashnStatusResponseSchema>
