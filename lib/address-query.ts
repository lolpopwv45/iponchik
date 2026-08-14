/** Нормализация ввода: «6в» → «6В», латинская b → кириллическая в */
export function normalizeAddressQuery(query: string) {
  const latinToCyrillic: Record<string, string> = {
    a: 'а',
    b: 'в',
    c: 'с',
    e: 'е',
    h: 'н',
    k: 'к',
    m: 'м',
    o: 'о',
    p: 'р',
    t: 'т',
    x: 'х',
    y: 'у',
  }

  return query
    .trim()
    .replace(/(\d+)\s*([a-zа-яё])/gi, (_, number: string, letter: string) => {
      const lower = letter.toLowerCase()
      const cyrillic = latinToCyrillic[lower] ?? letter
      return `${number}${cyrillic.toUpperCase()}`
    })
}

export function buildSearchVariants(query: string) {
  const normalized = normalizeAddressQuery(query)
  const withCity = /челябинск/i.test(normalized) ? normalized : `Челябинск, ${normalized}`
  const withStreet = /ул\.?|улица/i.test(normalized)
    ? withCity
    : `Челябинск, ул. ${normalized.replace(/^челябинск,?\s*/i, '')}`

  return [...new Set([normalized, withCity, withStreet])]
}
