# @vto/request

Robust HTTP client wrapper for internal and external API calls.

## Overview

A wrapper around `wretch` that provides a consistent interface for making HTTP requests. It includes built-in support for:

- **Retries**: Configurable retry logic with exponential backoff.
- **Timeouts**: Request timeout management.
- **Error Handling**: Standardized error classes (`RequestError`).
- **Logging**: Integrated with `@vto/logger`.

## Configuration

- **`baseUrl`**: (Required) The root URL for requests.
- **`timeoutMs`**: (Optional) Request timeout in milliseconds.
- **`retry`**: (Optional) Retry configuration.
  - `maxAttempts`: Number of retries (default: `2`).
  - `delayTimer`: Delay between retries in ms (default: `300`).
  - `retryOnNetworkError`: Retry on network failures (default: `true`).

## Usage

```typescript
import { createRequestClient } from '@vto/request'

const client = createRequestClient({
  baseUrl: 'https://api.example.com',
  timeoutMs: 5000,
  retry: {
    maxAttempts: 3,
    delayTimer: 500,
  },
  defaultHeaders: {
    Authorization: 'Bearer token',
  },
})

// GET request
const data = await client.get<{ id: string }>('/users/1')

// POST request
await client.post('/users', { body: { name: 'John' } })
```

## Error Handling

Errors are wrapped in `RequestError`:

```typescript
try {
  await client.get('/404')
} catch (error) {
  if (error instanceof RequestError) {
    console.log(error.status) // 404
    console.log(error.statusName) // HTTP_STATUS_NOT_FOUND
  }
}
```
