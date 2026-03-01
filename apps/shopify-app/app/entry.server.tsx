import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { AppLoadContext, EntryContext } from "react-router";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";
import { sessionStorage } from "./db.server";

export const streamTimeout = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext: AppLoadContext
) {
  // Inject the Cloudflare KV namespace before any Shopify auth happens.
  // In local Node.js / Vite dev mode cloudflare context may be absent — the
  // HybridSessionStorage in db.server.ts will fall back to in-memory.
  const cf = loadContext.cloudflare as { env: CloudflareEnv } | undefined;
  if (cf?.env?.SESSION_KV) {
    sessionStorage.setNamespace(cf.env.SESSION_KV);
  }

  addDocumentResponseHeaders(request, responseHeaders);

  const userAgent = request.headers.get("user-agent");

  let status = responseStatusCode;
  const body = await renderToReadableStream(
    <ServerRouter context={reactRouterContext} url={request.url} />,
    {
      onError(error: unknown) {
        console.error(error);
        status = 500;
      },
    }
  );

  if (isbot(userAgent ?? "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status,
  });
}
