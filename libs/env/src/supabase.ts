import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

export const supabaseEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.url(),
})

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>

export function parseSupabaseEnv(source?: EnvSource): SupabaseEnv {
  const env = collectEnv({ source })

  return parseWithSchema(supabaseEnvSchema, {
    SUPABASE_SERVICE_ROLE_KEY: resolveEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY', {
      aliases: commonAliases('SUPABASE_SERVICE_ROLE_KEY'),
    }),
    SUPABASE_URL: resolveEnvValue(env, 'SUPABASE_URL', {
      aliases: commonAliases('SUPABASE_URL'),
    }),
  })
}
