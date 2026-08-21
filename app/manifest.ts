import type { MetadataRoute } from 'next'
import {
  SITE_APPLE_ICON,
  SITE_DESCRIPTION,
  SITE_ICON,
  SITE_ICON_512,
  SITE_NAME,
} from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — пекарня в Челябинске`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7ed',
    theme_color: '#f97316',
    lang: 'ru',
    icons: [
      {
        src: SITE_ICON,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: SITE_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: SITE_APPLE_ICON,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
