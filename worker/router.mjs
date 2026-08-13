const allowedMethods = new Set(["GET", "HEAD"])

function plainResponse(message, status, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  })
}

export function resolveSiteRequest(request, sites) {
  const url = new URL(request.url)
  const site = sites[url.hostname]

  if (!site) return { kind: "missing-host" }
  if (!allowedMethods.has(request.method)) return { kind: "method-not-allowed" }

  if (site.kind === "showcase" && /^\/docs(?:\/|$)/.test(url.pathname)) {
    return {
      kind: "redirect",
      location: `https://cnix.corbet.ch/projects/${site.cnix_id}`,
    }
  }

  const pathname = url.pathname.startsWith("/")
    ? url.pathname
    : `/${url.pathname}`
  url.pathname = `/sites/${site.asset_key}${pathname}`
  return { kind: "asset", request: new Request(url, request) }
}

export function createWorker(sites) {
  return {
    async fetch(request, environment) {
      const route = resolveSiteRequest(request, sites)

      if (route.kind === "missing-host") {
        return plainResponse("Not found\n", 404)
      }
      if (route.kind === "method-not-allowed") {
        return plainResponse("Method not allowed\n", 405, {
          allow: "GET, HEAD",
        })
      }
      if (route.kind === "redirect") {
        return Response.redirect(route.location, 308)
      }
      return environment.ASSETS.fetch(route.request)
    },
  }
}
