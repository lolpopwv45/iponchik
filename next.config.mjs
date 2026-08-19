import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function supabaseImagePatterns() {
  /** @type {{ protocol: 'http' | 'https', hostname: string, pathname: string }[]} */
  const patterns = [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/product-images/**',
    },
  ]

  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return patterns

  try {
    const url = new URL(raw)
    if (!url.hostname) return patterns
    patterns.unshift({
      protocol: url.protocol === 'http:' ? 'http' : 'https',
      hostname: url.hostname,
      pathname: '/storage/v1/object/public/product-images/**',
    })
  } catch {
    // Keep the wildcard pattern if the env URL is invalid.
  }

  return patterns
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseImagePatterns(),
  },
  // Pin Turbopack to iponchik so the parent package.json cannot steal the workspace root.
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
