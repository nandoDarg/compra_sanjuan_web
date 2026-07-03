import { SYNONYM_MAP } from './synonym-map'
import { generateWordVariants } from './stem'

// ─── Stop words ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'de', 'el', 'la', 'un', 'una', 'los', 'las', 'para', 'con',
  'en', 'y', 'o', 'que', 'del', 'al', 'se', 'por', 'su', 'es',
])

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normaliza un string a minúsculas, sin tildes y sin palabras vacías.
 */
export function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .join(' ')
}

// ─── Levenshtein distance (iterative, O(m*n)) ─────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length

  // Shortcut: length difference alone exceeds threshold
  if (Math.abs(m - n) > 2) {
    return Math.abs(m - n)
  }

  const prev: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  const curr: number[] = new Array<number>(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j] + 1,           // deletion
        prev[j - 1] + cost     // substitution
      )
    }
    prev.splice(0, prev.length, ...curr)
  }

  return prev[n]
}

// ─── Fuzzy match against synonym-map keys (Capas 3/4) ────────────────────────

const MAX_EDIT_DISTANCE = 2
const MIN_LENGTH_FOR_SYNONYM_LOOKUP = 3

/**
 * Devuelve la clave canónica del mapa si `word` (o alguna de sus variantes
 * morfológicas) está a <= 2 ediciones de distancia de ella, o coincide
 * exacto con una clave o con cualquier sinónimo de la lista. Si no hay
 * match, devuelve null.
 */
function fuzzyMatchCanonical(word: string): string | null {
  if (word.length < MIN_LENGTH_FOR_SYNONYM_LOOKUP) {
    return null
  }

  // Primero intenta coincidencia exacta en las claves
  if (word in SYNONYM_MAP) {
    return word
  }

  // Luego intenta coincidencia exacta en cualquier sinónimo de cada entrada
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const synonym of synonyms) {
      const normSynonym = synonym
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
      if (normSynonym === word) {
        return key
      }
    }
  }

  // Finalmente fuzzy sobre las claves canónicas
  let bestKey: string | null = null
  let bestDist = MAX_EDIT_DISTANCE + 1

  for (const key of Object.keys(SYNONYM_MAP)) {
    const dist = levenshtein(word, key)
    if (dist <= MAX_EDIT_DISTANCE && dist < bestDist) {
      bestDist = dist
      bestKey = key
    }
  }

  return bestKey
}

// ─── Public API ───────────────────────────────────────────────────────────────

const MAX_EXPANDED_TERMS = 24

/**
 * Toma el input crudo del usuario y devuelve un array de términos de
 * búsqueda, combinando 4 capas (aditivas, no excluyentes):
 *
 * - Capa 1 (coincidencia exacta): cada palabra normalizada, y la frase
 *   completa cuando hay mas de una palabra (para priorizar matches de frase).
 * - Capa 2 (normalizacion linguistica): variantes de singular/plural y
 *   diminutivos de cada palabra (ver `stem.ts`), que gracias al ILIKE por
 *   substring alcanzan para relacionar "perro"/"perros"/"perrito"/"perritos".
 * - Capas 3/4 (variantes frecuentes + sinonimos): la palabra y sus variantes
 *   morfologicas se buscan en `SYNONYM_MAP` (exacto o fuzzy); si hay match
 *   se suman TODOS los sinonimos de esa entrada a la lista de terminos.
 *
 * A diferencia de la version anterior, esto es aditivo: nunca se pierde la
 * palabra original ni el resto de los tokens de la query.
 */
export function expandSearchQuery(input: string): string[] {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return []
  }

  const tokens = normalized.split(' ').filter(Boolean)
  const terms = new Set<string>()

  // Capa 1: frase completa (prioriza coincidencias de frase exacta, ej.
  // "golden retriever" como substring literal del titulo).
  if (tokens.length > 1) {
    terms.add(normalized)
  }

  for (const token of tokens) {
    // Capa 1: la palabra tal cual la escribio el usuario.
    terms.add(token)

    // Capa 2: variantes morfologicas (singular/plural/diminutivo).
    const variants = generateWordVariants(token)
    for (const variant of variants) {
      terms.add(variant)
    }

    // Capas 3/4: sinonimos, evaluados sobre la palabra y sus variantes.
    const canonicalKeys = new Set<string>()
    for (const candidate of variants) {
      const canonical = fuzzyMatchCanonical(candidate)
      if (canonical) {
        canonicalKeys.add(canonical)
      }
    }

    for (const key of canonicalKeys) {
      for (const synonym of SYNONYM_MAP[key]) {
        terms.add(synonym)
      }
    }
  }

  return Array.from(terms).slice(0, MAX_EXPANDED_TERMS)
}

/**
 * Construye el string de condición OR para Supabase a partir de los términos
 * expandidos, incluyendo category y subcategory cuando corresponde.
 *
 * Ejemplo de salida:
 *   "title.ilike.%perro%,description.ilike.%perro%,title.ilike.%mascota%,..."
 */
export function buildSupabaseOrFilter(
  terms: string[],
  includeSubcategory: boolean
): string {
  return terms
    .map((term) => {
      const p = `%${term}%`
      const base = `title.ilike.${p},description.ilike.${p},category.ilike.${p}`
      return includeSubcategory ? `${base},subcategory.ilike.${p}` : base
    })
    .join(',')
}
