export const CHECKOUT_LIMITS = {
  name: 80,
  address: 200,
  comment: 500,
  apartment: 20,
  entrance: 20,
  intercom: 20,
  timeLabel: 80,
  items: 50,
} as const

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_TAGS = /<\/?[^>]+>/g

export function sanitizePlainText(value: string, maxLength: number): string {
  return value
    .replace(HTML_TAGS, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizePhone(value: string): string | null {
  let digits = phoneDigits(value)
  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    digits = `7${digits.slice(1)}`
  } else if (digits.length === 10) {
    digits = `7${digits}`
  }

  if (!/^7\d{10}$/.test(digits)) return null
  return `+${digits}`
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) != null
}

export function formatPhoneInput(raw: string): string {
  const digits = phoneDigits(raw).slice(0, 11)
  if (!digits) return ''

  let national = digits
  if (national.startsWith('8') || national.startsWith('7')) {
    national = national.slice(1)
  }
  national = national.slice(0, 10)

  let formatted = '+7'
  if (national.length === 0) return formatted
  formatted += ` (${national.slice(0, 3)}`
  if (national.length >= 3) formatted += ')'
  if (national.length > 3) formatted += ` ${national.slice(3, 6)}`
  if (national.length > 6) formatted += `-${national.slice(6, 8)}`
  if (national.length > 8) formatted += `-${national.slice(8, 10)}`
  return formatted
}

export interface CheckoutFieldErrors {
  name?: string
  phone?: string
  address?: string
  comment?: string
  apartment?: string
  entrance?: string
  intercom?: string
}

export interface SanitizedCheckoutFields {
  name: string
  phone: string
  comment: string
  address: string
  apartment: string
  entrance: string
  intercom: string
}

export function sanitizeCheckoutFields(input: {
  name: string
  phone: string
  comment: string
  address: string
  apartment: string
  entrance: string
  intercom: string
}): SanitizedCheckoutFields {
  return {
    name: sanitizePlainText(input.name, CHECKOUT_LIMITS.name),
    phone: formatPhoneInput(input.phone),
    comment: sanitizePlainText(input.comment, CHECKOUT_LIMITS.comment),
    address: sanitizePlainText(input.address, CHECKOUT_LIMITS.address),
    apartment: sanitizePlainText(input.apartment, CHECKOUT_LIMITS.apartment),
    entrance: sanitizePlainText(input.entrance, CHECKOUT_LIMITS.entrance),
    intercom: sanitizePlainText(input.intercom, CHECKOUT_LIMITS.intercom),
  }
}

export function validateCheckoutFields(
  fields: SanitizedCheckoutFields,
  fulfillment: 'pickup' | 'delivery',
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}

  if (!fields.name) {
    errors.name = 'Укажите имя'
  } else if (fields.name.length < 2) {
    errors.name = 'Имя слишком короткое'
  }

  if (!fields.phone) {
    errors.phone = 'Укажите телефон'
  } else if (!isValidPhone(fields.phone)) {
    errors.phone = 'Введите телефон в формате +7 (XXX) XXX-XX-XX'
  }

  if (fields.comment.length > CHECKOUT_LIMITS.comment) {
    errors.comment = `Комментарий не длиннее ${CHECKOUT_LIMITS.comment} символов`
  }

  if (fulfillment === 'delivery') {
    if (!fields.address) {
      errors.address = 'Укажите адрес доставки'
    } else if (fields.address.length < 5) {
      errors.address = 'Адрес слишком короткий'
    }

    if (!fields.apartment) errors.apartment = 'Укажите квартиру'
    if (!fields.entrance) errors.entrance = 'Укажите подъезд'
    if (!fields.intercom) errors.intercom = 'Укажите домофон'
  }

  return errors
}
