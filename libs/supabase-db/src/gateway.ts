import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbGateway } from '@vto/db/contracts'

export interface SupabaseDbOptions {
  schema?: string
}

export class SupabaseDbGateway implements DbGateway {
  private readonly client: SupabaseClient
  private readonly options: SupabaseDbOptions

  constructor(client: SupabaseClient, options: SupabaseDbOptions = {}) {
    this.client = client
    this.options = options
    void this.client
    void this.options
  }

  validateApiKey(): ReturnType<DbGateway['validateApiKey']> {
    throw new Error('Not implemented.')
  }

  hasCredits(): ReturnType<DbGateway['hasCredits']> {
    throw new Error('Not implemented.')
  }

  reserveCredit(): ReturnType<DbGateway['reserveCredit']> {
    throw new Error('Not implemented.')
  }

  recordCreditEvent(): ReturnType<DbGateway['recordCreditEvent']> {
    throw new Error('Not implemented.')
  }

  findCachedResult(): ReturnType<DbGateway['findCachedResult']> {
    throw new Error('Not implemented.')
  }

  findJobByIdempotency(): ReturnType<DbGateway['findJobByIdempotency']> {
    throw new Error('Not implemented.')
  }

  saveJobIdempotency(): ReturnType<DbGateway['saveJobIdempotency']> {
    throw new Error('Not implemented.')
  }

  createJob(): ReturnType<DbGateway['createJob']> {
    throw new Error('Not implemented.')
  }

  updateJobStatus(): ReturnType<DbGateway['updateJobStatus']> {
    throw new Error('Not implemented.')
  }

  getJob(): ReturnType<DbGateway['getJob']> {
    throw new Error('Not implemented.')
  }

  getHistory(): ReturnType<DbGateway['getHistory']> {
    throw new Error('Not implemented.')
  }
}

export function createSupabaseDbGateway(
  client: SupabaseClient,
  options?: SupabaseDbOptions,
): DbGateway {
  return new SupabaseDbGateway(client, options)
}
