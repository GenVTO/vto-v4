# @vto/env

Environment variable management, validation, and parsing library.

## Overview

This library uses `zod` to define schemas for environment variables and provides type-safe parsers for different parts of the application. It ensures that the application fails fast if required configuration is missing.

## Features

- **Type-safe Parsing**: Returns typed configuration objects (e.g., `ServerEnv`, `FashnEnv`).
- **Validation**: Uses Zod schemas to validate values (e.g., URLs, integers, enums).
- **Environment Collection**: consistently collects variables from `process.env`, `import.meta.env`, and global objects.
- **Aliases**: Supports aliasing for environment variables to handle legacy names or different deployment targets.

## Modules & Environment Variables

### Core

Basic utilities for collecting and resolving environment variables.

### Server (`parseServerEnv`)

Server-side specific configuration.

| Variable                    | Description                                       | Default       |
| --------------------------- | ------------------------------------------------- | ------------- |
| `API_RATE_LIMIT_BURST`      | Burst limit for API rate limiting                 | `20`          |
| `API_RATE_LIMIT_PER_MINUTE` | Rate limit per minute                             | `60`          |
| `DEFAULT_RESULT_TTL_DAYS`   | Days to keep results before expiration            | `15`          |
| `MAX_IMAGE_MB`              | Maximum image size in MB                          | `5`           |
| `MAX_REQUEST_MB`            | Maximum request body size in MB                   | `8`           |
| `NODE_ENV`                  | Environment (`development`, `test`, `production`) | `development` |

### Fashn (`parseFashnEnv`)

Configuration for Fashn.ai integration.

| Variable        | Description            | Required                      |
| --------------- | ---------------------- | ----------------------------- |
| `FASHN_API_KEY` | API Key for Fashn.ai   | Yes                           |
| `FASHN_API_URL` | Base URL for Fashn API | No (defaults to official API) |

### Storage (`parseStorageEnv`)

Configuration for storage providers and their order.

| Variable                 | Description                              | Example                                        |
| ------------------------ | ---------------------------------------- | ---------------------------------------------- |
| `STORAGE_PROVIDER_ORDER` | Comma-separated list of providers to try | `r2:primary,s3:backup`                         |
| `R2_CONFIGS_JSON`        | JSON array of R2 configurations          | `[{"name":"primary","binding":"MY_BUCKET"}]`   |
| `S3_CONFIGS_JSON`        | JSON array of S3 configurations          | `[{"name":"backup","bucket":"my-bucket",...}]` |

### Supabase (`parseSupabaseEnv`)

Supabase connection details.

| Variable                    | Description                     | Required |
| --------------------------- | ------------------------------- | -------- |
| `SUPABASE_URL`              | Supabase project URL            | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) | Yes      |

### Logger (`detectLoggerEnvConfig`)

Logging configuration.

| Variable            | Description                | Options                          |
| ------------------- | -------------------------- | -------------------------------- |
| `LOG_LEVEL`         | Minimum log level          | `debug`, `info`, `warn`, `error` |
| `LOG_ENABLE_AXIOM`  | Enable Axiom transport     | `true`, `false`                  |
| `AXIOM_TOKEN`       | Axiom API Token            | Required if enabled              |
| `AXIOM_DATASET`     | Axiom Dataset Name         | Required if enabled              |
| `LOG_ENABLE_SENTRY` | Enable Sentry transport    | `true`, `false`                  |
| `SENTRY_DSN`        | Sentry DSN                 | Required if enabled              |
| `LOG_ENABLE_PINO`   | Enable Pino (console JSON) | `true`, `false`                  |

## Usage

```typescript
import { parseServerEnv } from '@vto/env/server'
import { parseFashnEnv } from '@vto/env/fashn'

// Parses and validates, throws if invalid
const serverConfig = parseServerEnv()
const fashnConfig = parseFashnEnv()

console.log(serverConfig.API_RATE_LIMIT_BURST)
```
