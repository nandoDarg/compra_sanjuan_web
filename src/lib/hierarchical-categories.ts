export type Category = {
  id: string
  name: string
  slug: string
  children?: Category[]
}

type CategorySelection = {
  category: string
  subcategory: string | null
  tertiarySubcategory: string | null
}

export type CategoryRouteSelection = {
  category: Category
  subcategory: Category
  tertiarySubcategories: Category[]
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

function buildSubcategoryRouteSlug(categoryName: string, subcategoryName: string) {
  return `${slugify(categoryName)}--${slugify(subcategoryName)}`
}

function makeLeaf(name: string): Category {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
  }
}

function makeBranch(name: string, children: string[]): Category {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
    children: children.map(makeLeaf),
  }
}

function makeRoot(name: string, children: Category[]): Category {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
    children,
  }
}

export const CATEGORY_TREE: Category[] = [
  makeBranch('Vehiculos', [
    'Autos',
    'Camiones',
    'Camionetas, Utilitarios, SUV',
    'Motos, Cuatriciclos',
    'Nautica',
    'Otros vehiculos',
    'Planes de Ahorro',
  ]),
  makeBranch('Inmuebles', [
    'Casas',
    'Cocheras',
    'Departamentos',
    'Fincas, Campos, Quintas',
    'Galpones',
    'Locales, Salones, Oficinas, Consultorios',
    'Negocios, Industrias',
    'Parcelas, Nichos',
    'Terrenos, Lotes',
    'Transferencias, Carpetas',
  ]),
  makeBranch('Servicios', [
    'Cursos y Capacitaciones',
    'Belleza y Cuidado personal',
    'Empleos',
    'Fiestas y Eventos',
    'Diseno e Impresiones',
    'Mantenimiento de Vehiculos',
    'Mantenimiento del Hogar',
    'Otros Servicios',
    'Profesionales',
    'Servicio Tecnico',
    'Traslados y Fletes',
    'Viajes y Turismo',
  ]),
  makeRoot('Articulos', [
    makeBranch('Electronica y tecnologia', ['Celulares', 'Audio y video', 'Otros']),
    makeBranch('Computacion', [
      'Laptops y Accesorios',
      'PC de Escritorio',
      'Monitores y Accesorios',
      'Componentes de PC',
      'Almacenamiento',
      'Impresoras y Escaneres',
      'Redes e Inalambrico',
      'Tablets y Accesorios',
      'Software',
      'Servidores y NAS',
    ]),
    makeLeaf('Electrodomesticos'),
    makeBranch('Hogar y muebles', ['Cocina y Bazar', 'Estar y comedor', 'Jardines y Exteriores', 'Muebles', 'Otros']),
    makeLeaf('Construccion'),
    makeLeaf('Vehiculos, Repuestos y Accesorios'),
    makeLeaf('Deportes y Aire libre'),
    makeLeaf('Industria y Oficina'),
    makeLeaf('Relojes y Joyas'),
    makeLeaf('Bebes y Ninos'),
    makeLeaf('Juegos y Juguetes'),
    makeLeaf('Libros, Revistas y Comics'),
    makeLeaf('Indumentaria y Accesorios'),
    makeLeaf('Otros'),
    makeLeaf('Animales y Mascotas'),
    makeLeaf('Cotillon y Fiestas'),
  ]),
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
  registerSynonym(root.name, { category: root.name, subcategory: null, tertiarySubcategory: null })

  for (const subcategory of root.children ?? []) {
    registerSynonym(subcategory.name, {
      category: root.name,
      subcategory: subcategory.name,
      tertiarySubcategory: null,
    })

    for (const tertiarySubcategory of subcategory.children ?? []) {
      const selection: CategorySelection = {
        category: root.name,
        subcategory: subcategory.name,
        tertiarySubcategory: tertiarySubcategory.name,
      }

      registerSynonym(tertiarySubcategory.name, selection)
      registerSynonym(`${subcategory.name} ${tertiarySubcategory.name}`, selection)
      registerSynonym(`${subcategory.name} > ${tertiarySubcategory.name}`, selection)
      registerSynonym(`${root.name} ${subcategory.name} ${tertiarySubcategory.name}`, selection)
    }
  }
}

const LEGACY_COMPATIBILITY_MAP: Array<[string, CategorySelection]> = [
  ['automotores', { category: 'Vehiculos', subcategory: 'Autos', tertiarySubcategory: null }],
  ['auto', { category: 'Vehiculos', subcategory: 'Autos', tertiarySubcategory: null }],
  ['autos', { category: 'Vehiculos', subcategory: 'Autos', tertiarySubcategory: null }],
  ['camioneta', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['camionetas', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['utilitario', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['utilitarios', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['suv', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['suvs', { category: 'Vehiculos', subcategory: 'Camionetas, Utilitarios, SUV', tertiarySubcategory: null }],
  ['moto', { category: 'Vehiculos', subcategory: 'Motos, Cuatriciclos', tertiarySubcategory: null }],
  ['motos', { category: 'Vehiculos', subcategory: 'Motos, Cuatriciclos', tertiarySubcategory: null }],
  ['cuatriciclo', { category: 'Vehiculos', subcategory: 'Motos, Cuatriciclos', tertiarySubcategory: null }],
  ['cuatriciclos', { category: 'Vehiculos', subcategory: 'Motos, Cuatriciclos', tertiarySubcategory: null }],
  ['camion', { category: 'Vehiculos', subcategory: 'Camiones', tertiarySubcategory: null }],
  ['camiones', { category: 'Vehiculos', subcategory: 'Camiones', tertiarySubcategory: null }],
  ['nautica', { category: 'Vehiculos', subcategory: 'Nautica', tertiarySubcategory: null }],
  ['otros vehiculos', { category: 'Vehiculos', subcategory: 'Otros vehiculos', tertiarySubcategory: null }],
  ['planes', { category: 'Vehiculos', subcategory: 'Planes de Ahorro', tertiarySubcategory: null }],
  ['planes de ahorro', { category: 'Vehiculos', subcategory: 'Planes de Ahorro', tertiarySubcategory: null }],
  ['repuestos', { category: 'Articulos', subcategory: 'Vehiculos, Repuestos y Accesorios', tertiarySubcategory: null }],
  ['accesorios vehiculos', { category: 'Articulos', subcategory: 'Vehiculos, Repuestos y Accesorios', tertiarySubcategory: null }],

  ['inmueble', { category: 'Inmuebles', subcategory: null, tertiarySubcategory: null }],
  ['inmuebles', { category: 'Inmuebles', subcategory: null, tertiarySubcategory: null }],
  ['casa', { category: 'Inmuebles', subcategory: 'Casas', tertiarySubcategory: null }],
  ['casas', { category: 'Inmuebles', subcategory: 'Casas', tertiarySubcategory: null }],
  ['cochera', { category: 'Inmuebles', subcategory: 'Cocheras', tertiarySubcategory: null }],
  ['cocheras', { category: 'Inmuebles', subcategory: 'Cocheras', tertiarySubcategory: null }],
  ['departamento', { category: 'Inmuebles', subcategory: 'Departamentos', tertiarySubcategory: null }],
  ['departamentos', { category: 'Inmuebles', subcategory: 'Departamentos', tertiarySubcategory: null }],
  ['terreno', { category: 'Inmuebles', subcategory: 'Terrenos, Lotes', tertiarySubcategory: null }],
  ['terrenos', { category: 'Inmuebles', subcategory: 'Terrenos, Lotes', tertiarySubcategory: null }],
  ['lotes', { category: 'Inmuebles', subcategory: 'Terrenos, Lotes', tertiarySubcategory: null }],
  ['local', { category: 'Inmuebles', subcategory: 'Locales, Salones, Oficinas, Consultorios', tertiarySubcategory: null }],
  ['locales', { category: 'Inmuebles', subcategory: 'Locales, Salones, Oficinas, Consultorios', tertiarySubcategory: null }],
  ['oficina', { category: 'Inmuebles', subcategory: 'Locales, Salones, Oficinas, Consultorios', tertiarySubcategory: null }],
  ['oficinas', { category: 'Inmuebles', subcategory: 'Locales, Salones, Oficinas, Consultorios', tertiarySubcategory: null }],
  ['finca', { category: 'Inmuebles', subcategory: 'Fincas, Campos, Quintas', tertiarySubcategory: null }],
  ['fincas', { category: 'Inmuebles', subcategory: 'Fincas, Campos, Quintas', tertiarySubcategory: null }],
  ['campo', { category: 'Inmuebles', subcategory: 'Fincas, Campos, Quintas', tertiarySubcategory: null }],
  ['quinta', { category: 'Inmuebles', subcategory: 'Fincas, Campos, Quintas', tertiarySubcategory: null }],
  ['negocio', { category: 'Inmuebles', subcategory: 'Negocios, Industrias', tertiarySubcategory: null }],
  ['negocios', { category: 'Inmuebles', subcategory: 'Negocios, Industrias', tertiarySubcategory: null }],
  ['carpeta', { category: 'Inmuebles', subcategory: 'Transferencias, Carpetas', tertiarySubcategory: null }],
  ['carpetas', { category: 'Inmuebles', subcategory: 'Transferencias, Carpetas', tertiarySubcategory: null }],

  ['servicio', { category: 'Servicios', subcategory: null, tertiarySubcategory: null }],
  ['servicios', { category: 'Servicios', subcategory: null, tertiarySubcategory: null }],
  ['capacitaciones', { category: 'Servicios', subcategory: 'Cursos y Capacitaciones', tertiarySubcategory: null }],
  ['cursos', { category: 'Servicios', subcategory: 'Cursos y Capacitaciones', tertiarySubcategory: null }],
  ['cuidado personal', { category: 'Servicios', subcategory: 'Belleza y Cuidado personal', tertiarySubcategory: null }],
  ['belleza', { category: 'Servicios', subcategory: 'Belleza y Cuidado personal', tertiarySubcategory: null }],
  ['empleo', { category: 'Servicios', subcategory: 'Empleos', tertiarySubcategory: null }],
  ['empleos', { category: 'Servicios', subcategory: 'Empleos', tertiarySubcategory: null }],
  ['fiestas', { category: 'Servicios', subcategory: 'Fiestas y Eventos', tertiarySubcategory: null }],
  ['eventos', { category: 'Servicios', subcategory: 'Fiestas y Eventos', tertiarySubcategory: null }],
  ['imprenta', { category: 'Servicios', subcategory: 'Diseno e Impresiones', tertiarySubcategory: null }],
  ['diseno', { category: 'Servicios', subcategory: 'Diseno e Impresiones', tertiarySubcategory: null }],
  ['impresiones', { category: 'Servicios', subcategory: 'Diseno e Impresiones', tertiarySubcategory: null }],
  ['mantenimiento vehiculos', { category: 'Servicios', subcategory: 'Mantenimiento de Vehiculos', tertiarySubcategory: null }],
  ['mantenimiento del hogar', { category: 'Servicios', subcategory: 'Mantenimiento del Hogar', tertiarySubcategory: null }],
  ['profesional', { category: 'Servicios', subcategory: 'Profesionales', tertiarySubcategory: null }],
  ['profesionales', { category: 'Servicios', subcategory: 'Profesionales', tertiarySubcategory: null }],
  ['tecnico', { category: 'Servicios', subcategory: 'Servicio Tecnico', tertiarySubcategory: null }],
  ['servicio tecnico', { category: 'Servicios', subcategory: 'Servicio Tecnico', tertiarySubcategory: null }],
  ['transporte', { category: 'Servicios', subcategory: 'Traslados y Fletes', tertiarySubcategory: null }],
  ['traslados', { category: 'Servicios', subcategory: 'Traslados y Fletes', tertiarySubcategory: null }],
  ['fletes', { category: 'Servicios', subcategory: 'Traslados y Fletes', tertiarySubcategory: null }],
  ['viajes', { category: 'Servicios', subcategory: 'Viajes y Turismo', tertiarySubcategory: null }],
  ['turismo', { category: 'Servicios', subcategory: 'Viajes y Turismo', tertiarySubcategory: null }],

  ['articulo', { category: 'Articulos', subcategory: null, tertiarySubcategory: null }],
  ['articulos', { category: 'Articulos', subcategory: null, tertiarySubcategory: null }],
  ['tecnologia', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: null }],
  ['electronica', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: null }],
  ['celular', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Celulares' }],
  ['celulares', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Celulares' }],
  ['telefono', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Celulares' }],
  ['telefonos', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Celulares' }],
  ['audio', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Audio y video' }],
  ['video', { category: 'Articulos', subcategory: 'Electronica y tecnologia', tertiarySubcategory: 'Audio y video' }],
  ['electrodomesticos', { category: 'Articulos', subcategory: 'Electrodomesticos', tertiarySubcategory: null }],
  ['cocina', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Cocina y Bazar' }],
  ['bazar', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Cocina y Bazar' }],
  ['hogar', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: null }],
  ['jardin', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Jardines y Exteriores' }],
  ['jardines', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Jardines y Exteriores' }],
  ['muebles', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Muebles' }],
  ['comedor', { category: 'Articulos', subcategory: 'Hogar y muebles', tertiarySubcategory: 'Estar y comedor' }],
  ['construccion', { category: 'Articulos', subcategory: 'Construccion', tertiarySubcategory: null }],
  ['deportes', { category: 'Articulos', subcategory: 'Deportes y Aire libre', tertiarySubcategory: null }],
  ['aire libre', { category: 'Articulos', subcategory: 'Deportes y Aire libre', tertiarySubcategory: null }],
  ['oficina', { category: 'Articulos', subcategory: 'Industria y Oficina', tertiarySubcategory: null }],
  ['industria', { category: 'Articulos', subcategory: 'Industria y Oficina', tertiarySubcategory: null }],
  ['relojes', { category: 'Articulos', subcategory: 'Relojes y Joyas', tertiarySubcategory: null }],
  ['joyas', { category: 'Articulos', subcategory: 'Relojes y Joyas', tertiarySubcategory: null }],
  ['bebes', { category: 'Articulos', subcategory: 'Bebes y Ninos', tertiarySubcategory: null }],
  ['ninos', { category: 'Articulos', subcategory: 'Bebes y Ninos', tertiarySubcategory: null }],
  ['juegos', { category: 'Articulos', subcategory: 'Juegos y Juguetes', tertiarySubcategory: null }],
  ['juguetes', { category: 'Articulos', subcategory: 'Juegos y Juguetes', tertiarySubcategory: null }],
  ['libros', { category: 'Articulos', subcategory: 'Libros, Revistas y Comics', tertiarySubcategory: null }],
  ['revistas', { category: 'Articulos', subcategory: 'Libros, Revistas y Comics', tertiarySubcategory: null }],
  ['comics', { category: 'Articulos', subcategory: 'Libros, Revistas y Comics', tertiarySubcategory: null }],
  ['indumentaria', { category: 'Articulos', subcategory: 'Indumentaria y Accesorios', tertiarySubcategory: null }],
  ['accesorios', { category: 'Articulos', subcategory: 'Indumentaria y Accesorios', tertiarySubcategory: null }],
  ['mascotas', { category: 'Articulos', subcategory: 'Animales y Mascotas', tertiarySubcategory: null }],
  ['animales', { category: 'Articulos', subcategory: 'Animales y Mascotas', tertiarySubcategory: null }],
  ['cotillon', { category: 'Articulos', subcategory: 'Cotillon y Fiestas', tertiarySubcategory: null }],
]

for (const [legacyLabel, selection] of LEGACY_COMPATIBILITY_MAP) {
  registerSynonym(legacyLabel, selection)
}

export function getRootCategories() {
  return CATEGORY_TREE
}

export function getSubcategoryRouteSlug(categoryName: string, subcategoryName: string) {
  return buildSubcategoryRouteSlug(categoryName, subcategoryName)
}

export function getSubcategoryRouteSelectionBySlug(slug: string): CategoryRouteSelection | null {
  const normalizedSlug = slug.trim().toLowerCase()

  if (!normalizedSlug) {
    return null
  }

  for (const category of CATEGORY_TREE) {
    for (const subcategory of category.children ?? []) {
      if (buildSubcategoryRouteSlug(category.name, subcategory.name) === normalizedSlug) {
        return {
          category,
          subcategory,
          tertiarySubcategories: subcategory.children ?? [],
        }
      }
    }
  }

  return null
}

export function getSubcategories(rootCategory: string) {
  const root = CATEGORY_TREE.find((item) => item.name === rootCategory)
  return root?.children ?? []
}

export function getTertiarySubcategories(rootCategory: string, subcategory: string) {
  const subcategoryNode = getSubcategories(rootCategory).find((item) => item.name === subcategory)
  return subcategoryNode?.children ?? []
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

export function isValidTertiarySubcategory(
  rootCategory: string,
  subcategory: string | null | undefined,
  tertiarySubcategory: string | null | undefined
) {
  if (!subcategory || !tertiarySubcategory) {
    return false
  }

  return getTertiarySubcategories(rootCategory, subcategory).some((item) => item.name === tertiarySubcategory)
}

export function resolveCategorySelection(
  rawCategory: string,
  rawSubcategory?: string | null,
  rawTertiarySubcategory?: string | null
): CategorySelection {
  const normalizedCategory = normalizeKey(rawCategory)
  const normalizedSubcategory = normalizeKey(rawSubcategory ?? '')
  const normalizedTertiarySubcategory = normalizeKey(rawTertiarySubcategory ?? '')

  if (
    rawSubcategory &&
    isValidSubcategory(rawCategory, rawSubcategory) &&
    (!rawTertiarySubcategory || isValidTertiarySubcategory(rawCategory, rawSubcategory, rawTertiarySubcategory))
  ) {
    return {
      category: rawCategory,
      subcategory: rawSubcategory,
      tertiarySubcategory: rawTertiarySubcategory ?? null,
    }
  }

  if (normalizedSubcategory && normalizedTertiarySubcategory) {
    const combined3 = SELECTION_BY_NORMALIZED_NAME.get(
      `${normalizedCategory} ${normalizedSubcategory} ${normalizedTertiarySubcategory}`
    )
    if (combined3) {
      return combined3
    }
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
        tertiarySubcategory: subcategoryOnly.tertiarySubcategory,
      }
    }
  }

  const direct = SELECTION_BY_NORMALIZED_NAME.get(normalizedCategory)
  if (direct) {
    return direct
  }

  const fallbackRoot = ROOT_BY_SLUG.get(slugify(rawCategory))
  if (fallbackRoot) {
    return {
      category: fallbackRoot.name,
      subcategory: null,
      tertiarySubcategory: null,
    }
  }

  return {
    category: 'Articulos',
    subcategory: null,
    tertiarySubcategory: null,
  }
}

export function isVehicleRootCategory(value: string) {
  return resolveCategorySelection(value).category === 'Vehiculos'
}

export function getCategoryPathLabel(
  category: string,
  subcategory: string | null | undefined,
  tertiarySubcategory?: string | null
) {
  if (!subcategory) {
    return category
  }

  if (!tertiarySubcategory) {
    return `${category} > ${subcategory}`
  }

  return `${category} > ${subcategory} > ${tertiarySubcategory}`
}
