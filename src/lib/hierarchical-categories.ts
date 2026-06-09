export type Category = {
  id: string
  name: string
  slug: string
  children?: Category[]
}

type CategorySelection = {
  category: string
  subcategory: string | null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function makeLeaf(name: string): Category {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
  }
}

function makeRoot(name: string, children: string[]): Category {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
    children: children.map(makeLeaf),
  }
}

export const CATEGORY_TREE: Category[] = [
  makeRoot('Vehiculos', [
    'Autos',
    'Camionetas',
    'SUVs',
    'Motos',
    'Camiones',
    'Utilitarios',
    'Nautica',
    'Repuestos y Accesorios',
  ]),
  makeRoot('Tecnologia', [
    'Celulares',
    'Tablets',
    'Notebooks',
    'PCs de Escritorio',
    'Monitores',
    'Smart TVs',
    'Consolas',
    'Videojuegos',
    'Audio',
    'Camaras',
    'Impresoras',
    'Redes y WiFi',
    'Accesorios',
  ]),
  makeRoot('Hogar y Muebles', [
    'Muebles',
    'Electrodomesticos',
    'Decoracion',
    'Jardin',
    'Iluminacion',
    'Herramientas',
  ]),
  makeRoot('Inmuebles', [
    'Casas',
    'Departamentos',
    'Terrenos',
    'Locales Comerciales',
    'Oficinas',
    'Galpones',
  ]),
  makeRoot('Deportes y Fitness', [
    'Bicicletas',
    'Gimnasio',
    'Camping',
    'Pesca',
    'Deportes de Equipo',
  ]),
  makeRoot('Moda', ['Hombre', 'Mujer', 'Calzado', 'Accesorios']),
  makeRoot('Ninos y Bebes', ['Juguetes', 'Ropa', 'Cochecitos', 'Muebles Infantiles']),
  makeRoot('Empleo', ['Ofertas Laborales', 'Servicios Profesionales']),
  makeRoot('Servicios', [
    'Construccion',
    'Electricidad',
    'Plomeria',
    'Informatica',
    'Diseno',
    'Clases Particulares',
    'Transporte',
  ]),
  makeRoot('Agro', ['Maquinaria Agricola', 'Insumos', 'Ganaderia']),
  makeRoot('Mascotas', ['Perros', 'Gatos', 'Accesorios', 'Servicios']),
  makeRoot('Otros', ['Varios']),
]

const ROOT_BY_SLUG = new Map(CATEGORY_TREE.map((root) => [root.slug, root]))

const SELECTION_BY_NORMALIZED_NAME = new Map<string, CategorySelection>()

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function registerSynonym(label: string, selection: CategorySelection) {
  const normalized = normalizeKey(label)
  if (!normalized) {
    return
  }

  SELECTION_BY_NORMALIZED_NAME.set(normalized, selection)
}

for (const root of CATEGORY_TREE) {
  registerSynonym(root.name, { category: root.name, subcategory: null })

  for (const child of root.children ?? []) {
    registerSynonym(child.name, { category: root.name, subcategory: child.name })
  }
}

const LEGACY_COMPATIBILITY_MAP: Array<[string, CategorySelection]> = [
  ['automotores', { category: 'Vehiculos', subcategory: 'Autos' }],
  ['auto', { category: 'Vehiculos', subcategory: 'Autos' }],
  ['autos', { category: 'Vehiculos', subcategory: 'Autos' }],
  ['camioneta', { category: 'Vehiculos', subcategory: 'Camionetas' }],
  ['camionetas', { category: 'Vehiculos', subcategory: 'Camionetas' }],
  ['suv', { category: 'Vehiculos', subcategory: 'SUVs' }],
  ['suvs', { category: 'Vehiculos', subcategory: 'SUVs' }],
  ['moto', { category: 'Vehiculos', subcategory: 'Motos' }],
  ['motos', { category: 'Vehiculos', subcategory: 'Motos' }],
  ['camion', { category: 'Vehiculos', subcategory: 'Camiones' }],
  ['camiones', { category: 'Vehiculos', subcategory: 'Camiones' }],
  ['utilitario', { category: 'Vehiculos', subcategory: 'Utilitarios' }],
  ['utilitarios', { category: 'Vehiculos', subcategory: 'Utilitarios' }],
  ['nautica', { category: 'Vehiculos', subcategory: 'Nautica' }],
  ['repuestos', { category: 'Vehiculos', subcategory: 'Repuestos y Accesorios' }],
  ['accesorios vehiculos', { category: 'Vehiculos', subcategory: 'Repuestos y Accesorios' }],

  ['tecnologia', { category: 'Tecnologia', subcategory: null }],
  ['celular', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['celulares', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['telefono', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['telefonos', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['smartphone', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['smartphones', { category: 'Tecnologia', subcategory: 'Celulares' }],
  ['tablet', { category: 'Tecnologia', subcategory: 'Tablets' }],
  ['tablets', { category: 'Tecnologia', subcategory: 'Tablets' }],
  ['notebook', { category: 'Tecnologia', subcategory: 'Notebooks' }],
  ['notebooks', { category: 'Tecnologia', subcategory: 'Notebooks' }],
  ['laptop', { category: 'Tecnologia', subcategory: 'Notebooks' }],
  ['laptops', { category: 'Tecnologia', subcategory: 'Notebooks' }],
  ['pc', { category: 'Tecnologia', subcategory: 'PCs de Escritorio' }],
  ['pcs', { category: 'Tecnologia', subcategory: 'PCs de Escritorio' }],
  ['computadora', { category: 'Tecnologia', subcategory: 'PCs de Escritorio' }],
  ['computadoras', { category: 'Tecnologia', subcategory: 'PCs de Escritorio' }],
  ['monitor', { category: 'Tecnologia', subcategory: 'Monitores' }],
  ['monitores', { category: 'Tecnologia', subcategory: 'Monitores' }],
  ['smart tv', { category: 'Tecnologia', subcategory: 'Smart TVs' }],
  ['smarttv', { category: 'Tecnologia', subcategory: 'Smart TVs' }],
  ['tv', { category: 'Tecnologia', subcategory: 'Smart TVs' }],
  ['consola', { category: 'Tecnologia', subcategory: 'Consolas' }],
  ['consolas', { category: 'Tecnologia', subcategory: 'Consolas' }],
  ['videojuego', { category: 'Tecnologia', subcategory: 'Videojuegos' }],
  ['videojuegos', { category: 'Tecnologia', subcategory: 'Videojuegos' }],
  ['audio', { category: 'Tecnologia', subcategory: 'Audio' }],
  ['camara', { category: 'Tecnologia', subcategory: 'Camaras' }],
  ['camaras', { category: 'Tecnologia', subcategory: 'Camaras' }],
  ['impresora', { category: 'Tecnologia', subcategory: 'Impresoras' }],
  ['impresoras', { category: 'Tecnologia', subcategory: 'Impresoras' }],
  ['wifi', { category: 'Tecnologia', subcategory: 'Redes y WiFi' }],
  ['redes', { category: 'Tecnologia', subcategory: 'Redes y WiFi' }],

  ['hogar y muebles', { category: 'Hogar y Muebles', subcategory: null }],
  ['hogar', { category: 'Hogar y Muebles', subcategory: null }],
  ['mueble', { category: 'Hogar y Muebles', subcategory: 'Muebles' }],
  ['muebles', { category: 'Hogar y Muebles', subcategory: 'Muebles' }],
  ['electrodomestico', { category: 'Hogar y Muebles', subcategory: 'Electrodomesticos' }],
  ['electrodomesticos', { category: 'Hogar y Muebles', subcategory: 'Electrodomesticos' }],
  ['decoracion', { category: 'Hogar y Muebles', subcategory: 'Decoracion' }],
  ['jardin', { category: 'Hogar y Muebles', subcategory: 'Jardin' }],
  ['iluminacion', { category: 'Hogar y Muebles', subcategory: 'Iluminacion' }],
  ['herramientas y construccion', { category: 'Hogar y Muebles', subcategory: 'Herramientas' }],

  ['inmueble', { category: 'Inmuebles', subcategory: null }],
  ['inmuebles', { category: 'Inmuebles', subcategory: null }],
  ['casa', { category: 'Inmuebles', subcategory: 'Casas' }],
  ['casas', { category: 'Inmuebles', subcategory: 'Casas' }],
  ['departamento', { category: 'Inmuebles', subcategory: 'Departamentos' }],
  ['departamentos', { category: 'Inmuebles', subcategory: 'Departamentos' }],
  ['terreno', { category: 'Inmuebles', subcategory: 'Terrenos' }],
  ['terrenos', { category: 'Inmuebles', subcategory: 'Terrenos' }],
  ['oficina', { category: 'Inmuebles', subcategory: 'Oficinas' }],
  ['oficinas', { category: 'Inmuebles', subcategory: 'Oficinas' }],

  ['salud y deportes', { category: 'Deportes y Fitness', subcategory: null }],
  ['deporte', { category: 'Deportes y Fitness', subcategory: null }],
  ['deportes', { category: 'Deportes y Fitness', subcategory: null }],
  ['bicicleta', { category: 'Deportes y Fitness', subcategory: 'Bicicletas' }],
  ['bicicletas', { category: 'Deportes y Fitness', subcategory: 'Bicicletas' }],
  ['gimnasio', { category: 'Deportes y Fitness', subcategory: 'Gimnasio' }],
  ['camping', { category: 'Deportes y Fitness', subcategory: 'Camping' }],
  ['pesca', { category: 'Deportes y Fitness', subcategory: 'Pesca' }],

  ['moda y belleza', { category: 'Moda', subcategory: null }],
  ['moda', { category: 'Moda', subcategory: null }],
  ['hombre', { category: 'Moda', subcategory: 'Hombre' }],
  ['mujer', { category: 'Moda', subcategory: 'Mujer' }],
  ['calzado', { category: 'Moda', subcategory: 'Calzado' }],

  ['bebes y ninos', { category: 'Ninos y Bebes', subcategory: null }],
  ['ninos y bebes', { category: 'Ninos y Bebes', subcategory: null }],
  ['juguetes', { category: 'Ninos y Bebes', subcategory: 'Juguetes' }],
  ['cochecitos', { category: 'Ninos y Bebes', subcategory: 'Cochecitos' }],

  ['empleo', { category: 'Empleo', subcategory: null }],
  ['ofertas laborales', { category: 'Empleo', subcategory: 'Ofertas Laborales' }],
  ['servicios profesionales', { category: 'Empleo', subcategory: 'Servicios Profesionales' }],

  ['servicio', { category: 'Servicios', subcategory: null }],
  ['servicios', { category: 'Servicios', subcategory: null }],
  ['construccion', { category: 'Servicios', subcategory: 'Construccion' }],
  ['electricidad', { category: 'Servicios', subcategory: 'Electricidad' }],
  ['plomeria', { category: 'Servicios', subcategory: 'Plomeria' }],
  ['informatica', { category: 'Servicios', subcategory: 'Informatica' }],
  ['diseno', { category: 'Servicios', subcategory: 'Diseno' }],
  ['transporte', { category: 'Servicios', subcategory: 'Transporte' }],

  ['agro', { category: 'Agro', subcategory: null }],
  ['maquinaria agricola', { category: 'Agro', subcategory: 'Maquinaria Agricola' }],
  ['insumos', { category: 'Agro', subcategory: 'Insumos' }],
  ['ganaderia', { category: 'Agro', subcategory: 'Ganaderia' }],

  ['mascota', { category: 'Mascotas', subcategory: null }],
  ['mascotas', { category: 'Mascotas', subcategory: null }],
  ['perros', { category: 'Mascotas', subcategory: 'Perros' }],
  ['gatos', { category: 'Mascotas', subcategory: 'Gatos' }],
  ['accesorios mascotas', { category: 'Mascotas', subcategory: 'Accesorios' }],

  ['otros', { category: 'Otros', subcategory: null }],
  ['varios', { category: 'Otros', subcategory: 'Varios' }],
]

for (const [legacyLabel, selection] of LEGACY_COMPATIBILITY_MAP) {
  registerSynonym(legacyLabel, selection)
}

export function getRootCategories() {
  return CATEGORY_TREE
}

export function getSubcategories(rootCategory: string) {
  const root = CATEGORY_TREE.find((item) => item.name === rootCategory)
  return root?.children ?? []
}

export function isValidRootCategory(value: string) {
  return CATEGORY_TREE.some((item) => item.name === value)
}

export function isValidSubcategory(rootCategory: string, subcategory: string | null | undefined) {
  if (!subcategory) {
    return false
  }

  return getSubcategories(rootCategory).some((item) => item.name === subcategory)
}

export function resolveCategorySelection(rawCategory: string, rawSubcategory?: string | null): CategorySelection {
  const normalizedCategory = normalizeKey(rawCategory)
  const normalizedSubcategory = normalizeKey(rawSubcategory ?? '')

  if (rawSubcategory && isValidSubcategory(rawCategory, rawSubcategory)) {
    return {
      category: rawCategory,
      subcategory: rawSubcategory,
    }
  }

  const direct = SELECTION_BY_NORMALIZED_NAME.get(normalizedCategory)
  if (direct) {
    return direct
  }

  if (normalizedSubcategory) {
    const combined = SELECTION_BY_NORMALIZED_NAME.get(`${normalizedCategory} ${normalizedSubcategory}`)
    if (combined) {
      return combined
    }

    const subcategoryOnly = SELECTION_BY_NORMALIZED_NAME.get(normalizedSubcategory)
    if (subcategoryOnly) {
      return {
        category: rawCategory && isValidRootCategory(rawCategory) ? rawCategory : subcategoryOnly.category,
        subcategory: subcategoryOnly.subcategory,
      }
    }
  }

  const fallbackRoot = ROOT_BY_SLUG.get(slugify(rawCategory))
  if (fallbackRoot) {
    return {
      category: fallbackRoot.name,
      subcategory: null,
    }
  }

  return {
    category: 'Otros',
    subcategory: 'Varios',
  }
}

export function isVehicleRootCategory(value: string) {
  return resolveCategorySelection(value).category === 'Vehiculos'
}

export function getCategoryPathLabel(category: string, subcategory: string | null | undefined) {
  if (!subcategory) {
    return category
  }

  return `${category} > ${subcategory}`
}
