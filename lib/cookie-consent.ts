export const COOKIE_CONSENT_KEY = 'ya-ponchik-cookie-consent'
export const COOKIE_CONSENT_EVENT = 'ya-ponchik-cookie-consent'

export type CookieConsentValue = 'all' | 'necessary'

export function isCookieConsentValue(value: string | null): value is CookieConsentValue {
  return value === 'all' || value === 'necessary'
}

export function readCookieConsent(): CookieConsentValue | null {
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    return isCookieConsentValue(value) ? value : null
  } catch {
    return null
  }
}

export function writeCookieConsent(value: CookieConsentValue) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  } catch {
    // Storage can be blocked in private mode; the banner will show again next visit.
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}
