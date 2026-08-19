import type { Metadata } from 'next'
import { CITY_DELIVERY, RESTAURANT_LOCATION } from '@/lib/deliveryZone'

export const SITE_NAME = 'Я-пончик'
export const SITE_LEGAL_NAME = 'Пекарня и кулинария «Я-пончик»'
export const SITE_DOMAIN = 'iponchik.ru'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`).replace(
  /\/$/,
  '',
)

export const SITE_TITLE = 'Я-пончик — пончики и пицца в Челябинске'
export const SITE_DESCRIPTION =
  'Пекарня «Я-пончик» на ул. Руставели, 24 в Челябинске: свежие пончики, горячая пицца и пирожки. Заказ онлайн, самовывоз и доставка. Ежедневно с 8:00 до 22:00.'

export const SITE_KEYWORDS = [
  'пончики Челябинск',
  'пицца Челябинск',
  'пекарня Челябинск',
  'Я-пончик',
  'кулинария Руставели',
  'доставка пончиков Челябинск',
  'пирожки Челябинск',
  'заказ пончиков онлайн',
  'самовывоз Челябинск',
]

export const SITE_PHONE = '+79084945053'
export const SITE_PHONE_LABEL = '+7 (908) 494-50-53'
export const SITE_PHONE_HREF = `tel:${SITE_PHONE}`

export const SITE_ADDRESS = {
  street: 'ул. Руставели, 24',
  city: 'Челябинск',
  region: 'Челябинская область',
  postalCode: '454000',
  country: 'RU',
} as const

export const SITE_ADDRESS_LINE = `${SITE_ADDRESS.street}, ${SITE_ADDRESS.city}`

export const SITE_GEO = {
  lat: RESTAURANT_LOCATION.lat,
  lon: RESTAURANT_LOCATION.lon,
} as const

export const SITE_HOURS = {
  opens: '08:00',
  closes: '22:00',
  label: 'ежедневно с 8:00 до 22:00',
} as const

export const SITE_OG_IMAGE = '/images/hero-donuts.png'
export const SITE_OG_IMAGE_ALT =
  'Свежие пончики и горячая пицца пекарни «Я-пончик» в Челябинске'

export const YANDEX_MAPS_URL = `https://yandex.ru/maps/?text=${encodeURIComponent(
  `${SITE_ADDRESS.city}, ${SITE_ADDRESS.street}`,
)}&pt=${SITE_GEO.lon},${SITE_GEO.lat}&z=17&l=map`

export const SITE_FAQS = [
  {
    question: 'Где находится пекарня «Я-пончик» в Челябинске?',
    answer:
      'Мы на ул. Руставели, 24. Самовывоз каждый день с 8:00 до 22:00, заказы принимаем до 21:00.',
  },
  {
    question: 'Есть ли доставка пончиков и пиццы по Челябинску?',
    answer:
      `Да, доставляем по городу. Минимальный заказ ${CITY_DELIVERY.minOrder} ₽, доставка ${CITY_DELIVERY.fee} ₽. По будням с 12:00 до 15:00 доставка бесплатная, кроме отдалённых зон.`,
  },
  {
    question: 'Как заказать пончики без очереди?',
    answer:
      'Оформите заказ на сайте iponchik.ru и заберите готовый заказ на кассе. Каждую партию печём к вашему приходу.',
  },
] as const

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function buildRootMetadata(): Metadata {
  const verification: Metadata['verification'] = {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '9391eca1e84168fb',
  }
  if (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION) {
    verification.google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_LEGAL_NAME, url: SITE_URL }],
    creator: SITE_LEGAL_NAME,
    publisher: SITE_LEGAL_NAME,
    category: 'food',
    alternates: {
      canonical: '/',
      languages: {
        'ru-RU': '/',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      url: '/',
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: SITE_OG_IMAGE,
          width: 1024,
          height: 1024,
          alt: SITE_OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [SITE_OG_IMAGE],
    },
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: 'default',
    },
    formatDetection: {
      telephone: true,
      address: true,
      email: false,
    },
    other: {
      'geo.region': 'RU-CHE',
      'geo.placename': SITE_ADDRESS.city,
      'geo.position': `${SITE_GEO.lat};${SITE_GEO.lon}`,
      ICBM: `${SITE_GEO.lat}, ${SITE_GEO.lon}`,
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  }
}
