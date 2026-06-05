import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const CATEGORY_VARIANT_MAP = {
  celular: 'Tecnologia',
  celulares: 'Tecnologia',
  telefono: 'Tecnologia',
  telefonia: 'Tecnologia',
  telefonos: 'Tecnologia',
  smartphone: 'Tecnologia',
  smartphones: 'Tecnologia',
  notebook: 'Tecnologia',
  notebooks: 'Tecnologia',
  pc: 'Tecnologia',
  computacion: 'Tecnologia',
  electrodomestico: 'Electrodomesticos',
  electrodomesticos: 'Electrodomesticos',
  'linea blanca': 'Electrodomesticos',
  auto: 'Automotores',
  autos: 'Automotores',
  moto: 'Automotores',
  motos: 'Automotores',
  vehiculo: 'Automotores',
  vehiculos: 'Automotores',
  propiedad: 'Inmuebles',
  propiedades: 'Inmuebles',
  alquiler: 'Inmuebles',
  alquileres: 'Inmuebles',
  casa: 'Inmuebles',
  casas: 'Inmuebles',
  departamento: 'Inmuebles',
  departamentos: 'Inmuebles',
  ropa: 'Moda y Belleza',
  indumentaria: 'Moda y Belleza',
  calzado: 'Moda y Belleza',
  belleza: 'Moda y Belleza',
  jardin: 'Hogar y Muebles',
  mueble: 'Hogar y Muebles',
  muebles: 'Hogar y Muebles',
  hogar: 'Hogar y Muebles',
  construccion: 'Herramientas y Construccion',
  herramienta: 'Herramientas y Construccion',
  herramientas: 'Herramientas y Construccion',
  mascota: 'Mascotas',
  mascotas: 'Mascotas',
  deporte: 'Salud y Deportes',
  deportes: 'Salud y Deportes',
  salud: 'Salud y Deportes',
  bebe: 'Bebes y Ninos',
  bebes: 'Bebes y Ninos',
  ninos: 'Bebes y Ninos',
  nino: 'Bebes y Ninos',
  empleo: 'Empleo',
  trabajo: 'Empleo',
  servicios: 'Servicios',
  servicio: 'Servicios',
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCategory(rawCategory) {
  const normalized = normalizeKey(rawCategory)
  return CATEGORY_VARIANT_MAP[normalized] ?? rawCategory
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: posts, error } = await supabase.from('posts').select('id,category')

  if (error) {
    console.error('No se pudieron leer publicaciones:', error.message)
    process.exit(1)
  }

  const updates = posts
    .map((post) => ({
      id: post.id,
      original: post.category,
      normalized: normalizeCategory(post.category),
    }))
    .filter((item) => item.original !== item.normalized)

  if (updates.length === 0) {
    console.log('No hay categorias para normalizar.')
    return
  }

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({ category: update.normalized })
      .eq('id', update.id)

    if (updateError) {
      console.error(
        `Error normalizando post ${update.id} (${update.original} -> ${update.normalized}): ${updateError.message}`
      )
      continue
    }

    console.log(`${update.id}: ${update.original} -> ${update.normalized}`)
  }

  console.log(`Normalizacion finalizada. Registros evaluados: ${posts.length}.`) 
}

main().catch((error) => {
  console.error('Error inesperado en normalizacion:', error)
  process.exit(1)
})
