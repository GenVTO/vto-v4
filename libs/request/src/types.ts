export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RetryOptions {
  delayTimer?: number
  maxAttempts?: number
  retryOnNetworkError?: boolean
}

export interface RequestOptions {
  body?: unknown
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined | null>
  timeoutMs?: number
}

export interface RequestClientOptions {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  middlewares?: unknown[]
  retry?: Partial<RetryOptions>
  timeoutMs?: number
}

export interface RequestClient {
  request<TResponse>(
    method: RequestMethod,
    path: string,
    options?: RequestOptions,
  ): Promise<TResponse>
  get<TResponse>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<TResponse>
  post<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>
}
