import { randomInt } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SEED_CONFIG } from './config'
import { buildCatalog, type CatalogEntry, type ProductEntry } from './catalog'
import { buildTitle, buildDescription } from './textVariation'
import { type ImagePlaceholderPool, getImagesForPost } from './seedImages'
import type { SeedUser } from './seedUsers'
import { SAN_JUAN_DEPARTMENTS } from '../../src/lib/san-juan-departments'
import {
  VEHICLE_BRAND_OPTIONS,
  VEHICLE_FUEL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  VEHICLE_CONDITION_OPTIONS,
  getVehicleYearRange,
} from '../../src/lib/vehicle-details'

const CONCURRENCY = 8
const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000

function randomFrom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length)]
}

function randomPrice([min, max]: [number, number]) {
  const raw = randomInt(min, max + 1)
  return Math.round(raw / 1000) * 1000
}

function randomCreatedAt(): string {
  const offsetMs = randomInt(0, YEAR_IN_MS)
  return new Date(Date.now() - offsetMs).toISOString()
}

function randomCondition(): 'new' | 'used' | null {
  const roll = randomInt(0, 10)
  if (roll < 7) return 'used'
  if (roll < 9) return 'new'
  return null
}

/**
 * Reparte SEED_CONFIG.postsTotal publicaciones entre los usuarios,
 * respetando el minimo/maximo por usuario y garantizando que el total nunca
 * supere el tope configurado (que a su vez nunca supera el HARD_POSTS_CAP).
 */
function distributePostsPerUser(users: SeedUser[]): Map<string, number> {
  const counts = new Map<string, number>(users.map((user) => [user.id, 0]))
  let remaining = SEED_CONFIG.postsTotal

  for (const user of users) {
    if (remaining <= 0) break
    const desired = randomInt(SEED_CONFIG.minPostsPerUser, SEED_CONFIG.maxPostsPerUser + 1)
    const amount = Math.min(desired, remaining)
    counts.set(user.id, amount)
    remaining -= amount
  }

  let progress = true
  while (remaining > 0 && progress) {
    progress = false
    for (const user of users) {
      if (remaining <= 0) break
      const current = counts.get(user.id) ?? 0
      if (current < SEED_CONFIG.maxPostsPerUser) {
        counts.set(user.id, current + 1)
        remaining -= 1
        progress = true
      }
    }
  }

  return counts
}

type PostJob = {
  user: SeedUser
  entry: CatalogEntry
}

function buildJobs(users: SeedUser[], catalog: CatalogEntry[]): PostJob[] {
  const countsByUser = distributePostsPerUser(users)
  const jobs: PostJob[] = []
  let catalogIndex = 0

  for (const user of users) {
    const count = countsByUser.get(user.id) ?? 0
    for (let i = 0; i < count; i += 1) {
      jobs.push({ user, entry: catalog[catalogIndex % catalog.length] })
      catalogIndex += 1
    }
  }

  return jobs
}

function buildVehicleDetails(product: ProductEntry) {
  const brand = product.vehicleBrand ?? randomFrom([...VEHICLE_BRAND_OPTIONS])
  const model = product.vehicleModel ?? 'Modelo'
  const yearRange = getVehicleYearRange()
  const minYear = Math.max(2005, yearRange.min)

  return {
    brand,
    model,
    year: randomInt(minYear, yearRange.max + 1),
    mileage: randomInt(0, 220_000),
    fuel_type: randomFrom([...VEHICLE_FUEL_OPTIONS]),
    transmission: randomFrom([...VEHICLE_TRANSMISSION_OPTIONS]),
    condition: randomFrom([...VEHICLE_CONDITION_OPTIONS]),
    first_owner: randomInt(0, 2) === 1,
  }
}

async function createPost(args: {
  supabase: SupabaseClient
  job: PostJob
  imagePool: ImagePlaceholderPool
}): Promise<void> {
  const { supabase, job, imagePool } = args
  const product = randomFrom(job.entry.products)
  const imagesCount = randomInt(SEED_CONFIG.minImagesPerPost, SEED_CONFIG.maxImagesPerPost + 1)

  const imageUrls = await getImagesForPost({
    supabase,
    product,
    category: job.entry.category,
    userId: job.user.id,
    count: imagesCount,
    placeholderPool: imagePool,
  })
  const [coverImage, ...extraImages] = imageUrls

  const { data: insertedPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      user_id: job.user.id,
      title: buildTitle(product),
      description: buildDescription(),
      price: randomPrice(job.entry.priceRange),
      category: job.entry.category,
      subcategory: job.entry.subcategory,
      whatsapp_number: job.user.whatsappNumber,
      location_department: randomFrom(SAN_JUAN_DEPARTMENTS),
      location_maps_url: null,
      image_url: coverImage ?? null,
      condition: randomCondition(),
      created_at: randomCreatedAt(),
    })
    .select('id')
    .single()

  if (insertError || !insertedPost) {
    throw new Error(`No se pudo insertar el post: ${insertError?.message ?? 'sin id'}`)
  }

  if (extraImages.length > 0) {
    const { error: imagesError } = await supabase.from('post_images').insert(
      extraImages.map((imageUrl, index) => ({
        post_id: insertedPost.id,
        image_url: imageUrl,
        position: index + 1,
      }))
    )

    if (imagesError) {
      throw new Error(`No se pudieron insertar las imagenes del post ${insertedPost.id}: ${imagesError.message}`)
    }
  }

  if (job.entry.isVehicle) {
    const vehicleDetails = buildVehicleDetails(product)
    const { error: vehicleError } = await supabase.from('vehicle_details').insert({
      post_id: insertedPost.id,
      ...vehicleDetails,
    })

    if (vehicleError) {
      throw new Error(`No se pudo insertar vehicle_details del post ${insertedPost.id}: ${vehicleError.message}`)
    }
  }
}

export async function seedPosts(
  supabase: SupabaseClient,
  users: SeedUser[],
  imagePool: ImagePlaceholderPool
): Promise<number> {
  const catalog = buildCatalog()
  const jobs = buildJobs(users, catalog)

  let completed = 0
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map((job) => createPost({ supabase, job, imagePool })))
    completed += batch.length
    console.log(`[posts] ${completed}/${jobs.length}`)
  }

  return jobs.length
}
