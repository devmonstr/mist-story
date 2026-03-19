/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@mist/shared"],
}

export default nextConfig
