import type { APIRoute } from 'astro'

export const GET: APIRoute = async () =>
  Response.json(
    {
      status: 'operational',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    },
  )
