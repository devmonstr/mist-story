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

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: collectAllowedDevOrigins(),
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@mist/shared"],
}

export default nextConfig
