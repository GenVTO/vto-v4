# @vto/logger

Structured logging library for the VTO project.

## Overview

Provides a unified logging interface based on `loglayer`, with support for multiple transports (outputs) such as:

- **Pino**: For high-performance JSON logging to stdout (server/CLI).
- **Axiom**: For cloud logging and observability.
- **Sentry**: For error tracking and monitoring.

## Configuration

Configuration is handled via environment variables (parsed by `@vto/env`):

- **Core**:
  - `LOG_LEVEL`: Minimum level (`debug`, `info`, `warn`, `error`).

- **Pino** (Console JSON):
  - `LOG_ENABLE_PINO`: `true` to enable.

- **Axiom** (Cloud logging):
  - `LOG_ENABLE_AXIOM`: `true` to enable.
  - `AXIOM_TOKEN`: API Token.
  - `AXIOM_DATASET`: Target dataset.

- **Sentry** (Error tracking):
  - `LOG_ENABLE_SENTRY`: `true` to enable.
  - `SENTRY_DSN`: Project DSN.

## Usage

```typescript
import { createLogger } from '@vto/logger'

const logger = createLogger({ service: 'my-service' })

logger.info('Something happened', {
  userId: '123',
  action: 'login',
})

logger.error('An error occurred', {
  error: err,
  context: 'api-handler',
})
```

## Context

The logger supports creating child loggers with bound context:

```typescript
const requestLogger = logger.child({ requestId: 'abc-123' })
requestLogger.info('Processing request') // Includes requestId automatically
```
