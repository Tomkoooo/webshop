"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useReportWebVitals } from "next/web-vitals"

type BrowserMetric = {
  category: string
  name: string
  value?: number
  unit?: "ms" | "count" | "score" | "bytes"
  status?: "ok" | "error"
  route?: string
  method?: string
  url?: string
  metadata?: Record<string, unknown>
}

type WrappedFetch = typeof window.fetch & {
  __devMetricsWrapped?: boolean
}

const ENDPOINT = "/api/dev/metrics"

export function DevMetricsClient({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const route = React.useMemo(() => {
    const query = searchParams.toString()
    return `${pathname || "/"}${query ? `?${query}` : ""}`
  }, [pathname, searchParams])
  const pendingNavigationStartRef = React.useRef<number | null>(null)
  const routeRef = React.useRef(route)
  const initialRouteRef = React.useRef(route)
  const reportedWebVitalsRef = React.useRef(new Set<string>())
  const reportedInitialPageLoadRef = React.useRef(false)

  React.useEffect(() => {
    routeRef.current = route
  }, [route])

  useReportWebVitals((metric) => {
    if (!enabled) return
    if (reportedWebVitalsRef.current.has(metric.id)) return
    reportedWebVitalsRef.current.add(metric.id)

    sendBrowserMetric({
      category: "web-vital",
      name: metric.name,
      value: metric.value,
      unit: metric.name === "CLS" ? "score" : "ms",
      route: initialRouteRef.current,
      metadata: {
        id: metric.id,
        rating: "rating" in metric ? metric.rating : undefined,
      },
    })
  })

  React.useEffect(() => {
    if (!enabled) return

    const start = pendingNavigationStartRef.current
    if (start != null) {
      sendBrowserMetric({
        category: "navigation",
        name: "route-change",
        value: performance.now() - start,
        unit: "ms",
        route,
      })
      pendingNavigationStartRef.current = null
      return
    }

    sendBrowserMetric({
      category: "navigation",
      name: "route-view",
      value: 1,
      unit: "count",
      route,
    })
  }, [enabled, route])

  React.useEffect(() => {
    if (!enabled) return
    if (reportedInitialPageLoadRef.current) return

    const reportInitialNavigation = () => {
      if (reportedInitialPageLoadRef.current) return
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
      if (!nav) return
      reportedInitialPageLoadRef.current = true

      const metrics: BrowserMetric[] = [
        {
          category: "page-load",
          name: "ttfb",
          value: nav.responseStart - nav.requestStart,
          unit: "ms",
          route: initialRouteRef.current,
        },
        {
          category: "page-load",
          name: "dom-content-loaded",
          value: nav.domContentLoadedEventEnd - nav.startTime,
          unit: "ms",
          route: initialRouteRef.current,
        },
        {
          category: "page-load",
          name: "load",
          value: nav.loadEventEnd - nav.startTime,
          unit: "ms",
          route: initialRouteRef.current,
        },
        {
          category: "page-load",
          name: "transfer-size",
          value: nav.transferSize,
          unit: "bytes",
          route: initialRouteRef.current,
        },
      ]
      sendBrowserMetrics(metrics.filter((metric) => Number(metric.value) >= 0))
    }

    window.setTimeout(reportInitialNavigation, 0)
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return

    const markNavigationStart = () => {
      pendingNavigationStartRef.current = performance.now()
    }

    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return

      const nextUrl = new URL(anchor.href, window.location.href)
      if (nextUrl.origin !== window.location.origin) return
      if (`${nextUrl.pathname}${nextUrl.search}` === `${window.location.pathname}${window.location.search}`) return

      markNavigationStart()
    }

    document.addEventListener("click", handleClick, true)
    window.addEventListener("popstate", markNavigationStart)
    return () => {
      document.removeEventListener("click", handleClick, true)
      window.removeEventListener("popstate", markNavigationStart)
    }
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return
    if (!PerformanceObserver.supportedEntryTypes?.includes("longtask")) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        sendBrowserMetric({
          category: "main-thread",
          name: "long-task",
          value: entry.duration,
          unit: "ms",
          route,
          metadata: { startTime: entry.startTime },
        })
      }
    })

    observer.observe({ type: "longtask", buffered: true })
    return () => observer.disconnect()
  }, [enabled, route])

  React.useEffect(() => {
    if (!enabled) return

    const currentFetch = window.fetch as WrappedFetch
    if (currentFetch.__devMetricsWrapped) return

    const originalFetch = window.fetch
    const wrappedFetch: WrappedFetch = async (input, init) => {
      const start = performance.now()
      const url = metricUrlFromFetchInput(input)
      const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase()

      try {
        const response = await originalFetch(input, init)
        if (!url.startsWith(ENDPOINT)) {
          sendBrowserMetric({
            category: "client-fetch",
            name: "request",
            value: performance.now() - start,
            unit: "ms",
            status: response.ok ? "ok" : "error",
            route: routeRef.current,
            method,
            url,
            metadata: { status: response.status },
          })
        }
        return response
      } catch (error) {
        if (!url.startsWith(ENDPOINT)) {
          sendBrowserMetric({
            category: "client-fetch",
            name: "request",
            value: performance.now() - start,
            unit: "ms",
            status: "error",
            route: routeRef.current,
            method,
            url,
            metadata: { errorName: error instanceof Error ? error.name : typeof error },
          })
        }
        throw error
      }
    }

    wrappedFetch.__devMetricsWrapped = true
    window.fetch = wrappedFetch

    return () => {
      if (window.fetch === wrappedFetch) {
        window.fetch = originalFetch
      }
    }
  }, [enabled])

  return null
}

function metricUrlFromFetchInput(input: Parameters<typeof window.fetch>[0]): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function sendBrowserMetric(metric: BrowserMetric) {
  sendBrowserMetrics([metric])
}

function sendBrowserMetrics(events: BrowserMetric[]) {
  const body = JSON.stringify({ events })
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(ENDPOINT, blob)) return
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined)
}
