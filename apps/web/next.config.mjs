import os from "node:os"

function collectAllowedDevOrigins() {
  const origins = new Set(["localhost", "127.0.0.1"])

  const appUrl = process.env.APP_URL
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).hostname)
    } catch {
      // Ignore invalid APP_URL during local development.
    }
  }

  const configuredOrigins = process.env.ALLOWED_DEV_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  configuredOrigins?.forEach((origin) => origins.add(origin))

  for (const networkInterface of Object.values(os.networkInterfaces())) {
    for (const address of networkInterface ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        origins.add(address.address)
      }
    }
  }

  return [...origins]
}

function resolveApiOrigin() {
  const explicitOrigin =
    process.env.INTERNAL_API_URL ||
    process.env.API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/$/, "")
  }

  const apiPort = process.env.API_PORT || "4000"
  return `http://127.0.0.1:${apiPort}`
}

const apiOrigin = resolveApiOrigin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: collectAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${apiOrigin}/health`,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@mist/shared"],
}

export default nextConfig
