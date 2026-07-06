const COMBINING_DIACRITICS_PATTERN = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
)

export function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(COMBINING_DIACRITICS_PATTERN, '')
}

export function slugify(value: string) {
  return stripDiacritics(value.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
