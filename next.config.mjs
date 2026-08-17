import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Pin Turbopack to iponchik so the parent package.json cannot steal the workspace root.
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
