import { SYNONYM_MAP } from './synonym-map'

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
    .replace(/[\u0300-\u036f]/g, '')
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

// ─── Fuzzy match against synonym-map keys ────────────────────────────────────

const MAX_EDIT_DISTANCE = 2

/**
 * Devuelve la clave canónica del mapa si el input está a ≤ 2 ediciones de
 * distancia de ella. Si no hay match, devuelve null.
 */
function fuzzyMatchCanonical(normalized: string): string | null {
  // Primero intenta coincidencia exacta en las claves
  if (normalized in SYNONYM_MAP) {
    return normalized
  }

  // Luego intenta coincidencia exacta en cualquier sinónimo de cada entrada
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const synonym of synonyms) {
      const normSynonym = synonym
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      if (normSynonym === normalized) {
        return key
      }
    }
  }

  // Finalmente fuzzy sobre las claves canónicas
  let bestKey: string | null = null
  let bestDist = MAX_EDIT_DISTANCE + 1

  for (const key of Object.keys(SYNONYM_MAP)) {
    const dist = levenshtein(normalized, key)
    if (dist <= MAX_EDIT_DISTANCE && dist < bestDist) {
      bestDist = dist
      bestKey = key
    }
  }

  return bestKey
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Toma el input crudo del usuario y devuelve un array de términos de búsqueda.
 *
 * - Si el input coincide (exacto o fuzzy) con una clave canónica del mapa de
 *   sinónimos, devuelve la lista de sinónimos expandida.
 * - Si no hay match semántico, devuelve el input normalizado como único término.
 */
export function expandSearchQuery(input: string): string[] {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return []
  }

  // Intenta expandir el primer token significativo (el término más relevante)
  const firstToken = normalized.split(' ')[0]
  const canonical = fuzzyMatchCanonical(firstToken) ?? fuzzyMatchCanonical(normalized)

  if (canonical !== null) {
    // Devuelve los sinónimos tal como están en el mapa; el consumer construye
    // los patrones ilike con ellos.
    return SYNONYM_MAP[canonical]
  }

  // Sin expansión: devuelve el input normalizado completo como único término
  return [normalized]
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
