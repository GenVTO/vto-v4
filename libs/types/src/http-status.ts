// oxlint-disable-next-line import/no-nodejs-modules
import { constants as HTTP_STATUS } from 'node:http2'
export { HTTP_STATUS }

export type HttpStatus = Extract<keyof typeof HTTP_STATUS, `HTTP_STATUS_${string}`>

const codeToName = new Map<number, HttpStatus>()

for (const [key, value] of Object.entries(HTTP_STATUS)) {
  if (!key.startsWith('HTTP_STATUS_')) {
    continue
  }
  if (typeof value !== 'number') {
    continue
  }
  codeToName.set(value, key as HttpStatus)
}

export function toHttpStatusName(code: number | null): HttpStatus | null {
  if (code === null) {
    return null
  }
  return codeToName.get(code) ?? null
}

export function toHttpStatusCode(status: HttpStatus): number {
  return Number(HTTP_STATUS[status])
}
