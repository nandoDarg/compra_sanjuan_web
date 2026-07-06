import { randomInt } from 'node:crypto'
import type { ProductEntry } from './catalog'
import { SEED_CONFIG } from './config'

const TITLE_QUALIFIERS = [
  'impecable',
  'excelente estado',
  'poco uso',
  'como nuevo',
  'unico dueño',
  'ideal para regalo',
  'listo para usar',
  'muy cuidado',
]

const ABBREVIATIONS = ['perm.', 'esc.', 'liq.', 'urg.', 'exc est.', 'c/acc.', 'caja orig.']

const DESCRIPTION_PHRASES = [
  'Excelente estado general.',
  'Muy poco uso.',
  'Listo para usar sin detalles.',
  'Se aceptan cambios razonables.',
  'Unico dueño desde que se compro.',
  'Se acepta permuta por articulo de similar valor.',
  'Escucho ofertas serias.',
  'Entrega coordinada en San Juan capital o alrededores.',
  'Funciona perfecto, sin reparaciones pendientes.',
  'Se vende por mudanza y falta de uso.',
  'Incluye accesorios originales.',
  'Documentacion y garantia al dia.',
  'Se puede ver sin compromiso antes de comprar.',
  'Precio conversable dentro de lo razonable.',
]

function randomFrom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length)]
}

function pickDistinct<T>(values: readonly T[], count: number): T[] {
  const picked = new Set<T>()
  const target = Math.min(count, values.length)

  while (picked.size < target) {
    picked.add(randomFrom(values))
  }

  return Array.from(picked)
}

/**
 * Elige el nombre a usar para el producto: con SEED_TYPO_RATE probabilidad
 * usa un error de tipeo real conocido (Capa 5), si no con SEED_SYNONYM_RATE
 * probabilidad usa un sinonimo (Capa 4), sino el nombre canonico (Capa 1/2).
 */
export function pickProductName(product: ProductEntry): string {
  if (product.typoVariants?.length && Math.random() < SEED_CONFIG.typoRate) {
    return randomFrom(product.typoVariants)
  }

  if (product.synonyms?.length && Math.random() < SEED_CONFIG.synonymRate) {
    return randomFrom(product.synonyms)
  }

  return product.name
}

export function buildTitle(product: ProductEntry): string {
  const base = pickProductName(product)
  let title = Math.random() < 0.6 ? `${base} ${randomFrom(TITLE_QUALIFIERS)}` : base

  if (Math.random() < SEED_CONFIG.abbreviationRate) {
    title = `${title} ${randomFrom(ABBREVIATIONS)}`
  }

  return title.trim()
}

export function buildDescription(): string {
  const sentences = pickDistinct(DESCRIPTION_PHRASES, randomInt(2, 5))
  let description = sentences.join(' ')

  if (Math.random() < SEED_CONFIG.abbreviationRate) {
    description = `${description} ${randomFrom(ABBREVIATIONS)}`
  }

  return description
}
