import { JsonLd } from '@/components/json-ld'
import { Storefront } from '@/components/storefront'
import { withProxiedProductImages } from '@/lib/media-proxy'
import { getRawCatalog } from '@/lib/public-catalog'
import { buildSiteJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const rawCatalog = await getRawCatalog()
  const catalog = {
    categories: rawCatalog.categories,
    products: withProxiedProductImages(rawCatalog.products),
  }

  return (
    <>
      <JsonLd data={buildSiteJsonLd(rawCatalog)} />
      <Storefront initialCatalog={catalog} />
    </>
  )
}
