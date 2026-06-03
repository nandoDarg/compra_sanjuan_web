import { PREDEFINED_POST_CATEGORIES } from '@/lib/post-categories'

const CATEGORY_VARIANT_MAP: Record<string, string> = {
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

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

export function normalizeCategoryValue(rawCategory: string) {
  const normalized = normalizeKey(rawCategory)

  if (!normalized) {
    return ''
  }

  const predefined = PREDEFINED_POST_CATEGORIES.find(
    (category) => normalizeKey(category) === normalized
  )

  if (predefined) {
    return predefined
  }

  const mapped = CATEGORY_VARIANT_MAP[normalized]
  if (mapped) {
    return mapped
  }

  return titleCase(normalized)
}
