import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getRootCategories } from '../../src/lib/hierarchical-categories'
import { SEED_CONFIG } from './config'
import { slugify } from './textUtils'
import type { ProductEntry } from './catalog'

const PLACEHOLDER_SIZE = 800
const VARIANTS_PER_CATEGORY = 4

const CATEGORY_COLORS: Record<string, string> = {
  Vehiculos: '#0B7A75',
  Inmuebles: '#1D3147',
  Servicios: '#FF7A1A',
  Articulos: '#075E5A',
}

const FALLBACK_COLOR = '#4F6275'

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildPlaceholderSvg(categoryName: string, variant: number, color: string) {
  const label = escapeXml(categoryName)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PLACEHOLDER_SIZE}" height="${PLACEHOLDER_SIZE}">
    <rect width="100%" height="100%" fill="${color}"/>
    <rect x="40" y="40" width="${PLACEHOLDER_SIZE - 80}" height="${PLACEHOLDER_SIZE - 80}" fill="#ffffff" opacity="0.08" rx="24"/>
    <text x="50%" y="48%" font-family="sans-serif" font-size="56" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
    <text x="50%" y="58%" font-family="sans-serif" font-size="28" fill="#ffffff" opacity="0.75" text-anchor="middle">tratohechoSJ · test image ${variant}</text>
  </svg>`
}

export type ImagePlaceholderPool = Record<string, string[]>

/**
 * Genera (si no existen todavia) placeholders locales por categoria raiz en
 * public/test-images/<categoria>/placeholder-N.jpg usando sharp, sin
 * depender de red ni de una API externa de fotos. Devuelve las rutas de
 * archivo agrupadas por nombre de categoria raiz.
 */
export async function ensurePlaceholderImages(publicDir: string): Promise<ImagePlaceholderPool> {
  const testImagesDir = path.join(publicDir, 'test-images')
  const pool: ImagePlaceholderPool = {}

  for (const root of getRootCategories()) {
    const categoryDir = path.join(testImagesDir, slugify(root.name))
    await fs.mkdir(categoryDir, { recursive: true })

    const color = CATEGORY_COLORS[root.name] ?? FALLBACK_COLOR
    const filePaths: string[] = []

    for (let variant = 1; variant <= VARIANTS_PER_CATEGORY; variant += 1) {
      const filePath = path.join(categoryDir, `placeholder-${variant}.jpg`)
      filePaths.push(filePath)

      const alreadyExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false)

      if (alreadyExists) {
        continue
      }

      const svg = buildPlaceholderSvg(root.name, variant, color)
      await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(filePath)
    }

    pool[root.name] = filePaths
  }

  return pool
}

/**
 * Sube un placeholder local a Storage bajo el path del usuario (mismo
 * patron que create-post/page.tsx: `${userId}/${timestamp}-nombre`) y
 * devuelve la URL publica. Cada subida es un objeto de Storage distinto,
 * aunque el contenido visual se repita entre publicaciones.
 */
export async function uploadSeedImage(args: {
  supabase: SupabaseClient
  filePath: string
  userId: string
  index: number
}): Promise<string> {
  const bytes = await fs.readFile(args.filePath)
  const fileName = path.basename(args.filePath)
  const storagePath = `${args.userId}/${Date.now()}-seed-${args.index}-${fileName}`

  const { error: uploadError } = await args.supabase.storage
    .from(SEED_CONFIG.storageBucket)
    .upload(storagePath, bytes, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(`No se pudo subir la imagen ${storagePath}: ${uploadError.message}`)
  }

  const { data } = args.supabase.storage.from(SEED_CONFIG.storageBucket).getPublicUrl(storagePath)
  return data.publicUrl
}

// ─── Fotos reales via Unsplash (opcional, requiere UNSPLASH_ACCESS_KEY) ────

type UnsplashPhoto = { id: string; urls: { regular: string; small: string } }
type UnsplashSearchResponse = { results?: UnsplashPhoto[] }

/** Cache por termino de busqueda (no por publicacion), igual patron que el script viejo. */
const unsplashSearchCache = new Map<string, UnsplashPhoto[]>()

async function searchUnsplashPhotos(query: string): Promise<UnsplashPhoto[]> {
  const cached = unsplashSearchCache.get(query)
  if (cached) {
    return cached
  }

  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '30')
  url.searchParams.set('orientation', 'squarish')
  url.searchParams.set('content_filter', 'high')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${SEED_CONFIG.unsplashAccessKey}`,
      'Accept-Version': 'v1',
    },
  })

  if (!response.ok) {
    throw new Error(`Unsplash search fallo (${response.status}) para "${query}"`)
  }

  const payload = (await response.json()) as UnsplashSearchResponse
  const results = payload.results ?? []
  unsplashSearchCache.set(query, results)
  return results
}

async function uploadBufferImage(args: {
  supabase: SupabaseClient
  bytes: Buffer
  contentType: string
  userId: string
  index: number
}): Promise<string> {
  const extension = args.contentType.includes('png') ? 'png' : 'jpg'
  const storagePath = `${args.userId}/${Date.now()}-seed-${args.index}.${extension}`

  const { error: uploadError } = await args.supabase.storage
    .from(SEED_CONFIG.storageBucket)
    .upload(storagePath, args.bytes, {
      contentType: args.contentType,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(`No se pudo subir la imagen ${storagePath}: ${uploadError.message}`)
  }

  const { data } = args.supabase.storage.from(SEED_CONFIG.storageBucket).getPublicUrl(storagePath)
  return data.publicUrl
}

async function downloadAndUploadUnsplashPhoto(args: {
  supabase: SupabaseClient
  photo: UnsplashPhoto
  userId: string
  index: number
}): Promise<string> {
  const sourceUrl = args.photo.urls.regular || args.photo.urls.small
  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error(`No se pudo descargar la foto de Unsplash (${response.status})`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'

  return uploadBufferImage({
    supabase: args.supabase,
    bytes,
    contentType,
    userId: args.userId,
    index: args.index,
  })
}

function shuffle<T>(values: T[]): T[] {
  return [...values].sort(() => Math.random() - 0.5)
}

/**
 * Devuelve hasta `count` URLs publicas ya subidas a Storage para una
 * publicacion. Intenta primero fotos reales de Unsplash (cacheadas por
 * termino de busqueda del producto, no por publicacion, para no agotar el
 * limite de la API); ante cualquier problema (sin API key, sin resultados,
 * fetch fallido) completa lo que falte con el placeholder local generado
 * con sharp, para que el script nunca se rompa por la fuente de imagenes.
 */
export async function getImagesForPost(args: {
  supabase: SupabaseClient
  product: ProductEntry
  category: string
  userId: string
  count: number
  placeholderPool: ImagePlaceholderPool
}): Promise<string[]> {
  const urls: string[] = []

  if (SEED_CONFIG.unsplashAccessKey && args.product.imageQuery) {
    try {
      const photos = await searchUnsplashPhotos(args.product.imageQuery)
      const selected = shuffle(photos).slice(0, args.count)

      for (let index = 0; index < selected.length; index += 1) {
        const url = await downloadAndUploadUnsplashPhoto({
          supabase: args.supabase,
          photo: selected[index],
          userId: args.userId,
          index,
        })
        urls.push(url)
      }
    } catch (error) {
      console.warn(
        `[seed-images] Unsplash fallo para "${args.product.imageQuery}", se completa con placeholder: ${(error as Error).message}`
      )
    }
  }

  if (urls.length >= args.count) {
    return urls
  }

  const pool = args.placeholderPool[args.category] ?? Object.values(args.placeholderPool).flat()
  const missing = args.count - urls.length

  for (let index = 0; index < missing && pool.length > 0; index += 1) {
    const filePath = pool[Math.floor(Math.random() * pool.length)]
    const url = await uploadSeedImage({
      supabase: args.supabase,
      filePath,
      userId: args.userId,
      index: urls.length + index,
    })
    urls.push(url)
  }

  return urls
}
