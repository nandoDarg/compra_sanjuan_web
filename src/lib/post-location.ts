export { SAN_JUAN_DEPARTMENTS, resolveSanJuanDepartment } from '@/lib/san-juan-departments'

const MAPS_ALLOWED_HOSTS = new Set([
  'maps.google.com',
  'www.maps.google.com',
  'maps.app.goo.gl',
  'www.google.com',
  'google.com',
])

export function isValidGoogleMapsUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  try {
    const parsed = new URL(trimmed)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    if (!MAPS_ALLOWED_HOSTS.has(parsed.hostname)) {
      return false
    }

    if ((parsed.hostname === 'www.google.com' || parsed.hostname === 'google.com') && !parsed.pathname.startsWith('/maps')) {
      return false
    }

    return true
  } catch {
    return false
  }
}
