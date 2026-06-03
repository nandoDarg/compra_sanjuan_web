export const SAN_JUAN_DEPARTMENTS = [
  'Capital',
  'Rawson',
  'Rivadavia',
  'Chimbas',
  'Santa Lucia',
  'Pocito',
  'Caucete',
  'Albardon',
  'San Martin',
  'Angaco',
  '9 de Julio',
  '25 de Mayo',
  'Sarmiento',
  'Ullum',
  'Zonda',
  'Jachal',
  'Iglesia',
  'Calingasta',
  'Valle Fertil',
] as const

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
