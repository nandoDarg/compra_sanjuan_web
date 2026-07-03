/**
 * Capa 2 de busqueda: normalizacion linguistica heuristica (no un lematizador
 * real). Genera variantes morfologicas de una palabra ya normalizada
 * (minusculas, sin tildes) para singular/plural y diminutivos frecuentes en
 * espanol rioplatense, de forma que "perritos" tambien pueda encontrar
 * contenido con "perro", "perros" o "perrito".
 *
 * Principio: como el filtro de busqueda usa ILIKE (coincidencia de
 * substring), alcanza con generar formas mas CORTAS/canonicas de la palabra
 * (la "raiz") en vez de todas las flexiones posibles: %perro% ya matchea
 * "perro", "perros" y "perrito" porque todas contienen "perro" como
 * substring. Por eso las reglas priorizan achicar la palabra hacia su raiz.
 */

const MIN_VARIANT_LENGTH = 3

type SuffixRule = {
  suffix: string
  replacement: string
}

// Orden importa: reglas mas especificas (diminutivos) antes que las genericas
// (plural simple), para no perder informacion de genero al recortar.
const SUFFIX_RULES: SuffixRule[] = [
  // Diminutivos plurales -> raiz + genero
  { suffix: 'ecitos', replacement: 'o' },
  { suffix: 'ecitas', replacement: 'a' },
  { suffix: 'citos', replacement: 'o' },
  { suffix: 'citas', replacement: 'a' },
  { suffix: 'itos', replacement: 'o' },
  { suffix: 'itas', replacement: 'a' },
  // Diminutivos singulares -> raiz + genero
  { suffix: 'ecito', replacement: 'o' },
  { suffix: 'ecita', replacement: 'a' },
  { suffix: 'cito', replacement: 'o' },
  { suffix: 'cita', replacement: 'a' },
  { suffix: 'ito', replacement: 'o' },
  { suffix: 'ita', replacement: 'a' },
  // Plurales terminados en consonante + "es" (flor -> flores)
  { suffix: 'ones', replacement: 'on' },
  { suffix: 'es', replacement: '' },
  // Plural simple
  { suffix: 's', replacement: '' },
]

/**
 * Genera variantes candidatas de una palabra ya normalizada (sin tildes,
 * minusculas). Incluye la palabra original. No garantiza que las variantes
 * sean palabras reales: el consumidor las usa como termino ILIKE, asi que
 * un falso positivo ocasional es preferible a perder recall.
 */
export function generateWordVariants(word: string): string[] {
  const variants = new Set<string>([word])

  for (const rule of SUFFIX_RULES) {
    if (word.length <= rule.suffix.length) {
      continue
    }

    if (!word.endsWith(rule.suffix)) {
      continue
    }

    const stem = word.slice(0, word.length - rule.suffix.length)
    const candidate = stem + rule.replacement

    if (candidate.length >= MIN_VARIANT_LENGTH) {
      variants.add(candidate)
    }

    // Tambien se guarda la raiz "pelada" (sin agregar terminacion de genero)
    // para casos donde la palabra no sigue el patron o/a, ej. "flor".
    if (stem.length >= MIN_VARIANT_LENGTH) {
      variants.add(stem)
    }
  }

  return Array.from(variants)
}
