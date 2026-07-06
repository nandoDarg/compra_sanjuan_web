import {
  getRootCategories,
  getSubcategories,
  getTertiarySubcategories,
} from '../../src/lib/hierarchical-categories'
import { VEHICLE_BRAND_OPTIONS } from '../../src/lib/vehicle-details'

export type ProductEntry = {
  name: string
  /** Terminos relacionados reales (celular/telefono/smartphone/movil) para ejercitar la Capa 4 del buscador. */
  synonyms?: string[]
  /** Errores de tipeo reales y conocidos (celuar, samsumg) para ejercitar la Capa 5 (fuzzy). */
  typoVariants?: string[]
  /** Solo para categoria Vehiculos: mantiene el titulo alineado con vehicle_details. */
  vehicleBrand?: string
  vehicleModel?: string
  /** Termino de busqueda en ingles para traer una foto real de Unsplash. */
  imageQuery?: string
}

export type CatalogEntry = {
  category: string
  /** "Subcategoria" o "Subcategoria > Terciaria", igual formato que post-form.tsx. */
  subcategory: string
  isVehicle: boolean
  priceRange: [number, number]
  products: ProductEntry[]
}

const VEHICLE_MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Corolla', 'Hilux', 'Etios', 'Yaris'],
  Ford: ['Fiesta', 'Ranger', 'Focus', 'Ecosport'],
  Volkswagen: ['Gol Trend', 'Vento', 'Amarok', 'Polo'],
  Chevrolet: ['Cruze', 'Onix', 'S10', 'Tracker'],
  Fiat: ['Cronos', 'Argo', 'Toro', 'Mobi'],
  Renault: ['Sandero', 'Duster', 'Kwid', 'Logan'],
  Peugeot: ['208', '2008', 'Partner', '3008'],
  Citroen: ['C3', 'C4 Lounge', 'Berlingo', 'C4 Cactus'],
  Honda: ['Civic', 'HR-V', 'CB 190R', 'Wave 110'],
  Nissan: ['Versa', 'Frontier', 'Kicks', 'March'],
  Jeep: ['Renegade', 'Compass'],
  'Mercedes-Benz': ['Sprinter', 'A200'],
  BMW: ['Serie 1', 'X1'],
  Audi: ['A3', 'Q3'],
  Otra: ['Modelo importado'],
}

function vehicleProducts(count: number): ProductEntry[] {
  const brands = [...VEHICLE_BRAND_OPTIONS].filter((brand) => brand !== 'Otra')
  const products: ProductEntry[] = []

  for (let i = 0; i < count; i += 1) {
    const brand = brands[i % brands.length]
    const models = VEHICLE_MODELS_BY_BRAND[brand] ?? ['Modelo']
    const model = models[Math.floor(i / brands.length) % models.length]

    products.push({
      name: `${brand} ${model}`,
      synonyms: [brand, model, `${brand} ${model}`],
      vehicleBrand: brand,
      vehicleModel: model,
      imageQuery: `${brand} ${model} car`,
    })
  }

  return products
}

/**
 * Catalogo con contenido a mano para las categorias pedidas explicitamente
 * (con sinonimos/typos reales), clave = "Categoria::Subcategoria" o
 * "Categoria::Subcategoria::Terciaria".
 */
const HANDCRAFTED_ENTRIES: CatalogEntry[] = [
  // ── Vehiculos ─────────────────────────────────────────────────────────
  {
    category: 'Vehiculos',
    subcategory: 'Autos',
    isVehicle: true,
    priceRange: [6_000_000, 40_000_000],
    products: vehicleProducts(10),
  },
  {
    category: 'Vehiculos',
    subcategory: 'Camionetas, Utilitarios, SUV',
    isVehicle: true,
    priceRange: [9_000_000, 42_000_000],
    products: [
      { name: 'Volkswagen Amarok', synonyms: ['Amarok', 'VW Amarok'], vehicleBrand: 'Volkswagen', vehicleModel: 'Amarok', imageQuery: 'Volkswagen Amarok pickup truck' },
      { name: 'Toyota Hilux', synonyms: ['Hilux', 'Toyota Hilux'], vehicleBrand: 'Toyota', vehicleModel: 'Hilux', imageQuery: 'Toyota Hilux pickup truck' },
      { name: 'Ford Ranger', synonyms: ['Ranger', 'Ford Ranger'], vehicleBrand: 'Ford', vehicleModel: 'Ranger', imageQuery: 'Ford Ranger pickup truck' },
      { name: 'Chevrolet S10', synonyms: ['S10', 'Chevrolet S10'], vehicleBrand: 'Chevrolet', vehicleModel: 'S10', imageQuery: 'Chevrolet S10 pickup truck' },
      { name: 'Jeep Renegade', synonyms: ['Renegade', 'Jeep Renegade'], vehicleBrand: 'Jeep', vehicleModel: 'Renegade', imageQuery: 'Jeep Renegade suv' },
      { name: 'Chevrolet Tracker', synonyms: ['Tracker', 'Chevrolet Tracker'], vehicleBrand: 'Chevrolet', vehicleModel: 'Tracker', imageQuery: 'Chevrolet Tracker suv' },
    ],
  },
  {
    category: 'Vehiculos',
    subcategory: 'Motos, Cuatriciclos',
    isVehicle: true,
    priceRange: [1_100_000, 9_000_000],
    products: [
      { name: 'Honda Wave', synonyms: ['Wave 110', 'Honda Wave', 'moto Honda'], vehicleBrand: 'Honda', vehicleModel: 'Wave 110', imageQuery: 'Honda Wave motorcycle' },
      { name: 'Honda CB 190R', synonyms: ['CB 190', 'Honda CB'], vehicleBrand: 'Honda', vehicleModel: 'CB 190R', imageQuery: 'Honda CB motorcycle' },
      { name: 'Moto 110cc', synonyms: ['moto', 'ciclomotor', 'motito'], vehicleBrand: 'Otra', vehicleModel: '110cc', imageQuery: 'small motorcycle street' },
      { name: 'Cuatriciclo 200cc', synonyms: ['cuatri', 'cuatriciclo'], vehicleBrand: 'Otra', vehicleModel: 'Cuatri 200cc', imageQuery: 'quad bike atv' },
    ],
  },
  {
    category: 'Vehiculos',
    subcategory: 'Camiones',
    isVehicle: true,
    priceRange: [8_000_000, 45_000_000],
    products: [
      { name: 'Camion Mercedes-Benz Sprinter', synonyms: ['Sprinter', 'Mercedes Sprinter', 'camion'], vehicleBrand: 'Mercedes-Benz', vehicleModel: 'Sprinter', imageQuery: 'Mercedes Sprinter cargo van truck' },
      { name: 'Camion Ford Cargo', synonyms: ['Ford Cargo', 'camion Ford'], vehicleBrand: 'Ford', vehicleModel: 'Cargo', imageQuery: 'cargo truck' },
    ],
  },
  {
    category: 'Vehiculos',
    subcategory: 'Nautica',
    isVehicle: true,
    priceRange: [2_000_000, 30_000_000],
    products: [
      { name: 'Lancha semirigida', synonyms: ['lancha', 'embarcacion', 'bote'], imageQuery: 'motor boat lake' },
      { name: 'Kayak individual', synonyms: ['kayak', 'canoa'], imageQuery: 'kayak' },
      { name: 'Gomon con motor', synonyms: ['gomon', 'bote inflable'], imageQuery: 'inflatable boat motor' },
    ],
  },
  {
    category: 'Vehiculos',
    subcategory: 'Otros vehiculos',
    isVehicle: true,
    priceRange: [1_000_000, 20_000_000],
    products: [
      { name: 'Tractor agricola', synonyms: ['tractor'], imageQuery: 'farm tractor' },
      { name: 'Acoplado con patente', synonyms: ['acoplado', 'trailer'], imageQuery: 'cargo trailer' },
    ],
  },
  {
    category: 'Vehiculos',
    subcategory: 'Planes de Ahorro',
    isVehicle: true,
    priceRange: [3_000_000, 15_000_000],
    products: [
      { name: 'Plan Volkswagen 100% adjudicado', synonyms: ['plan de ahorro', 'plan Volkswagen'], vehicleBrand: 'Volkswagen', vehicleModel: 'Gol Trend', imageQuery: 'Volkswagen Gol car' },
      { name: 'Plan Toyota adjudicado', synonyms: ['plan de ahorro', 'plan Toyota'], vehicleBrand: 'Toyota', vehicleModel: 'Etios', imageQuery: 'Toyota Etios car' },
    ],
  },

  // ── Tecnologia ────────────────────────────────────────────────────────
  {
    category: 'Articulos',
    subcategory: 'Electronica y tecnologia > Celulares',
    isVehicle: false,
    priceRange: [80_000, 2_200_000],
    products: [
      {
        name: 'iPhone',
        synonyms: ['celular', 'telefono', 'smartphone', 'movil', 'equipo', 'iphone'],
        typoVariants: ['ifone', 'iphon'],
        imageQuery: 'iphone smartphone',
      },
      {
        name: 'Samsung Galaxy',
        synonyms: ['celular', 'telefono', 'smartphone', 'movil', 'equipo', 'samsung'],
        typoVariants: ['samsumg', 'galaxi'],
        imageQuery: 'samsung galaxy smartphone',
      },
      {
        name: 'Motorola Moto G',
        synonyms: ['celular', 'telefono', 'smartphone', 'movil', 'equipo', 'motorola'],
        typoVariants: ['motorolla'],
        imageQuery: 'android smartphone',
      },
      {
        name: 'Xiaomi Redmi',
        synonyms: ['celular', 'telefono', 'smartphone', 'movil', 'equipo', 'xiaomi'],
        typoVariants: ['redmy', 'shaomi'],
        imageQuery: 'xiaomi smartphone',
      },
    ],
  },
  {
    category: 'Articulos',
    subcategory: 'Electronica y tecnologia > Audio y video',
    isVehicle: false,
    priceRange: [40_000, 1_800_000],
    products: [
      { name: 'Smart TV LG', synonyms: ['televisor', 'tv', 'smart tv', 'tele'], typoVariants: ['televisorr'], imageQuery: 'smart tv living room' },
      { name: 'Smart TV Samsung', synonyms: ['televisor', 'tv', 'smart tv', 'tele'], typoVariants: ['samsumg'], imageQuery: 'samsung smart tv' },
      { name: 'Parlante Bluetooth JBL', synonyms: ['parlante', 'altavoz', 'audio', 'bocina'], imageQuery: 'bluetooth speaker' },
      { name: 'Auriculares inalambricos', synonyms: ['auriculares', 'audifonos', 'auricular'], imageQuery: 'wireless headphones' },
      { name: 'Barra de sonido', synonyms: ['audio', 'sonido', 'equipo de sonido'], imageQuery: 'soundbar speaker' },
    ],
  },
  {
    category: 'Articulos',
    subcategory: 'Computacion > Laptops y Accesorios',
    isVehicle: false,
    priceRange: [500_000, 2_500_000],
    products: [
      {
        name: 'Notebook Lenovo',
        synonyms: ['notebook', 'laptop', 'computadora portatil', 'pc portatil'],
        typoVariants: ['notboock', 'lenovoo'],
        imageQuery: 'lenovo laptop',
      },
      {
        name: 'Notebook HP',
        synonyms: ['notebook', 'laptop', 'computadora portatil', 'pc portatil'],
        typoVariants: ['notboock'],
        imageQuery: 'hp laptop',
      },
      {
        name: 'Notebook Dell',
        synonyms: ['notebook', 'laptop', 'computadora portatil', 'pc portatil'],
        typoVariants: ['notebok'],
        imageQuery: 'dell laptop',
      },
      { name: 'Mouse y teclado inalambrico', synonyms: ['accesorios pc', 'mouse', 'teclado'], imageQuery: 'wireless mouse keyboard' },
    ],
  },
  {
    category: 'Articulos',
    subcategory: 'Computacion > PC de Escritorio',
    isVehicle: false,
    priceRange: [400_000, 2_000_000],
    products: [
      { name: 'PC Gamer armada', synonyms: ['computadora', 'pc', 'cpu'], imageQuery: 'gaming pc desktop computer' },
      { name: 'PC de oficina completa', synonyms: ['computadora', 'pc', 'cpu'], imageQuery: 'desktop computer office' },
    ],
  },

  // ── Mascotas ──────────────────────────────────────────────────────────
  {
    category: 'Articulos',
    subcategory: 'Animales y Mascotas',
    isVehicle: false,
    priceRange: [80_000, 900_000],
    products: [
      {
        name: 'Cachorros Golden Retriever',
        synonyms: ['cachorros', 'perritos', 'golden', 'golden retriever', 'perro'],
        typoVariants: ['golden retriver', 'cachorito'],
        imageQuery: 'golden retriever puppy',
      },
      { name: 'Caniche Toy', synonyms: ['cachorros', 'perritos', 'caniche', 'perro'], typoVariants: ['canishe'], imageQuery: 'toy poodle puppy' },
      { name: 'Bulldog Frances', synonyms: ['cachorros', 'perritos', 'bulldog', 'perro'], typoVariants: ['buldog', 'frances'], imageQuery: 'french bulldog puppy' },
      { name: 'Gatos Persa', synonyms: ['gatitos', 'gatos', 'persa', 'gato'], typoVariants: ['perza'], imageQuery: 'persian cat kitten' },
      { name: 'Jaula para pajaros', synonyms: ['jaula', 'accesorios mascota'], imageQuery: 'bird cage' },
      { name: 'Alimento balanceado para perro', synonyms: ['alimento', 'balanceado', 'comida perro'], imageQuery: 'dog food bag' },
    ],
  },

  // ── Hogar ─────────────────────────────────────────────────────────────
  {
    category: 'Articulos',
    subcategory: 'Hogar y muebles > Muebles',
    isVehicle: false,
    priceRange: [35_000, 1_800_000],
    products: [
      { name: 'Mesa de algarrobo', synonyms: ['mesa', 'mueble', 'comedor'], typoVariants: ['algarovo'], imageQuery: 'wooden dining table' },
      { name: 'Placard', synonyms: ['placard', 'ropero', 'mueble'], typoVariants: ['plackard'], imageQuery: 'wardrobe closet' },
      { name: 'Sillon 3 cuerpos', synonyms: ['sillon', 'sofa', 'mueble'], imageQuery: 'sofa living room' },
      { name: 'Juego de comedor', synonyms: ['comedor', 'mesa y sillas', 'mueble'], imageQuery: 'dining table chairs set' },
      { name: 'Mesa ratona', synonyms: ['mesa ratona', 'mueble'], imageQuery: 'coffee table' },
    ],
  },
  {
    category: 'Articulos',
    subcategory: 'Electrodomesticos',
    isVehicle: false,
    priceRange: [75_000, 2_600_000],
    products: [
      { name: 'Heladera no frost', synonyms: ['heladera', 'refrigerador', 'electrodomestico'], typoVariants: ['heladra', 'eladera'], imageQuery: 'refrigerator kitchen' },
      { name: 'Cocina a gas', synonyms: ['cocina', 'anafe', 'electrodomestico'], imageQuery: 'gas stove kitchen' },
      { name: 'Lavarropas automatico', synonyms: ['lavarropas', 'lavadora', 'electrodomestico'], imageQuery: 'washing machine' },
      { name: 'Microondas digital', synonyms: ['microondas', 'electrodomestico'], imageQuery: 'microwave oven' },
      { name: 'Aire acondicionado frio calor', synonyms: ['aire acondicionado', 'split', 'electrodomestico'], imageQuery: 'air conditioner split' },
    ],
  },

  // ── Herramientas (mapeado a Construccion, leaf mas cercano del arbol actual) ─
  {
    category: 'Articulos',
    subcategory: 'Construccion',
    isVehicle: false,
    priceRange: [50_000, 820_000],
    products: [
      { name: 'Taladro Bosch', synonyms: ['taladro', 'herramienta'], typoVariants: ['tanadro'], imageQuery: 'power drill tool' },
      { name: 'Amoladora Makita', synonyms: ['amoladora', 'herramienta'], typoVariants: ['amoladra'], imageQuery: 'angle grinder tool' },
      { name: 'Soldadora Inverter', synonyms: ['soldadora', 'herramienta'], imageQuery: 'welding machine' },
      { name: 'Compresor de aire', synonyms: ['compresor', 'herramienta'], imageQuery: 'air compressor tool' },
      { name: 'Kit de herramientas completo', synonyms: ['herramientas', 'caja de herramientas'], imageQuery: 'tool box kit' },
    ],
  },

  // ── Servicios ─────────────────────────────────────────────────────────
  {
    category: 'Servicios',
    subcategory: 'Profesionales',
    isVehicle: false,
    priceRange: [8_000, 350_000],
    products: [
      { name: 'Electricista matriculado', synonyms: ['electricista', 'servicio electrico'], imageQuery: 'electrician working' },
      { name: 'Plomero a domicilio', synonyms: ['plomero', 'gasista', 'servicio plomeria'], imageQuery: 'plumber working' },
      { name: 'Albañil para reformas', synonyms: ['albañil', 'construccion'], typoVariants: ['albanil'], imageQuery: 'construction worker bricklayer' },
      { name: 'Programador freelance', synonyms: ['programador', 'desarrollador', 'developer'], imageQuery: 'programmer working laptop' },
      { name: 'Profesor particular', synonyms: ['profesor', 'clases particulares', 'tutor'], imageQuery: 'tutor teaching student' },
    ],
  },

  // ── Deportes ──────────────────────────────────────────────────────────
  {
    category: 'Articulos',
    subcategory: 'Deportes y Aire libre',
    isVehicle: false,
    priceRange: [150_000, 1_200_000],
    products: [
      {
        name: 'Bicicleta Venzo Rodado 29',
        synonyms: ['bicicleta', 'bici', 'mountain bike', 'mtb', 'rodado 29'],
        typoVariants: ['bicileta', 'venso'],
        imageQuery: 'mountain bike',
      },
      { name: 'Bicicleta rodado 26', synonyms: ['bicicleta', 'bici', 'mountain bike', 'mtb'], typoVariants: ['bicileta'], imageQuery: 'bicycle' },
      { name: 'Caminadora electrica', synonyms: ['caminadora', 'cinta para correr'], imageQuery: 'treadmill' },
      { name: 'Set de mancuernas', synonyms: ['mancuernas', 'pesas'], imageQuery: 'dumbbells' },
      { name: 'Banco de musculacion', synonyms: ['banco', 'gimnasio en casa'], imageQuery: 'home gym bench' },
    ],
  },
]

const genericPriceRangeByRoot: Record<string, [number, number]> = {
  Vehiculos: [2_000_000, 25_000_000],
  Inmuebles: [10_000_000, 200_000_000],
  Servicios: [8_000, 300_000],
  Articulos: [15_000, 500_000],
}

/** Termino de busqueda generico en ingles por categoria raiz, usado cuando un leaf no tiene contenido a mano. */
const genericImageQueryByRoot: Record<string, string> = {
  Vehiculos: 'car vehicle',
  Inmuebles: 'house real estate',
  Servicios: 'worker service',
  Articulos: 'product for sale',
}

function buildLeafKey(category: string, subcategory: string, tertiary: string | null) {
  return tertiary ? `${category}::${subcategory}::${tertiary}` : `${category}::${subcategory}`
}

function genericProductsFor(leafName: string, rootName: string): ProductEntry[] {
  const imageQuery = genericImageQueryByRoot[rootName] ?? 'product for sale'
  return [
    { name: `${leafName} en muy buen estado`, imageQuery },
    { name: `${leafName} usado poco tiempo`, imageQuery },
    { name: `${leafName} impecable`, imageQuery },
  ]
}

/**
 * Construye el catalogo completo recorriendo el arbol real de categorias
 * (hierarchical-categories.ts). Los leaves con contenido a mano usan sus
 * sinonimos/typos reales; el resto recibe productos genericos para no dejar
 * ninguna categoria sin publicaciones ("distribucion equilibrada").
 */
export function buildCatalog(): CatalogEntry[] {
  const handcraftedByKey = new Map<string, CatalogEntry>()
  for (const entry of HANDCRAFTED_ENTRIES) {
    const [sub, tertiary] = entry.subcategory.split(' > ').map((part) => part.trim())
    handcraftedByKey.set(buildLeafKey(entry.category, sub, tertiary ?? null), entry)
  }

  const catalog: CatalogEntry[] = []

  for (const root of getRootCategories()) {
    const subcategories = getSubcategories(root.name)

    if (subcategories.length === 0) {
      continue
    }

    for (const subcategory of subcategories) {
      const tertiaries = getTertiarySubcategories(root.name, subcategory.name)

      if (tertiaries.length === 0) {
        const key = buildLeafKey(root.name, subcategory.name, null)
        const handcrafted = handcraftedByKey.get(key)

        catalog.push(
          handcrafted ?? {
            category: root.name,
            subcategory: subcategory.name,
            isVehicle: root.name === 'Vehiculos',
            priceRange: genericPriceRangeByRoot[root.name] ?? [15_000, 500_000],
            products: genericProductsFor(subcategory.name, root.name),
          }
        )
        continue
      }

      for (const tertiary of tertiaries) {
        const key = buildLeafKey(root.name, subcategory.name, tertiary.name)
        const handcrafted = handcraftedByKey.get(key)

        catalog.push(
          handcrafted ?? {
            category: root.name,
            subcategory: `${subcategory.name} > ${tertiary.name}`,
            isVehicle: false,
            priceRange: genericPriceRangeByRoot[root.name] ?? [15_000, 500_000],
            products: genericProductsFor(tertiary.name, root.name),
          }
        )
      }
    }
  }

  return catalog
}
