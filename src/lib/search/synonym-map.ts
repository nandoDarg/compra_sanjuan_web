/**
 * Mapa de sinónimos semánticos.
 * Clave: término canónico normalizado (sin tildes, minúsculas).
 * Valor: lista de términos relacionados que se usarán en la búsqueda expandida.
 *
 * Para agregar nuevas entradas simplemente añade una clave nueva aquí;
 * no es necesario tocar la lógica de búsqueda.
 *
 * ── Regla para términos de 3 caracteres o menos ──────────────────────────
 * La búsqueda usa ILIKE por substring (no por palabra completa), a propósito:
 * asi %perro% matchea tambien "perros"/"perrito". Pero un término corto y
 * puramente alfabético tiene mucha más chance de aparecer "escondido" dentro
 * de una palabra castellana común no relacionada. Ya pasó dos veces con datos
 * reales: "ram" (agregado para camionetas RAM) matcheaba "programador"
 * (prog-RAM-ador), y "pet" matcheaba "carpeta" (car-PET-a) — ambos se sacaron.
 * Antes de agregar un término nuevo de ≤ 3 letras: pensar si podría ser
 * substring de un sustantivo/verbo/adjetivo común en castellano: si hay
 * dudas, no agregarlo, o preferir una variante alfanumérica (ej. "s10") o con
 * espacio (ej. "smart tv"), mucho menos propensas a colisionar.
 * Excepciones ya aceptadas hoy (revisadas, sin colisión detectada en
 * pruebas reales): `pc`, `tv`, `hp`, `lg`, `suv`, `s10`.
 */
// ─── Mascotas ─────────────────────────────────────────────────────────────
const PET_CONCEPTS: Record<string, string[]> = {
  perro: [
    'perro', 'perros', 'mascota', 'mascotas', 'canino', 'caninos',
    'cachorro', 'cachorros', 'animal', 'animales',
    'veterinaria', 'veterinario',
    // razas frecuentes: una publicacion que solo menciona la raza tambien
    // debe aparecer al buscar el concepto generico "perro".
    'golden', 'caniche', 'bulldog', 'beagle', 'labrador', 'rottweiler',
  ],
  gato: [
    'gato', 'gatos', 'mascota', 'mascotas', 'felino', 'felinos',
    'gatito', 'gatitos', 'animal', 'animales', 'veterinaria',
  ],
}

// ─── Vehiculos ────────────────────────────────────────────────────────────
const VEHICLE_CONCEPTS: Record<string, string[]> = {
  auto: [
    'auto', 'autos', 'coche', 'carro', 'carros', 'vehiculo', 'vehiculos',
    'automovil', 'automoviles', 'usado',
  ],
  moto: [
    'moto', 'motos', 'motocicleta', 'motocicletas', 'scooter', 'ciclomotor',
  ],
  camioneta: [
    'camioneta', 'camionetas', 'pickup', 'suv', 'todoterreno',
    // modelos comerciales frecuentes de camionetas/pickups.
    'hilux', 'ranger', 'amarok', 'frontier', 's10',
  ],
  moto_acua: [
    'nautica', 'lancha', 'bote', 'embarcacion', 'yate', 'kayak',
  ],
}

// ─── Electronica y tecnologia ───────────────────────────────────────────────
const ELECTRONICS_CONCEPTS: Record<string, string[]> = {
  celular: [
    'celular', 'celulares', 'smartphone', 'telefono', 'telefonos',
    'movil', 'moviles', 'iphone', 'android',
    // marcas comerciales frecuentes de celulares.
    'samsung', 'xiaomi', 'motorola', 'huawei', 'realme', 'honor',
  ],
  computadora: [
    'computadora', 'computadoras', 'laptop', 'notebook', 'notebooks',
    'pc', 'computacion', 'portatil',
    // marcas comerciales frecuentes de notebooks/PC.
    'lenovo', 'hp', 'asus', 'acer', 'dell', 'macbook',
  ],
  televisor: [
    'televisor', 'televisores', 'tv', 'tele', 'smart tv', 'television',
    'smarttv',
    // marcas y tecnologias de pantalla frecuentes.
    'lg', 'sony', 'oled', 'qled',
  ],
  audio: [
    'audio', 'parlante', 'parlantes', 'altavoz', 'auricular', 'auriculares',
    'audifonos', 'sonido', 'equipo de sonido',
  ],
  camara: [
    'camara', 'camaras', 'fotografia', 'reflex', 'mirrorless', 'gopro',
    'drone', 'tripode',
  ],
  consola: [
    'consola', 'consolas', 'playstation', 'xbox', 'nintendo', 'ps4', 'ps5',
    'videojuego', 'videojuegos', 'gaming',
  ],
}

// ─── Hogar ────────────────────────────────────────────────────────────────
const HOME_CONCEPTS: Record<string, string[]> = {
  ropa: [
    'ropa', 'vestimenta', 'indumentaria', 'remera', 'pantalon',
    'vestido', 'calzado', 'zapatos', 'zapatillas',
  ],
  bicicleta: [
    'bicicleta', 'bicicletas', 'bici', 'bicis', 'ciclismo',
  ],
  mueble: [
    'mueble', 'muebles', 'silla', 'mesa', 'sillas', 'mesas',
    'sofa', 'sofas', 'escritorio', 'cama', 'placard',
  ],
  herramienta: [
    'herramienta', 'herramientas', 'taladro', 'sierra', 'martillo',
    'tornillo', 'construccion',
  ],
}

// ─── Ocio ─────────────────────────────────────────────────────────────────
const LEISURE_CONCEPTS: Record<string, string[]> = {
  deporte: [
    'deporte', 'deportes', 'fitness', 'gimnasio', 'entrenamiento',
    'pesa', 'pesas', 'cinta', 'eliptica',
  ],
  libro: [
    'libro', 'libros', 'revista', 'revistas', 'manga', 'comic',
    'educacion', 'estudio',
  ],
  instrumento: [
    'instrumento', 'instrumentos', 'guitarra', 'piano', 'bateria',
    'bajo', 'violín', 'violin', 'trompeta', 'musica',
  ],
}

/**
 * Mapa unificado, armado a partir de los bloques por dominio de arriba para
 * que agregar nuevos conceptos no signifique crecer una unica lista plana.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  ...PET_CONCEPTS,
  ...VEHICLE_CONCEPTS,
  ...ELECTRONICS_CONCEPTS,
  ...HOME_CONCEPTS,
  ...LEISURE_CONCEPTS,
}

/**
 * Abreviaturas coloquiales que no comparten suficiente prefijo/edicion con
 * su clave canonica como para que el fuzzy matching de `expand-query.ts` las
 * detecte (ej. "celu" vs "celular"). Match directo, sin heuristica.
 */
export const ABBREVIATIONS: Record<string, string> = {
  celu: 'celular',
  compu: 'computadora',
}
