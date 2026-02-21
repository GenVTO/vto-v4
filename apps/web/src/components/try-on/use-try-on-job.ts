import { useState } from 'react'

import type { LogEntry } from './LogViewer'

const API_KEY = 'dev_vto_api_key'
const SHOP_DOMAIN = 'demo-shop.myshopify.com'
const POLL_INTERVAL = 2000

interface TryOnPayload {
  api_key: string
  model: string
  product_id: string
  product_image_url: string
  shop_domain: string
  user_image: string
  visitor_id: string
}

interface StatusResponse {
  status: string
  result_url?: string
}

interface JobResponse {
  job_id: string
}

interface JobActions {
  addLog: (message: string, type?: LogEntry['type']) => void
  setIsLoading: (loading: boolean) => void
  setResultUrl: (url: string | null) => void
}

function createPayload(userImage: string, productImage: string, model: string): TryOnPayload {
  return {
    api_key: API_KEY,
    model,
    product_id: `prod_${Date.now()}`,
    product_image_url: productImage,
    shop_domain: SHOP_DOMAIN,
    user_image: userImage,
    visitor_id: `visitor_${Date.now()}`,
  }
}

async function postJob(payload: TryOnPayload): Promise<JobResponse> {
  const res = await fetch('/api/v1/try-on', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
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

  const pollStatus = (id: string) => {
    addLog(`Polling status for job ${id}...`)

    const check = async () => {
      try {
        const res = await fetch(`/api/v1/try-on/${id}`, {
          headers: { 'x-api-key': API_KEY },
        })

        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`)
        }

        const data = await res.json()
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

  const submitJob = async (userImage: string, productImage: string, model: string) => {
    initJob()

    try {
      const payload = createPayload(userImage, productImage, model)
      const data = await postJob(payload)

      addLog(`Job created with ID: ${data.job_id}`, 'success')
      pollStatus(data.job_id)
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
