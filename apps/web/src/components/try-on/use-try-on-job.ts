import { useState } from 'react'

import type { OptimizedImagePayload } from './ImageUpload'
import type { LogEntry } from './LogViewer'

const POLL_INTERVAL = 2000

interface StatusResponse {
  status: string
  result_url?: string
}

interface JobResponse {
  job_id: string
}

export interface TryOnShopContext {
  apiKey: string
  shopDomain: string
  tenantId: string
}

interface JobActions {
  addLog: (message: string, type?: LogEntry['type']) => void
  setIsLoading: (loading: boolean) => void
  setResultUrl: (url: string | null) => void
}

function summarizeFormData(form: FormData): string {
  const entries: string[] = []
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      entries.push(`${key}=File(name=${value.name},type=${value.type || 'n/a'},size=${value.size})`)
    } else {
      const strVal = String(value)
      const displayVal = strVal.length > 100 ? `${strVal.slice(0, 100)}...` : strVal
      entries.push(`${key}=${displayVal}`)
    }
  }
  return entries.join(' | ')
}

function createPayload(
  userImage: OptimizedImagePayload,
  productImage: OptimizedImagePayload,
  model: string,
  context: TryOnShopContext,
): FormData {
  const form = new FormData()
  form.set('model', model)
  form.set('product_id', `prod_${context.tenantId}_${Date.now()}`)
  form.set('shop_domain', context.shopDomain)
  form.set('visitor_id', `visitor_${context.tenantId}_${Date.now()}`)
  form.set('user_image', userImage.file, userImage.file.name)
  form.set('product_image', productImage.file, productImage.file.name)
  return form
}

async function postJob(payload: FormData, apiKey: string): Promise<JobResponse> {
  const res = await fetch('/api/v1/try-on', {
    body: payload,
    headers: {
      'x-api-key': apiKey,
    },
    method: 'POST',
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || `Request failed with ${res.status}`)
  }

  return res.json()
}

function handleCompletion(url: string | undefined, actions: JobActions) {
  actions.addLog('Current status: completed', 'success')
  actions.addLog(`Final result URL (platform): ${url ?? 'null'}`)
  actions.addLog('Job completed successfully!', 'success')
  actions.setResultUrl(url ?? null)
  actions.setIsLoading(false)
}

function handleFailure(actions: JobActions) {
  actions.addLog('Current status: failed', 'error')
  actions.addLog('Job failed.', 'error')
  actions.setIsLoading(false)
}

function handleStatusResponse(data: StatusResponse, check: () => void, actions: JobActions) {
  if (data.status === 'completed') {
    handleCompletion(data.result_url, actions)
    return
  }

  if (data.status === 'failed') {
    handleFailure(actions)
    return
  }

  actions.addLog(`Current status: ${data.status}`)
  setTimeout(check, POLL_INTERVAL)
}

export function useTryOnJob() {
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    })
    setLogs((prev) => [...prev, { id: crypto.randomUUID(), message, time, type }])
  }

  const actions: JobActions = { addLog, setIsLoading, setResultUrl }

  const pollStatus = (id: string, context: TryOnShopContext) => {
    addLog(`Polling status for job ${id}...`)

    const check = async () => {
      try {
        const pollPath = `/api/v1/try-on/${id}`
        addLog(`Polling request -> GET ${pollPath}`)
        const res = await fetch(`/api/v1/try-on/${id}`, {
          headers: { 'x-api-key': context.apiKey },
        })

        const raw = await res.text()
        addLog(`Polling response <- ${res.status} ${raw}`)

        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`)
        }

        const data = JSON.parse(raw) as StatusResponse
        handleStatusResponse(data, check, actions)
      } catch (error) {
        addLog(`Polling error: ${error instanceof Error ? error.message : String(error)}`, 'error')
        setIsLoading(false)
      }
    }

    check()
  }

  const initJob = () => {
    setIsLoading(true)
    setLogs([])
    setResultUrl(null)
    addLog('Submitting job request...')
  }

  const submitJob = async (
    userImage: OptimizedImagePayload,
    productImage: OptimizedImagePayload,
    model: string,
    context: TryOnShopContext,
  ) => {
    initJob()

    try {
      const payload = createPayload(userImage, productImage, model, context)
      addLog(`Create request -> POST /api/v1/try-on | ${summarizeFormData(payload)}`)
      const data = await postJob(payload, context.apiKey)
      addLog(`Create response <- ${JSON.stringify(data)}`)

      addLog(`Job created with ID: ${data.job_id}`, 'success')
      pollStatus(data.job_id, context)
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error')
      setIsLoading(false)
    }
  }

  const reset = () => {
    setResultUrl(null)
    setLogs([])
    setIsLoading(false)
  }

  return {
    isLoading,
    logs,
    reset,
    resultUrl,
    submitJob,
  }
}
