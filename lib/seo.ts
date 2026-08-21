import type { Catalog } from '@/lib/catalog'
import type { Product } from '@/lib/products'
import {
  SITE_ADDRESS,
  SITE_DESCRIPTION,
  SITE_GEO,
  SITE_HOURS,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_APPLE_ICON,
  SITE_PHONE,
  SITE_URL,
  SITE_FAQS,
  absoluteUrl,
} from '@/lib/site'

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

function productImageUrl(product: Product) {
  return absoluteUrl(product.image || SITE_OG_IMAGE)
}

function menuSections(catalog: Catalog) {
  return catalog.categories
    .map((category) => {
      const items = catalog.products.filter((product) => product.categoryId === category.id)
      if (items.length === 0) return null
      return {
        '@type': 'MenuSection',
        name: category.name,
        hasMenuItem: items.map((product) => ({
          '@type': 'MenuItem',
          name: product.name,
          description: product.description,
          image: productImageUrl(product),
          offers: {
            '@type': 'Offer',
            price: String(product.price),
            priceCurrency: 'RUB',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
          nutrition: {
            '@type': 'NutritionInformation',
            calories: `${product.nutrition.calories} kcal`,
            proteinContent: `${product.nutrition.proteins} g`,
            fatContent: `${product.nutrition.fats} g`,
            carbohydrateContent: `${product.nutrition.carbs} g`,
          },
        })),
      }
    })
    .filter(Boolean)
}

export function buildSiteJsonLd(catalog: Catalog) {
  const businessId = `${SITE_URL}/#business`
  const websiteId = `${SITE_URL}/#website`
  const menuId = `${SITE_URL}/#menu`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'ru-RU',
        publisher: { '@id': businessId },
      },
      {
        '@type': ['Bakery', 'FoodEstablishment'],
        '@id': businessId,
        name: SITE_NAME,
        legalName: SITE_LEGAL_NAME,
        alternateName: ['Я пончик', 'iponchik'],
        url: SITE_URL,
        image: absoluteUrl(SITE_OG_IMAGE),
        logo: absoluteUrl(SITE_APPLE_ICON),
        telephone: SITE_PHONE,
        priceRange: '₽',
        currenciesAccepted: 'RUB',
        paymentAccepted: 'Cash, Credit Card',
        servesCuisine: ['Выпечка', 'Пицца', 'Десерты'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: SITE_ADDRESS.street,
          addressLocality: SITE_ADDRESS.city,
          addressRegion: SITE_ADDRESS.region,
          postalCode: SITE_ADDRESS.postalCode,
          addressCountry: SITE_ADDRESS.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: SITE_GEO.lat,
          longitude: SITE_GEO.lon,
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [...WEEKDAYS],
          opens: SITE_HOURS.opens,
          closes: SITE_HOURS.closes,
        },
        hasMap: `https://yandex.ru/maps/?pt=${SITE_GEO.lon},${SITE_GEO.lat}&z=17&l=map`,
        areaServed: {
          '@type': 'City',
          name: SITE_ADDRESS.city,
        },
        hasMenu: { '@id': menuId },
        acceptsReservations: false,
      },
      {
        '@type': 'Menu',
        '@id': menuId,
        name: 'Меню «Я-пончик»',
        hasMenuSection: menuSections(catalog),
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: SITE_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
