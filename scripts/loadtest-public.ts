type RouteResult = {
  route: string
  status: number
  latencyMs: number
  ok: boolean
}

type RouteSummary = {
  route: string
  requests: number
  errors: number
  errorRate: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
}

type RunSummary = {
  concurrency: number
  durationSeconds: number
  totalRequests: number
  totalErrors: number
  errorRate: number
  requestsPerSecond: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  routeSummaries: RouteSummary[]
}

type WeightedRoute = {
  route: string
  weight: number
  buildPath: () => string
}

const DEFAULT_BASE_URL = process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:3000"
const DEFAULT_DURATION_SECONDS = Number.parseInt(process.env.LOADTEST_DURATION_SECONDS ?? "30", 10)
const DEFAULT_CONCURRENCY_LEVELS = (process.env.LOADTEST_CONCURRENCY_LEVELS ?? "10,25,40")
  .split(",")
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value) && value > 0)
const DEFAULT_OUTPUT_PATH =
  process.env.LOADTEST_OUTPUT_PATH ?? ".codex-loadtest/public-mix-loadtest.json"

const discoverVariants = [
  "/discover",
  "/discover?sort=recent",
  "/discover?sort=popular",
  "/discover?genre=Fantasy&sort=popular",
  "/discover?genre=Romance&sort=recent",
]

const libraryVariants = [
  "/api/v1/library?page=1&pageSize=18&sort=recent",
  "/api/v1/library?page=1&pageSize=18&sort=popular",
  "/api/v1/library?page=1&pageSize=18&sort=rating",
  "/api/v1/library?page=1&pageSize=18&genre=Fantasy&sort=popular",
  "/api/v1/library?page=1&pageSize=18&genre=Romance&sort=recent",
]

const searchVariants = [
  "/api/v1/discover/search?q=fantasy&type=all&sort=relevance&page=1&pageSize=20",
  "/api/v1/discover/search?q=romance&type=all&sort=relevance&page=1&pageSize=20",
  "/api/v1/discover/search?q=mystery&type=all&sort=relevance&page=1&pageSize=20",
  "/api/v1/discover/search?q=magic&type=novel&sort=popular&page=1&pageSize=20",
  "/api/v1/discover/search?q=love&type=all&sort=recent&page=1&pageSize=20",
]

const weightedRoutes: WeightedRoute[] = [
  {
    route: "/",
    weight: 35,
    buildPath: () => "/",
  },
  {
    route: "/discover",
    weight: 25,
    buildPath: () => discoverVariants[Math.floor(Math.random() * discoverVariants.length)]!,
  },
  {
    route: "/api/v1/library",
    weight: 25,
    buildPath: () => libraryVariants[Math.floor(Math.random() * libraryVariants.length)]!,
  },
  {
    route: "/api/v1/discover/search",
    weight: 15,
    buildPath: () => searchVariants[Math.floor(Math.random() * searchVariants.length)]!,
  },
]

function parseArg(name: string) {
  const prefix = `--${name}=`
  const match = Bun.argv.find((argument) => argument.startsWith(prefix))
  return match ? match.slice(prefix.length) : undefined
}

function chooseRoute() {
  const totalWeight = weightedRoutes.reduce((sum, route) => sum + route.weight, 0)
  let cursor = Math.random() * totalWeight

  for (const route of weightedRoutes) {
    cursor -= route.weight
    if (cursor <= 0) {
      return route
    }
  }

  return weightedRoutes[weightedRoutes.length - 1]!
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))
  return sorted[index] ?? 0
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

async function fetchRoute(baseUrl: string): Promise<RouteResult> {
  const selected = chooseRoute()
  const path = selected.buildPath()
  const startedAt = performance.now()

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "cache-control": "no-cache",
      },
    })

    await response.arrayBuffer()

    return {
      route: selected.route,
      status: response.status,
      latencyMs: performance.now() - startedAt,
      ok: response.ok,
    }
  } catch {
    return {
      route: selected.route,
      status: 0,
      latencyMs: performance.now() - startedAt,
      ok: false,
    }
  }
}

async function virtualUser(baseUrl: string, deadline: number, bucket: RouteResult[]) {
  while (Date.now() < deadline) {
    const result = await fetchRoute(baseUrl)
    bucket.push(result)

    const thinkTimeMs = 50 + Math.floor(Math.random() * 150)
    await Bun.sleep(thinkTimeMs)
  }
}

function summarizeRun(results: RouteResult[], concurrency: number, durationSeconds: number): RunSummary {
  const latencies = results.map((result) => result.latencyMs)
  const totalErrors = results.filter((result) => !result.ok).length
  const routeGroups = new Map<string, RouteResult[]>()

  for (const result of results) {
    const group = routeGroups.get(result.route) ?? []
    group.push(result)
    routeGroups.set(result.route, group)
  }

  const routeSummaries = [...routeGroups.entries()]
    .map(([route, group]) => {
      const routeLatencies = group.map((result) => result.latencyMs)
      const errors = group.filter((result) => !result.ok).length

      return {
        route,
        requests: group.length,
        errors,
        errorRate: group.length > 0 ? errors / group.length : 0,
        avgLatencyMs: average(routeLatencies),
        p50LatencyMs: percentile(routeLatencies, 0.5),
        p95LatencyMs: percentile(routeLatencies, 0.95),
        p99LatencyMs: percentile(routeLatencies, 0.99),
      }
    })
    .sort((left, right) => left.route.localeCompare(right.route))

  return {
    concurrency,
    durationSeconds,
    totalRequests: results.length,
    totalErrors,
    errorRate: results.length > 0 ? totalErrors / results.length : 0,
    requestsPerSecond: durationSeconds > 0 ? results.length / durationSeconds : 0,
    avgLatencyMs: average(latencies),
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    p99LatencyMs: percentile(latencies, 0.99),
    routeSummaries,
  }
}

async function main() {
  const baseUrl = parseArg("base-url") ?? DEFAULT_BASE_URL
  const durationSeconds = Number.parseInt(
    parseArg("duration-seconds") ?? String(DEFAULT_DURATION_SECONDS),
    10
  )
  const concurrencyLevels = (
    parseArg("concurrency-levels") ?? DEFAULT_CONCURRENCY_LEVELS.join(",")
  )
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0)
  const outputPath = parseArg("output") ?? DEFAULT_OUTPUT_PATH

  const runSummaries: RunSummary[] = []

  for (const concurrency of concurrencyLevels) {
    const results: RouteResult[] = []
    const deadline = Date.now() + durationSeconds * 1000
    const users = Array.from({ length: concurrency }, () =>
      virtualUser(baseUrl, deadline, results)
    )

    console.log(`[loadtest] starting concurrency=${concurrency} duration=${durationSeconds}s`)
    await Promise.all(users)

    const summary = summarizeRun(results, concurrency, durationSeconds)
    runSummaries.push(summary)
    console.log(
      `[loadtest] concurrency=${concurrency} rps=${summary.requestsPerSecond.toFixed(2)} avg=${summary.avgLatencyMs.toFixed(2)}ms p95=${summary.p95LatencyMs.toFixed(2)}ms errors=${summary.totalErrors}`
    )
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routeMix: weightedRoutes.map((route) => ({ route: route.route, weight: route.weight })),
    runs: runSummaries,
  }

  await Bun.write(outputPath, JSON.stringify(payload, null, 2))
  console.log(`[loadtest] wrote ${outputPath}`)
}

await main()
