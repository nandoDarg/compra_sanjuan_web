import { PREDEFINED_POST_CATEGORIES } from '@/lib/post-categories'

const CATEGORY_VARIANT_MAP: Record<string, string> = {
  automotores: 'Vehiculos',
  auto: 'Vehiculos',
  autos: 'Vehiculos',
  camioneta: 'Vehiculos',
  camionetas: 'Vehiculos',
  camion: 'Vehiculos',
  camiones: 'Vehiculos',
  utilitario: 'Vehiculos',
  utilitarios: 'Vehiculos',
  moto: 'Vehiculos',
  motos: 'Vehiculos',
  vehiculo: 'Vehiculos',
  vehiculos: 'Vehiculos',

  tecnologia: 'Tecnologia',
  celular: 'Tecnologia',
  celulares: 'Tecnologia',
  telefono: 'Tecnologia',
  telefonia: 'Tecnologia',
  telefonos: 'Tecnologia',
  smartphone: 'Tecnologia',
  smartphones: 'Tecnologia',
  tablet: 'Tecnologia',
  tablets: 'Tecnologia',
  laptop: 'Tecnologia',
  laptops: 'Tecnologia',
  notebook: 'Tecnologia',
  notebooks: 'Tecnologia',
  netbook: 'Tecnologia',
  netbooks: 'Tecnologia',
  pc: 'Tecnologia',
  computadora: 'Tecnologia',
  computadoras: 'Tecnologia',
  computacion: 'Tecnologia',
  tv: 'Tecnologia',
  smarttv: 'Tecnologia',
  'smart tv': 'Tecnologia',
  television: 'Tecnologia',
  televisores: 'Tecnologia',

  hogar: 'Hogar y Muebles',
  mueble: 'Hogar y Muebles',
  muebles: 'Hogar y Muebles',
  sillon: 'Hogar y Muebles',
  sillones: 'Hogar y Muebles',
  mesa: 'Hogar y Muebles',
  mesas: 'Hogar y Muebles',
  heladera: 'Hogar y Muebles',
  lavarropas: 'Hogar y Muebles',

  propiedad: 'Inmuebles',
  propiedades: 'Inmuebles',
  alquiler: 'Inmuebles',
  alquileres: 'Inmuebles',
  casa: 'Inmuebles',
  casas: 'Inmuebles',
  departamento: 'Inmuebles',
  departamentos: 'Inmuebles',

  empleo: 'Empleo',
  trabajo: 'Empleo',

  servicio: 'Servicios',
  servicios: 'Servicios',

  indumentaria: 'Moda y Belleza',
  ropa: 'Moda y Belleza',
  calzado: 'Moda y Belleza',
  belleza: 'Moda y Belleza',

  deporte: 'Salud y Deportes',
  deportes: 'Salud y Deportes',
  salud: 'Salud y Deportes',

  bebe: 'Bebes y Ninos',
  bebes: 'Bebes y Ninos',
  nino: 'Bebes y Ninos',
  ninos: 'Bebes y Ninos',

  construccion: 'Herramientas y Construccion',
  herramienta: 'Herramientas y Construccion',
  herramientas: 'Herramientas y Construccion',

  mascota: 'Mascotas',
  mascotas: 'Mascotas',

  turismo: 'Turismo y Ocio',
  ocio: 'Turismo y Ocio',

  oficina: 'Industria y Oficina',
  industria: 'Industria y Oficina',

  educacion: 'Educacion',

  agro: 'Agro',

  electrodomestico: 'Electrodomesticos',
  electrodomesticos: 'Electrodomesticos',
  'linea blanca': 'Electrodomesticos',
  jardin: 'Hogar y Muebles',
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

  const mapped = CATEGORY_VARIANT_MAP[normalized]
  if (mapped) {
    return mapped
  }

  const predefined = PREDEFINED_POST_CATEGORIES.find(
    (category) => normalizeKey(category) === normalized
  )

  if (predefined) {
    return predefined
  }

  return titleCase(normalized)
}
