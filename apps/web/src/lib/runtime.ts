import { createDbGateway } from '@vto/db'
import { collectEnv } from '@vto/env'
import { createLogger } from '@vto/logger'
import { createStorageGateway } from '@vto/storage'
import { createTryOnGatewayFromEnv } from '@vto/try-on'
const runtimeLogger = createLogger({ service: '@vto/web-runtime' })

const env = collectEnv()

const db = createDbGateway({ env })
let storage = createStorageGateway({ env })
let tryOnGateway = createTryOnGatewayFromEnv({ db, env, storage })

runtimeLogger.info('Initialized try-on gateway from env')

export const runtime = {
  db,
  logger: runtimeLogger,
  storage,
  tryOnGateway,
}

export function configureRuntimeBindings(bindings: Record<string, unknown> | undefined): void {
  if (!bindings) {
    return
  }

  storage = createStorageGateway({ bindings, env })
  runtime.storage = storage
  tryOnGateway = createTryOnGatewayFromEnv({ db, env, storage })
  runtime.tryOnGateway = tryOnGateway
  runtimeLogger.info('Bound storage gateway from Cloudflare runtime bindings')
}
