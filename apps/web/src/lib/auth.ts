import type { APIContext } from 'astro'

export function readApiKey(context: APIContext): string | null {
  const headerKey = context.request.headers.get('x-api-key')
  if (headerKey) {
    return headerKey
  }

  const auth = context.request.headers.get('authorization')
  if (!auth) {
    return null
  }

  const [scheme, token] = auth.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }
  return token
}
