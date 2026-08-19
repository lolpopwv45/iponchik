import { JsonLd } from '@/components/json-ld'
import { Storefront } from '@/components/storefront'
import { getRawCatalog } from '@/lib/public-catalog'
import { buildSiteJsonLd } from '@/lib/seo'

export const revalidate = 60

export default async function Page() {
  const catalog = await getRawCatalog()

  return (
    <>
      <JsonLd data={buildSiteJsonLd(catalog)} />
      <Storefront initialCatalog={catalog} />
    </>
  )
}
