import { defineMiddleware } from 'astro:middleware'

const PROTECTED_ROUTES = ['/admin', '/api/v1/admin']
const BASIC_AUTH_USER = 'admin'
const BASIC_AUTH_PASS = 'admin-tryon-$123AB' // Hardcoded as requested

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url)

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const auth = context.request.headers.get('authorization')

    if (auth) {
      const match = auth.match(/^Basic (.+)$/)
      if (match) {
        const credentials = atob(match[1])
        const [user, pass] = credentials.split(':')

        if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
          return next()
        }
      }
    }

    return new Response('Unauthorized', {
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"',
      },
      status: 401,
    })
  }

  return next()
})
