import { Axiom } from '@axiomhq/js'

import type { LogEvent, LogTransport } from './types'

interface AxiomTransportOptions {
  dataset: string
  token: string
}

function noopTransport(): LogTransport {
  return () => {}
}

function loadAxiomClient(token: string): Axiom | null {
  try {
    return new Axiom({ token })
  } catch {
    return null
  }
}

export async function createAxiomTransport(options: AxiomTransportOptions): Promise<LogTransport> {
  const client = loadAxiomClient(options.token)
  if (!client) {
    return noopTransport()
  }

  return (event: LogEvent) => {
    try {
      void client.ingest(options.dataset, event)
    } catch {
      // Noop: logging must never break request flow
    }
  }
}
