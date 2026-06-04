/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomInt } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { PREDEFINED_POST_CATEGORIES } from '../src/lib/post-categories'
import {
  VEHICLE_BRAND_OPTIONS,
  VEHICLE_CONDITION_OPTIONS,
  VEHICLE_FUEL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  isVehicleCategory,
} from '../src/lib/vehicle-details'

type FictionalUser = {
  fullName: string
  email: string
  whatsapp: string
}

type CategoryPlan = {
  category: string
  count: number
  priceRange: [number, number]
  searchTerms: string[]
  titleTemplates: string[]
  descriptionTemplates: string[]
}

type UnsplashPhoto = {
  id: string
  urls: {
    regular: string
    small: string
  }
}

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[]
}

type VehicleSeed = {
  brand: string
  model: string
  year: number
  mileage: number
  fuel_type: string
  transmission: string
  condition: string
  first_owner: boolean
}

type SupabaseAdminClient = ReturnType<typeof createClient<any>>

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY ?? ''
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'TratoHechoSJ#2026'
const SEED_POSTS_COUNT = Math.max(40, Number(process.env.SEED_POSTS_COUNT ?? '44'))

const STORAGE_BUCKET = 'post-images'
const LOCATION_VALUE = 'San Juan, Argentina'
const LOCATION_MAPS_URL = 'https://maps.google.com/?q=San+Juan,+Argentina'

const fictionalUsers: FictionalUser[] = [
  { fullName: 'Sofia Torres', email: 'sofia.torres.seed@tratohechosj.test', whatsapp: '2645101001' },
  { fullName: 'Martin Quiroga', email: 'martin.quiroga.seed@tratohechosj.test', whatsapp: '2645101002' },
  { fullName: 'Lucia Paredes', email: 'lucia.paredes.seed@tratohechosj.test', whatsapp: '2645101003' },
  { fullName: 'Agustin Sarmiento', email: 'agustin.sarmiento.seed@tratohechosj.test', whatsapp: '2645101004' },
  { fullName: 'Valentina Arce', email: 'valentina.arce.seed@tratohechosj.test', whatsapp: '2645101005' },
  { fullName: 'Franco Mena', email: 'franco.mena.seed@tratohechosj.test', whatsapp: '2645101006' },
  { fullName: 'Camila Ortiz', email: 'camila.ortiz.seed@tratohechosj.test', whatsapp: '2645101007' },
  { fullName: 'Nicolas Funes', email: 'nicolas.funes.seed@tratohechosj.test', whatsapp: '2645101008' },
]

const categoryPlans: CategoryPlan[] = [
  {
    category: 'Automotores',
    count: 4,
    priceRange: [3500000, 30000000],
    searchTerms: ['used car argentina', 'sedan', 'hatchback'],
    titleTemplates: ['Auto usado en muy buen estado', 'Vehiculo listo para transferir', 'Particular impecable'],
    descriptionTemplates: [
      'Mecanica en excelente estado y uso familiar. Se entrega con papeles listos para transferir.',
      'Motor parejo, interior cuidado y cubiertas en buen estado. Se puede coordinar prueba en San Juan.',
      'No tiene deudas ni multas. Escucho ofertas razonables en efectivo.',
    ],
  },
  {
    category: 'Autos',
    count: 3,
    priceRange: [4200000, 28000000],
    searchTerms: ['used auto', 'family car', 'compact car'],
    titleTemplates: ['Auto familiar bajo consumo', 'Sedan comodo para ruta', 'Compacto ideal primer auto'],
    descriptionTemplates: [
      'Unidad muy cuidada, uso particular y services al dia. Documentacion completa para transferencia.',
      'Aire acondicionado funcionando perfecto y bateria reciente. Se puede ver sin compromiso.',
      'Publicacion real con precio acorde al estado. Escucho oferta coherente.',
    ],
  },
  {
    category: 'Camionetas',
    count: 1,
    priceRange: [9000000, 38000000],
    searchTerms: ['pickup truck', 'double cab truck'],
    titleTemplates: ['Camioneta doble cabina impecable'],
    descriptionTemplates: [
      'Uso particular, nunca trabajo pesado. Mantenimiento al dia y lista para transferir.',
      'Muy buena para ciudad y ruta, con interior prolijo. Se vende por renovacion.',
      'Se puede revisar con mecanico de confianza.',
    ],
  },
  {
    category: 'Motos',
    count: 1,
    priceRange: [1100000, 7500000],
    searchTerms: ['street motorcycle', 'city motorcycle'],
    titleTemplates: ['Moto lista para usar'],
    descriptionTemplates: [
      'Arranca al toque y esta muy cuidada. Ideal para moverse por ciudad con bajo consumo.',
      'Papeles al dia y lista para transferir en el acto. Se puede probar.',
      'Vendo por cambio de cilindrada.',
    ],
  },
  {
    category: 'Utilitarios',
    count: 1,
    priceRange: [7000000, 25000000],
    searchTerms: ['cargo van', 'utility vehicle'],
    titleTemplates: ['Utilitario en excelente estado'],
    descriptionTemplates: [
      'Unidad confiable y con buen espacio de carga. Se encuentra en uso y funciona perfecto.',
      'Service recien hecho y documentacion completa. Lista para trabajar.',
      'Coordinamos visita en Capital.',
    ],
  },
  {
    category: 'Hogar y Muebles',
    count: 7,
    priceRange: [35000, 1800000],
    searchTerms: ['living room furniture', 'wooden table', 'home decor'],
    titleTemplates: ['Juego de comedor en excelente estado', 'Sillon 3 cuerpos muy comodo', 'Placard amplio impecable', 'Mesa ratona moderna'],
    descriptionTemplates: [
      'Se encuentra en muy buen estado general y listo para usar. Sin detalles importantes.',
      'Se vende por mudanza y falta de espacio. Retiro por Capital con coordinacion.',
      'Material firme y facil de limpiar. Escucho ofertas razonables.',
    ],
  },
  {
    category: 'Salud y Deportes',
    count: 6,
    priceRange: [25000, 950000],
    searchTerms: ['fitness equipment', 'home gym', 'sports bicycle'],
    titleTemplates: ['Bicicleta rodado 29', 'Banco de musculacion completo', 'Set de mancuernas', 'Cinta para correr'],
    descriptionTemplates: [
      'Producto muy cuidado y funcionando perfecto. Ideal para entrenar en casa.',
      'Se uso poco tiempo y se encuentra en excelente estado. Se puede probar.',
      'Precio acorde al estado real, entrega inmediata.',
    ],
  },
  {
    category: 'Tecnologia',
    count: 7,
    priceRange: [65000, 3200000],
    searchTerms: ['laptop', 'smartphone', 'gaming monitor', 'tablet'],
    titleTemplates: ['Notebook de trabajo', 'Celular liberado impecable', 'Monitor gamer alta tasa', 'Tablet ideal estudio'],
    descriptionTemplates: [
      'Funciona al 100 por ciento y se entrega con accesorios principales. Bateria en buen estado.',
      'Sin bloqueos ni cuentas asociadas. Se puede revisar al momento de la compra.',
      'Excelente opcion por precio y rendimiento. Entrega en punto a convenir en San Juan.',
    ],
  },
  {
    category: 'Moda y Belleza',
    count: 5,
    priceRange: [18000, 380000],
    searchTerms: ['fashion clothes', 'sneakers', 'beauty kit'],
    titleTemplates: ['Campera urbana casi nueva', 'Zapatillas originales', 'Kit maquillaje profesional', 'Bolso premium'],
    descriptionTemplates: [
      'Articulo en excelente estado y listo para usar. Muy bien cuidado.',
      'Se vende por falta de uso y cambio de talle. Calidad de materiales destacable.',
      'Se puede ver sin compromiso y coordinar entrega en Capital.',
    ],
  },
  {
    category: 'Electrodomesticos',
    count: 4,
    priceRange: [75000, 2600000],
    searchTerms: ['washing machine', 'refrigerator', 'microwave', 'air conditioner'],
    titleTemplates: ['Heladera no frost impecable', 'Lavarropas automatico', 'Microondas digital', 'Aire acondicionado frio calor'],
    descriptionTemplates: [
      'Electrodomestico en pleno funcionamiento y con mantenimiento al dia. Se puede probar.',
      'Se vende por recambio del hogar, nunca tuvo fallas graves. Muy buen estado estetico.',
      'Ideal para uso diario, bajo consumo y buen rendimiento.',
    ],
  },
  {
    category: 'Herramientas y Construccion',
    count: 3,
    priceRange: [50000, 820000],
    searchTerms: ['power tools', 'construction tools', 'drill machine'],
    titleTemplates: ['Taladro percutor profesional', 'Amoladora de mano', 'Kit herramientas completo'],
    descriptionTemplates: [
      'Herramienta funcionando perfecto y lista para trabajar. Sin reparaciones pendientes.',
      'Se uso en trabajos puntuales, no tiene maltrato. Incluye accesorios publicados.',
      'Muy buena opcion para equiparse sin gastar de mas.',
    ],
  },
  {
    category: 'Mascotas',
    count: 2,
    priceRange: [12000, 220000],
    searchTerms: ['pet accessories', 'dog house', 'cat tower'],
    titleTemplates: ['Cucha reforzada para perro', 'Rascador para gato', 'Transportadora semirigida'],
    descriptionTemplates: [
      'Producto en muy buen estado y facil de limpiar. Ideal para mascotas de casa.',
      'Se vende por cambio de tamano de mascota. Material resistente y duradero.',
      'Entrega en Capital o alrededores a coordinar.',
    ],
  },
]

const vehicleModelsByBrand: Record<string, string[]> = {
  Toyota: ['Corolla', 'Hilux', 'Etios'],
  Ford: ['Fiesta', 'Ranger', 'Focus'],
  Volkswagen: ['Gol Trend', 'Vento', 'Amarok'],
  Chevrolet: ['Cruze', 'Onix', 'S10'],
  Fiat: ['Cronos', 'Argo', 'Toro'],
  Renault: ['Sandero', 'Duster', 'Kwid'],
  Peugeot: ['208', '2008', 'Partner'],
  Citroen: ['C3', 'C4 Lounge', 'Berlingo'],
  Honda: ['Civic', 'HR-V', 'CB 190R'],
  Nissan: ['Versa', 'Frontier', 'Kicks'],
  Jeep: ['Renegade', 'Compass'],
  'Mercedes-Benz': ['Sprinter', 'A200'],
  BMW: ['Serie 1', 'X1'],
  Audi: ['A3', 'Q3'],
  Otra: ['Modelo importado'],
}

function ensureRequiredEnv() {
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!UNSPLASH_ACCESS_KEY) missing.push('UNSPLASH_ACCESS_KEY')

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

function randomFrom<T>(values: T[]): T {
  return values[randomInt(0, values.length)]
}

function randomPrice([min, max]: [number, number]) {
  const raw = randomInt(min, max + 1)
  return Math.round(raw / 1000) * 1000
}

function buildDescription(templates: string[]) {
  const picked = new Set<string>()
  while (picked.size < 3) {
    picked.add(randomFrom(templates))
  }
  return Array.from(picked).join(' ')
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildVehicleSeed(): VehicleSeed {
  const brand = randomFrom([...VEHICLE_BRAND_OPTIONS])
  const model = randomFrom(vehicleModelsByBrand[brand] ?? ['Modelo'])
  const currentYear = new Date().getFullYear()

  return {
    brand,
    model,
    year: randomInt(2008, currentYear + 1),
    mileage: randomInt(18000, 210000),
    fuel_type: randomFrom([...VEHICLE_FUEL_OPTIONS]),
    transmission: randomFrom([...VEHICLE_TRANSMISSION_OPTIONS]),
    condition: randomFrom([...VEHICLE_CONDITION_OPTIONS]),
    first_owner: randomInt(0, 2) === 1,
  }
}

async function listAllAuthUsers(supabase: SupabaseAdminClient) {
  const allUsers: Array<{ id: string; email?: string | null }> = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`)
    }

    const users = data.users ?? []
    allUsers.push(...users)

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return allUsers
}

async function ensureFictionalUsers(supabase: SupabaseAdminClient) {
  const existingUsers = await listAllAuthUsers(supabase)
  const userIds: string[] = []

  for (const user of fictionalUsers) {
    const existing = existingUsers.find(
      (candidate) => candidate.email?.toLowerCase() === user.email.toLowerCase()
    )

    if (existing) {
      userIds.push(existing.id)
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: SEED_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        source: 'seed-script',
      },
    })

    if (error || !data.user) {
      throw new Error(`Failed to create fictional user ${user.email}: ${error?.message ?? 'unknown error'}`)
    }

    userIds.push(data.user.id)
  }

  return userIds
}

async function searchUnsplashPhotos(query: string, cache: Map<string, UnsplashPhoto[]>) {
  if (cache.has(query)) {
    return cache.get(query) ?? []
  }

  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '30')
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('content_filter', 'high')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  })

  if (!response.ok) {
    throw new Error(`Unsplash search failed (${response.status}) for query "${query}"`)
  }

  const payload = (await response.json()) as UnsplashSearchResponse
  const results = payload.results ?? []
  cache.set(query, results)
  return results
}

async function uploadImageFromUnsplash(args: {
  supabase: SupabaseAdminClient
  imageUrl: string
  userId: string
  postSlug: string
  index: number
}) {
  const response = await fetch(args.imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}) from Unsplash URL.`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const filePath = `${args.userId}/seed-${args.postSlug}-${Date.now()}-${args.index}.${extension}`

  const { error: uploadError } = await args.supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, bytes, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  const { data } = args.supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
  return { filePath, publicUrl: data.publicUrl }
}

function createListingSeeds() {
  const categoriesSet = new Set(PREDEFINED_POST_CATEGORIES)
  const seeds: Array<{
    title: string
    description: string
    price: number
    category: string
    imageQuery: string
    vehicleDetails?: VehicleSeed
  }> = []

  for (const plan of categoryPlans) {
    if (!categoriesSet.has(plan.category as (typeof PREDEFINED_POST_CATEGORIES)[number])) {
      continue
    }

    for (let i = 0; i < plan.count; i += 1) {
      const title = randomFrom(plan.titleTemplates)
      seeds.push({
        title,
        description: buildDescription(plan.descriptionTemplates),
        price: randomPrice(plan.priceRange),
        category: plan.category,
        imageQuery: `${randomFrom(plan.searchTerms)} argentina`,
        vehicleDetails: isVehicleCategory(plan.category) ? buildVehicleSeed() : undefined,
      })
    }
  }

  while (seeds.length < SEED_POSTS_COUNT) {
    const plan = randomFrom(categoryPlans)
    const title = randomFrom(plan.titleTemplates)

    if (!categoriesSet.has(plan.category as (typeof PREDEFINED_POST_CATEGORIES)[number])) {
      continue
    }

    seeds.push({
      title,
      description: buildDescription(plan.descriptionTemplates),
      price: randomPrice(plan.priceRange),
      category: plan.category,
      imageQuery: `${randomFrom(plan.searchTerms)} argentina`,
      vehicleDetails: isVehicleCategory(plan.category) ? buildVehicleSeed() : undefined,
    })
  }

  return seeds.slice(0, SEED_POSTS_COUNT)
}

async function insertPostWithOptionalStatus(
  supabase: SupabaseAdminClient,
  payload: Record<string, unknown>
) {
  const firstTry = await supabase
    .from('posts')
    .insert({ ...payload, status: 'active' })
    .select('id')
    .single()

  if (!firstTry.error && firstTry.data) {
    return firstTry.data.id as string
  }

  const statusMissing = Boolean(
    firstTry.error?.message &&
      /column .*status.* does not exist|could not find the 'status' column/i.test(firstTry.error.message)
  )

  if (!statusMissing) {
    throw new Error(`Failed to insert post: ${firstTry.error?.message ?? 'unknown error'}`)
  }

  const fallbackTry = await supabase
    .from('posts')
    .insert(payload)
    .select('id')
    .single()

  if (fallbackTry.error || !fallbackTry.data) {
    throw new Error(`Failed to insert post (fallback): ${fallbackTry.error?.message ?? 'unknown error'}`)
  }

  return fallbackTry.data.id as string
}

async function main() {
  ensureRequiredEnv()

  const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  console.log('Step 1/3 - Creating fictional users in Supabase Auth...')
  const userIds = await ensureFictionalUsers(supabase)
  console.log(`Users created/reused: ${userIds.length}`)

  console.log('Step 2/3 - Generating realistic listing data...')
  const listingSeeds = createListingSeeds()
  console.log(`Listings generated: ${listingSeeds.length}`)

  console.log('Step 3/3 - Fetching Unsplash images, uploading, and inserting posts...')
  const unsplashCache = new Map<string, UnsplashPhoto[]>()
  let createdPosts = 0

  for (const seed of listingSeeds) {
    const ownerId = randomFrom(userIds)
    const imagesCount = randomInt(2, 5)

    let photos = await searchUnsplashPhotos(seed.imageQuery, unsplashCache)
    if (photos.length < imagesCount) {
      photos = await searchUnsplashPhotos(seed.category, unsplashCache)
    }
    if (photos.length < imagesCount) {
      photos = await searchUnsplashPhotos('marketplace argentina product', unsplashCache)
    }
    if (photos.length === 0) {
      throw new Error(`No photos found for listing "${seed.title}"`)
    }

    const selectedPhotos = [...photos].sort(() => randomInt(0, 3) - 1).slice(0, imagesCount)
    const postSlug = toSlug(seed.title)

    const uploadedImages: Array<{ publicUrl: string; filePath: string }> = []
    for (let index = 0; index < selectedPhotos.length; index += 1) {
      const photo = selectedPhotos[index]
      const sourceUrl = photo.urls.regular || photo.urls.small
      const uploaded = await uploadImageFromUnsplash({
        supabase,
        imageUrl: sourceUrl,
        userId: ownerId,
        postSlug,
        index,
      })
      uploadedImages.push(uploaded)
    }

    const coverImage = uploadedImages[0]?.publicUrl ?? null
    const extraImages = uploadedImages.slice(1)

    const postId = await insertPostWithOptionalStatus(supabase, {
      user_id: ownerId,
      title: seed.title,
      description: seed.description,
      price: seed.price,
      category: seed.category,
      whatsapp_number: fictionalUsers[userIds.indexOf(ownerId)]?.whatsapp ?? '2645000000',
      location_department: LOCATION_VALUE,
      location_maps_url: LOCATION_MAPS_URL,
      image_url: coverImage,
    })

    if (extraImages.length > 0) {
      const { error: postImagesError } = await supabase.from('post_images').insert(
        extraImages.map((image, index) => ({
          post_id: postId,
          image_url: image.publicUrl,
          position: index + 1,
        }))
      )

      if (postImagesError) {
        throw new Error(`Failed to insert post_images for ${postId}: ${postImagesError.message}`)
      }
    }

    if (seed.vehicleDetails) {
      const { error: vehicleError } = await supabase.from('vehicle_details').upsert(
        {
          post_id: postId,
          brand: seed.vehicleDetails.brand,
          model: seed.vehicleDetails.model,
          year: seed.vehicleDetails.year,
          mileage: seed.vehicleDetails.mileage,
          fuel_type: seed.vehicleDetails.fuel_type,
          transmission: seed.vehicleDetails.transmission,
          condition: seed.vehicleDetails.condition,
          first_owner: seed.vehicleDetails.first_owner,
        },
        { onConflict: 'post_id' }
      )

      if (vehicleError) {
        throw new Error(`Failed to insert vehicle_details for ${postId}: ${vehicleError.message}`)
      }
    }

    createdPosts += 1
    console.log(`[${createdPosts}/${listingSeeds.length}] ${seed.category} - ${seed.title}`)
  }

  console.log('Seed finished successfully.')
  console.log(`Total posts created: ${createdPosts}`)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
