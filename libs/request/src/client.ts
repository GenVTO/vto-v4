import { createLogger } from '@vto/logger'
import { toHttpStatusName } from '@vto/types/http-status'
import wretch from 'wretch'
import { retry } from 'wretch/middlewares'

import type {
  RequestClient,
  RequestClientOptions,
  RequestMethod,
  RequestOptions,
  RetryOptions,
} from './types'

import { RequestError } from './errors'

const requestLogger = createLogger({ service: '@vto/request' })

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  delayTimer: 300,
  maxAttempts: 2,
  retryOnNetworkError: true,
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function buildPathWithQuery(path: string, query?: RequestOptions['query']): string {
  if (!query) {
    return path
  }

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue
    }
    search.set(key, String(value))
  }

  const encoded = search.toString()
  if (!encoded) {
    return path
  }

  return path.includes('?') ? `${path}&${encoded}` : `${path}?${encoded}`
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  const contentType = response.headers.get('content-type') ?? ''

  if (response.status === 204) {
    return undefined as TResponse
  }

  if (contentType.includes('application/json')) {
    return (await response.json()) as TResponse
  }

  return (await response.text()) as TResponse
}

function normalizeUnknownError(error: unknown): RequestError {
  const fallback = new RequestError('Unexpected request failure.', null, null)

  if (!error || typeof error !== 'object') {
    return fallback
  }

  const maybeError = error as {
    message?: unknown
    status?: unknown
    json?: unknown
    text?: unknown
  }

  const statusCode = typeof maybeError.status === 'number' ? maybeError.status : null
  const statusName = toHttpStatusName(statusCode)
  const message =
    typeof maybeError.message === 'string' && maybeError.message.length > 0
      ? maybeError.message
      : 'Request failed.'

  return new RequestError(message, statusCode, statusName, maybeError.json ?? maybeError.text)
}

export function createRequestClient(options: RequestClientOptions): RequestClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl)
  const mergedRetry = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options.retry,
  }

  const middlewareChain = [
    retry({
      delayTimer: mergedRetry.delayTimer,
      maxAttempts: mergedRetry.maxAttempts,
      retryOnNetworkError: mergedRetry.retryOnNetworkError,
    }),
    ...(options.middlewares ?? []),
  ]

  const client = wretch(baseUrl)
    .headers(options.defaultHeaders ?? {})
    .middlewares(middlewareChain as never[])

  async function request<TResponse>(
    method: RequestMethod,
    path: string,
    requestOptions: RequestOptions = {},
  ): Promise<TResponse> {
    const startedAt = Date.now()
    const fullPath = buildPathWithQuery(path, requestOptions.query)

    const controller = requestOptions.timeoutMs ? new AbortController() : null
    const timeout = controller
      ? setTimeout(() => {
          controller.abort('request-timeout')
        }, requestOptions.timeoutMs)
      : null

    let req = client.url(fullPath).headers(requestOptions.headers ?? {})
    if (controller) {
      req = req.options({ signal: controller.signal })
    }

    try {
      const response = await ((): Promise<Response> => {
        switch (method) {
          case 'GET': {
            return req.get().res()
          }
          case 'POST': {
            return (
              requestOptions.body !== undefined
                ? req.json(requestOptions.body as Record<string, unknown>)
                : req
            )
              .post()
              .res()
          }
          case 'PUT': {
            return (
              requestOptions.body !== undefined
                ? req.json(requestOptions.body as Record<string, unknown>)
                : req
            )
              .put()
              .res()
          }
          case 'PATCH': {
            return (
              requestOptions.body !== undefined
                ? req.json(requestOptions.body as Record<string, unknown>)
                : req
            )
              .patch()
              .res()
          }
          case 'DELETE': {
            return req.delete().res()
          }
          default: {
            throw new RequestError(`Unsupported method: ${method}`, null, null)
          }
        }
      })()

      requestLogger.debug('HTTP request completed', {
        duration_ms: Date.now() - startedAt,
        method,
        path: fullPath,
        status: toHttpStatusName(response.status),
        status_code: response.status,
      })

      return parseResponse<TResponse>(response)
    } catch (error) {
      const normalized = normalizeUnknownError(error)

      requestLogger.warn('HTTP request failed', {
        method,
        path: fullPath,
        status: normalized.statusName,
        status_code: normalized.statusCode,
      })

      throw normalized
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }

  return {
    get(path, options) {
      return request('GET', path, options)
    },
    post(path, options) {
      return request('POST', path, options)
    },
    request,
  }
}
