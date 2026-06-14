import type { NextConfig } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
const extraAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
let tunnelHost: string | null = null

if (siteUrl) {
  try {
    tunnelHost = new URL(siteUrl).host
  } catch {
    tunnelHost = null
  }
}

const defaultDevOrigins = ['localhost', '127.0.0.1', '192.168.100.11']
const envDevOrigins = (extraAllowedDevOrigins ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedDevOrigins = Array.from(
  new Set([...defaultDevOrigins, ...envDevOrigins, ...(tunnelHost ? [tunnelHost] : [])])
)

const nextConfig: NextConfig = {
  allowedDevOrigins,
}

export default nextConfig
