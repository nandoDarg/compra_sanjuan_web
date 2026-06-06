import type { NextConfig } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
let tunnelHost: string | null = null

if (siteUrl) {
  try {
    tunnelHost = new URL(siteUrl).host
  } catch {
    tunnelHost = null
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: tunnelHost ? [tunnelHost] : [],
}

export default nextConfig
