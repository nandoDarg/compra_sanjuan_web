/**
 * Score de relevancia para el ordenamiento "Mas relevantes".
 *
 * Etapa 2 (no implementado aun, documentado para referencia futura):
 * - Popularidad/vistas: requiere una columna `views_count` en `posts` (default 0,
 *   con indice), incrementada via un RPC security definer (`increment_post_view`)
 *   llamado de forma debounced (dedup por localStorage) desde el detalle de
 *   publicacion. `popularityScoreByPostId` ya esta reservado en `RelevanceAuxData`
 *   para no tener que rediseñar tipos cuando esto se active.
 * - Reputacion del vendedor: requiere una columna en `profiles` (`verified`,
 *   `average_rating`) con lectura publica acotada, probablemente via un RPC
 *   dedicado similar a `get_post_favorite_counts` (para no abrir la RLS de
 *   `profiles` en general). El proxy de cantidad de publicaciones se mantendria
 *   como señal para vendedores nuevos sin rating aun.
 *
 * Para activar popularidad: agregarla a ACTIVE_FACTORS y poblar
 * `popularityScoreByPostId`; los demas pesos se reescalan solos.
 */

import { isVehicleCategory } from '@/lib/vehicle-details'

export type RelevanceInputPost = {
  id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  condition: 'new' | 'used' | null
  location_department: string | null
  image_url: string | null
  created_at: string
  user_id: string
  price: number
}

export type VehicleDetailsCompleteness = {
  hasBrand: boolean
  hasModel: boolean
  hasYear: boolean
  hasMileage: boolean
  hasFuelType: boolean
  hasTransmission: boolean
}

export type RelevanceAuxData = {
  favoriteCountsByPostId: Map<string, number>
  sellerPostCountByUserId: Map<string, number>
  imageCountByPostId: Map<string, number>
  vehicleDetailsByPostId?: Map<string, VehicleDetailsCompleteness>
  popularityScoreByPostId?: Map<string, number>
}

// ─── Pesos ────────────────────────────────────────────────────────────────

const RELEVANCE_WEIGHTS_DESIGN = {
  search: 50,
  recency: 20,
  popularity: 10,
  favorites: 10,
  sellerStanding: 5,
  quality: 5,
  // Señal deliberadamente baja: la expansión conceptual (marca/modelo -> su
  // concepto, ej. "iPhone" al buscar "celular") es una señal adicional, no
  // debe superar nunca a un match literal de `search`.
  conceptual: 8,
} as const

type RelevanceFactor = keyof typeof RELEVANCE_WEIGHTS_DESIGN

// Popularidad queda fuera hasta que exista tracking de vistas (Etapa 2).
const ACTIVE_FACTORS: readonly RelevanceFactor[] = [
  'search',
  'recency',
  'favorites',
  'sellerStanding',
  'quality',
  'conceptual',
]

function computeActiveWeights(
  design: typeof RELEVANCE_WEIGHTS_DESIGN,
  active: readonly RelevanceFactor[]
): Record<RelevanceFactor, number> {
  const activeSum = active.reduce((sum, factor) => sum + design[factor], 0)

  const weights = {} as Record<RelevanceFactor, number>
  for (const factor of Object.keys(design) as RelevanceFactor[]) {
    const isActive = active.includes(factor)
    weights[factor] = isActive ? (design[factor] / activeSum) * 100 : 0
  }

  return weights
}

/** Pesos efectivos en uso, ya redistribuidos mientras popularidad esta inactiva. */
export const RELEVANCE_WEIGHTS = computeActiveWeights(RELEVANCE_WEIGHTS_DESIGN, ACTIVE_FACTORS)

// ─── Recencia: boost + decaimiento ─────────────────────────────────────────

export const RECENCY_BOOST_WINDOW_HOURS = 48
export const RECENCY_BOOST_VALUE = 1.0
export const RECENCY_DECAY_HALF_LIFE_DAYS = 14

/**
 * 1.0 flat durante las primeras 48h (boost a publicaciones nuevas), luego
 * decaimiento exponencial con vida media de RECENCY_DECAY_HALF_LIFE_DAYS dias.
 * Cubre tanto el "decaimiento gradual" como la perdida de relevancia
 * progresiva de publicaciones inactivas por mucho tiempo (curva asintotica).
 */
export function computeRecencyFactor(createdAtIso: string, now: number = Date.now()): number {
  const createdAt = new Date(createdAtIso).getTime()
  if (Number.isNaN(createdAt)) {
    return 0
  }

  const ageHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60))

  if (ageHours <= RECENCY_BOOST_WINDOW_HOURS) {
    return RECENCY_BOOST_VALUE
  }

  const ageDaysAfterBoost = (ageHours - RECENCY_BOOST_WINDOW_HOURS) / 24
  const decayed =
    RECENCY_BOOST_VALUE * Math.pow(0.5, ageDaysAfterBoost / RECENCY_DECAY_HALF_LIFE_DAYS)

  return Math.max(0, decayed)
}

// ─── Sub-scores (0..1) ──────────────────────────────────────────────────────

const COMBINING_DIACRITICS_PATTERN = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
)

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(COMBINING_DIACRITICS_PATTERN, '')

const MAX_SEARCH_RAW_SCORE = 22

/** Reutiliza la heuristica de matching existente (title/description/category), sumando subcategory. */
export function scoreSearchMatch(
  post: RelevanceInputPost,
  normalizedQuery: string,
  queryTokens: string[]
): number {
  if (!normalizedQuery && queryTokens.length === 0) {
    return 0
  }

  const title = normalizeText(post.title)
  const description = normalizeText(post.description)
  const category = normalizeText(post.category)
  const subcategory = post.subcategory ? normalizeText(post.subcategory) : ''

  let raw = 0
  if (normalizedQuery && title.includes(normalizedQuery)) raw += 8
  if (normalizedQuery && description.includes(normalizedQuery)) raw += 4
  if (normalizedQuery && category.includes(normalizedQuery)) raw += 5
  if (normalizedQuery && subcategory.includes(normalizedQuery)) raw += 3

  for (const token of queryTokens) {
    if (title.includes(token)) raw += 3
    if (description.includes(token)) raw += 1
    if (category.includes(token)) raw += 2
    if (subcategory.includes(token)) raw += 1
  }

  return Math.min(1, raw / MAX_SEARCH_RAW_SCORE)
}

const CONCEPT_MATCH_SATURATION_COUNT = 3

/**
 * Puntua coincidencias que solo aparecen via expansion conceptual/de
 * sinonimos (`expandSearchQuery`), no en el texto literal de la busqueda.
 * Retornos decrecientes: con ~3 terminos expandidos encontrados ya alcanza
 * el maximo, mismo patron que `scoreFavorites`.
 */
export function scoreConceptMatch(
  post: RelevanceInputPost,
  expandedTerms: string[]
): number {
  if (expandedTerms.length === 0) {
    return 0
  }

  const title = normalizeText(post.title)
  const description = normalizeText(post.description)

  let matches = 0
  for (const term of expandedTerms) {
    const normalizedTerm = normalizeText(term)
    if (normalizedTerm.length < 2) {
      continue
    }

    if (title.includes(normalizedTerm) || description.includes(normalizedTerm)) {
      matches += 1
    }
  }

  if (matches <= 0) {
    return 0
  }

  return Math.min(1, Math.log2(1 + matches) / Math.log2(1 + CONCEPT_MATCH_SATURATION_COUNT))
}

export function scoreRecency(createdAtIso: string, now?: number): number {
  return computeRecencyFactor(createdAtIso, now)
}

const FAVORITES_SATURATION_COUNT = 20

/** Retornos decrecientes: ~20 favoritos alcanza el maximo. */
export function scoreFavorites(postId: string, favoriteCountsByPostId: Map<string, number>): number {
  const count = favoriteCountsByPostId.get(postId) ?? 0
  if (count <= 0) {
    return 0
  }

  return Math.min(1, Math.log2(1 + count) / Math.log2(1 + FAVORITES_SATURATION_COUNT))
}

const SELLER_STANDING_CAP = 10

/** Proxy de estado del vendedor: cantidad de publicaciones propias, con tope para no monopolizar. */
export function scoreSellerStanding(
  userId: string,
  sellerPostCountByUserId: Map<string, number>
): number {
  const totalPosts = sellerPostCountByUserId.get(userId) ?? 1
  const otherPosts = Math.max(0, totalPosts - 1)

  if (otherPosts <= 0) {
    return 0
  }

  return Math.min(1, Math.log2(otherPosts + 1) / Math.log2(SELLER_STANDING_CAP + 1))
}

const QUALITY_DESCRIPTION_TARGET_CHARS = 200
const QUALITY_IMAGE_TARGET_COUNT = 4

export function scoreQuality(post: RelevanceInputPost, aux: RelevanceAuxData): number {
  const descriptionScore = Math.min(
    1,
    post.description.trim().length / QUALITY_DESCRIPTION_TARGET_CHARS
  )

  const imageCount = aux.imageCountByPostId.get(post.id) ?? (post.image_url ? 1 : 0)
  const imageScore = Math.min(1, imageCount / QUALITY_IMAGE_TARGET_COUNT)

  const categorizationScore = post.subcategory ? 1 : post.category ? 0.5 : 0
  const locationScore = post.location_department ? 1 : 0

  if (!isVehicleCategory(post.category)) {
    return (
      descriptionScore * 0.35 +
      imageScore * 0.35 +
      categorizationScore * 0.15 +
      locationScore * 0.15
    )
  }

  const vehicleDetails = aux.vehicleDetailsByPostId?.get(post.id)
  if (!vehicleDetails) {
    return (
      descriptionScore * 0.35 +
      imageScore * 0.35 +
      categorizationScore * 0.15 +
      locationScore * 0.15
    )
  }

  const vehicleFields = Object.values(vehicleDetails)
  const vehicleCompleteness =
    vehicleFields.filter(Boolean).length / vehicleFields.length

  return (
    descriptionScore * 0.28 +
    imageScore * 0.28 +
    categorizationScore * 0.12 +
    locationScore * 0.12 +
    vehicleCompleteness * 0.2
  )
}

// ─── Combinacion final ──────────────────────────────────────────────────────

export function combineRelevanceScore(
  post: RelevanceInputPost,
  aux: RelevanceAuxData,
  normalizedQuery: string,
  queryTokens: string[],
  now?: number,
  expandedTerms: string[] = []
): number {
  const search = scoreSearchMatch(post, normalizedQuery, queryTokens)
  const recency = scoreRecency(post.created_at, now)
  const favorites = scoreFavorites(post.id, aux.favoriteCountsByPostId)
  const sellerStanding = scoreSellerStanding(post.user_id, aux.sellerPostCountByUserId)
  const quality = scoreQuality(post, aux)
  const popularity = aux.popularityScoreByPostId?.get(post.id) ?? 0
  const conceptual = scoreConceptMatch(post, expandedTerms)

  return (
    search * RELEVANCE_WEIGHTS.search +
    recency * RELEVANCE_WEIGHTS.recency +
    favorites * RELEVANCE_WEIGHTS.favorites +
    sellerStanding * RELEVANCE_WEIGHTS.sellerStanding +
    quality * RELEVANCE_WEIGHTS.quality +
    popularity * RELEVANCE_WEIGHTS.popularity +
    conceptual * RELEVANCE_WEIGHTS.conceptual
  )
}
