import {
  countLibraryCollectionNovels,
  listDiscoverGenres,
  listLibraryCatalogFacetCounts,
  listLibraryCollectionNovels,
} from "../packages/db/src/index"
import { getDiscoverData } from "../apps/api/src/services/discover-search-service"

type TimedSample = {
  label: string
  durationMs: number
}

type ProfileSummary = {
  label: string
  avgMs: number
  minMs: number
  maxMs: number
  p95Ms: number
}

const DEFAULT_API_BASE_URL =
  process.env.PROFILE_API_BASE_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`
const DEFAULT_WEB_BASE_URL = process.env.PROFILE_WEB_BASE_URL ?? "http://127.0.0.1:3000"
const DEFAULT_ITERATIONS = Number.parseInt(process.env.PROFILE_ITERATIONS ?? "5", 10)
const DEFAULT_OUTPUT_PATH =
  process.env.PROFILE_OUTPUT_PATH ?? ".codex-loadtest/discover-profile.json"

const filters = {
  query: "",
  genre: null,
  workType: null,
  status: null,
  collection: null,
  sort: "recent" as const,
}

function parseArg(name: string) {
  const prefix = `--${name}=`
  const match = Bun.argv.find((argument) => argument.startsWith(prefix))
  return match ? match.slice(prefix.length) : undefined
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))
  return sorted[index] ?? 0
}

function summarize(samples: TimedSample[]): ProfileSummary[] {
  const grouped = new Map<string, number[]>()

  for (const sample of samples) {
    const group = grouped.get(sample.label) ?? []
    group.push(sample.durationMs)
    grouped.set(sample.label, group)
  }

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      avgMs: values.reduce((sum, value) => sum + value, 0) / values.length,
      minMs: Math.min(...values),
      maxMs: Math.max(...values),
      p95Ms: percentile(values, 0.95),
    }))
    .sort((left, right) => left.avgMs - right.avgMs)
}

async function timeTask(label: string, task: () => Promise<unknown>) {
  const startedAt = performance.now()
  await task()
  return {
    label,
    durationMs: performance.now() - startedAt,
  } satisfies TimedSample
}

async function fetchAndDrain(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      "cache-control": "no-cache",
    },
  })

  await response.arrayBuffer()
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`)
  }
}

async function main() {
  const apiBaseUrl = parseArg("api-base-url") ?? DEFAULT_API_BASE_URL
  const webBaseUrl = parseArg("web-base-url") ?? DEFAULT_WEB_BASE_URL
  const iterations = Number.parseInt(parseArg("iterations") ?? String(DEFAULT_ITERATIONS), 10)
  const outputPath = parseArg("output") ?? DEFAULT_OUTPUT_PATH
  const samples: TimedSample[] = []

  await getDiscoverData(filters)
  await fetchAndDrain(`${apiBaseUrl}/api/v1/discover`)
  await fetchAndDrain(`${webBaseUrl}/discover`)

  for (let index = 0; index < iterations; index += 1) {
    samples.push(await timeTask("db:listDiscoverGenres", () => listDiscoverGenres(filters)))
    samples.push(
      await timeTask("db:listLibraryCatalogFacetCounts", () => listLibraryCatalogFacetCounts(filters))
    )
    samples.push(
      await timeTask("db:listCollection:trending", () =>
        listLibraryCollectionNovels("trending", filters, { page: 1, pageSize: 3 })
      )
    )
    samples.push(
      await timeTask("db:listCollection:hidden-gems", () =>
        listLibraryCollectionNovels("hidden-gems", filters, { page: 1, pageSize: 3 })
      )
    )
    samples.push(
      await timeTask("db:listCollection:editors-picks", () =>
        listLibraryCollectionNovels("editors-picks", filters, { page: 1, pageSize: 3 })
      )
    )
    samples.push(
      await timeTask("db:listCollection:new-voices", () =>
        listLibraryCollectionNovels("new-voices", filters, { page: 1, pageSize: 3 })
      )
    )
    samples.push(
      await timeTask("db:countCollection:trending", () => countLibraryCollectionNovels("trending", filters))
    )
    samples.push(
      await timeTask("db:countCollection:hidden-gems", () =>
        countLibraryCollectionNovels("hidden-gems", filters)
      )
    )
    samples.push(
      await timeTask("db:countCollection:editors-picks", () =>
        countLibraryCollectionNovels("editors-picks", filters)
      )
    )
    samples.push(
      await timeTask("db:countCollection:new-voices", () =>
        countLibraryCollectionNovels("new-voices", filters)
      )
    )
    samples.push(await timeTask("service:getDiscoverData", () => getDiscoverData(filters)))
    samples.push(await timeTask("http:api:/api/v1/discover", () => fetchAndDrain(`${apiBaseUrl}/api/v1/discover`)))
    samples.push(await timeTask("http:web:/discover", () => fetchAndDrain(`${webBaseUrl}/discover`)))
  }

  const summaries = summarize(samples)
  const lookup = new Map(summaries.map((item) => [item.label, item]))
  const serviceAvgMs = lookup.get("service:getDiscoverData")?.avgMs ?? 0
  const apiAvgMs = lookup.get("http:api:/api/v1/discover")?.avgMs ?? 0
  const webAvgMs = lookup.get("http:web:/discover")?.avgMs ?? 0

  const payload = {
    generatedAt: new Date().toISOString(),
    iterations,
    apiBaseUrl,
    webBaseUrl,
    summaries,
    breakdown: {
      dbAndServiceAvgMs: serviceAvgMs,
      apiTransportAndExpressOverheadMs: Math.max(0, apiAvgMs - serviceAvgMs),
      ssrAndProxyOverheadMs: Math.max(0, webAvgMs - apiAvgMs),
    },
  }

  await Bun.write(outputPath, JSON.stringify(payload, null, 2))
  console.log(`[profile] wrote ${outputPath}`)
}

await main()
process.exit(0)
