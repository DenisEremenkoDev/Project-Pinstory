import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { ApiErrorBody } from './apiTypes'

export interface MockRequestArgs {
  url: string
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

export interface MockRouteContext {
  pathParams: Record<string, string>
  searchParams: URLSearchParams
  body: unknown
}

export type MockResult = { data: unknown } | { error: { status: number; data: ApiErrorBody } }
export type MockHandler = (ctx: MockRouteContext) => MockResult

export interface MockRoute {
  method: string
  segments: string[]
  handler: MockHandler
}

export type MockBaseQuery = BaseQueryFn<MockRequestArgs, unknown, { status: number; data: ApiErrorBody }>

export function defineMockRoute(method: string, path: string, handler: MockHandler): MockRoute {
  return { method: method.toUpperCase(), segments: path.split('/').filter(Boolean), handler }
}

export function mockError(status: number, message: string, code: string): { error: { status: number; data: ApiErrorBody } } {
  return { error: { status, data: { error: { message, code } } } }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function matchRoute(route: MockRoute, method: string, pathSegments: string[]): Record<string, string> | null {
  if (route.method !== method) return null
  if (route.segments.length !== pathSegments.length) return null

  const pathParams: Record<string, string> = {}
  for (let i = 0; i < route.segments.length; i++) {
    const routeSeg = route.segments[i]
    const actualSeg = pathSegments[i]
    if (routeSeg === undefined || actualSeg === undefined) return null

    if (routeSeg.startsWith(':')) {
      pathParams[routeSeg.slice(1)] = decodeURIComponent(actualSeg)
    } else if (routeSeg !== actualSeg) {
      return null
    }
  }
  return pathParams
}

/**
 * Simulates a network layer for RTK Query. Swapping to a real backend later
 * means replacing this baseQuery with fetchBaseQuery({ baseUrl: ... }) in
 * src/app/api.ts — endpoint definitions and components don't change.
 */
export function createMockBaseQuery(routes: MockRoute[]): MockBaseQuery {
  return async (args) => {
    await delay(200 + Math.random() * 200)

    const method = (args.method ?? 'GET').toUpperCase()
    const [pathname = '', queryString] = args.url.split('?')
    const pathSegments = pathname.split('/').filter(Boolean)
    const searchParams = new URLSearchParams(queryString)
    if (args.params) {
      for (const [key, value] of Object.entries(args.params)) {
        if (value !== undefined) searchParams.set(key, String(value))
      }
    }

    for (const route of routes) {
      const pathParams = matchRoute(route, method, pathSegments)
      if (!pathParams) continue

      try {
        const result = route.handler({ pathParams, searchParams, body: args.body })
        if ('error' in result) return result
        return { data: result.data }
      } catch (err) {
        return mockError(500, err instanceof Error ? err.message : String(err), 'MOCK_HANDLER_ERROR')
      }
    }

    return mockError(404, `No mock handler for ${method} ${args.url}`, 'MOCK_NOT_FOUND')
  }
}
